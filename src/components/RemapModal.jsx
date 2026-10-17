import React, { useState, useEffect } from 'react';
import { X, RotateCcw, Check, Sparkles, AlertCircle } from 'lucide-react';
import { XBOX_BUTTONS, DEFAULT_PROFILES } from '../constants/xboxLayout';
import { soundEffects } from '../services/soundEffects';

export default function RemapModal({
  isOpen,
  onClose,
  rawGamepad,
  profile,
  onSaveProfile,
  onResetProfile,
  playerIndex = 0
}) {
  const [currentButtons, setCurrentButtons] = useState({});
  const [listeningFor, setListeningFor] = useState(null);
  const [selectedPreset, setSelectedPreset] = useState('custom');

  useEffect(() => {
    if (profile?.buttons) {
      setCurrentButtons({ ...profile.buttons });
      setSelectedPreset(profile.type || 'custom');
    }
  }, [profile, isOpen]);

  // Bucle para escuchar pulsaciones físicas cuando listeningFor !== null
  useEffect(() => {
    if (!listeningFor || !isOpen) return;

    let animId;
    const pollPhysicalButton = () => {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      const gp = rawGamepad ? gamepads[rawGamepad.index] : null;

      if (gp && gp.buttons) {
        for (let i = 0; i < gp.buttons.length; i++) {
          const btn = gp.buttons[i];
          if (btn && (btn.pressed || btn.value > 0.6)) {
            // Asignar este botón físico al objetivo Xbox
            soundEffects.playClick(900);
            setCurrentButtons(prev => ({
              ...prev,
              [listeningFor]: i
            }));
            setListeningFor(null);
            return;
          }
        }
      }

      animId = requestAnimationFrame(pollPhysicalButton);
    };

    animId = requestAnimationFrame(pollPhysicalButton);
    return () => cancelAnimationFrame(animId);
  }, [listeningFor, isOpen, rawGamepad]);

  if (!isOpen) return null;

  const handleApplyPreset = (presetKey) => {
    const preset = DEFAULT_PROFILES[presetKey];
    if (preset) {
      soundEffects.playClick(700);
      setCurrentButtons({ ...preset.buttons });
      setSelectedPreset(presetKey);
    }
  };

  const handleSave = () => {
    soundEffects.playConnect();
    const updated = {
      ...profile,
      type: selectedPreset,
      name: selectedPreset !== 'custom' && DEFAULT_PROFILES[selectedPreset]
        ? DEFAULT_PROFILES[selectedPreset].name
        : 'Perfil Personalizado',
      buttons: currentButtons
    };
    onSaveProfile(updated);
    onClose();
  };

  const handleReset = () => {
    soundEffects.playDisconnect();
    onResetProfile();
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={() => { if (!listeningFor) onClose(); }}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Mapeo de Botones · Jugador {playerIndex + 1}</h2>
            <p className="modal-desc">
              Asigna los botones físicos de este mando a la consola Xbox One.
            </p>
          </div>
          <button className="btn-close" onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        {/* Selector de perfiles preestablecidos */}
        <div className="presets-bar">
          <span className="preset-label">Cargar Perfil Predeterminado:</span>
          <div className="preset-buttons">
            <button
              className={`preset-btn ${selectedPreset === 'xboxOne' ? 'preset-active' : ''}`}
              onClick={() => handleApplyPreset('xboxOne')}
            >
              Xbox One / Series
            </button>
            <button
              className={`preset-btn ${selectedPreset === 'xbox360' ? 'preset-active' : ''}`}
              onClick={() => handleApplyPreset('xbox360')}
            >
              Xbox 360
            </button>
            <button
              className={`preset-btn ${selectedPreset === 'ps4' ? 'preset-active' : ''}`}
              onClick={() => handleApplyPreset('ps4')}
            >
              PlayStation 4
            </button>
            <button
              className={`preset-btn ${selectedPreset === 'xboxClassic' ? 'preset-active' : ''}`}
              onClick={() => handleApplyPreset('xboxClassic')}
            >
              Xbox Clásico
            </button>
            <button
              className={`preset-btn ${selectedPreset === 'generic' ? 'preset-active' : ''}`}
              onClick={() => handleApplyPreset('generic')}
            >
              Genérico USB
            </button>
          </div>
        </div>

        {/* Banner de escucha activa */}
        {listeningFor && (
          <div className="listening-banner">
            <span className="listening-pulse" />
            <div>
              <strong>Esperando pulsación:</strong> Presiona en tu mando físico el botón que deseas asignar a{' '}
              <span className="target-btn-highlight">{listeningFor}</span>...
            </div>
            <button
              className="btn-cancel-listen"
              onClick={() => setListeningFor(null)}
            >
              Cancelar
            </button>
          </div>
        )}

        {/* Matriz de botones */}
        <div className="remap-grid">
          {XBOX_BUTTONS.map((xboxBtn) => {
            const mappedIndex = currentButtons[xboxBtn.id];
            const isListening = listeningFor === xboxBtn.id;

            return (
              <div
                key={xboxBtn.id}
                className={`remap-item ${isListening ? 'listening' : ''}`}
              >
                <div className="remap-left">
                  <span
                    className="xbox-btn-dot"
                    style={{ backgroundColor: xboxBtn.color }}
                  />
                  <div className="remap-text-group">
                    <span className="remap-btn-name">{xboxBtn.label}</span>
                    <span className="remap-btn-desc">{xboxBtn.description}</span>
                  </div>
                </div>

                <div className="remap-right">
                  <span className="mapped-badge">
                    {mappedIndex !== undefined ? `Botón ${mappedIndex}` : 'Sin asignar'}
                  </span>
                  <button
                    className={`btn-assign ${isListening ? 'btn-assign-listening' : ''}`}
                    onClick={() => {
                      soundEffects.playClick(500);
                      setListeningFor(xboxBtn.id);
                    }}
                  >
                    {isListening ? 'Pulsar mando...' : 'Reasignar'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer del Modal */}
        <div className="modal-footer">
          <button className="btn-secondary" onClick={handleReset}>
            <RotateCcw size={16} />
            <span>Restablecer Fábrica</span>
          </button>

          <div className="modal-actions-right">
            <button className="btn-cancel" onClick={onClose}>
              Cancelar
            </button>
            <button className="btn-primary" onClick={handleSave}>
              <Check size={16} />
              <span>Guardar Perfil</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
