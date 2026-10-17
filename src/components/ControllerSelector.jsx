import React from 'react';
import { Gamepad2, Settings2, Sliders, CheckCircle2, User, Eye, Activity, Plus } from 'lucide-react';
import { identifyGamepadType } from '../services/gamepadEngine';

const PLAYER_CONFIGS = [
  { label: 'P1', name: 'Jugador 1', color: '#107c10', bgLight: '#f0f9f3', borderColor: '#a3d9b5' },
  { label: 'P2', name: 'Jugador 2', color: '#0078d7', bgLight: '#eef6fc', borderColor: '#9cd2fa' },
  { label: 'P3', name: 'Jugador 3', color: '#d83b01', bgLight: '#fdf2ee', borderColor: '#f7bca7' },
  { label: 'P4', name: 'Jugador 4', color: '#d48806', bgLight: '#fef9e8', borderColor: '#f8de8d' }
];

export default function ControllerSelector({
  gamepads,
  selectedIndex,
  onSelectIndex,
  onOpenRemap,
  onOpenCalibration,
  profile,
  playersStates = []
}) {
  const connectedCount = Math.min(gamepads.length, 4);

  return (
    <div className="controller-selector-card natural-card">
      <div className="selector-header">
        <div className="selector-title-group">
          <div className="selector-symbol">
            <Gamepad2 size={20} />
          </div>
          <div>
            <h2 className="selector-title">Controles y Jugadores</h2>
            <p className="selector-subtitle">
              {connectedCount === 0
                ? 'Conecta hasta 4 mandos para jugar juntos en tu consola'
                : `${connectedCount} de 4 controles listos para jugar`}
            </p>
          </div>
        </div>

        <div className="multiplayer-limit-badge natural-badge">
          <span className="limit-count">{connectedCount}/4</span>
          <span className="limit-text">Conectados</span>
        </div>
      </div>

      {/* Grid de 4 Jugadores: P1, P2, P3, P4 */}
      <div className="players-slots-grid">
        {PLAYER_CONFIGS.map((cfg, idx) => {
          const pad = gamepads[idx] || null;
          const detected = pad ? identifyGamepadType(pad.id) : null;
          const state = playersStates[idx] || null;
          const isSelected = selectedIndex === idx;

          // Obtener botones actualmente presionados en este mando
          const pressedButtons = [];
          if (state?.buttons) {
            for (const [btnName, val] of Object.entries(state.buttons)) {
              if (val === true || (typeof val === 'number' && val > 0.5)) {
                pressedButtons.push(btnName);
              }
            }
          }

          return (
            <div
              key={cfg.label}
              className={`player-slot-card ${pad ? 'slot-occupied' : 'slot-empty'} ${isSelected ? 'slot-active-view' : ''}`}
              style={{
                borderColor: isSelected ? cfg.color : pad ? cfg.borderColor : '#e2e4e7',
                backgroundColor: isSelected ? '#ffffff' : pad ? cfg.bgLight : '#fafbfb'
              }}
            >
              {/* Encabezado del Slot */}
              <div className="slot-header">
                <div
                  className="player-pill"
                  style={{
                    backgroundColor: cfg.color,
                    color: '#ffffff'
                  }}
                >
                  <User size={12} />
                  <span>{cfg.label} · {cfg.name}</span>
                </div>

                {pad ? (
                  <button
                    type="button"
                    className={`btn-slot-select ${isSelected ? 'btn-slot-selected' : ''}`}
                    onClick={() => onSelectIndex(idx)}
                    title={`Ver mando del ${cfg.name} en el visualizador`}
                  >
                    <Eye size={13} />
                    <span>{isSelected ? 'Activo' : 'Ver'}</span>
                  </button>
                ) : (
                  <span className="slot-empty-tag">Libre</span>
                )}
              </div>

              {/* Contenido del Slot */}
              {pad ? (
                <div className="slot-body">
                  <div className="slot-device-info">
                    <span
                      className="slot-device-name"
                      title={pad.id}
                      style={{ color: cfg.color }}
                    >
                      {detected.displayName}
                    </span>
                    <span className="slot-device-specs">
                      {pad.buttons.length} botones · {pad.axes.length} ejes
                    </span>
                  </div>

                  {/* Monitor en vivo de botones presionados */}
                  <div className="slot-live-monitor">
                    {pressedButtons.length > 0 ? (
                      <div className="active-keys-row">
                        <Activity size={12} className="pulse-key-icon" style={{ color: cfg.color }} />
                        <span className="active-keys-text">
                          {pressedButtons.slice(0, 3).join(', ')}
                          {pressedButtons.length > 3 ? '...' : ''}
                        </span>
                      </div>
                    ) : (
                      <span className="slot-idle-text">Listo para jugar</span>
                    )}
                  </div>

                  {/* Acciones del Slot */}
                  <div className="slot-actions-row">
                    <button
                      type="button"
                      className="btn-slot-action"
                      onClick={() => {
                        onSelectIndex(idx);
                        onOpenRemap(idx);
                      }}
                      title={`Reasignar botones del ${cfg.name}`}
                    >
                      <Settings2 size={13} />
                      <span>Mapear</span>
                    </button>
                    <button
                      type="button"
                      className="btn-slot-action"
                      onClick={() => {
                        onSelectIndex(idx);
                        onOpenCalibration(idx);
                      }}
                      title={`Ajustar zona muerta y Anti-Drift del ${cfg.name}`}
                    >
                      <Sliders size={13} />
                      <span>Calibrar</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="slot-empty-body">
                  <div className="empty-add-icon" style={{ color: cfg.color }}>
                    <Plus size={18} />
                  </div>
                  <p className="empty-slot-msg">Ranura {cfg.label} disponible</p>
                  <span className="empty-slot-sub">Conecta un control por USB o Bluetooth</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Barra de estado inferior */}
      <div className="multiplayer-footer-bar">
        <div className="multiplayer-active-info">
          <span className="footer-label">Visualizando en pantalla:</span>
          <span className="footer-active-player" style={{ color: PLAYER_CONFIGS[selectedIndex]?.color }}>
            {PLAYER_CONFIGS[selectedIndex]?.label} ({PLAYER_CONFIGS[selectedIndex]?.name})
          </span>
          {gamepads[selectedIndex] && (
            <span className="footer-active-model">
              · {identifyGamepadType(gamepads[selectedIndex].id).displayName}
            </span>
          )}
        </div>

        <div className="multiplayer-help-hint">
          <CheckCircle2 size={14} className="hint-check" />
          <span>Todos los mandos conectados se transmiten en paralelo a tu Xbox</span>
        </div>
      </div>
    </div>
  );
}
