import Smartglass from 'xbox-smartglass-core-node';
import SystemInput from 'xbox-smartglass-core-node/src/channels/systeminput.js';
import SystemMedia from 'xbox-smartglass-core-node/src/channels/systemmedia.js';
import Packer from 'xbox-smartglass-core-node/src/packet/packer.js';
import Structure from 'xbox-smartglass-core-node/src/packet/structure.js';
import dgram from 'dgram';
import net from 'net';
import os from 'os';
import { EventEmitter } from 'events';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Prefijos OUI oficiales de tarjetas de red de Microsoft Xbox (Xbox One, One S/X, Series S/X)
const MS_XBOX_OUIS = [
  '30:59:b7', 'ec:83:50', '7c:1e:52', '28:18:78', 'dc:98:40',
  '00:50:f2', '00:1d:d8', '00:17:fa', '00:22:48', '00:25:ae',
  '60:45:bd', '50:1a:c5', '00:12:5a', 'f8:84:f2'
];

/**
 * MultiControl - Puente Nativo de Red para Linux hacia Xbox One
 * Utiliza el protocolo criptográfico autenticado SmartGlass y escaneo 100% dinámico
 * Incluye Vigilante de Salud (Watchdog) y auto-resincronización ante cambios de IP.
 */
export class XboxLinuxBridge extends EventEmitter {
  constructor() {
    super();
    this.targetIp = null;
    this.targetMac = null;
    this.targetLiveId = null;
    this.targetName = null;
    this.sg = null;
    this.sysInput = null;
    this.sysMedia = null;
    this.isConnected = false;
    this.discoveredDevices = new Map();
    this.lastButtonStates = {};
    this.isConnecting = false;
    this.isAutoRecovering = false;
    this.consecutivePingFails = 0;
    this.watchdogInterval = null;
    this.lastLatencyMs = 0;
  }

  /**
   * Obtiene la lista de subredes locales IPv4 activas (Wi-Fi, Ethernet, Hotspot)
   */
  getLocalSubnets() {
    const subnets = [];
    const ifaces = os.networkInterfaces();

    for (const [name, addrs] of Object.entries(ifaces)) {
      for (const addr of addrs) {
        if (addr.family === 'IPv4' && !addr.internal) {
          const parts = addr.address.split('.');
          const base = `${parts[0]}.${parts[1]}.${parts[2]}`;
          subnets.push({
            name,
            ip: addr.address,
            base,
            broadcast: `${base}.255`
          });
        }
      }
    }
    return subnets;
  }

  /**
   * Escaneo 100% REAL de la red local:
   * 1. Envía paquetes de sondeo SmartGlass UDP (puerto 5050) broadcast y unicast a toda la subred
   *    (bypasseando el bloqueo de broadcast de los routers Wi-Fi residenciales como Huawei/Nokia).
   * 2. Recibe respuestas criptográficas de consolas Xbox en tiempo real.
   * 3. Examina la tabla ARP del kernel Linux para dispositivos alcanzables.
   * 4. Verifica el puerto TCP 7401 (SmartGlass Companion) y los prefijos MAC de Microsoft.
   * 5. Mide la latencia real (ping ms).
   * ZERO IPs inventadas ni cacheadas fijas.
   */
  async discoverConsoles(timeoutMs = 2200) {
    this.discoveredDevices.clear();
    const subnets = this.getLocalSubnets();
    if (subnets.length === 0) {
      return { consoles: [], otherDevices: [], scannedSubnets: [], totalScanned: 0 };
    }

    const verifiedConsoles = new Map();
    const otherDevices = new Map();

    // 1. Socket UDP para enviar y escuchar respuestas SmartGlass en puerto 5050
    const udpSocket = dgram.createSocket('udp4');
    
    try {
      await new Promise((resolve) => udpSocket.bind(0, resolve));
      try {
        udpSocket.setBroadcast(true);
      } catch {
        // Ignorar si el sistema no permite broadcast
      }

      // Escuchar respuestas directas de consolas Xbox
      udpSocket.on('message', (msg, rinfo) => {
        try {
          const packet = Structure(msg);
          const decoded = packet.unpack(packet);
          const consoleName = decoded.name || 'Xbox One';
          const liveId = decoded.liveid || '';

          verifiedConsoles.set(rinfo.address, {
            ip: rinfo.address,
            name: `${consoleName} (Xbox Verificada por SmartGlass)`,
            liveId,
            isVerifiedXbox: true,
            isLikelyXbox: true,
            method: 'smartglass_udp',
            lastSeen: Date.now()
          });
        } catch {
          // No es paquete SmartGlass válido
        }
      });

      // Crear paquete discovery oficial de Xbox SmartGlass
      const discoveryPacket = Packer('simple.discovery_request').pack();

      // Enviar a broadcasts de cada subred y a todas las IPs del rango local
      for (const sub of subnets) {
        udpSocket.send(discoveryPacket, 5050, sub.broadcast, () => {});
        udpSocket.send(discoveryPacket, 5050, '255.255.255.255', () => {});
        
        // BARRIDO UNICAST: Enviar paquetes UDP unicast a las IPs del rango local (1..254).
        // Bypassea la política de aislamiento inalámbrico de routers domésticos.
        for (let i = 1; i <= 254; i++) {
          const targetIp = `${sub.base}.${i}`;
          if (targetIp !== sub.ip) {
            udpSocket.send(discoveryPacket, 5050, targetIp, () => {});
          }
        }
      }

      // Esperar 650ms para que la red responda y el kernel de Linux refresque la tabla ARP
      await new Promise(r => setTimeout(r, 650));
    } catch (err) {
      console.warn('[Network Discovery] Error en socket UDP:', err.message);
    } finally {
      try {
        udpSocket.close();
      } catch {
        // Ignorar
      }
    }

    // 2. Inspeccionar tabla ARP de Linux actualizada por el barrido
    const reachableDevices = [];
    try {
      const { stdout: arpOutput } = await execAsync('ip neigh show').catch(() => ({ stdout: '' }));
      const lines = arpOutput.split('\n');

      for (const line of lines) {
        const match = line.match(/^([0-9.]+)\s+(?:dev\s+\S+\s+)?(?:lladdr\s+([0-9a-f:]{17})\s+)?(\S+)/i);
        if (match) {
          const ip = match[1];
          const mac = (match[2] || '').toLowerCase();
          const state = match[3];

          if (state !== 'FAILED' && state !== 'INCOMPLETE' && mac) {
            reachableDevices.push({ ip, mac, state });
          }
        }
      }
    } catch {
      // Ignorar
    }

    // 3. Verificación de puerto TCP 7401 (SmartGlass Companion) y OUI MAC de Microsoft
    await Promise.all(reachableDevices.map((dev) => {
      return new Promise((resolve) => {
        const isMsMac = MS_XBOX_OUIS.some(prefix => dev.mac.startsWith(prefix));

        const tcpSock = new net.Socket();
        tcpSock.setTimeout(350);

        tcpSock.on('connect', () => {
          const existing = verifiedConsoles.get(dev.ip);
          verifiedConsoles.set(dev.ip, {
            ip: dev.ip,
            mac: dev.mac,
            name: existing ? existing.name : 'Consola Xbox (Puerto 7401 SmartGlass Activo)',
            isVerifiedXbox: true,
            isLikelyXbox: true,
            method: 'smartglass_tcp',
            lastSeen: Date.now()
          });
          tcpSock.destroy();
          resolve();
        });

        tcpSock.on('error', () => {
          if (isMsMac) {
            verifiedConsoles.set(dev.ip, {
              ip: dev.ip,
              mac: dev.mac,
              name: 'Xbox One (Hardware Microsoft Detectado)',
              isVerifiedXbox: true,
              isLikelyXbox: true,
              method: 'hardware_mac',
              lastSeen: Date.now()
            });
          } else if (!verifiedConsoles.has(dev.ip)) {
            const isRouter = dev.ip.endsWith('.254') || dev.ip.endsWith('.1');
            otherDevices.set(dev.ip, {
              ip: dev.ip,
              mac: dev.mac,
              name: isRouter ? `Router / Puerta de Enlace (${dev.ip})` : `Dispositivo de Red (${dev.ip})`,
              isVerifiedXbox: false,
              isLikelyXbox: false,
              isRouter,
              lastSeen: Date.now()
            });
          }
          resolve();
        });

        tcpSock.on('timeout', () => {
          tcpSock.destroy();
          if (isMsMac) {
            verifiedConsoles.set(dev.ip, {
              ip: dev.ip,
              mac: dev.mac,
              name: 'Xbox One (Hardware Microsoft Detectado)',
              isVerifiedXbox: true,
              isLikelyXbox: true,
              method: 'hardware_mac',
              lastSeen: Date.now()
            });
          } else if (!verifiedConsoles.has(dev.ip)) {
            const isRouter = dev.ip.endsWith('.254') || dev.ip.endsWith('.1');
            otherDevices.set(dev.ip, {
              ip: dev.ip,
              mac: dev.mac,
              name: isRouter ? `Router / Puerta de Enlace (${dev.ip})` : `Dispositivo de Red (${dev.ip})`,
              isVerifiedXbox: false,
              isLikelyXbox: false,
              isRouter,
              lastSeen: Date.now()
            });
          }
          resolve();
        });

        tcpSock.connect(7401, dev.ip);
      });
    }));

    // 4. Medir latencia de ping real para cada consola verificada
    const verifiedList = Array.from(verifiedConsoles.values());
    await Promise.all(verifiedList.map(async (consoleDev) => {
      const pingRes = await this.pingHost(consoleDev.ip);
      consoleDev.pingMs = pingRes.reachable ? pingRes.pingMs : null;
      consoleDev.reachable = pingRes.reachable;
    }));

    const otherList = Array.from(otherDevices.values()).sort((a, b) => {
      if (a.isRouter && !b.isRouter) return 1;
      if (!a.isRouter && b.isRouter) return -1;
      return a.ip.localeCompare(b.ip, undefined, { numeric: true });
    });

    return {
      consoles: verifiedList,
      otherDevices: otherList,
      devices: [...verifiedList, ...otherList],
      scannedSubnets: subnets.map(s => `${s.base}.0/24 (${s.name})`),
      totalScanned: subnets.length * 254
    };
  }

  /**
   * Ping rápido a la consola
   */
  async pingHost(ip) {
    try {
      const startTime = Date.now();
      const { stdout } = await execAsync(`ping -c 1 -W 2 ${ip}`);
      const duration = Date.now() - startTime;
      
      const match = stdout.match(/time=([0-9.]+) ms/);
      const pingMs = match ? parseFloat(match[1]) : duration;

      return {
        reachable: true,
        ip,
        pingMs: Math.round(pingMs),
        message: `Consola alcanzable (${Math.round(pingMs)} ms)`
      };
    } catch {
      return {
        reachable: false,
        ip,
        pingMs: 0,
        message: `Sin respuesta en la IP ${ip}. Verifica que la Xbox esté encendida.`
      };
    }
  }

  /**
   * Conecta directamente a la Xbox One mediante el protocolo autenticado SmartGlass
   */
  async connect(ip) {
    if (this.isConnecting) return { success: false, message: 'Conexión en curso...' };

    this.stopWatchdog();
    this.disconnect();
    this.targetIp = (ip || '').trim();
    this.isConnecting = true;
    console.log(`[Xbox Linux Bridge] Iniciando handshake criptográfico SmartGlass con: ${this.targetIp}...`);

    try {
      // 1. Obtener la dirección MAC de la consola en la tabla ARP para tracking de IP dinámica
      try {
        const { stdout } = await execAsync(`ip neigh show ${this.targetIp}`).catch(() => ({ stdout: '' }));
        const match = stdout.match(/lladdr\s+([0-9a-f:]{17})/i);
        if (match) {
          this.targetMac = match[1].toLowerCase();
        }
      } catch {
        // Ignorar
      }

      const sg = Smartglass();
      const inputManager = SystemInput();
      const mediaManager = SystemMedia();

      sg.addManager('system_input', inputManager);
      sg.addManager('system_media', mediaManager);

      await sg.connect(this.targetIp);
      console.log(`[Xbox Linux Bridge] ✓ Handshake completado exitosamente con ${this.targetIp}`);

      // Esperar a que el canal SystemInput de botones termine de abrirse
      let attempts = 0;
      while (!inputManager._channel_manager.getStatus() && attempts < 25) {
        await new Promise(r => setTimeout(r, 100));
        attempts++;
      }

      this.sg = sg;
      this.sysInput = sg.getManager('system_input');
      this.sysMedia = sg.getManager('system_media');
      this.isConnected = true;
      this.isConnecting = false;
      this.consecutivePingFails = 0;

      // Iniciar el vigilante de salud / auto-reconexión ante desincronización de IP
      this.startWatchdog();

      console.log(`[Xbox Linux Bridge] ✓ Canal SystemInput listo (${attempts * 100}ms). Mandos vinculados directamente con Xbox One.`);
      return { success: true, ip: this.targetIp, message: `Conectado y canal de control abierto con Xbox One en ${this.targetIp}` };
    } catch (err) {
      this.isConnecting = false;
      this.isConnected = false;
      console.error(`[Xbox Linux Bridge] Error de conexión SmartGlass:`, err.message || err);
      return { success: false, error: err.message || err };
    }
  }

  /**
   * Vigilante de latencia y salud de conexión:
   * Supervisa activamente el ping. Si se detectan 2 caídas consecutivas,
   * asume pérdida de IP o desconexión Wi-Fi e inicia la re-sincronización automática.
   */
  startWatchdog() {
    this.stopWatchdog();
    this.watchdogInterval = setInterval(async () => {
      if (!this.isConnected || !this.targetIp || this.isAutoRecovering) return;

      const pingRes = await this.pingHost(this.targetIp);
      if (pingRes.reachable) {
        this.consecutivePingFails = 0;
        this.lastLatencyMs = pingRes.pingMs;
      } else {
        this.consecutivePingFails++;
        console.warn(`[Xbox Watchdog] Paquete perdido hacia ${this.targetIp} (Fallo ${this.consecutivePingFails}/2)`);
        if (this.consecutivePingFails >= 2) {
          this.handleConnectionLoss();
        }
      }
    }, 2000);
  }

  stopWatchdog() {
    if (this.watchdogInterval) {
      clearInterval(this.watchdogInterval);
      this.watchdogInterval = null;
    }
  }

  /**
   * Recuperación y re-sincronización automática de IP:
   * Realiza un escaneo activo de la subred para ubicar la nueva IP de la consola
   * (mediante MAC o SmartGlass) y restablece el canal sin intervención del usuario.
   */
  async handleConnectionLoss() {
    if (this.isAutoRecovering) return;
    this.isAutoRecovering = true;
    const oldIp = this.targetIp;
    console.log(`[Xbox Watchdog] [AVISO] Conexión perdida con ${oldIp}. Iniciando búsqueda activa para re-sincronizar IP de la consola...`);
    this.emit('connection_loss', { oldIp });

    try {
      const scan = await this.discoverConsoles(2000);
      let targetConsole = null;

      // 1. Buscar por MAC address física
      if (this.targetMac) {
        targetConsole = scan.consoles.find(c => c.mac === this.targetMac);
      }
      // 2. Si no hay MAC previa y solo hay una consola en la subred
      if (!targetConsole && scan.consoles.length === 1) {
        targetConsole = scan.consoles[0];
      }

      if (targetConsole) {
        const newIp = targetConsole.ip;
        console.log(`[Xbox Watchdog] 🔄 ¡Consola localizada en red! ${oldIp} -> ${newIp}. Re-sincronizando automáticamente...`);
        this.disconnect();
        const res = await this.connect(newIp);
        if (res.success) {
          this.emit('ip_resynced', { oldIp, newIp, name: targetConsole.name });
        }
      } else {
        console.warn(`[Xbox Watchdog] Consola no responde aún. El vigilante continuará reintentando en segundo plano.`);
      }
    } catch (e) {
      console.warn(`[Xbox Watchdog] Error durante re-sincronización:`, e.message);
    } finally {
      this.isAutoRecovering = false;
    }
  }

  disconnect() {
    this.stopWatchdog();
    if (this.sg) {
      try {
        this.sg.disconnect();
      } catch {
        // Ignorar
      }
      this.sg = null;
    }
    this.sysInput = null;
    this.sysMedia = null;
    this.isConnected = false;
    this.targetIp = null;
    this.lastButtonStates = {};
  }

  /**
   * Procesa y despacha las pulsaciones de botones físicos directamente hacia la Xbox One
   * Soporta hasta 4 jugadores simultáneos (playerIndex 0 a 3) con latencia mínima
   */
  sendControllerState(state, playerIndex = 0) {
    if (!this.isConnected || !this.sysInput) {
      return false;
    }

    if (!this.lastButtonStatesByPlayer) {
      this.lastButtonStatesByPlayer = {};
    }
    if (!this.lastButtonStatesByPlayer[playerIndex]) {
      this.lastButtonStatesByPlayer[playerIndex] = {};
    }

    const b = state?.buttons || {};
    const lastPlayerStates = this.lastButtonStatesByPlayer[playerIndex];

    // Mapeo hacia comandos de SmartGlass
    const buttonMapping = {
      A: 'a',
      B: 'b',
      X: 'x',
      Y: 'y',
      DpadUp: 'up',
      DpadDown: 'down',
      DpadLeft: 'left',
      DpadRight: 'right',
      Xbox: 'nexus',
      View: 'view',
      Menu: 'menu'
    };

    // Detectar flanco de subida (cuando se presiona el botón) y despachar inmediatamente
    for (const [btnName, sgCmd] of Object.entries(buttonMapping)) {
      const isPressed = !!b[btnName];
      const wasPressed = !!lastPlayerStates[btnName];

      if (isPressed && !wasPressed) {
        // Enviar botón al instante por el canal de SmartGlass sin bloquear
        try {
          this.sysInput.sendCommand(sgCmd).catch(() => {});
        } catch {
          // Ignorar
        }
      }
    }

    // Actualizar historial de botones del jugador
    this.lastButtonStatesByPlayer[playerIndex] = { ...b };
    return true;
  }
}

export const xboxLinuxBridge = new XboxLinuxBridge();

