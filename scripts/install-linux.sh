#!/bin/bash
set -e

echo "=========================================================="
echo "    Inagerlibox: Instalador de Aplicación y Servicio      "
echo "=========================================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NODE_BIN="$(which node || echo "/usr/bin/node")"

echo "[1/4] Configurando servicio en segundo plano (Systemd de Usuario)..."
mkdir -p "$HOME/.config/systemd/user"

cat <<EOF > "$HOME/.config/systemd/user/multicontrol.service"
[Unit]
Description=Inagerlibox Xbox Relay and Watchdog Service
After=network.target

[Service]
Type=simple
WorkingDirectory=$SCRIPT_DIR
ExecStart=$NODE_BIN server/relay-server.js
Restart=always
RestartSec=3
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=default.target
EOF

echo "[2/4] Habilitando inicio automático del servicio sin terminal..."
systemctl --user daemon-reload
systemctl --user enable multicontrol.service
systemctl --user restart multicontrol.service

echo "[3/4] Creando acceso directo en el menú de aplicaciones de Linux..."
mkdir -p "$HOME/.local/share/applications"

cat <<EOF > "$HOME/.local/share/applications/inagerlibox.desktop"
[Desktop Entry]
Version=1.0
Type=Application
Name=Inagerlibox
GenericName=Conector Universal de Mandos para Xbox
Comment=Juega en tu consola Xbox con cualquier control físico
Exec=xdg-open http://localhost:5174/
Icon=$SCRIPT_DIR/public/inagerlibox-icon.png
Terminal=false
Categories=Game;Utility;
StartupNotify=true
EOF

chmod +x "$HOME/.local/share/applications/inagerlibox.desktop"

echo "[4/4] Creando lanzador ejecutable de escritorio..."
cat <<EOF > "$SCRIPT_DIR/Inagerlibox-App.sh"
#!/bin/bash
# Lanzador de un clic para Inagerlibox
systemctl --user is-active --quiet multicontrol.service || systemctl --user start multicontrol.service

if which google-chrome >/dev/null 2>&1; then
    google-chrome --app=http://localhost:5174/ &
elif which brave-browser >/dev/null 2>&1; then
    brave-browser --app=http://localhost:5174/ &
elif which chromium >/dev/null 2>&1; then
    chromium --app=http://localhost:5174/ &
else
    xdg-open http://localhost:5174/ &
fi
EOF

chmod +x "$SCRIPT_DIR/Inagerlibox-App.sh"
cp "$SCRIPT_DIR/Inagerlibox-App.sh" "$SCRIPT_DIR/MultiControl-App.sh" 2>/dev/null || true

echo "=========================================================="
echo " ✓ ¡Instalación Completada con Éxito!"
echo " • El servicio de red de Xbox ahora inicia automáticamente."
echo " • Ya no necesitas abrir la terminal nunca más."
echo " • Puedes abrir 'Inagerlibox' desde el menú de aplicaciones."
echo "=========================================================="
