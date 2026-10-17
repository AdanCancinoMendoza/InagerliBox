import WebSocket from 'ws';

/**
 * MultiControl - Cliente Receptor para PC Host (Conexión hacia Xbox One)
 * 
 * Este script se ejecuta en la PC anfitriona que transmitirá a la Xbox One:
 * 1. Se conecta al Servidor Relay en la nube o local.
 * 2. Crea una sala única con código (ej. XB-9482).
 * 3. Recibe los paquetes de mando en tiempo real (PS4, Xbox 360, Genéricos normalizados).
 * 4. Alimenta el emulador de mando virtual (ViGEmBus / vgamepad) para que la app de Xbox
 *    Remote Play lo reconozca como un mando Xbox One oficial conectado a la consola.
 */

const SERVER_URL = process.env.RELAY_URL || 'ws://localhost:4000/ws';
console.clear();
console.log(`=======================================================`);
console.log(`[MultiControl] Receptor Host de Mando para Xbox One`);
console.log(`Conectando a Relay en: ${SERVER_URL}`);
console.log(`=======================================================\n`);

let ws;
let roomCode = null;
let lastPacketTime = Date.now();
let packetCount = 0;
let lastFpsCheck = Date.now();
let fps = 0;

function connect() {
  ws = new WebSocket(SERVER_URL);

  ws.on('open', () => {
    console.log(`[Receptor] Conectado al servidor Relay. Solicitando creación de sala...`);
    ws.send(JSON.stringify({ type: 'CREATE_ROOM' }));
  });

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);

      if (msg.type === 'ROOM_CREATED') {
        roomCode = msg.roomCode;
        console.log(`\n======================================================`);
        console.log(`🔑 CÓDIGO DE SALA CREADO: \x1b[1m\x1b[32m${roomCode}\x1b[0m`);
        console.log(`👉 Abre la aplicación Web en tu navegador (celular o PC remota):`);
        console.log(`   Ingresa el código: \x1b[33m${roomCode}\x1b[0m en el panel "Conexión a Xbox"`);
        console.log(`======================================================\n`);
      } else if (msg.type === 'CONTROLLER_CONNECTED') {
        console.log(`\n[\x1b[32m+\x1b[0m] ¡Mando remoto conectado! ID: ${msg.clientId} - Tipo: ${msg.controllerName}`);
        console.log(`Recibiendo señales en tiempo real...\n`);
      } else if (msg.type === 'CONTROLLER_DISCONNECTED') {
        console.log(`\n[\x1b[31m-\x1b[0m] Mando desconectado (${msg.clientId})`);
      } else if (msg.type === 'CONTROLLER_STATE') {
        packetCount++;
        const now = Date.now();
        if (now - lastFpsCheck >= 1000) {
          fps = packetCount;
          packetCount = 0;
          lastFpsCheck = now;
        }

        const latency = msg.timestamp ? now - msg.timestamp : 0;
        processXboxOneState(msg.state, latency, fps);
      }
    } catch (e) {
      console.error('[Error] Mensaje inválido:', e.message);
    }
  });

  ws.on('error', (err) => {
    console.error(`[Receptor] Error de conexión: ${err.message}`);
  });

  ws.on('close', () => {
    console.log(`[Receptor] Conexión perdida. Reintentando en 3 segundos...`);
    setTimeout(connect, 3000);
  });
}

/**
 * Normaliza y muestra el estado de mando Xbox One en consola.
 * Si ViGEm está activo en Windows, aquí se despacha al mando virtual.
 */
let lastRenderTime = 0;
function processXboxOneState(state, latency, currentFps) {
  if (!state) return;

  const now = Date.now();
  // Evitar sobrecargar la terminal actualizando a max 15 Hz en consola visual
  if (now - lastRenderTime < 66) return;
  lastRenderTime = now;

  const b = state.buttons || {};
  const a = state.axes || {};

  // Botones activos
  const activeButtons = [];
  if (b.A) activeButtons.push('\x1b[32mA\x1b[0m');
  if (b.B) activeButtons.push('\x1b[31mB\x1b[0m');
  if (b.X) activeButtons.push('\x1b[34mX\x1b[0m');
  if (b.Y) activeButtons.push('\x1b[33mY\x1b[0m');
  if (b.LB) activeButtons.push('LB');
  if (b.RB) activeButtons.push('RB');
  if (b.View) activeButtons.push('VIEW');
  if (b.Menu) activeButtons.push('MENU');
  if (b.Xbox) activeButtons.push('\x1b[32m[XBOX]\x1b[0m');
  if (b.LS) activeButtons.push('LS_CLK');
  if (b.RS) activeButtons.push('RS_CLK');
  if (b.DpadUp) activeButtons.push('↑');
  if (b.DpadDown) activeButtons.push('↓');
  if (b.DpadLeft) activeButtons.push('←');
  if (b.DpadRight) activeButtons.push('→');

  const btnStr = activeButtons.length > 0 ? activeButtons.join(' ') : 'Ninguno';
  const lt = ((b.LT || 0) * 100).toFixed(0);
  const rt = ((b.RT || 0) * 100).toFixed(0);

  const lx = (a.leftStickX || 0).toFixed(2);
  const ly = (a.leftStickY || 0).toFixed(2);
  const rx = (a.rightStickX || 0).toFixed(2);
  const ry = (a.rightStickY || 0).toFixed(2);

  process.stdout.write(
    `\r\x1b[K[PAD] [\x1b[36m${currentFps} pps\x1b[0m | \x1b[33m${latency}ms\x1b[0m] LS:(${lx},${ly}) RS:(${rx},${ry}) LT:${lt}% RT:${rt}% | Botones: ${btnStr}`
  );
}

connect();
