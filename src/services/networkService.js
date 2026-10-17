/**
 * Servicio de Comunicación de Red para Retransmisión de Mandos hacia Xbox One
 */

class NetworkService {
  constructor() {
    this.ws = null;
    this.url = 'ws://localhost:4000/ws';
    this.status = 'disconnected'; // 'disconnected' | 'connecting' | 'connected' | 'error'
    this.roomCode = '';
    this.clientId = null;
    this.latency = 0;
    this.latencyHistory = [];
    this.packetsSent = 0;
    this.packetsPerSecond = 0;
    this.mode = 'direct'; // 'direct' (Linux IP directa) | 'relay' (Sala con código)
    this.directIp = typeof localStorage !== 'undefined' ? (localStorage.getItem('multicontrol_direct_ip') || '') : '';
    this.errorMessage = null;
    this.targetFps = 60; // 30, 60, o 120 Hz
    this.lastPacketTime = 0;
    this.packetCounterInterval = null;
    this.pingInterval = null;
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    const state = this.getState();
    this.listeners.forEach(fn => fn(state));
  }

  getState() {
    return {
      status: this.status,
      errorMessage: this.errorMessage,
      mode: this.mode,
      directIp: this.directIp,
      roomCode: this.roomCode,
      url: this.url,
      latency: this.latency,
      latencyHistory: [...this.latencyHistory],
      packetsSent: this.packetsSent,
      packetsPerSecond: this.packetsPerSecond,
      targetFps: this.targetFps,
      clientId: this.clientId
    };
  }

  setMode(mode) {
    this.mode = mode;
    this.notify();
  }

  setDirectIp(ip) {
    this.directIp = (ip || '').trim();
    if (typeof localStorage !== 'undefined' && this.directIp) {
      try {
        localStorage.setItem('multicontrol_direct_ip', this.directIp);
      } catch {
        // Ignorar
      }
    }
    this.notify();
  }

  async discoverConsoles() {
    try {
      const res = await fetch('http://localhost:4000/api/xbox/discover');
      const data = await res.json();
      return {
        consoles: data.consoles || [],
        otherDevices: data.otherDevices || [],
        devices: data.devices || [],
        scannedSubnets: data.scannedSubnets || [],
        totalScanned: data.totalScanned || 0
      };
    } catch (e) {
      console.warn('Error al descubrir consolas en red local:', e);
      return {
        consoles: [],
        otherDevices: [],
        devices: [],
        scannedSubnets: [],
        totalScanned: 0
      };
    }
  }

  async pingHost(ip) {
    try {
      const res = await fetch(`http://localhost:4000/api/xbox/ping?ip=${encodeURIComponent(ip)}`);
      return await res.json();
    } catch {
      return { reachable: false, message: 'Servidor local no disponible' };
    }
  }

  async connectDirect(ip, port = 5050) {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      this.disconnect();
    }

    this.mode = 'direct';
    this.directIp = (ip || '').trim();
    this.status = 'connecting';
    this.notify();

    // Comprobar si la IP responde a ping
    const pingResult = await this.pingHost(this.directIp);
    if (pingResult.reachable) {
      this.latency = pingResult.pingMs;
    }

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.ws.send(JSON.stringify({
          type: 'CONNECT_DIRECT_XBOX',
          ip: this.directIp,
          port
        }));
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.handleMessage(msg);
        } catch {
          // Error parsing
        }
      };

      this.ws.onerror = () => {
        this.status = 'error';
        this.notify();
      };

      this.ws.onclose = () => {
        this.status = 'disconnected';
        this.stopHeartbeat();
        this.notify();
      };
    } catch {
      this.status = 'error';
      this.notify();
    }
  }

  setTargetFps(fps) {
    this.targetFps = fps;
    this.notify();
  }

  setUrl(newUrl) {
    this.url = newUrl;
  }

  connect(roomCode, controllerName = 'Mando') {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      this.disconnect();
    }

    this.roomCode = (roomCode || '').toUpperCase().trim();
    this.status = 'connecting';
    this.notify();

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        // Enviar solicitud de unirse a la sala
        this.ws.send(JSON.stringify({
          type: 'JOIN_ROOM',
          roomCode: this.roomCode,
          controllerName
        }));
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.handleMessage(msg);
        } catch {
          // Error parsing
        }
      };

      this.ws.onerror = () => {
        this.status = 'error';
        this.notify();
      };

      this.ws.onclose = () => {
        this.status = 'disconnected';
        this.stopHeartbeat();
        this.notify();
      };
    } catch {
      this.status = 'error';
      this.notify();
    }
  }

  disconnect() {
    this.stopHeartbeat();
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // Ignore
      }
      this.ws = null;
    }
    this.status = 'disconnected';
    this.packetsPerSecond = 0;
    this.notify();
  }

  startHeartbeat() {
    this.stopHeartbeat();
    // Medir Ping cada 1.5 segundos
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'PING',
          timestamp: Date.now()
        }));
      }
    }, 1500);

    // Medidor de paquetes por segundo
    let lastPackets = this.packetsSent;
    this.packetCounterInterval = setInterval(() => {
      this.packetsPerSecond = this.packetsSent - lastPackets;
      lastPackets = this.packetsSent;
      this.notify();
    }, 1000);
  }

  stopHeartbeat() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    if (this.packetCounterInterval) clearInterval(this.packetCounterInterval);
  }

  handleMessage(msg) {
    if (msg.type === 'ROOM_JOINED') {
      this.status = 'connected';
      this.errorMessage = null;
      this.clientId = msg.clientId;
      this.notify();
    } else if (msg.type === 'DIRECT_XBOX_CONNECTED') {
      this.status = 'connected';
      this.errorMessage = null;
      this.directIp = msg.ip;
      this.notify();
    } else if (msg.type === 'PONG') {
      const now = Date.now();
      const rtt = now - msg.timestamp;
      this.latency = rtt;
      this.latencyHistory.push(rtt);
      if (this.latencyHistory.length > 25) {
        this.latencyHistory.shift();
      }
      this.notify();
    } else if (msg.type === 'XBOX_IP_RESYNCD') {
      console.log('[NetworkService] IP re-sincronizada automáticamente:', msg.oldIp, '->', msg.newIp);
      this.directIp = msg.newIp;
      this.status = 'connected';
      this.errorMessage = null;
      if (typeof localStorage !== 'undefined' && msg.newIp) {
        try {
          localStorage.setItem('multicontrol_direct_ip', msg.newIp);
        } catch {
          // Ignorar
        }
      }
      this.notify();
    } else if (msg.type === 'XBOX_RECONNECTING') {
      console.warn('[NetworkService] Re-sincronizando con la consola Xbox...');
      this.status = 'connecting';
      this.errorMessage = msg.message || 'Re-sincronizando IP con la consola Xbox...';
      this.notify();
    } else if (msg.type === 'ERROR') {
      this.status = 'error';
      this.errorMessage = msg.message || 'Error al conectar con la consola Xbox One';
      this.notify();
    }
  }

  sendState(normalizedState, playerIndex = 0) {
    this.sendPlayerState(playerIndex, normalizedState);
  }

  sendPlayerState(playerIndex, normalizedState) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || this.status !== 'connected' || !normalizedState) {
      return;
    }

    if (!this.lastPlayerPacketTimes) {
      this.lastPlayerPacketTimes = {};
    }

    const now = performance.now();
    const intervalMs = 1000 / this.targetFps;
    const lastTime = this.lastPlayerPacketTimes[playerIndex] || 0;
    if (now - lastTime < intervalMs) {
      return;
    }
    this.lastPlayerPacketTimes[playerIndex] = now;

    // Enviar paquete con playerIndex para diferenciar mandos P1, P2, P3, P4
    const packet = {
      type: 'CONTROLLER_STATE',
      playerIndex: typeof playerIndex === 'number' ? playerIndex : 0,
      timestamp: Date.now(),
      state: {
        buttons: normalizedState.buttons,
        axes: normalizedState.axes
      }
    };

    try {
      this.ws.send(JSON.stringify(packet));
      this.packetsSent++;
    } catch {
      // Fallo de red
    }
  }
}

export const networkService = new NetworkService();
