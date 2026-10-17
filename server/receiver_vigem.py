"""
MultiControl - Emulador de Mando Virtual ViGEm para Xbox One (Windows Host)
Requiere en Windows:
  pip install vgamepad websocket-client
  Instalador del driver ViGEmBus: https://github.com/nefarius/ViGEmBus/releases

Este script:
1. Crea un mando virtual Xbox 360/Xbox One en Windows reconocido directamente por Xbox App (Remote Play).
2. Se conecta al servidor Relay WebSocket.
3. Traduce los paquetes recibidos desde la Web (PS4, Xbox 360, Genéricos) a eventos del mando virtual.
"""

import sys
import json
import time

try:
    import websocket
except ImportError:
    print("Falta instalar websocket-client: pip install websocket-client")
    sys.exit(1)

HAS_VGAMEPAD = False
virtual_gamepads = {}
try:
    import vgamepad as vg
    # Inicializar hasta 4 mandos virtuales (P1, P2, P3, P4)
    for p in range(4):
        try:
            virtual_gamepads[p] = vg.VX360Gamepad()
            print(f"✓ Mando virtual P{p+1} ViGEmBus inicializado con éxito.")
        except Exception as e:
            print(f"⚠ Error inicializando mando P{p+1}: {e}")
    HAS_VGAMEPAD = len(virtual_gamepads) > 0
except Exception as e:
    print("⚠ No se pudo cargar ViGEmBus (solo compatible con Windows con el driver ViGEm instalado).")
    print("  Modo de prueba simulado activado.")
    print(f"  Detalle: {e}")

SERVER_URL = "ws://localhost:4000/ws"

def on_message(ws, message):
    try:
        msg = json.loads(message)
        m_type = msg.get("type")

        if m_type == "ROOM_CREATED":
            code = msg.get("roomCode")
            print("\n" + "=" * 50)
            print(f"🔑 CÓDIGO DE SALA HOST: {code}")
            print(f"Ingresa este código en el frontend Web para vincular tus mandos.")
            print("=" * 50 + "\n")

        elif m_type == "CONTROLLER_CONNECTED":
            p_idx = msg.get("playerIndex", 0)
            print(f"[+] Mando remoto conectado para P{p_idx + 1}: {msg.get('controllerName')}")

        elif m_type == "CONTROLLER_STATE":
            state = msg.get("state", {})
            player_idx = msg.get("playerIndex", 0)
            apply_to_virtual_gamepad(state, player_idx)

    except Exception as err:
        print(f"Error procesando mensaje: {err}")

def apply_to_virtual_gamepad(state, player_idx=0):
    if not HAS_VGAMEPAD:
        return

    gamepad = virtual_gamepads.get(player_idx) or virtual_gamepads.get(0)
    if not gamepad:
        return

    buttons = state.get("buttons", {})
    axes = state.get("axes", {})

    # Botones digitales
    btn_map = {
        "A": vg.XUSB_BUTTON.XUSB_GAMEPAD_A,
        "B": vg.XUSB_BUTTON.XUSB_GAMEPAD_B,
        "X": vg.XUSB_BUTTON.XUSB_GAMEPAD_X,
        "Y": vg.XUSB_BUTTON.XUSB_GAMEPAD_Y,
        "LB": vg.XUSB_BUTTON.XUSB_GAMEPAD_LEFT_SHOULDER,
        "RB": vg.XUSB_BUTTON.XUSB_GAMEPAD_RIGHT_SHOULDER,
        "View": vg.XUSB_BUTTON.XUSB_GAMEPAD_BACK,
        "Menu": vg.XUSB_BUTTON.XUSB_GAMEPAD_START,
        "LS": vg.XUSB_BUTTON.XUSB_GAMEPAD_LEFT_THUMB,
        "RS": vg.XUSB_BUTTON.XUSB_GAMEPAD_RIGHT_THUMB,
        "DpadUp": vg.XUSB_BUTTON.XUSB_GAMEPAD_DPAD_UP,
        "DpadDown": vg.XUSB_BUTTON.XUSB_GAMEPAD_DPAD_DOWN,
        "DpadLeft": vg.XUSB_BUTTON.XUSB_GAMEPAD_DPAD_LEFT,
        "DpadRight": vg.XUSB_BUTTON.XUSB_GAMEPAD_DPAD_RIGHT,
        "Xbox": vg.XUSB_BUTTON.XUSB_GAMEPAD_GUIDE,
    }

    for name, mask in btn_map.items():
        if buttons.get(name):
            gamepad.press_button(button=mask)
        else:
            gamepad.release_button(button=mask)

    # Gatillos analógicos (0.0 a 1.0 -> 0 a 255)
    lt_val = int(buttons.get("LT", 0.0) * 255)
    rt_val = int(buttons.get("RT", 0.0) * 255)
    gamepad.left_trigger(value=lt_val)
    gamepad.right_trigger(value=rt_val)

    # Joysticks analógicos (-1.0 a 1.0 -> -32768 a 32767, Y invertido en XInput)
    lx = int((axes.get("leftStickX", 0.0)) * 32767)
    ly = int((-axes.get("leftStickY", 0.0)) * 32767) # Invert Y for XInput
    rx = int((axes.get("rightStickX", 0.0)) * 32767)
    ry = int((-axes.get("rightStickY", 0.0)) * 32767)

    gamepad.left_joystick(x_value=lx, y_value=ly)
    gamepad.right_joystick(x_value=rx, y_value=ry)

    # Actualizar estado del mando virtual
    gamepad.update()

def on_open(ws):
    print("Conectado al servidor Relay. Solicitando sala...")
    ws.send(json.dumps({"type": "CREATE_ROOM"}))

def on_error(ws, error):
    print(f"Error WebSocket: {error}")

def on_close(ws, close_status_code, close_msg):
    print("Conexión cerrada.")

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else SERVER_URL
    print(f"Conectando a {target}...")
    ws = websocket.WebSocketApp(
        target,
        on_open=on_open,
        on_message=on_message,
        on_error=on_error,
        on_close=on_close
    )
    ws.run_forever()
