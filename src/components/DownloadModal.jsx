import React, { useState } from 'react';
import {
  X,
  Download,
  Terminal,
  Smartphone,
  Monitor,
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { soundEffects } from '../services/soundEffects';

export default function DownloadModal({ isOpen, onClose, deferredPrompt }) {
  const [copiedLinux, setCopiedLinux] = useState(false);
  const [pwaInstalled, setPwaInstalled] = useState(false);

  if (!isOpen) return null;

  const handleCopyLinux = () => {
    soundEffects.playClick(600);
    navigator.clipboard.writeText('bash scripts/install-linux.sh');
    setCopiedLinux(true);
    setTimeout(() => setCopiedLinux(false), 2000);
  };

  const handleInstallPwa = async () => {
    soundEffects.playClick(700);
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setPwaInstalled(true);
      }
    } else {
      alert('Para instalar en Android: Abre Chrome en tu teléfono, entra a esta página y selecciona "Instalar aplicación" o "Agregar a pantalla principal" en el menú (⋮).');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-download-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-badge modal-icon-stag">
              <img src="/inagerlibox-stag.png" alt="Inagerlibox" className="modal-stag-icon" />
            </div>
            <div>
              <h2 className="modal-title">Descargar Inagerlibox</h2>
              <p className="modal-subtitle">
                Úsalo como aplicación independiente sin necesidad de abrir terminales ni encender servicios manualmente.
              </p>
            </div>
          </div>
          <button type="button" className="btn-close" onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body-cards">
          {/* ================= CARD LINUX ================= */}
          <div className="dl-platform-card dl-card-linux">
            <div className="dl-platform-header">
              <div className="dl-os-icon-box">
                <Terminal size={22} className="os-icon" />
              </div>
              <div className="dl-os-title-block">
                <div className="os-name-row">
                  <span className="dl-os-name">GNU / Linux</span>
                  <span className="dl-tag-service">Servicio Automático</span>
                </div>
                <span className="dl-os-desc">Ubuntu, Debian, Fedora, Arch, Manjaro</span>
              </div>
            </div>

            <ul className="dl-features-list">
              <li>
                <Check size={14} className="feature-check" />
                <span>Instala servicio <code>systemd</code> de fondo sin tocar la terminal</span>
              </li>
              <li>
                <Check size={14} className="feature-check" />
                <span>Crea acceso directo en tu menú de aplicaciones de escritorio</span>
              </li>
              <li>
                <Check size={14} className="feature-check" />
                <span>Inicio instantáneo en ventana limpia tipo app</span>
              </li>
            </ul>

            <div className="dl-actions-group">
              <a
                href="http://localhost:4000/api/download/linux"
                download="Inagerlibox-Linux.tar.gz"
                className="btn-download-action btn-dl-primary"
                onClick={() => soundEffects.playConnect()}
              >
                <Download size={15} />
                <span>Descargar para Linux (.tar.gz)</span>
              </a>

              <div className="quick-command-box">
                <span className="quick-cmd-label">O activar en tu equipo actual:</span>
                <div className="quick-cmd-code">
                  <code>bash scripts/install-linux.sh</code>
                  <button
                    type="button"
                    className="btn-copy-cmd"
                    onClick={handleCopyLinux}
                    title="Copiar comando al portapapeles"
                  >
                    {copiedLinux ? <Check size={13} /> : <Copy size={13} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ================= CARD WINDOWS ================= */}
          <div className="dl-platform-card dl-card-windows">
            <div className="dl-platform-header">
              <div className="dl-os-icon-box">
                <Monitor size={22} className="os-icon" />
              </div>
              <div className="dl-os-title-block">
                <div className="os-name-row">
                  <span className="dl-os-name">Windows 10 / 11</span>
                  <span className="dl-tag-service">Inicio en 1 Clic</span>
                </div>
                <span className="dl-os-desc">64-bit ejecutable portátil</span>
              </div>
            </div>

            <ul className="dl-features-list">
              <li>
                <Check size={14} className="feature-check" />
                <span>Doble clic en <code>Iniciar-Inagerlibox.bat</code> para jugar</span>
              </li>
              <li>
                <Check size={14} className="feature-check" />
                <span>Incluye script para encender automáticamente con Windows</span>
              </li>
              <li>
                <Check size={14} className="feature-check" />
                <span>Compatible con mandos virtuales ViGEmBus nativos</span>
              </li>
            </ul>

            <div className="dl-actions-group">
              <a
                href="http://localhost:4000/api/download/windows"
                download="Inagerlibox-Windows.zip"
                className="btn-download-action btn-dl-primary"
                onClick={() => soundEffects.playConnect()}
              >
                <Download size={15} />
                <span>Descargar para Windows (.zip)</span>
              </a>
            </div>
          </div>

          {/* ================= CARD ANDROID ================= */}
          <div className="dl-platform-card dl-card-android">
            <div className="dl-platform-header">
              <div className="dl-os-icon-box">
                <Smartphone size={22} className="os-icon" />
              </div>
              <div className="dl-os-title-block">
                <div className="os-name-row">
                  <span className="dl-os-name">Android</span>
                  <span className="dl-tag-service">PWA Pantalla Completa</span>
                </div>
                <span className="dl-os-desc">Móviles, Tablets y Consolas Android</span>
              </div>
            </div>

            <ul className="dl-features-list">
              <li>
                <Check size={14} className="feature-check" />
                <span>Se instala en tu pantalla de inicio sin anuncios ni tiendas</span>
              </li>
              <li>
                <Check size={14} className="feature-check" />
                <span>Sin barra de navegación, corre en modo juego panorámico</span>
              </li>
              <li>
                <Check size={14} className="feature-check" />
                <span>Soporta mandos Bluetooth (PS4/Xbox) conectados al teléfono</span>
              </li>
            </ul>

            <div className="dl-actions-group">
              <button
                type="button"
                className="btn-download-action btn-dl-android-install"
                onClick={handleInstallPwa}
              >
                {pwaInstalled ? <Check size={15} /> : <Zap size={15} />}
                <span>{pwaInstalled ? 'Aplicación Instalada' : 'Instalar en este Dispositivo (PWA)'}</span>
              </button>

              <a
                href="http://localhost:4000/api/download/android"
                download="Inagerlibox-Android.zip"
                className="btn-download-action btn-dl-secondary"
                onClick={() => soundEffects.playConnect()}
              >
                <Download size={14} />
                <span>Descargar Paquete Android (.zip)</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
