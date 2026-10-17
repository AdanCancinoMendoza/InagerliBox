import React from 'react';
import { Gamepad2, Volume2, VolumeX, BookOpen, Download, Terminal, RefreshCw } from 'lucide-react';
import { soundEffects } from '../services/soundEffects';

// Íconos SVG oficiales de consolas para el mando activo
function NintendoSwitchIcon({ size = 15, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M7.7 2C4 2 2 4.4 2 8v8c0 3.6 2 6 5.7 6h1.6V2H7.7zm-.7 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm9.3-8H14.7v20h1.6c3.7 0 5.7-2.4 5.7-6V8c0-3.6-2-6-5.7-6zm-1.3 14a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" />
    </svg>
  );
}

function PlayStationLogoIcon({ size = 15, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M2.5 16.5c-.2.5-.1 1.1.3 1.4.5.3 1.2.3 2.5.1 1.2-.2 2.7-.7 4.1-1.4V6.2L6 7.4c-.6.2-1 .5-1.3.8-.4.4-.6.9-.6 1.4 0 .4.1.8.4 1.1.3.4.7.6 1.3.6h.4v1.7h-.6c-1.1 0-1.9-.3-2.5-.9-.6-.6-.9-1.4-.9-2.3 0-.9.3-1.8.9-2.5.6-.7 1.5-1.3 2.6-1.6L9.4 4v10.5c-1.1.5-2.2.8-3.1 1-.9.1-1.6.2-2.1.2-.8 0-1.3-.1-1.7-.2zM14.6 10.3c1.3-.6 2.3-1 2.9-1.2.6-.2 1.1-.3 1.5-.3.7 0 1.3.2 1.7.6.4.4.6.9.6 1.5 0 .5-.2 1-.5 1.4-.4.4-.9.8-1.7 1.1l-4.5 1.6v-4.7zm0-2.3v-.8l4.4-1.6c.9-.3 1.7-.5 2.3-.5.9 0 1.7.3 2.2.9.6.6.9 1.4.9 2.4 0 .9-.3 1.7-.8 2.4-.6.7-1.3 1.2-2.3 1.6l-6.7 2.4v4.5l-2.6.9V4.6l2.6-.9v4.3z" />
    </svg>
  );
}

function XboxSphereIcon({ size = 15, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.7 3.5c1.4.9 2.5 2.2 3.2 3.6-1.5 1.5-3.7 3-5.4 4.3 1.8 1.6 3.8 3.1 5.3 4.5-.8 1.4-1.9 2.6-3.2 3.5-1.9-1.5-4.1-3.5-5.6-5.1-1.5 1.6-3.7 3.6-5.6 5.1-1.3-.9-2.4-2.1-3.2-3.5 1.5-1.4 3.5-2.9 5.3-4.5-1.7-1.3-3.9-2.8-5.4-4.3.7-1.4 1.8-2.7 3.2-3.6 2 1.5 4.1 3.5 5.7 5.1 1.6-1.6 3.7-3.6 5.7-5.1z" />
    </svg>
  );
}

export default function Header({
  networkState,
  networkStatus,
  soundEnabled,
  onToggleSound,
  onOpenGuide,
  onOpenDownload,
  onReplayIntro,
  activeGamepad,
  gamepadCount = 0,
  detectedGamepadInfo,
  selectedPlayerIndex = 0
}) {
  const status = networkState?.status || networkStatus || 'disconnected';
  const latency = networkState?.latency;

  const hasController = !!activeGamepad;
  const iconType = detectedGamepadInfo?.iconType || (hasController ? 'generic' : 'none');
  const controllerDisplayName = detectedGamepadInfo?.displayName || activeGamepad?.id || 'Mando Genérico';

  // Nombre amigable según la familia de la consola
  let brandLabel = 'Control Genérico';
  if (iconType === 'nintendo') brandLabel = 'Nintendo Switch';
  else if (iconType === 'playstation') brandLabel = 'PlayStation';
  else if (iconType === 'xbox') brandLabel = 'Xbox Controller';

  return (
    <header className="app-header natural-header">
      {/* Logotipo y Título Natural */}
      <div className="header-brand">
        <img
          src="/inagerlibox-stag.png"
          alt="Inagerlibox"
          className="brand-stag-emblem"
        />
        <div className="brand-text-block">
          <div className="brand-name-row">
            <h1 className="brand-name">Inagerlibox</h1>
            <span className="brand-sub-badge">Xbox Edition</span>
          </div>
          <p className="brand-natural-tagline">
            Juega en tu consola Xbox con cualquier control
          </p>
        </div>
      </div>

      <div className="header-actions">
        {/* Indicador de Mando Conectado en Uso (Nintendo, Xbox o PlayStation) */}
        {hasController ? (
          <div className={`natural-controller-pill controller-pill-${iconType}`} title={controllerDisplayName}>
            <div className={`controller-brand-icon brand-icon-${iconType}`}>
              {iconType === 'nintendo' && <NintendoSwitchIcon size={15} />}
              {iconType === 'playstation' && <PlayStationLogoIcon size={15} />}
              {iconType === 'xbox' && <XboxSphereIcon size={15} />}
              {iconType !== 'nintendo' && iconType !== 'playstation' && iconType !== 'xbox' && (
                <Gamepad2 size={15} />
              )}
            </div>
            <div className="controller-pill-copy">
              <div className="controller-pill-header">
                <span className="controller-pill-dot" />
                <span className="controller-pill-brand">{brandLabel}</span>
                <span className="controller-pill-slot">P{selectedPlayerIndex + 1}</span>
              </div>
              <span className="controller-pill-sub">En uso • Conectado</span>
            </div>
          </div>
        ) : (
          <div className="natural-controller-pill controller-pill-none">
            <Gamepad2 size={15} className="controller-icon-idle" />
            <div className="controller-pill-copy">
              <span className="controller-pill-brand text-muted">Sin mando conectado</span>
              <span className="controller-pill-sub">Conecta por USB o Bluetooth</span>
            </div>
          </div>
        )}

        {/* Indicador de estado de Red Xbox */}
        <div className={`natural-status-pill status-pill-${status}`}>
          {status === 'connected' ? (
            <>
              <span className="status-live-dot dot-online" />
              <div className="status-copy">
                <span className="status-main">Conectado a Xbox</span>
                {latency !== undefined && (
                  <span className="status-detail">{latency} ms</span>
                )}
              </div>
            </>
          ) : status === 'connecting' ? (
            <>
              <RefreshCw size={12} className="spin-icon text-amber" />
              <div className="status-copy">
                <span className="status-main">Sincronizando...</span>
                <span className="status-detail">Buscando consola</span>
              </div>
            </>
          ) : (
            <>
              <span className="status-live-dot dot-idle" />
              <div className="status-copy">
                <span className="status-main">Listo para conectar</span>
                <span className="status-detail">Red local activa</span>
              </div>
            </>
          )}
        </div>

        {/* Botón Descargar App (Simple y natural: sin fondo llamativo, sin degradados, bordes suaves) */}
        <button
          type="button"
          className="btn-natural-action btn-natural-download"
          onClick={() => {
            soundEffects.playClick(750);
            if (onOpenDownload) onOpenDownload();
          }}
          title="Descargar instalador para Linux, Windows o Android"
        >
          <Download size={14} />
          <span>Descargar App</span>
        </button>

        {/* Botón de Sonido Natural */}
        <button
          type="button"
          className="btn-natural-action btn-natural-icon"
          onClick={() => {
            const next = !soundEnabled;
            soundEffects.toggleSound(next);
            onToggleSound(next);
            if (next) soundEffects.playClick(800);
          }}
          title={soundEnabled ? 'Silenciar efectos de sonido' : 'Activar efectos de sonido'}
          aria-label="Alternar sonido"
        >
          {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
        </button>

        {/* Botón de Consola Hacker Intro */}
        <button
          type="button"
          className="btn-natural-action btn-natural-icon"
          onClick={() => {
            soundEffects.playClick(900);
            if (onReplayIntro) onReplayIntro();
          }}
          title="Ver animación de bienvenida"
          aria-label="Animación Hacker"
        >
          <Terminal size={14} />
        </button>

        {/* Botón de Guía Natural */}
        <button
          type="button"
          className="btn-natural-action btn-natural-guide"
          onClick={onOpenGuide}
          title="Ver guía paso a paso de conexión"
        >
          <BookOpen size={14} />
          <span>Guía</span>
        </button>
      </div>
    </header>
  );
}
