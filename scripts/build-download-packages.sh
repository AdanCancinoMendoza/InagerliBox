#!/bin/bash
set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOWNLOADS_DIR="$PROJECT_ROOT/public/downloads"
TMP_DIR="/tmp/inagerlibox-build-$(date +%s)"

echo "Construyendo aplicación web primero..."
npm run build --prefix "$PROJECT_ROOT"
rm -rf "$PROJECT_ROOT/dist/downloads"

echo "Creando directorio de descargas: $DOWNLOADS_DIR"
mkdir -p "$DOWNLOADS_DIR"
mkdir -p "$TMP_DIR"

# ========================================================
# 1. PAQUETE LINUX (.tar.gz)
# ========================================================
echo "[1/3] Creando paquete Linux..."
LINUX_PKG="$TMP_DIR/Inagerlibox-Linux"
mkdir -p "$LINUX_PKG"

cp -r "$PROJECT_ROOT/server" "$LINUX_PKG/"
cp -r "$PROJECT_ROOT/dist" "$LINUX_PKG/"
cp "$PROJECT_ROOT/package.json" "$LINUX_PKG/"
cp "$PROJECT_ROOT/public/inagerlibox-icon.png" "$LINUX_PKG/" 2>/dev/null || true
cp "$PROJECT_ROOT/public/inagerlibox-logo.png" "$LINUX_PKG/" 2>/dev/null || true

cat << 'EOF' > "$LINUX_PKG/instalar.sh"
#!/bin/bash
set -e
echo "=========================================================="
echo "    Inagerlibox: Instalador de Aplicación y Servicio      "
echo "=========================================================="
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE_BIN="$(which node || echo "/usr/bin/node")"

mkdir -p "$HOME/.config/systemd/user"
cat <<UNIT > "$HOME/.config/systemd/user/multicontrol.service"
[Unit]
Description=Inagerlibox Xbox Relay Service
After=network.target

[Service]
Type=simple
WorkingDirectory=$DIR
ExecStart=$NODE_BIN server/relay-server.js
Restart=always
RestartSec=3

[Install]
WantedBy=default.target
UNIT

systemctl --user daemon-reload
systemctl --user enable multicontrol.service
systemctl --user restart multicontrol.service

mkdir -p "$HOME/.local/share/applications"
cat <<DESK > "$HOME/.local/share/applications/inagerlibox.desktop"
[Desktop Entry]
Version=1.0
Type=Application
Name=Inagerlibox
GenericName=Xbox Controller Hub
Comment=Juega en tu consola Xbox con cualquier control
Exec=xdg-open http://localhost:5174/
Icon=$DIR/inagerlibox-icon.png
Terminal=false
Categories=Game;Utility;
StartupNotify=true
DESK

chmod +x "$HOME/.local/share/applications/inagerlibox.desktop"
echo "✓ Instalación completada. Ya puedes abrir Inagerlibox desde tu menú de inicio sin usar terminal."
EOF
chmod +x "$LINUX_PKG/instalar.sh"

cat << 'EOF' > "$LINUX_PKG/iniciar.sh"
#!/bin/bash
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if ! pgrep -f "server/relay-server.js" > /dev/null; then
  node "$DIR/server/relay-server.js" &
fi
xdg-open http://localhost:5174/ || true
EOF
chmod +x "$LINUX_PKG/iniciar.sh"

cat << 'EOF' > "$LINUX_PKG/LEEME-LINUX.txt"
=========================================
 Inagerlibox para GNU/Linux
=========================================

INSTALACIÓN RÁPIDA (RECOMENDADO):
1. Abre una terminal en esta carpeta.
2. Ejecuta:
   bash instalar.sh

¡Listo! Inagerlibox se registrará como servicio de sistema que enciende solo
al iniciar sesión, y tendrás el ícono en tu menú de aplicaciones.
EOF

tar -czf "$DOWNLOADS_DIR/Inagerlibox-Linux.tar.gz" -C "$TMP_DIR" Inagerlibox-Linux
cp "$DOWNLOADS_DIR/Inagerlibox-Linux.tar.gz" "$DOWNLOADS_DIR/MultiControl-Linux.tar.gz" 2>/dev/null || true

# ========================================================
# 2. PAQUETE WINDOWS (.zip)
# ========================================================
echo "[2/3] Creando paquete Windows..."
WIN_PKG="$TMP_DIR/Inagerlibox-Windows"
mkdir -p "$WIN_PKG"

cp -r "$PROJECT_ROOT/server" "$WIN_PKG/"
cp -r "$PROJECT_ROOT/dist" "$WIN_PKG/"
cp "$PROJECT_ROOT/package.json" "$WIN_PKG/"
cp "$PROJECT_ROOT/public/inagerlibox-icon.png" "$WIN_PKG/" 2>/dev/null || true
cp "$PROJECT_ROOT/public/inagerlibox-logo.png" "$WIN_PKG/" 2>/dev/null || true

cat << 'EOF' > "$WIN_PKG/Iniciar-Inagerlibox.bat"
@echo off
title Inagerlibox - Xbox Hub
echo ===================================================
echo     Iniciando Inagerlibox en Segundo Plano...
echo ===================================================
start /B node server/relay-server.js
timeout /t 1 /nobreak >nul
start http://localhost:5174/
exit
EOF
cp "$WIN_PKG/Iniciar-Inagerlibox.bat" "$WIN_PKG/Iniciar-MultiControl.bat" 2>/dev/null || true

cat << 'EOF' > "$WIN_PKG/Instalar-Inicio-Automatico.bat"
@echo off
title Instalador Inagerlibox Windows
echo ===================================================
echo Agregando Inagerlibox a Inicio de Windows...
echo ===================================================
set SCRIPT="%TEMP%\%RANDOM%-%RANDOM%_shortcut.vbs"
echo Set oWS = WScript.CreateObject("WScript.Shell") >> %SCRIPT%
echo sLinkFile = "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\Inagerlibox.lnk" >> %SCRIPT%
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> %SCRIPT%
echo oLink.TargetPath = "%~dp0Iniciar-Inagerlibox.bat" >> %SCRIPT%
echo oLink.WorkingDirectory = "%~dp0" >> %SCRIPT%
echo oLink.Save >> %SCRIPT%
cscript /nologo %SCRIPT%
del %SCRIPT%
echo.
echo [OK] Inagerlibox iniciara automaticamente al encender tu PC!
echo.
pause
EOF

cat << 'EOF' > "$WIN_PKG/LEEME-WINDOWS.txt"
=========================================
 Inagerlibox para Windows 10 / 11
=========================================

1. INICIO DIRECTO:
   Haz doble clic en "Iniciar-Inagerlibox.bat"
   Abrirá la aplicación en tu navegador predeterminado y dejará el
   servicio activo en segundo plano sin estorbar.

2. INICIO AUTOMÁTICO (Sin volver a abrir nada):
   Haz clic derecho en "Instalar-Inicio-Automatico.bat" y ejecútalo.
   Inagerlibox arrancará automáticamente cada vez que enciendas tu PC.
EOF

(cd "$TMP_DIR" && zip -r -q "$DOWNLOADS_DIR/Inagerlibox-Windows.zip" Inagerlibox-Windows)
cp "$DOWNLOADS_DIR/Inagerlibox-Windows.zip" "$DOWNLOADS_DIR/MultiControl-Windows.zip" 2>/dev/null || true

# ========================================================
# 3. PAQUETE ANDROID (.zip con PWA y Guía de Instalación)
# ========================================================
echo "[3/3] Creando paquete Android..."
ANDROID_PKG="$TMP_DIR/Inagerlibox-Android"
mkdir -p "$ANDROID_PKG"

cp "$PROJECT_ROOT/public/manifest.json" "$ANDROID_PKG/"
cp "$PROJECT_ROOT/public/inagerlibox-icon.png" "$ANDROID_PKG/" 2>/dev/null || true
cp "$PROJECT_ROOT/public/inagerlibox-logo.png" "$ANDROID_PKG/" 2>/dev/null || true
cp -r "$PROJECT_ROOT/dist" "$ANDROID_PKG/"

cat << 'EOF' > "$ANDROID_PKG/COMO-INSTALAR-EN-ANDROID.txt"
==================================================
 CÓMO INSTALAR INAGERLIBOX EN TU TELÉFONO ANDROID
==================================================

Inagerlibox utiliza tecnología PWA (Progressive Web App) nativa.
Esto permite instalarla como una aplicación real de pantalla completa
sin anuncios y con respuesta táctil directa:

PASOS PARA INSTALAR EN 30 SEGUNDOS:
1. Conecta tu teléfono Android a la misma red Wi-Fi de tu PC / consola.
2. Abre Google Chrome o tu navegador en tu teléfono.
3. Entra a la dirección IP de tu PC con el puerto :5174
   Ejemplo: http://[IP-DE-TU-PC]:5174/
4. Toca el botón de tres puntos (⋮) arriba a la derecha en Chrome.
5. Selecciona "Instalar aplicación" o "Agregar a la pantalla principal".
6. ¡Listo! Se creará el ícono dorado de Inagerlibox en tus aplicaciones
   y se abrirá a pantalla completa como cualquier juego o app nativa.
EOF

cat << 'EOF' > "$ANDROID_PKG/instalar-en-telefono.html"
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Instalador Inagerlibox Android</title>
  <style>
    body { font-family: sans-serif; background: #111; color: #fff; padding: 2rem; text-align: center; }
    .card { max-width: 420px; margin: 0 auto; background: #1a1a1a; padding: 1.5rem; border-radius: 14px; border: 1px solid #333; }
    h1 { color: #d4af37; font-size: 1.5rem; }
    p { color: #aaa; font-size: 0.95rem; line-height: 1.5; }
    .btn { display: inline-block; background: #d4af37; color: #000; text-decoration: none; padding: 0.8rem 1.5rem; border-radius: 8px; font-weight: bold; margin-top: 1rem; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Inagerlibox para Android</h1>
    <p>Abre esta página en Chrome desde tu teléfono Android y pulsa "Instalar aplicación" en el menú.</p>
  </div>
</body>
</html>
EOF

(cd "$TMP_DIR" && zip -r -q "$DOWNLOADS_DIR/Inagerlibox-Android.zip" Inagerlibox-Android)
cp "$DOWNLOADS_DIR/Inagerlibox-Android.zip" "$DOWNLOADS_DIR/MultiControl-Android.zip" 2>/dev/null || true

# Limpieza temporal
rm -rf "$TMP_DIR"

echo "✓ Todos los instaladores fueron creados en: $DOWNLOADS_DIR"
ls -lh "$DOWNLOADS_DIR"
