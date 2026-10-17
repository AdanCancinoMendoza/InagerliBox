import React from 'react';
import { X, Tv, Laptop, Gamepad2, Globe, ShieldCheck, ArrowRight, CheckCircle2, Terminal } from 'lucide-react';

export default function GuideModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-guide-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-row">
            <Gamepad2 size={24} className="guide-modal-icon" />
            <div>
              <h2 className="modal-title">Guía de Conexión a Xbox One (Directo en Linux y Red)</h2>
              <p className="modal-desc">
                Conecta y juega con cualquier mando en tu consola Xbox One sin necesidad de Windows ni Remote Play oficial.
              </p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose} aria-label="Cerrar guía">
            <X size={20} />
          </button>
        </div>

        <div className="guide-body">
          {/* Diagrama de Arquitectura */}
          <div className="architecture-diagram">
            <div className="diag-step">
              <div className="diag-icon-box">
                <Gamepad2 size={24} />
              </div>
              <span className="diag-step-title">1. Tu Mando</span>
              <span className="diag-step-sub">PS4 / 360 / Clásico / Genérico</span>
            </div>

            <ArrowRight size={20} className="diag-arrow" />

            <div className="diag-step">
              <div className="diag-icon-box">
                <Laptop size={24} />
              </div>
              <span className="diag-step-title">2. PC con Linux</span>
              <span className="diag-step-sub">Normalizador &amp; Puente UDP</span>
            </div>

            <ArrowRight size={20} className="diag-arrow" />

            <div className="diag-step">
              <div className="diag-icon-box">
                <Tv size={24} />
              </div>
              <span className="diag-step-title">3. Xbox One</span>
              <span className="diag-step-sub">Conexión Directa por Red</span>
            </div>
          </div>

          {/* Pasos Detallados */}
          <div className="guide-steps-list">
            <div className="guide-step-item">
              <div className="step-num">1</div>
              <div className="step-content">
                <h4 className="step-title">Habilitar conexiones de red en tu Xbox One</h4>
                <p className="step-text">
                  En tu consola Xbox One, ve al menú:
                  <br />
                  <strong>Configuración &gt; Dispositivos y conexiones &gt; Conexiones de la app de Xbox</strong>.
                  <br />
                  Asegúrate de marcar <strong>"Permitir conexiones desde cualquier dispositivo"</strong> y activar las características remotas.
                </p>
              </div>
            </div>

            <div className="guide-step-item">
              <div className="step-num">2</div>
              <div className="step-content">
                <h4 className="step-title">Conecta hasta 4 mandos físicos a tu PC (P1, P2, P3 y P4)</h4>
                <p className="step-text">
                  Conecta por USB o Bluetooth los mandos de tus amigos (PlayStation 4, Xbox 360, Xbox One, Xbox Clásico con adaptador USB o mandos genéricos). Al presionar cualquier botón en cada mando, el sistema lo asignará automáticamente a su slot correspondiente (P1 Verde, P2 Azul, P3 Rojo, P4 Amarillo).
                </p>
              </div>
            </div>

            <div className="guide-step-item">
              <div className="step-num">3</div>
              <div className="step-content">
                <h4 className="step-title">Conectar directamente por IP desde Linux</h4>
                <p className="step-text">
                  En el panel <strong>"Conexión a Xbox One"</strong>:
                  <br />
                  1. Pulsa en <strong>"Detectar Xbox en Red"</strong> para escanear automáticamente tu red local, o escribe directamente la IP local de tu Xbox One.
                  <br />
                  2. Pulsa en <strong>"Conectar a Xbox"</strong>.
                  <br />
                  El puente enviará las pulsaciones de cada jugador en tiempo real hacia la consola Xbox One.
                </p>
              </div>
            </div>

            <div className="guide-step-item">
              <div className="step-num">4</div>
              <div className="step-content">
                <h4 className="step-title">Partidas Multijugador y Perfiles en la Xbox</h4>
                <p className="step-text">
                  Al iniciar juegos de 2, 3 o 4 jugadores (como FIFA, Halo, Overcooked, Mortal Kombat, etc.), pulsa el botón <strong>A</strong> en cada mando para unirse a la partida. En la Xbox puedes seleccionar perfiles de invitado (<em>"Invitado 1"</em>, <em>"Invitado 2"</em>) para que cada amigo tenga su propio personaje.
                </p>
              </div>
            </div>
          </div>

          <div className="guide-info-banner">
            <ShieldCheck size={20} className="info-icon" />
            <div>
              <strong>Diseño y Anti-Drift:</strong> Puedes calibrar los gatillos LT/RT y el stick izquierdo en el menú <em>"Calibrar Joysticks"</em> para activar el filtro de 100% de presión si tu mando tiene fallas de drift.
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-primary" onClick={onClose} style={{ width: '100%' }}>
            <CheckCircle2 size={16} />
            <span>¡Listo, volver a la aplicación!</span>
          </button>
        </div>
      </div>
    </div>
  );
}
