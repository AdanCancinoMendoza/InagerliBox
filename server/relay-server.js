import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const downloadsDir = path.join(__dirname, '..', 'public', 'downloads');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/downloads', express.static(downloadsDir));

// Rutas de descarga directa para Linux, Windows y Android
app.get('/api/download/:os', (req, res) => {
  const os = (req.params.os || '').toLowerCase();
  const getFile = (inagerName, legacyName) => {
    const primary = path.join(downloadsDir, inagerName);
    if (fs.existsSync(primary)) return res.download(primary, inagerName);
    return res.download(path.join(downloadsDir, legacyName), inagerName);
  };

  if (os === 'linux') {
    return getFile('Inagerlibox-Linux.tar.gz', 'MultiControl-Linux.tar.gz');
  } else if (os === 'windows') {
    return getFile('Inagerlibox-Windows.zip', 'MultiControl-Windows.zip');
  } else if (os === 'android') {
    return getFile('Inagerlibox-Android.zip', 'MultiControl-Android.zip');
  }
  res.status(404).json({ error: 'Sistema no soportado' });
});

const PORT = process.env.PORT || 4000;
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Rooms storage: roomCode -> { receiver: WebSocket, senders: Map<id, WebSocket>, createdAt: number }
const rooms = new Map();

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'XB-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

import { xboxLinuxBridge } from './xbox-linux-network.js';

// Transmitir eventos de re-sincronización automática de IP a clientes web
xboxLinuxBridge.on('connection_loss', (data) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client.directXboxIp) {
      client.send(JSON.stringify({
        type: 'XBOX_RECONNECTING',
        oldIp: data.oldIp,
        message: 'Detectada pérdida de señal en la Xbox. Buscando y re-sincronizando IP automáticamente...'
      }));
    }
  });
});

xboxLinuxBridge.on('ip_resynced', (data) => {
  console.log(`[Relay] ✓ Consola re-sincronizada: ${data.oldIp} -> ${data.newIp}`);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client.directXboxIp) {
      client.directXboxIp = data.newIp;
      client.send(JSON.stringify({
        type: 'XBOX_IP_RESYNCD',
        oldIp: data.oldIp,
        newIp: data.newIp,
        name: data.name,
        message: `✓ Conexión re-sincronizada automáticamente con tu Xbox en ${data.newIp}`
      }));
    }
  });
});

app.get('/api/xbox/discover', async (req, res) => {
  try {
    const data = await xboxLinuxBridge.discoverConsoles(2500);
    res.json({
      success: true,
      consoles: data.consoles || [],
      otherDevices: data.otherDevices || [],
      devices: data.devices || [],
      scannedSubnets: data.scannedSubnets || [],
      totalScanned: data.totalScanned || 0
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/xbox/connect-direct', (req, res) => {
  const { ip, port = 5050 } = req.body;
  if (!ip) return res.status(400).json({ error: 'IP de consola requerida' });
  const result = xboxLinuxBridge.connect(ip, port);
  res.json({ success: true, message: `Conectado directamente a Xbox en ${ip}:${port}`, result });
});

app.get('/api/xbox/ping', async (req, res) => {
  const ip = (req.query.ip || '').trim();
  if (!ip) return res.status(400).json({ error: 'IP requerida' });
  const result = await xboxLinuxBridge.pingHost(ip);
  res.json(result);
});

wss.on('connection', (ws) => {
  ws.isAlive = true;
  ws.role = null;
  ws.roomCode = null;
  ws.clientId = Math.random().toString(36).substring(2, 9);

  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('message', async (message) => {
    try {
      const msg = JSON.parse(message);

      switch (msg.type) {
        case 'PING': {
          ws.send(JSON.stringify({ type: 'PONG', timestamp: msg.timestamp, serverTime: Date.now() }));
          break;
        }

        // Host / Receiver creates a room
        case 'CREATE_ROOM': {
          let code = generateRoomCode();
          while (rooms.has(code)) {
            code = generateRoomCode();
          }

          ws.role = 'receiver';
          ws.roomCode = code;

          rooms.set(code, {
            receiver: ws,
            senders: new Map(),
            createdAt: Date.now()
          });

          ws.send(JSON.stringify({
            type: 'ROOM_CREATED',
            roomCode: code,
            role: 'receiver',
            message: `Sala ${code} creada exitosamente. Esperando conexión del mando.`
          }));
          console.log(`[Relay] Sala creada: ${code} por Host ${ws.clientId}`);
          break;
        }

        // Client / Controller joins an existing room
        case 'JOIN_ROOM': {
          const targetCode = (msg.roomCode || '').toUpperCase().trim();
          const room = rooms.get(targetCode);

          if (!room) {
            ws.send(JSON.stringify({
              type: 'ERROR',
              code: 'ROOM_NOT_FOUND',
              message: `La sala "${targetCode}" no existe o el anfitrión no está conectado.`
            }));
            return;
          }

          ws.role = 'sender';
          ws.roomCode = targetCode;
          room.senders.set(ws.clientId, ws);

          ws.send(JSON.stringify({
            type: 'ROOM_JOINED',
            roomCode: targetCode,
            role: 'sender',
            clientId: ws.clientId,
            message: `Conectado a la sala ${targetCode}. ¡Listo para retransmitir controles a Xbox One!`
          }));

          // Notify receiver that a controller connected
          if (room.receiver && room.receiver.readyState === WebSocket.OPEN) {
            room.receiver.send(JSON.stringify({
              type: 'CONTROLLER_CONNECTED',
              clientId: ws.clientId,
              controllerName: msg.controllerName || 'Mando Genérico / XInput'
            }));
          }

          console.log(`[Relay] Cliente ${ws.clientId} se unió a la sala ${targetCode}`);
          break;
        }

        // Direct connection from Linux to Xbox One IP via SmartGlass
        case 'CONNECT_DIRECT_XBOX': {
          const targetIp = (msg.ip || '').trim();
          if (targetIp) {
            ws.directXboxIp = targetIp;
            const res = await xboxLinuxBridge.connect(targetIp);
            if (res.success) {
              ws.send(JSON.stringify({
                type: 'DIRECT_XBOX_CONNECTED',
                ip: targetIp,
                message: `Conectado con éxito a Xbox One (${targetIp}). ¡Canal de mandos abierto!`
              }));
              console.log(`[Relay/Linux] Conectado exitosamente a Xbox One en: ${targetIp}`);
            } else {
              ws.send(JSON.stringify({
                type: 'ERROR',
                message: `No se pudo conectar a Xbox One (${targetIp}): ${res.error || 'Rechazado'}`
              }));
            }
          }
          break;
        }

        // Forward controller inputs from Web Client to Receiver Host or Direct Xbox
        case 'CONTROLLER_STATE': {
          const playerIdx = msg.playerIndex !== undefined ? msg.playerIndex : 0;

          // Si está en modo directo a Xbox por red
          if (ws.directXboxIp) {
            xboxLinuxBridge.sendControllerState(msg.state, playerIdx);
          }

          // Si está en sala de relay
          if (ws.roomCode) {
            const room = rooms.get(ws.roomCode);
            if (room && room.receiver && room.receiver.readyState === WebSocket.OPEN) {
              msg.clientId = ws.clientId;
              msg.relayTimestamp = Date.now();
              room.receiver.send(JSON.stringify(msg));
            }
          }
          break;
        }

        // Forward rumble / haptic feedback from Xbox host back to controller
        case 'RUMBLE_FEEDBACK': {
          if (!ws.roomCode) return;
          const room = rooms.get(ws.roomCode);
          if (room) {
            for (const sender of room.senders.values()) {
              if (sender.readyState === WebSocket.OPEN) {
                sender.send(JSON.stringify(msg));
              }
            }
          }
          break;
        }

        default:
          break;
      }
    } catch (err) {
      console.error('[Relay] Error al procesar mensaje:', err);
    }
  });

  ws.on('close', () => {
    if (ws.roomCode && rooms.has(ws.roomCode)) {
      const room = rooms.get(ws.roomCode);
      if (ws.role === 'receiver') {
        // Notify all senders that host left
        for (const sender of room.senders.values()) {
          if (sender.readyState === WebSocket.OPEN) {
            sender.send(JSON.stringify({
              type: 'HOST_DISCONNECTED',
              message: 'El anfitrión de Xbox One se ha desconectado.'
            }));
          }
        }
        rooms.delete(ws.roomCode);
        console.log(`[Relay] Sala ${ws.roomCode} eliminada (anfitrión desconectado)`);
      } else if (ws.role === 'sender') {
        room.senders.delete(ws.clientId);
        if (room.receiver && room.receiver.readyState === WebSocket.OPEN) {
          room.receiver.send(JSON.stringify({
            type: 'CONTROLLER_DISCONNECTED',
            clientId: ws.clientId
          }));
        }
        console.log(`[Relay] Cliente ${ws.clientId} salió de la sala ${ws.roomCode}`);
      }
    }
  });
});

// Periodic heartbeat to clean dead connections
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', () => {
  clearInterval(interval);
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`[Inagerlibox] Servidor Relay WebSocket Activo`);
  console.log(`Puerto: ${PORT}`);
  console.log(`Salud: http://localhost:${PORT}/health`);
  console.log(`Listo para interconectar mandos con Xbox One via Internet`);
  console.log(`=======================================================`);
});
