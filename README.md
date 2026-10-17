# 🎮 MultiControl - Xbox One Bridge (Linux Nativo)

Sistema con **React** capaz de detectar y normalizar mandos de **PlayStation 4, Xbox 360, Xbox Clásico (USB) y controles genéricos (DirectInput/HID)**, permitiendo conectarse **directamente desde tu PC con Linux hacia tu consola Xbox One a través de la red local o Internet**, sin depender de Windows ni de la app oficial de Xbox Remote Play.

---

## 🎨 Diseño Flat: Blanco y Negro Minimalista
- **Fondo:** Blanco puro (#ffffff) y neutro claro (#f6f7f8), limpio y sin distracciones.
- **Acentos:** Negro puro (#111111) de alto contraste.
- **Estilo:** Diseño completamente plano (Flat Design): **cero degradados y cero sombras**.
- **Colores de los botones:** Botones con colores sólidos y auténticos de Xbox (A verde, B rojo, X azul, Y amarillo).

---

## 🕹️ Silueta Dinámica Adaptable según el Mando Conectado
El visualizador central cambia automáticamente de diseño y proporciones según el mando físico conectado:
1. **PlayStation 4 / 5 (DualShock 4 / DualSense):** Silueta icónica de PlayStation con palancas analógicas simétricas inferiores (L3/R3), gran Touchpad central con barra de luz, D-Pad independiente, botones de símbolos clásicos (△, ○, ✕, □) y botones Share, Options y PS.
2. **Xbox 360:** Chasis curvo con el legendario **Anillo de Luz de 4 cuadrantes** (se ilumina el cuadrante correspondiente al Jugador P1, P2, P3 o P4), botones circulares Back/Start y cruceta sobre disco.
3. **Xbox Clásico (Duke / Controller S):** Silueta retro con la gigantesca joya central verde de Xbox y los botones frontales adicionales **Blanco (LB)** y **Negro (RB)**.
4. **Xbox One / Series X|S:** Diseño moderno con contornos ergonómicos definidos, botón Guía/Nexus central y cruceta en cruz.
5. **Mando Genérico / Retro / Arcade:** Chasis universal con distribución equilibrada y números `[1, 2, 3, 4]`.
*También puedes previsualizar cualquier silueta manualmente con la barra de modelos en la parte superior del visualizador.*

---

## 🌐 Escaneo de Red 100% Real y Dinámico (Sin Datos Falsos)

El motor de descubrimiento de red local fue completamente re-diseñado para ser **100% real, activo y libre de falsos positivos**:
1. **Bypass de Aislamiento Wi-Fi (Unicast + Broadcast UDP 5050):** Los routers domésticos (como Huawei, Nokia GPON o TP-Link) descartan paquetes broadcast entre clientes inalámbricos. MultiControl envía paquetes de sondeo SmartGlass tanto a broadcast como en barrido unicast a los 254 hosts de cada subred activa en paralelo (~600ms).
2. **Inspección ARP y Verificación Multicapa:**
   - **Capa 1 (SmartGlass UDP):** Decodifica la respuesta criptográfica oficial con el nombre real de la consola (`XBOXONE`) y su Live ID.
   - **Capa 2 (Puerto TCP 7401):** Comprueba el canal de mandos de SmartGlass.
   - **Capa 3 (Hardware Microsoft OUI):** Valida la dirección MAC física del fabricante Microsoft (`30:59:b7`, `ec:83:50`, `7c:1e:52`, etc.) y mide su latencia real de ping (RTT en milisegundos).
3. **Cero IPs Fijas ni Cache Fantasma:** Se eliminó cualquier IP hardcodeada. Si una consola no está encendida o se desconectó de la red Wi-Fi, el sistema lo indica con honestidad y ofrece una guía diagnóstica para reconectarla.
4. **Separación de Otros Dispositivos:** Los routers, PCs o teléfonos móviles detectados en la subred se agrupan en una sección desplegable independiente para que nunca se confundan con una consola Xbox.

---

## 🛠️ Configuración en tu Consola Xbox One (Solo una vez)

En tu consola Xbox One:
1. Ve a **Configuración &gt; Dispositivos y conexiones &gt; Conexiones de la app de Xbox**.
2. Marca **"Permitir conexiones desde cualquier dispositivo"**.
3. Asegúrate de tener habilitada la opción de **"Características remotas"**.

---

## 🛡️ Filtro Anti-Drift al 100%

En el botón **"Calibrar Joysticks"** puedes activar la opción para que:
- **Gatillo Izquierdo (LT):** Solo se active cuando alcance el 100% de presión (evita apuntar solo por drift).
- **Gatillo Derecho (RT):** Solo se active al 100% de presión (evita disparar solo).
- **Stick Izquierdo (LS - Clic):** Requiera 100% de fuerza para clic (evita clics accidentales al mover el stick).
- **Umbral Regulable:** Ajusta el tope entre 70% y 100% con medidores visuales en tiempo real.

---

## 🚀 Cómo Iniciar el Sistema

```bash
# 1. Iniciar la interfaz web
npm run dev

# 2. Iniciar el puente de red
npm run server
```

Abre tu navegador en **http://localhost:5174/**:
- Conecta tu control de PS4, 360, Clásico o Genérico.
- En la pestaña **"Red Directa (Linux / IP Local)"**, presiona **"Detectar Xbox en Red"** o ingresa la IP de tu consola.
- Pulsa **"Conectar a Xbox"** y ¡a jugar!
