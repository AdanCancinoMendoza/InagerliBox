import React, { useState } from 'react';
import { Activity, Sparkles, Sliders, Palette, Zap, Gamepad2, Flame, Moon } from 'lucide-react';
import { triggerRumble, identifyGamepadType } from '../services/gamepadEngine';
import { soundEffects } from '../services/soundEffects';

const CONTROLLER_MODELS = [
  { id: 'xboxOne', label: 'Xbox One / Series' },
  { id: 'ps4', label: 'PlayStation 4 / 5' },
  { id: 'xbox360', label: 'Xbox 360' },
  { id: 'xboxClassic', label: 'Xbox Clásico' },
  { id: 'generic', label: 'Genérico' }
];

const RGB_MODES = [
  { id: 'chroma', label: 'Chroma Onda', icon: Sparkles, desc: 'Flujo multicolor continuo de 360° en movimiento' },
  { id: 'reactive', label: 'Reactivo Letras', icon: Zap, desc: 'Ilumina según la letra pulsada: A (Verde), B (Rojo), X (Azul), Y (Amarillo)' },
  { id: 'player', label: 'Color Jugador', icon: Gamepad2, desc: 'Iluminación ambiental según el número de jugador' },
  { id: 'cyberpunk', label: 'Neón Cyber', icon: Flame, desc: 'Gradiente eléctrico Cian y Magenta en rotación' },
  { id: 'stealth', label: 'Sigilo', icon: Moon, desc: 'Iluminación minimalista / apagada' }
];

export default function XboxVisualizer({ state, rawGamepad, profile, playerIndex = 0 }) {
  const buttons = state?.buttons || {};
  const axes = state?.axes || { leftStickX: 0, leftStickY: 0, rightStickX: 0, rightStickY: 0 };

  // Detección automática del tipo de mando según hardware
  const detected = rawGamepad ? identifyGamepadType(rawGamepad.id) : null;
  const detectedType = profile?.type || detected?.type || 'xboxOne';

  // Permite seleccionar manualmente para previsualizar o dejar en automático
  const [manualType, setManualType] = useState(null);
  const activeType = manualType || detectedType;

  // Estado del sistema de iluminación RGB Chroma
  const [rgbMode, setRgbMode] = useState(() => {
    return typeof localStorage !== 'undefined' ? localStorage.getItem('multicontrol_rgb_mode') || 'chroma' : 'chroma';
  });

  const handleSetRgbMode = (modeId) => {
    soundEffects.playClick(650);
    setRgbMode(modeId);
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('multicontrol_rgb_mode', modeId);
      } catch {
        // Ignorar
      }
    }
  };

  // Gatillos analógicos (0 a 1)
  const ltValue = Math.max(0, Math.min(1, buttons.LT || 0));
  const rtValue = Math.max(0, Math.min(1, buttons.RT || 0));

  // Desplazamiento máximo en píxeles para los joysticks (radio 18px)
  const maxStickOffset = 18;
  const lx = (axes.leftStickX || 0) * maxStickOffset;
  const ly = (axes.leftStickY || 0) * maxStickOffset;
  const rx = (axes.rightStickX || 0) * maxStickOffset;
  const ry = (axes.rightStickY || 0) * maxStickOffset;

  // Configuración de los 4 botones de acción principales para iluminación reactiva por letras
  const isPlayStation = activeType === 'ps4';

  const actionButtons = isPlayStation
    ? [
        { key: 'A', letter: '✕', name: 'Cruz (✕)', color: '#2563eb', pressed: !!buttons.A },
        { key: 'B', letter: '○', name: 'Círculo (○)', color: '#ef4444', pressed: !!buttons.B },
        { key: 'X', letter: '□', name: 'Cuadrado (□)', color: '#db2777', pressed: !!buttons.X },
        { key: 'Y', letter: '△', name: 'Triángulo (△)', color: '#10b981', pressed: !!buttons.Y },
      ]
    : [
        { key: 'A', letter: 'A', name: 'Botón A', color: '#22c55e', pressed: !!buttons.A },
        { key: 'B', letter: 'B', name: 'Botón B', color: '#ef4444', pressed: !!buttons.B },
        { key: 'X', letter: 'X', name: 'Botón X', color: '#0ea5e9', pressed: !!buttons.X },
        { key: 'Y', letter: 'Y', name: 'Botón Y', color: '#eab308', pressed: !!buttons.Y },
      ];

  const pressedActionButtons = actionButtons.filter(b => b.pressed);

  // Otros controles para el modo reactivo
  const isOtherInputActive =
    buttons.LB || buttons.RB || buttons.LS || buttons.RS ||
    buttons.DpadUp || buttons.DpadDown || buttons.DpadLeft || buttons.DpadRight ||
    buttons.View || buttons.Menu || buttons.Xbox ||
    ltValue > 0.05 || rtValue > 0.05 ||
    Math.abs(axes.leftStickX || 0) > 0.08 || Math.abs(axes.leftStickY || 0) > 0.08 ||
    Math.abs(axes.rightStickX || 0) > 0.08 || Math.abs(axes.rightStickY || 0) > 0.08;

  const playerColors = ['#107c10', '#0078d7', '#d83b01', '#d48806'];
  const pColor = playerColors[playerIndex] || '#107c10';

  // Configuración de trazo y resplandor según modo RGB
  let rgbStroke = 'url(#rgbChromaGrad)';
  let rgbGlowOpacity = 0.9;
  let rgbAuraIntensity = 'glow-chroma';
  let dynamicContainerStyle = {};

  if (rgbMode === 'chroma') {
    rgbStroke = 'url(#rgbChromaGrad)';
    rgbGlowOpacity = 0.9;
    rgbAuraIntensity = 'glow-chroma';
  } else if (rgbMode === 'reactive') {
    if (pressedActionButtons.length === 1) {
      // 1 sola letra pulsada: resplandor sólido de alta intensidad según el color de la letra
      const btn = pressedActionButtons[0];
      rgbStroke = btn.color;
      rgbGlowOpacity = 1.0;
      rgbAuraIntensity = 'glow-reactive-letter';
      dynamicContainerStyle = {
        borderColor: btn.color,
        boxShadow: `0 4px 28px ${btn.color}44`,
        transition: 'all 0.08s ease-out'
      };
    } else if (pressedActionButtons.length > 1) {
      // Múltiples letras pulsadas simultáneamente: gradiente reactivo dinámico
      rgbStroke = 'url(#rgbReactiveLettersGrad)';
      rgbGlowOpacity = 1.0;
      rgbAuraIntensity = 'glow-reactive-letter';
      const mainColor = pressedActionButtons[0].color;
      dynamicContainerStyle = {
        borderColor: mainColor,
        boxShadow: `0 4px 30px ${mainColor}55`,
        transition: 'all 0.08s ease-out'
      };
    } else if (isOtherInputActive) {
      // Gatillos, bumpers, palancas o cruceta activos (sin letras)
      rgbStroke = '#06b6d4';
      rgbGlowOpacity = 0.85;
      rgbAuraIntensity = 'glow-reactive-active';
      dynamicContainerStyle = {
        borderColor: '#06b6d4',
        boxShadow: '0 4px 22px rgba(6, 182, 212, 0.25)',
        transition: 'all 0.12s ease-out'
      };
    } else {
      // Reposo (esperando pulsación)
      rgbStroke = 'rgba(215, 220, 230, 0.35)';
      rgbGlowOpacity = 0.18;
      rgbAuraIntensity = 'glow-dim';
    }
  } else if (rgbMode === 'player') {
    rgbStroke = pColor;
    rgbGlowOpacity = 0.85;
    rgbAuraIntensity = 'glow-player';
  } else if (rgbMode === 'cyberpunk') {
    rgbStroke = 'url(#rgbCyberpunkGrad)';
    rgbGlowOpacity = 0.95;
    rgbAuraIntensity = 'glow-cyberpunk';
  } else if (rgbMode === 'stealth') {
    rgbStroke = 'none';
    rgbGlowOpacity = 0;
    rgbAuraIntensity = 'glow-none';
  }

  const handleTestRumble = async () => {
    soundEffects.playClick(300);
    const success = await triggerRumble(rawGamepad, 500, 1.0, 0.7);
    if (!success) {
      alert('Tu mando o navegador actual no soporta la API de vibración. La transmisión a Xbox seguirá funcionando normalmente.');
    }
  };

  // Etiquetas adaptables según el modelo de mando
  const ltLabel = isPlayStation ? 'L2' : 'LT';
  const rtLabel = isPlayStation ? 'R2' : 'RT';
  const ltDesc = isPlayStation ? 'Gatillo Izquierdo (L2)' : 'Gatillo Izquierdo (LT)';
  const rtDesc = isPlayStation ? 'Gatillo Derecho (R2)' : 'Gatillo Derecho (RT)';

  return (
    <div className={`visualizer-container ${rgbAuraIntensity}`} style={dynamicContainerStyle}>
      {/* Indicador de Jugador y Estado de Asignación */}
      <div className="visualizer-player-header">
        <span className="vis-player-pill" style={{ backgroundColor: pColor, color: '#ffffff' }}>
          Jugador {playerIndex + 1}
        </span>
        <span className="vis-player-hint">
          {rawGamepad ? `Mando asignado: ${detected?.displayName || 'Detectado'}` : 'Esperando asignación de mando'}
        </span>
      </div>

      {/* ================= BARRA DE ILUMINACIÓN RGB CHROMA (CON ICONOS) ================= */}
      <div className="vis-rgb-bar">
        <div className="rgb-bar-label">
          <Palette size={15} className="rgb-header-icon" />
          <span className="rgb-bar-title">Iluminación RGB</span>
          <span className="rgb-bar-desc">
            {RGB_MODES.find(m => m.id === rgbMode)?.desc}
          </span>
        </div>
        <div className="rgb-pills-group">
          {RGB_MODES.map((mode) => {
            const IconComp = mode.icon;
            return (
              <button
                key={mode.id}
                type="button"
                className={`btn-rgb-pill ${rgbMode === mode.id ? 'active' : ''}`}
                onClick={() => handleSetRgbMode(mode.id)}
              >
                <IconComp size={13} className={`rgb-pill-icon icon-${mode.id}`} />
                <span className="rgb-pill-text">{mode.label}</span>
              </button>
            );
          })}
        </div>

        {/* Estado interactivo en vivo de letras en modo Reactivo */}
        {rgbMode === 'reactive' && (
          <div className="rgb-reactive-letters-status">
            <span className="reactive-hint-label">Letras:</span>
            <div className="reactive-chips-row">
              {actionButtons.map((btn) => (
                <span
                  key={btn.key}
                  className={`reactive-letter-chip ${btn.pressed ? 'pressed' : ''}`}
                  style={{
                    borderColor: btn.pressed ? btn.color : '#cbd0d8',
                    backgroundColor: btn.pressed ? btn.color : '#ffffff',
                    color: btn.pressed ? '#ffffff' : btn.color,
                    boxShadow: btn.pressed ? `0 0 10px ${btn.color}90` : 'none',
                  }}
                  title={`${btn.name} (${btn.pressed ? 'Presionado' : 'En reposo'})`}
                >
                  {btn.letter}
                </span>
              ))}
            </div>
            {pressedActionButtons.length > 0 && (
              <span className="reactive-active-feedback">
                {pressedActionButtons.map(b => b.letter).join(' + ')} activo
              </span>
            )}
          </div>
        )}
      </div>

      {/* Barra de Selección y Detección de Silueta de Mando */}
      <div className="vis-model-selector-bar">
        <div className="model-detected-badge">
          <Sparkles size={14} />
          <span>Diseño Activo:</span>
          <span className="model-badge-tag">
            {CONTROLLER_MODELS.find(m => m.id === activeType)?.label || 'Xbox One'}
          </span>
        </div>

        <div className="controller-type-pills">
          {CONTROLLER_MODELS.map(m => (
            <button
              key={m.id}
              type="button"
              className={`btn-model-pill ${activeType === m.id ? 'active' : ''}`}
              onClick={() => {
                soundEffects.playClick(700);
                setManualType(m.id);
              }}
              title={`Mostrar silueta de ${m.label}`}
            >
              {m.label}
            </button>
          ))}

          {manualType && (
            <button
              type="button"
              className="btn-model-reset"
              onClick={() => {
                soundEffects.playClick(500);
                setManualType(null);
              }}
              title="Volver a detección automática del mando físico conectado"
            >
              Auto ({CONTROLLER_MODELS.find(m => m.id === detectedType)?.label || 'Xbox One'})
            </button>
          )}
        </div>
      </div>

      {/* Gatillos analógicos superiores con medidores de presión */}
      <div className="triggers-hud">
        <div className={`trigger-card ${ltValue > 0.05 ? 'active' : ''} ${rgbMode !== 'stealth' ? 'rgb-card-aura' : ''}`}>
          <div className="trigger-label-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="trigger-badge">{ltLabel}</span>
              {profile?.require100PercentLT && (
                <span className="trigger-lock-tag" title="Filtro Anti-Drift: Activa solo al 100%">
                  100% Anti-Drift
                </span>
              )}
            </div>
            <span className="trigger-desc">{ltDesc}</span>
            <span className="trigger-val">{(ltValue * 100).toFixed(0)}%</span>
          </div>
          <div className="trigger-meter-bg">
            <div
              className={`trigger-meter-fill lt-fill ${rgbMode !== 'stealth' ? 'trigger-meter-rgb' : ''}`}
              style={{ width: `${ltValue * 100}%` }}
            />
          </div>
        </div>

        <div className={`trigger-card ${rtValue > 0.05 ? 'active' : ''} ${rgbMode !== 'stealth' ? 'rgb-card-aura' : ''}`}>
          <div className="trigger-label-row">
            <span className="trigger-val">{(rtValue * 100).toFixed(0)}%</span>
            <span className="trigger-desc">{rtDesc}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {profile?.require100PercentRT && (
                <span className="trigger-lock-tag" title="Filtro Anti-Drift: Activa solo al 100%">
                  100% Anti-Drift
                </span>
              )}
              <span className="trigger-badge">{rtLabel}</span>
            </div>
          </div>
          <div className="trigger-meter-bg">
            <div
              className={`trigger-meter-fill rt-fill ${rgbMode !== 'stealth' ? 'trigger-meter-rgb' : ''}`}
              style={{ width: `${rtValue * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* ================= SVG DINÁMICO CON RESPLANDOR RGB EN VIVO ================= */}
      <div className="gamepad-svg-wrapper">
        <svg
          viewBox="0 0 620 410"
          className="gamepad-svg"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Filtro de Resplandor Neón RGB (Underglow) */}
            <filter id="rgbGlowFilter" x="-25%" y="-25%" width="150%" height="150%">
              <feGaussianBlur stdDeviation="8" result="blur1" />
              <feGaussianBlur stdDeviation="16" result="blur2" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Aura suave para detalles de luz */}
            <filter id="rgbSoftAura" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Gradiente Reactivo Dinámico para Combinaciones de Letras Pulsadas */}
            <linearGradient id="rgbReactiveLettersGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              {pressedActionButtons.length >= 2 ? (
                pressedActionButtons.map((btn, idx) => {
                  const offset = Math.round((idx / (pressedActionButtons.length - 1)) * 100);
                  return <stop key={btn.key} offset={`${offset}%`} stopColor={btn.color} />;
                })
              ) : (
                <>
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="100%" stopColor="#ef4444" />
                </>
              )}
            </linearGradient>

            {/* Gradiente Chroma Arcoíris Animado Continuo con Rotación 360 */}
            <linearGradient id="rgbChromaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <animateTransform
                attributeName="gradientTransform"
                type="rotate"
                from="0 0.5 0.5"
                to="360 0.5 0.5"
                dur="6s"
                repeatCount="indefinite"
              />
              <stop offset="0%" stopColor="#ff0055">
                <animate attributeName="stop-color" values="#ff0055;#ff8800;#ffe600;#00ff88;#00e5ff;#9d00ff;#ff0055" dur="6s" repeatCount="indefinite" />
              </stop>
              <stop offset="25%" stopColor="#ff8800">
                <animate attributeName="stop-color" values="#ff8800;#ffe600;#00ff88;#00e5ff;#9d00ff;#ff0055;#ff8800" dur="6s" repeatCount="indefinite" />
              </stop>
              <stop offset="50%" stopColor="#00ff88">
                <animate attributeName="stop-color" values="#00ff88;#00e5ff;#9d00ff;#ff0055;#ff8800;#ffe600;#00ff88" dur="6s" repeatCount="indefinite" />
              </stop>
              <stop offset="75%" stopColor="#00e5ff">
                <animate attributeName="stop-color" values="#00e5ff;#9d00ff;#ff0055;#ff8800;#ffe600;#00ff88;#00e5ff" dur="6s" repeatCount="indefinite" />
              </stop>
              <stop offset="100%" stopColor="#9d00ff">
                <animate attributeName="stop-color" values="#9d00ff;#ff0055;#ff8800;#ffe600;#00ff88;#00e5ff;#9d00ff" dur="6s" repeatCount="indefinite" />
              </stop>
            </linearGradient>

            {/* Gradiente Cyberpunk con Rotación */}
            <linearGradient id="rgbCyberpunkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <animateTransform
                attributeName="gradientTransform"
                type="rotate"
                from="0 0.5 0.5"
                to="360 0.5 0.5"
                dur="4s"
                repeatCount="indefinite"
              />
              <stop offset="0%" stopColor="#00f0ff" />
              <stop offset="50%" stopColor="#d600ff" />
              <stop offset="100%" stopColor="#ff0077" />
            </linearGradient>
          </defs>

          {activeType === 'ps4' && renderPlayStationSvg(buttons, ltValue, rtValue, lx, ly, rx, ry, pColor, rgbStroke, rgbGlowOpacity, rgbMode)}
          {activeType === 'xbox360' && renderXbox360Svg(buttons, ltValue, rtValue, lx, ly, rx, ry, playerIndex, rgbStroke, rgbGlowOpacity, rgbMode)}
          {activeType === 'xboxClassic' && renderXboxClassicSvg(buttons, ltValue, rtValue, lx, ly, rx, ry, rgbStroke, rgbGlowOpacity, rgbMode)}
          {activeType === 'generic' && renderGenericSvg(buttons, ltValue, rtValue, lx, ly, rx, ry, rgbStroke, rgbGlowOpacity, rgbMode)}
          {activeType === 'xboxOne' && renderXboxOneSvg(buttons, ltValue, rtValue, lx, ly, rx, ry, rgbStroke, rgbGlowOpacity, rgbMode)}
        </svg>
      </div>

      {/* Coordenadas en vivo y botón de prueba de vibración */}
      <div className="visualizer-footer">
        <div className="sticks-coords">
          <div className="coord-chip">
            <span className="coord-label">{isPlayStation ? 'L3 / Stick Izq:' : 'LS:'}</span>
            <span className="coord-val">
              X: {(axes.leftStickX || 0).toFixed(2)} | Y: {(axes.leftStickY || 0).toFixed(2)}
            </span>
          </div>
          <div className="coord-chip">
            <span className="coord-label">{isPlayStation ? 'R3 / Stick Der:' : 'RS:'}</span>
            <span className="coord-val">
              X: {(axes.rightStickX || 0).toFixed(2)} | Y: {(axes.rightStickY || 0).toFixed(2)}
            </span>
          </div>
        </div>

        <button
          className="btn-rumble-test"
          onClick={handleTestRumble}
          disabled={!rawGamepad}
          title="Prueba los motores de vibración de tu control físico"
        >
          <Activity size={16} />
          <span>Probar Vibración (Rumble)</span>
        </button>
      </div>
    </div>
  );
}

// =========================================================================
// 1. SILUETA XBOX ONE / SERIES X|S
// =========================================================================
function renderXboxOneSvg(buttons, ltValue, rtValue, lx, ly, rx, ry, rgbStroke = 'none', rgbGlowOpacity = 0.8, rgbMode = 'chroma') {
  return (
    <g>
      {/* Halo de Luz RGB Inferior / Underglow con Onda Láser en Movimiento */}
      {rgbStroke !== 'none' && (
        <path
          d="M 140 75 
             C 220 65, 400 65, 480 75 
             C 525 80, 560 130, 570 200 
             C 580 270, 560 365, 495 365 
             C 460 365, 440 310, 410 275 
             C 365 240, 255 240, 210 275 
             C 180 310, 160 365, 125 365 
             C 60 365, 40 270, 50 200 
             C 60 130, 95 80, 140 75 Z"
          fill="none"
          stroke={rgbStroke}
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={rgbMode === 'chroma' || rgbMode === 'cyberpunk' ? "180 50" : "none"}
          opacity={rgbGlowOpacity}
          filter="url(#rgbGlowFilter)"
        >
          {(rgbMode === 'chroma' || rgbMode === 'cyberpunk') && (
            <animate attributeName="stroke-dashoffset" from="0" to="460" dur="3s" repeatCount="indefinite" />
          )}
        </path>
      )}

      {/* Gatillos traseros superiores (LT y RT) */}
      <path
        d="M 125 55 C 125 35, 175 25, 215 35 L 210 70 L 135 65 Z"
        className="bumper-shape"
        fill={ltValue > 0.05 ? '#111111' : '#f0f2f5'}
        stroke="#cbd0d8"
        strokeWidth="2"
      />
      <path
        d="M 405 35 C 445 25, 495 35, 495 55 L 485 65 L 410 70 Z"
        className="bumper-shape"
        fill={rtValue > 0.05 ? '#111111' : '#f0f2f5'}
        stroke="#cbd0d8"
        strokeWidth="2"
      />

      {/* Bumpers superiores (LB y RB) */}
      <path
        d="M 140 70 C 180 58, 230 62, 255 72 L 250 88 C 220 78, 175 75, 142 86 Z"
        className="bumper-shape"
        fill={buttons.LB ? '#111111' : '#f0f2f5'}
        stroke="#cbd0d8"
        strokeWidth="2"
      />
      <text x="195" y="81" textAnchor="middle" fill={buttons.LB ? '#ffffff' : '#111111'} fontSize="11" fontWeight="bold">
        LB
      </text>

      <path
        d="M 365 72 C 390 62, 440 58, 480 70 L 478 86 C 445 75, 400 78, 370 88 Z"
        className="bumper-shape"
        fill={buttons.RB ? '#111111' : '#f0f2f5'}
        stroke="#cbd0d8"
        strokeWidth="2"
      />
      <text x="425" y="81" textAnchor="middle" fill={buttons.RB ? '#ffffff' : '#111111'} fontSize="11" fontWeight="bold">
        RB
      </text>

      {/* Cuerpo principal del Mando Xbox One */}
      <path
        d="M 140 75 
           C 220 65, 400 65, 480 75 
           C 525 80, 560 130, 570 200 
           C 580 270, 560 365, 495 365 
           C 460 365, 440 310, 410 275 
           C 365 240, 255 240, 210 275 
           C 180 310, 160 365, 125 365 
           C 60 365, 40 270, 50 200 
           C 60 130, 95 80, 140 75 Z"
        fill="#ffffff"
        stroke="#111111"
        strokeWidth="3"
      />

      {/* Ranura ergonómica central superior */}
      <path
        d="M 230 75 C 270 70, 350 70, 390 75 C 380 115, 240 115, 230 75 Z"
        fill="#f6f7f8"
        stroke="#e2e4e7"
        strokeWidth="1.5"
      />

      {/* Botón Xbox Guía Central con Halo Luminoso */}
      <g className="xbox-guide-btn" transform="translate(310, 115)">
        {rgbStroke !== 'none' && (
          <circle r="26" fill="none" stroke={rgbStroke} strokeWidth="3" opacity={rgbGlowOpacity} filter="url(#rgbSoftAura)" />
        )}
        <circle r="22" fill={buttons.Xbox ? '#111111' : '#ffffff'} stroke="#111111" strokeWidth="2.5" />
        <path
          d="M -10 -10 L 10 10 M 10 -10 L -10 10"
          stroke={buttons.Xbox ? '#ffffff' : '#111111'}
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </g>

      {/* Botones View y Menu */}
      <g transform="translate(255, 150)">
        <circle r="12" fill={buttons.View ? '#111111' : '#f0f2f5'} stroke="#cbd0d8" strokeWidth="1.5" />
        <rect x="-6" y="-5" width="7" height="6" fill="none" stroke={buttons.View ? '#ffffff' : '#111111'} strokeWidth="1.2" />
        <rect x="-2" y="-2" width="7" height="6" fill="none" stroke={buttons.View ? '#ffffff' : '#111111'} strokeWidth="1.2" />
      </g>
      <g transform="translate(365, 150)">
        <circle r="12" fill={buttons.Menu ? '#111111' : '#f0f2f5'} stroke="#cbd0d8" strokeWidth="1.5" />
        <line x1="-5" y1="-4" x2="5" y2="-4" stroke={buttons.Menu ? '#ffffff' : '#111111'} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="-5" y1="0" x2="5" y2="0" stroke={buttons.Menu ? '#ffffff' : '#111111'} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="-5" y1="4" x2="5" y2="4" stroke={buttons.Menu ? '#ffffff' : '#111111'} strokeWidth="1.5" strokeLinecap="round" />
      </g>

      {/* Stick Izquierdo (LS) */}
      <g transform="translate(185, 160)">
        <circle r="38" fill="#f6f7f8" stroke="#e2e4e7" strokeWidth="2" />
        <circle r="18" fill="none" stroke="#cbd0d8" strokeWidth="1" strokeDasharray="3 3" />
        <g transform={`translate(${lx}, ${ly})`} style={{ transition: 'transform 0.05s ease-out' }}>
          <circle r="26" fill={buttons.LS ? '#111111' : '#ffffff'} stroke={buttons.LS ? '#000000' : '#888888'} strokeWidth="2.5" />
          <circle r="19" fill="#f0f2f5" stroke="#cbd0d8" strokeWidth="1.5" />
          <circle r="11" fill="none" stroke="#e2e4e7" strokeWidth="1" />
          <text x="0" y="4" textAnchor="middle" fill={buttons.LS ? '#ffffff' : '#111111'} fontSize="9" fontWeight="bold">
            LS
          </text>
        </g>
      </g>

      {/* D-Pad */}
      <g transform="translate(245, 260)">
        <circle r="36" fill="#f6f7f8" stroke="#e2e4e7" strokeWidth="2" />
        <path d="M -10 -10 L -10 -30 L 10 -30 L 10 -10 Z" fill={buttons.DpadUp ? '#111111' : '#ffffff'} stroke="#cbd0d8" strokeWidth="1.5" />
        <path d="M -10 10 L -10 30 L 10 30 L 10 10 Z" fill={buttons.DpadDown ? '#111111' : '#ffffff'} stroke="#cbd0d8" strokeWidth="1.5" />
        <path d="M -10 -10 L -30 -10 L -30 10 L -10 10 Z" fill={buttons.DpadLeft ? '#111111' : '#ffffff'} stroke="#cbd0d8" strokeWidth="1.5" />
        <path d="M 10 -10 L 30 -10 L 30 10 L 10 10 Z" fill={buttons.DpadRight ? '#111111' : '#ffffff'} stroke="#cbd0d8" strokeWidth="1.5" />
        <rect x="-10" y="-10" width="20" height="20" fill="#f0f2f5" stroke="none" />
      </g>

      {/* Stick Derecho (RS) */}
      <g transform="translate(365, 240)">
        <circle r="38" fill="#f6f7f8" stroke="#e2e4e7" strokeWidth="2" />
        <circle r="18" fill="none" stroke="#cbd0d8" strokeWidth="1" strokeDasharray="3 3" />
        <g transform={`translate(${rx}, ${ry})`} style={{ transition: 'transform 0.05s ease-out' }}>
          <circle r="26" fill={buttons.RS ? '#111111' : '#ffffff'} stroke={buttons.RS ? '#000000' : '#888888'} strokeWidth="2.5" />
          <circle r="19" fill="#f0f2f5" stroke="#cbd0d8" strokeWidth="1.5" />
          <circle r="11" fill="none" stroke="#e2e4e7" strokeWidth="1" />
          <text x="0" y="4" textAnchor="middle" fill={buttons.RS ? '#ffffff' : '#111111'} fontSize="9" fontWeight="bold">
            RS
          </text>
        </g>
      </g>

      {/* Botones frontales A, B, X, Y */}
      <g transform="translate(435, 160)">
        <g transform="translate(0, -32)">
          <circle
            r="15"
            fill={buttons.Y ? '#eab308' : '#f9a825'}
            stroke={buttons.Y ? '#fef08a' : '#d48806'}
            strokeWidth={buttons.Y ? "3" : "2"}
            filter={buttons.Y ? 'url(#rgbGlowFilter)' : 'none'}
          />
          <text x="0" y="5" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="900">Y</text>
        </g>
        <g transform="translate(-32, 0)">
          <circle
            r="15"
            fill={buttons.X ? '#0ea5e9' : '#1976d2'}
            stroke={buttons.X ? '#bae6fd' : '#1565c0'}
            strokeWidth={buttons.X ? "3" : "2"}
            filter={buttons.X ? 'url(#rgbGlowFilter)' : 'none'}
          />
          <text x="0" y="5" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="900">X</text>
        </g>
        <g transform="translate(32, 0)">
          <circle
            r="15"
            fill={buttons.B ? '#ef4444' : '#d32f2f'}
            stroke={buttons.B ? '#fecaca' : '#c62828'}
            strokeWidth={buttons.B ? "3" : "2"}
            filter={buttons.B ? 'url(#rgbGlowFilter)' : 'none'}
          />
          <text x="0" y="5" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="900">B</text>
        </g>
        <g transform="translate(0, 32)">
          <circle
            r="15"
            fill={buttons.A ? '#22c55e' : '#2e7d32'}
            stroke={buttons.A ? '#bbf7d0' : '#1b5e20'}
            strokeWidth={buttons.A ? "3" : "2"}
            filter={buttons.A ? 'url(#rgbGlowFilter)' : 'none'}
          />
          <text x="0" y="5" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="900">A</text>
        </g>
      </g>
    </g>
  );
}

// =========================================================================
// 2. SILUETA PLAYSTATION 4 (DUALSHOCK 4 / DUALSENSE)
// =========================================================================
function renderPlayStationSvg(buttons, ltValue, rtValue, lx, ly, rx, ry, pColor, rgbStroke = 'none', rgbGlowOpacity = 0.8, rgbMode = 'chroma') {
  return (
    <g>
      {/* Halo de Luz RGB Inferior / Underglow con Onda Láser en Movimiento */}
      {rgbStroke !== 'none' && (
        <path
          d="M 140 78 
             C 210 74, 410 74, 480 78 
             C 515 82, 555 125, 565 200 
             C 575 270, 560 375, 495 375 
             C 460 375, 445 320, 420 280 
             C 385 240, 235 240, 200 280 
             C 175 320, 160 375, 125 375 
             C 60 375, 45 270, 55 200 
             C 65 125, 105 82, 140 78 Z"
          fill="none"
          stroke={rgbStroke}
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={rgbMode === 'chroma' || rgbMode === 'cyberpunk' ? "180 50" : "none"}
          opacity={rgbGlowOpacity}
          filter="url(#rgbGlowFilter)"
        >
          {(rgbMode === 'chroma' || rgbMode === 'cyberpunk') && (
            <animate attributeName="stroke-dashoffset" from="0" to="460" dur="3s" repeatCount="indefinite" />
          )}
        </path>
      )}

      {/* Gatillos L2 y R2 */}
      <path
        d="M 125 55 C 125 35, 175 25, 215 35 L 210 70 L 135 65 Z"
        className="bumper-shape"
        fill={ltValue > 0.05 ? '#111111' : '#f0f2f5'}
        stroke="#cbd0d8"
        strokeWidth="2"
      />
      <path
        d="M 405 35 C 445 25, 495 35, 495 55 L 485 65 L 410 70 Z"
        className="bumper-shape"
        fill={rtValue > 0.05 ? '#111111' : '#f0f2f5'}
        stroke="#cbd0d8"
        strokeWidth="2"
      />

      {/* Bumpers L1 y R1 */}
      <path
        d="M 135 70 C 175 60, 220 65, 245 74 L 240 88 C 215 78, 170 76, 137 86 Z"
        className="bumper-shape"
        fill={buttons.LB ? '#111111' : '#f0f2f5'}
        stroke="#cbd0d8"
        strokeWidth="2"
      />
      <text x="190" y="81" textAnchor="middle" fill={buttons.LB ? '#ffffff' : '#111111'} fontSize="11" fontWeight="bold">
        L1
      </text>

      <path
        d="M 375 74 C 400 65, 445 60, 485 70 L 483 86 C 450 76, 405 78, 380 88 Z"
        className="bumper-shape"
        fill={buttons.RB ? '#111111' : '#f0f2f5'}
        stroke="#cbd0d8"
        strokeWidth="2"
      />
      <text x="430" y="81" textAnchor="middle" fill={buttons.RB ? '#ffffff' : '#111111'} fontSize="11" fontWeight="bold">
        R1
      </text>

      {/* Cuerpo icónico de DualShock 4 */}
      <path
        d="M 140 78 
           C 210 74, 410 74, 480 78 
           C 515 82, 555 125, 565 200 
           C 575 270, 560 375, 495 375 
           C 460 375, 445 320, 420 280 
           C 385 240, 235 240, 200 280 
           C 175 320, 160 375, 125 375 
           C 60 375, 45 270, 55 200 
           C 65 125, 105 82, 140 78 Z"
        fill="#ffffff"
        stroke="#111111"
        strokeWidth="3"
      />

      {/* Touchpad Central */}
      <rect x="250" y="86" width="120" height="74" rx="8" fill="#f6f7f8" stroke="#111111" strokeWidth="2" />
      {/* Barra de luz del Touchpad con RGB vivo */}
      <rect
        x="276"
        y="89"
        width="68"
        height="5"
        rx="2.5"
        fill={rgbStroke !== 'none' ? rgbStroke : (buttons.Xbox ? '#0078d7' : pColor)}
        filter={rgbStroke !== 'none' ? 'url(#rgbSoftAura)' : 'none'}
      />
      <text x="310" y="128" textAnchor="middle" fill="#888888" fontSize="10" fontWeight="bold" letterSpacing="1">
        TOUCHPAD
      </text>

      {/* Botones Share y Options */}
      <g transform="translate(225, 120)">
        <rect x="-14" y="-7" width="28" height="14" rx="7" fill={buttons.View ? '#111111' : '#f0f2f5'} stroke="#cbd0d8" strokeWidth="1.5" />
        <text x="0" y="3" textAnchor="middle" fill={buttons.View ? '#ffffff' : '#111111'} fontSize="7" fontWeight="bold">SHARE</text>
      </g>
      <g transform="translate(395, 120)">
        <rect x="-16" y="-7" width="32" height="14" rx="7" fill={buttons.Menu ? '#111111' : '#f0f2f5'} stroke="#cbd0d8" strokeWidth="1.5" />
        <text x="0" y="3" textAnchor="middle" fill={buttons.Menu ? '#ffffff' : '#111111'} fontSize="7" fontWeight="bold">OPTIONS</text>
      </g>

      {/* Botón PS Home (entre las palancas) */}
      <g transform="translate(310, 235)">
        <circle r="14" fill={buttons.Xbox ? '#111111' : '#ffffff'} stroke="#111111" strokeWidth="2" />
        <text x="0" y="4" textAnchor="middle" fill={buttons.Xbox ? '#ffffff' : '#111111'} fontSize="9" fontWeight="900">PS</text>
      </g>

      {/* D-Pad PlayStation (Arriba a la izquierda) */}
      <g transform="translate(175, 170)">
        <circle r="36" fill="#f6f7f8" stroke="#e2e4e7" strokeWidth="2" />
        <path d="M -9 -10 L -9 -28 L 9 -28 L 9 -10 Z" fill={buttons.DpadUp ? '#111111' : '#ffffff'} stroke="#cbd0d8" strokeWidth="1.5" />
        <path d="M -9 10 L -9 28 L 9 28 L 9 10 Z" fill={buttons.DpadDown ? '#111111' : '#ffffff'} stroke="#cbd0d8" strokeWidth="1.5" />
        <path d="M -10 -9 L -28 -9 L -28 9 L -10 9 Z" fill={buttons.DpadLeft ? '#111111' : '#ffffff'} stroke="#cbd0d8" strokeWidth="1.5" />
        <path d="M 10 -9 L 28 -9 L 28 9 L 10 9 Z" fill={buttons.DpadRight ? '#111111' : '#ffffff'} stroke="#cbd0d8" strokeWidth="1.5" />
        <circle r="7" fill="#f0f2f5" />
      </g>

      {/* PALANCAS SIMÉTRICAS PLAYSTATION (Ambas abajo al centro) */}
      {/* Left Stick (L3) */}
      <g transform="translate(235, 260)">
        <circle r="38" fill="#f6f7f8" stroke="#e2e4e7" strokeWidth="2" />
        <circle r="18" fill="none" stroke="#cbd0d8" strokeWidth="1" strokeDasharray="3 3" />
        <g transform={`translate(${lx}, ${ly})`} style={{ transition: 'transform 0.05s ease-out' }}>
          <circle r="26" fill={buttons.LS ? '#111111' : '#ffffff'} stroke={buttons.LS ? '#000000' : '#888888'} strokeWidth="2.5" />
          <circle r="19" fill="#f0f2f5" stroke="#cbd0d8" strokeWidth="1.5" />
          <text x="0" y="4" textAnchor="middle" fill={buttons.LS ? '#ffffff' : '#111111'} fontSize="9" fontWeight="bold">L3</text>
        </g>
      </g>

      {/* Right Stick (R3) */}
      <g transform="translate(385, 260)">
        <circle r="38" fill="#f6f7f8" stroke="#e2e4e7" strokeWidth="2" />
        <circle r="18" fill="none" stroke="#cbd0d8" strokeWidth="1" strokeDasharray="3 3" />
        <g transform={`translate(${rx}, ${ry})`} style={{ transition: 'transform 0.05s ease-out' }}>
          <circle r="26" fill={buttons.RS ? '#111111' : '#ffffff'} stroke={buttons.RS ? '#000000' : '#888888'} strokeWidth="2.5" />
          <circle r="19" fill="#f0f2f5" stroke="#cbd0d8" strokeWidth="1.5" />
          <text x="0" y="4" textAnchor="middle" fill={buttons.RS ? '#ffffff' : '#111111'} fontSize="9" fontWeight="bold">R3</text>
        </g>
      </g>

      {/* Botones de Acción PlayStation (△, ○, ✕, □) */}
      <g transform="translate(445, 170)">
        <circle r="36" fill="#f6f7f8" stroke="#e2e4e7" strokeWidth="2" />
        {/* Triángulo / Y (Arriba) */}
        <g transform="translate(0, -28)">
          <circle
            r="13"
            fill={buttons.Y ? '#10b981' : '#ffffff'}
            stroke={buttons.Y ? '#a7f3d0' : '#cbd0d8'}
            strokeWidth={buttons.Y ? "2.5" : "2"}
            filter={buttons.Y ? 'url(#rgbGlowFilter)' : 'none'}
          />
          <text x="0" y="4" textAnchor="middle" fill={buttons.Y ? '#ffffff' : '#00aa55'} fontSize="13" fontWeight="900">△</text>
        </g>
        {/* Círculo / B (Derecha) */}
        <g transform="translate(28, 0)">
          <circle
            r="13"
            fill={buttons.B ? '#ef4444' : '#ffffff'}
            stroke={buttons.B ? '#fecaca' : '#cbd0d8'}
            strokeWidth={buttons.B ? "2.5" : "2"}
            filter={buttons.B ? 'url(#rgbGlowFilter)' : 'none'}
          />
          <text x="0" y="4" textAnchor="middle" fill={buttons.B ? '#ffffff' : '#e60012'} fontSize="13" fontWeight="900">○</text>
        </g>
        {/* Cruz / A (Abajo) */}
        <g transform="translate(0, 28)">
          <circle
            r="13"
            fill={buttons.A ? '#2563eb' : '#ffffff'}
            stroke={buttons.A ? '#bfdbfe' : '#cbd0d8'}
            strokeWidth={buttons.A ? "2.5" : "2"}
            filter={buttons.A ? 'url(#rgbGlowFilter)' : 'none'}
          />
          <text x="0" y="4" textAnchor="middle" fill={buttons.A ? '#ffffff' : '#0066cc'} fontSize="13" fontWeight="900">✕</text>
        </g>
        {/* Cuadrado / X (Izquierda) */}
        <g transform="translate(-28, 0)">
          <circle
            r="13"
            fill={buttons.X ? '#db2777' : '#ffffff'}
            stroke={buttons.X ? '#fbcfe8' : '#cbd0d8'}
            strokeWidth={buttons.X ? "2.5" : "2"}
            filter={buttons.X ? 'url(#rgbGlowFilter)' : 'none'}
          />
          <text x="0" y="4" textAnchor="middle" fill={buttons.X ? '#ffffff' : '#cc0088'} fontSize="13" fontWeight="900">□</text>
        </g>
      </g>
    </g>
  );
}

// =========================================================================
// 3. SILUETA XBOX 360 (CON ANILLO DE LUZ DE 4 CUADRANTES)
// =========================================================================
function renderXbox360Svg(buttons, ltValue, rtValue, lx, ly, rx, ry, playerIndex, rgbStroke = 'none', rgbGlowOpacity = 0.8, rgbMode = 'chroma') {
  // Cuadrante activo para el jugador o todos encendidos si se presiona el botón Guía
  const isP1 = playerIndex === 0 || buttons.Xbox;
  const isP2 = playerIndex === 1 || buttons.Xbox;
  const isP3 = playerIndex === 2 || buttons.Xbox;
  const isP4 = playerIndex === 3 || buttons.Xbox;

  return (
    <g>
      {/* Halo de Luz RGB Inferior / Underglow con Onda Láser en Movimiento */}
      {rgbStroke !== 'none' && (
        <path
          d="M 145 72 
             C 220 62, 400 62, 475 72 
             C 525 78, 565 130, 570 200 
             C 575 270, 550 370, 490 370 
             C 450 370, 435 300, 405 270 
             C 360 235, 260 235, 215 270 
             C 185 300, 170 370, 130 370 
             C 70 370, 45 270, 50 200 
             C 55 130, 95 78, 145 72 Z"
          fill="none"
          stroke={rgbStroke}
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={rgbMode === 'chroma' || rgbMode === 'cyberpunk' ? "180 50" : "none"}
          opacity={rgbGlowOpacity}
          filter="url(#rgbGlowFilter)"
        >
          {(rgbMode === 'chroma' || rgbMode === 'cyberpunk') && (
            <animate attributeName="stroke-dashoffset" from="0" to="460" dur="3s" repeatCount="indefinite" />
          )}
        </path>
      )}

      {/* Gatillos traseros 360 */}
      <path d="M 130 50 C 130 30, 180 20, 220 30 L 215 65 L 140 60 Z" fill={ltValue > 0.05 ? '#111111' : '#f0f2f5'} stroke="#cbd0d8" strokeWidth="2" />
      <path d="M 400 30 C 440 20, 490 30, 490 50 L 480 60 L 405 65 Z" fill={rtValue > 0.05 ? '#111111' : '#f0f2f5'} stroke="#cbd0d8" strokeWidth="2" />

      {/* Bumpers curvos 360 */}
      <path d="M 145 66 C 185 54, 235 58, 258 70 L 252 85 C 225 74, 180 72, 147 82 Z" fill={buttons.LB ? '#111111' : '#f0f2f5'} stroke="#cbd0d8" strokeWidth="2" />
      <text x="200" y="78" textAnchor="middle" fill={buttons.LB ? '#ffffff' : '#111111'} fontSize="11" fontWeight="bold">LB</text>

      <path d="M 362 70 C 385 58, 435 54, 475 66 L 473 82 C 440 72, 395 74, 368 85 Z" fill={buttons.RB ? '#111111' : '#f0f2f5'} stroke="#cbd0d8" strokeWidth="2" />
      <text x="420" y="78" textAnchor="middle" fill={buttons.RB ? '#ffffff' : '#111111'} fontSize="11" fontWeight="bold">RB</text>

      {/* Cuerpo voluptuoso y curvo de Xbox 360 */}
      <path
        d="M 145 72 
           C 220 62, 400 62, 475 72 
           C 525 78, 565 130, 570 200 
           C 575 270, 550 370, 490 370 
           C 450 370, 435 300, 405 270 
           C 360 235, 260 235, 215 270 
           C 185 300, 170 370, 130 370 
           C 70 370, 45 270, 50 200 
           C 55 130, 95 78, 145 72 Z"
        fill="#ffffff"
        stroke="#111111"
        strokeWidth="3"
      />

      {/* ================= EL ICÓNICO ANILLO DE LUZ DE XBOX 360 ================= */}
      <g transform="translate(310, 135)">
        {/* Resplandor del Anillo de Luz */}
        {rgbStroke !== 'none' && (
          <circle r="30" fill="none" stroke={rgbStroke} strokeWidth="3" opacity={rgbGlowOpacity} filter="url(#rgbSoftAura)" />
        )}

        {/* Base exterior del anillo */}
        <circle r="26" fill="#f0f2f5" stroke="#111111" strokeWidth="2" />

        {/* 4 Cuadrantes LED de Jugadores (P1, P2, P3, P4) */}
        {/* Q1 (P1 - Arriba Izquierda) */}
        <path d="M -2 -4 A 20 20 0 0 0 -18 -2 L -13 -2 A 15 15 0 0 1 -2 -3 Z" fill={isP1 ? '#107c10' : '#d8dbe0'} />
        {/* Q2 (P2 - Arriba Derecha) */}
        <path d="M 2 -4 A 20 20 0 0 1 18 -2 L 13 -2 A 15 15 0 0 0 2 -3 Z" fill={isP2 ? '#107c10' : '#d8dbe0'} />
        {/* Q3 (P3 - Abajo Izquierda) */}
        <path d="M -18 2 A 20 20 0 0 0 -2 4 L -2 3 A 15 15 0 0 1 -13 2 Z" fill={isP3 ? '#107c10' : '#d8dbe0'} />
        {/* Q4 (P4 - Abajo Derecha) */}
        <path d="M 18 2 A 20 20 0 0 1 2 4 L 2 3 A 15 15 0 0 0 13 2 Z" fill={isP4 ? '#107c10' : '#d8dbe0'} />

        {/* Botón Central Guía Xbox 360 con la 'X' cromada */}
        <circle r="14" fill={buttons.Xbox ? '#111111' : '#ffffff'} stroke="#cbd0d8" strokeWidth="2" />
        <path
          d="M -6 -6 L 6 6 M 6 -6 L -6 6"
          stroke={buttons.Xbox ? '#ffffff' : '#107c10'}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </g>

      {/* Botones Back y Start circulares */}
      <g transform="translate(255, 145)">
        <circle r="10" fill={buttons.View ? '#111111' : '#f0f2f5'} stroke="#cbd0d8" strokeWidth="1.5" />
        <path d="M -3 0 L 2 -4 L 2 4 Z" fill={buttons.View ? '#ffffff' : '#111111'} />
      </g>
      <g transform="translate(365, 145)">
        <circle r="10" fill={buttons.Menu ? '#111111' : '#f0f2f5'} stroke="#cbd0d8" strokeWidth="1.5" />
        <path d="M 3 0 L -2 -4 L -2 4 Z" fill={buttons.Menu ? '#ffffff' : '#111111'} />
      </g>

      {/* Stick Izquierdo Xbox 360 con 4 puntos de agarre */}
      <g transform="translate(185, 160)">
        <circle r="38" fill="#f6f7f8" stroke="#e2e4e7" strokeWidth="2" />
        <circle r="18" fill="none" stroke="#cbd0d8" strokeWidth="1" strokeDasharray="3 3" />
        <g transform={`translate(${lx}, ${ly})`} style={{ transition: 'transform 0.05s ease-out' }}>
          <circle r="26" fill={buttons.LS ? '#111111' : '#ffffff'} stroke={buttons.LS ? '#000000' : '#888888'} strokeWidth="2.5" />
          <circle r="19" fill="#f0f2f5" stroke="#cbd0d8" strokeWidth="1.5" />
          <circle cx="0" cy="-10" r="1.5" fill="#888888" />
          <circle cx="0" cy="10" r="1.5" fill="#888888" />
          <circle cx="-10" cy="0" r="1.5" fill="#888888" />
          <circle cx="10" cy="0" r="1.5" fill="#888888" />
          <text x="0" y="4" textAnchor="middle" fill={buttons.LS ? '#ffffff' : '#111111'} fontSize="9" fontWeight="bold">LS</text>
        </g>
      </g>

      {/* D-Pad Xbox 360 (Sobre disco circular) */}
      <g transform="translate(245, 255)">
        <circle r="36" fill="#e8eaed" stroke="#cbd0d8" strokeWidth="1.5" />
        <circle r="30" fill="#f6f7f8" stroke="#e2e4e7" strokeWidth="1.5" />
        <path d="M -9 -9 L -9 -26 L 9 -26 L 9 -9 Z" fill={buttons.DpadUp ? '#111111' : '#ffffff'} stroke="#cbd0d8" strokeWidth="1.5" />
        <path d="M -9 9 L -9 26 L 9 26 L 9 9 Z" fill={buttons.DpadDown ? '#111111' : '#ffffff'} stroke="#cbd0d8" strokeWidth="1.5" />
        <path d="M -9 -9 L -26 -9 L -26 9 L -9 9 Z" fill={buttons.DpadLeft ? '#111111' : '#ffffff'} stroke="#cbd0d8" strokeWidth="1.5" />
        <path d="M 9 -9 L 26 -9 L 26 9 L 9 9 Z" fill={buttons.DpadRight ? '#111111' : '#ffffff'} stroke="#cbd0d8" strokeWidth="1.5" />
        <rect x="-9" y="-9" width="18" height="18" fill="#f0f2f5" stroke="none" />
      </g>

      {/* Stick Derecho Xbox 360 */}
      <g transform="translate(365, 245)">
        <circle r="38" fill="#f6f7f8" stroke="#e2e4e7" strokeWidth="2" />
        <circle r="18" fill="none" stroke="#cbd0d8" strokeWidth="1" strokeDasharray="3 3" />
        <g transform={`translate(${rx}, ${ry})`} style={{ transition: 'transform 0.05s ease-out' }}>
          <circle r="26" fill={buttons.RS ? '#111111' : '#ffffff'} stroke={buttons.RS ? '#000000' : '#888888'} strokeWidth="2.5" />
          <circle r="19" fill="#f0f2f5" stroke="#cbd0d8" strokeWidth="1.5" />
          <circle cx="0" cy="-10" r="1.5" fill="#888888" />
          <circle cx="0" cy="10" r="1.5" fill="#888888" />
          <circle cx="-10" cy="0" r="1.5" fill="#888888" />
          <circle cx="10" cy="0" r="1.5" fill="#888888" />
          <text x="0" y="4" textAnchor="middle" fill={buttons.RS ? '#ffffff' : '#111111'} fontSize="9" fontWeight="bold">RS</text>
        </g>
      </g>

      {/* Botones frontales A, B, X, Y (360) */}
      <g transform="translate(435, 160)">
        <g transform="translate(0, -32)">
          <circle
            r="15"
            fill={buttons.Y ? '#eab308' : '#f9a825'}
            stroke={buttons.Y ? '#fef08a' : '#d48806'}
            strokeWidth={buttons.Y ? "3" : "2"}
            filter={buttons.Y ? 'url(#rgbGlowFilter)' : 'none'}
          />
          <text x="0" y="5" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="900">Y</text>
        </g>
        <g transform="translate(-32, 0)">
          <circle
            r="15"
            fill={buttons.X ? '#0ea5e9' : '#1976d2'}
            stroke={buttons.X ? '#bae6fd' : '#1565c0'}
            strokeWidth={buttons.X ? "3" : "2"}
            filter={buttons.X ? 'url(#rgbGlowFilter)' : 'none'}
          />
          <text x="0" y="5" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="900">X</text>
        </g>
        <g transform="translate(32, 0)">
          <circle
            r="15"
            fill={buttons.B ? '#ef4444' : '#d32f2f'}
            stroke={buttons.B ? '#fecaca' : '#c62828'}
            strokeWidth={buttons.B ? "3" : "2"}
            filter={buttons.B ? 'url(#rgbGlowFilter)' : 'none'}
          />
          <text x="0" y="5" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="900">B</text>
        </g>
        <g transform="translate(0, 32)">
          <circle
            r="15"
            fill={buttons.A ? '#22c55e' : '#2e7d32'}
            stroke={buttons.A ? '#bbf7d0' : '#1b5e20'}
            strokeWidth={buttons.A ? "3" : "2"}
            filter={buttons.A ? 'url(#rgbGlowFilter)' : 'none'}
          />
          <text x="0" y="5" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="900">A</text>
        </g>
      </g>
    </g>
  );
}

// =========================================================================
// 4. SILUETA XBOX CLÁSICO (CONTROLLER S / DUKE CON BOTÓN BLANCO Y NEGRO)
// =========================================================================
function renderXboxClassicSvg(buttons, ltValue, rtValue, lx, ly, rx, ry, rgbStroke = 'none', rgbGlowOpacity = 0.8, rgbMode = 'chroma') {
  return (
    <g>
      {/* Halo de Luz RGB Inferior / Underglow con Onda Láser en Movimiento */}
      {rgbStroke !== 'none' && (
        <path
          d="M 135 72 
             C 210 60, 410 60, 485 72 
             C 530 80, 570 135, 575 210 
             C 580 280, 555 375, 490 375 
             C 445 375, 430 310, 400 275 
             C 360 235, 260 235, 220 275 
             C 190 310, 175 375, 130 375 
             C 65 375, 40 280, 45 210 
             C 50 135, 90 80, 135 72 Z"
          fill="none"
          stroke={rgbStroke}
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={rgbMode === 'chroma' || rgbMode === 'cyberpunk' ? "180 50" : "none"}
          opacity={rgbGlowOpacity}
          filter="url(#rgbGlowFilter)"
        >
          {(rgbMode === 'chroma' || rgbMode === 'cyberpunk') && (
            <animate attributeName="stroke-dashoffset" from="0" to="460" dur="3s" repeatCount="indefinite" />
          )}
        </path>
      )}

      {/* Gatillos clásicos */}
      <path d="M 125 50 C 125 30, 175 20, 215 30 L 210 65 L 135 60 Z" fill={ltValue > 0.05 ? '#111111' : '#f0f2f5'} stroke="#cbd0d8" strokeWidth="2" />
      <path d="M 405 30 C 445 20, 495 30, 495 50 L 485 60 L 410 65 Z" fill={rtValue > 0.05 ? '#111111' : '#f0f2f5'} stroke="#cbd0d8" strokeWidth="2" />

      {/* Silueta robusta del Controller S de Xbox Clásico */}
      <path
        d="M 135 72 
           C 210 60, 410 60, 485 72 
           C 530 80, 570 135, 575 210 
           C 580 280, 555 375, 490 375 
           C 445 375, 430 310, 400 275 
           C 360 235, 260 235, 220 275 
           C 190 310, 175 375, 130 375 
           C 65 375, 40 280, 45 210 
           C 50 135, 90 80, 135 72 Z"
        fill="#ffffff"
        stroke="#111111"
        strokeWidth="3.5"
      />

      {/* ================= LA GRAN JOYA VERDE DE XBOX CLÁSICO ================= */}
      <g transform="translate(310, 138)">
        {rgbStroke !== 'none' && (
          <circle r="38" fill="none" stroke={rgbStroke} strokeWidth="3" opacity={rgbGlowOpacity} filter="url(#rgbSoftAura)" />
        )}
        <circle r="34" fill="#107c10" stroke="#111111" strokeWidth="3" />
        <circle r="29" fill="#0d5c0d" stroke="#2e7d32" strokeWidth="1" />
        <text x="0" y="6" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="900" letterSpacing="1.5">
          XBOX
        </text>
      </g>

      {/* Botones Back y Start ubicados abajo a la izquierda */}
      <g transform="translate(280, 215)">
        <rect x="-14" y="-6" width="28" height="12" rx="6" fill={buttons.View ? '#111111' : '#f0f2f5'} stroke="#cbd0d8" strokeWidth="1.2" />
        <text x="0" y="3" textAnchor="middle" fill={buttons.View ? '#ffffff' : '#111111'} fontSize="6" fontWeight="bold">BACK</text>
      </g>
      <g transform="translate(280, 235)">
        <rect x="-14" y="-6" width="28" height="12" rx="6" fill={buttons.Menu ? '#111111' : '#f0f2f5'} stroke="#cbd0d8" strokeWidth="1.2" />
        <text x="0" y="3" textAnchor="middle" fill={buttons.Menu ? '#ffffff' : '#111111'} fontSize="6" fontWeight="bold">START</text>
      </g>

      {/* Stick Izquierdo */}
      <g transform="translate(180, 160)">
        <circle r="38" fill="#f6f7f8" stroke="#e2e4e7" strokeWidth="2" />
        <circle r="18" fill="none" stroke="#cbd0d8" strokeWidth="1" strokeDasharray="3 3" />
        <g transform={`translate(${lx}, ${ly})`} style={{ transition: 'transform 0.05s ease-out' }}>
          <circle r="26" fill={buttons.LS ? '#111111' : '#ffffff'} stroke={buttons.LS ? '#000000' : '#888888'} strokeWidth="2.5" />
          <circle r="19" fill="#f0f2f5" stroke="#cbd0d8" strokeWidth="1.5" />
          <text x="0" y="4" textAnchor="middle" fill={buttons.LS ? '#ffffff' : '#111111'} fontSize="9" fontWeight="bold">LS</text>
        </g>
      </g>

      {/* D-Pad Clásico */}
      <g transform="translate(235, 260)">
        <circle r="36" fill="#f6f7f8" stroke="#e2e4e7" strokeWidth="2" />
        <path d="M -9 -9 L -9 -28 L 9 -28 L 9 -9 Z" fill={buttons.DpadUp ? '#111111' : '#ffffff'} stroke="#cbd0d8" strokeWidth="1.5" />
        <path d="M -9 9 L -9 28 L 9 28 L 9 9 Z" fill={buttons.DpadDown ? '#111111' : '#ffffff'} stroke="#cbd0d8" strokeWidth="1.5" />
        <path d="M -9 -9 L -28 -9 L -28 9 L -9 9 Z" fill={buttons.DpadLeft ? '#111111' : '#ffffff'} stroke="#cbd0d8" strokeWidth="1.5" />
        <path d="M 9 -9 L 28 -9 L 28 9 L 9 9 Z" fill={buttons.DpadRight ? '#111111' : '#ffffff'} stroke="#cbd0d8" strokeWidth="1.5" />
      </g>

      {/* Stick Derecho Clásico */}
      <g transform="translate(345, 250)">
        <circle r="38" fill="#f6f7f8" stroke="#e2e4e7" strokeWidth="2" />
        <circle r="18" fill="none" stroke="#cbd0d8" strokeWidth="1" strokeDasharray="3 3" />
        <g transform={`translate(${rx}, ${ry})`} style={{ transition: 'transform 0.05s ease-out' }}>
          <circle r="26" fill={buttons.RS ? '#111111' : '#ffffff'} stroke={buttons.RS ? '#000000' : '#888888'} strokeWidth="2.5" />
          <circle r="19" fill="#f0f2f5" stroke="#cbd0d8" strokeWidth="1.5" />
          <text x="0" y="4" textAnchor="middle" fill={buttons.RS ? '#ffffff' : '#111111'} fontSize="9" fontWeight="bold">RS</text>
        </g>
      </g>

      {/* Botones frontales A, B, X, Y */}
      <g transform="translate(425, 160)">
        <g transform="translate(0, -30)">
          <circle
            r="14"
            fill={buttons.Y ? '#eab308' : '#f9a825'}
            stroke={buttons.Y ? '#fef08a' : '#d48806'}
            strokeWidth={buttons.Y ? "3" : "2"}
            filter={buttons.Y ? 'url(#rgbGlowFilter)' : 'none'}
          />
          <text x="0" y="5" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="900">Y</text>
        </g>
        <g transform="translate(-30, 0)">
          <circle
            r="14"
            fill={buttons.X ? '#0ea5e9' : '#1976d2'}
            stroke={buttons.X ? '#bae6fd' : '#1565c0'}
            strokeWidth={buttons.X ? "3" : "2"}
            filter={buttons.X ? 'url(#rgbGlowFilter)' : 'none'}
          />
          <text x="0" y="5" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="900">X</text>
        </g>
        <g transform="translate(30, 0)">
          <circle
            r="14"
            fill={buttons.B ? '#ef4444' : '#d32f2f'}
            stroke={buttons.B ? '#fecaca' : '#c62828'}
            strokeWidth={buttons.B ? "3" : "2"}
            filter={buttons.B ? 'url(#rgbGlowFilter)' : 'none'}
          />
          <text x="0" y="5" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="900">B</text>
        </g>
        <g transform="translate(0, 30)">
          <circle
            r="15"
            fill={buttons.A ? '#22c55e' : '#2e7d32'}
            stroke={buttons.A ? '#bbf7d0' : '#1b5e20'}
            strokeWidth={buttons.A ? "3" : "2"}
            filter={buttons.A ? 'url(#rgbGlowFilter)' : 'none'}
          />
          <text x="0" y="5" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="900">A</text>
        </g>
      </g>

      {/* ================= BOTONES BLANCO Y NEGRO (Mapeados a LB y RB) ================= */}
      {/* Botón Blanco (White / LB) */}
      <g transform="translate(455, 230)">
        <circle r="10" fill={buttons.LB ? '#111111' : '#ffffff'} stroke="#111111" strokeWidth="2" />
        <text x="0" y="3" textAnchor="middle" fill={buttons.LB ? '#ffffff' : '#111111'} fontSize="7" fontWeight="bold">W</text>
      </g>
      <text x="455" y="248" textAnchor="middle" fill="#666666" fontSize="7" fontWeight="bold">LB</text>

      {/* Botón Negro (Black / RB) */}
      <g transform="translate(478, 255)">
        <circle r="10" fill={buttons.RB ? '#ffffff' : '#111111'} stroke="#111111" strokeWidth="2" />
        <text x="0" y="3" textAnchor="middle" fill={buttons.RB ? '#111111' : '#ffffff'} fontSize="7" fontWeight="bold">B</text>
      </g>
      <text x="478" y="273" textAnchor="middle" fill="#666666" fontSize="7" fontWeight="bold">RB</text>
    </g>
  );
}

// =========================================================================
// 5. SILUETA MANDO GENÉRICO / RETRO / ARCADE
// =========================================================================
function renderGenericSvg(buttons, ltValue, rtValue, lx, ly, rx, ry, rgbStroke = 'none', rgbGlowOpacity = 0.8, rgbMode = 'chroma') {
  return (
    <g>
      {/* Halo de Luz RGB Inferior / Underglow con Onda Láser en Movimiento */}
      {rgbStroke !== 'none' && (
        <rect
          x="96"
          y="81"
          width="428"
          height="278"
          rx="59"
          fill="none"
          stroke={rgbStroke}
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={rgbMode === 'chroma' || rgbMode === 'cyberpunk' ? "180 50" : "none"}
          opacity={rgbGlowOpacity}
          filter="url(#rgbGlowFilter)"
        >
          {(rgbMode === 'chroma' || rgbMode === 'cyberpunk') && (
            <animate attributeName="stroke-dashoffset" from="0" to="460" dur="3s" repeatCount="indefinite" />
          )}
        </rect>
      )}

      {/* Gatillos / Botones superiores */}
      <rect x="140" y="55" width="80" height="20" rx="6" fill={ltValue > 0.05 ? '#111111' : '#f0f2f5'} stroke="#cbd0d8" strokeWidth="2" />
      <text x="180" y="69" textAnchor="middle" fill={ltValue > 0.05 ? '#ffffff' : '#111111'} fontSize="9" fontWeight="bold">LT / L2</text>

      <rect x="400" y="55" width="80" height="20" rx="6" fill={rtValue > 0.05 ? '#111111' : '#f0f2f5'} stroke="#cbd0d8" strokeWidth="2" />
      <text x="440" y="69" textAnchor="middle" fill={rtValue > 0.05 ? '#ffffff' : '#111111'} fontSize="9" fontWeight="bold">RT / R2</text>

      <rect x="155" y="75" width="80" height="15" rx="4" fill={buttons.LB ? '#111111' : '#f0f2f5'} stroke="#cbd0d8" strokeWidth="1.5" />
      <text x="195" y="86" textAnchor="middle" fill={buttons.LB ? '#ffffff' : '#111111'} fontSize="8" fontWeight="bold">LB / L1</text>

      <rect x="385" y="75" width="80" height="15" rx="4" fill={buttons.RB ? '#111111' : '#f0f2f5'} stroke="#cbd0d8" strokeWidth="1.5" />
      <text x="425" y="86" textAnchor="middle" fill={buttons.RB ? '#ffffff' : '#111111'} fontSize="8" fontWeight="bold">RB / R1</text>

      {/* Chasis universal */}
      <rect x="100" y="85" width="420" height="270" rx="55" fill="#ffffff" stroke="#111111" strokeWidth="3" />

      {/* Botones Centrales Select, Home, Start */}
      <g transform="translate(255, 140)">
        <rect x="-14" y="-6" width="28" height="12" rx="4" fill={buttons.View ? '#111111' : '#f0f2f5'} stroke="#cbd0d8" strokeWidth="1.5" />
        <text x="0" y="3" textAnchor="middle" fill={buttons.View ? '#ffffff' : '#111111'} fontSize="6" fontWeight="bold">SELECT</text>
      </g>
      <g transform="translate(310, 140)">
        {rgbStroke !== 'none' && (
          <circle r="16" fill="none" stroke={rgbStroke} strokeWidth="2" opacity={rgbGlowOpacity} filter="url(#rgbSoftAura)" />
        )}
        <circle r="12" fill={buttons.Xbox ? '#111111' : '#ffffff'} stroke="#111111" strokeWidth="2" />
        <text x="0" y="3" textAnchor="middle" fill={buttons.Xbox ? '#ffffff' : '#111111'} fontSize="7" fontWeight="bold">HOME</text>
      </g>
      <g transform="translate(365, 140)">
        <rect x="-14" y="-6" width="28" height="12" rx="4" fill={buttons.Menu ? '#111111' : '#f0f2f5'} stroke="#cbd0d8" strokeWidth="1.5" />
        <text x="0" y="3" textAnchor="middle" fill={buttons.Menu ? '#ffffff' : '#111111'} fontSize="6" fontWeight="bold">START</text>
      </g>

      {/* D-Pad */}
      <g transform="translate(180, 180)">
        <circle r="36" fill="#f6f7f8" stroke="#e2e4e7" strokeWidth="2" />
        <path d="M -9 -9 L -9 -28 L 9 -28 L 9 -9 Z" fill={buttons.DpadUp ? '#111111' : '#ffffff'} stroke="#cbd0d8" strokeWidth="1.5" />
        <path d="M -9 9 L -9 28 L 9 28 L 9 9 Z" fill={buttons.DpadDown ? '#111111' : '#ffffff'} stroke="#cbd0d8" strokeWidth="1.5" />
        <path d="M -9 -9 L -28 -9 L -28 9 L -9 9 Z" fill={buttons.DpadLeft ? '#111111' : '#ffffff'} stroke="#cbd0d8" strokeWidth="1.5" />
        <path d="M 9 -9 L 28 -9 L 28 9 L 9 9 Z" fill={buttons.DpadRight ? '#111111' : '#ffffff'} stroke="#cbd0d8" strokeWidth="1.5" />
      </g>

      {/* Palancas Simétricas */}
      <g transform="translate(245, 270)">
        <circle r="36" fill="#f6f7f8" stroke="#e2e4e7" strokeWidth="2" />
        <g transform={`translate(${lx}, ${ly})`} style={{ transition: 'transform 0.05s ease-out' }}>
          <circle r="25" fill={buttons.LS ? '#111111' : '#ffffff'} stroke={buttons.LS ? '#000000' : '#888888'} strokeWidth="2.5" />
          <text x="0" y="4" textAnchor="middle" fill={buttons.LS ? '#ffffff' : '#111111'} fontSize="9" fontWeight="bold">L3</text>
        </g>
      </g>
      <g transform="translate(375, 270)">
        <circle r="36" fill="#f6f7f8" stroke="#e2e4e7" strokeWidth="2" />
        <g transform={`translate(${rx}, ${ry})`} style={{ transition: 'transform 0.05s ease-out' }}>
          <circle r="25" fill={buttons.RS ? '#111111' : '#ffffff'} stroke={buttons.RS ? '#000000' : '#888888'} strokeWidth="2.5" />
          <text x="0" y="4" textAnchor="middle" fill={buttons.RS ? '#ffffff' : '#111111'} fontSize="9" fontWeight="bold">R3</text>
        </g>
      </g>

      {/* Botones de acción 1, 2, 3, 4 (Y, B, A, X) */}
      <g transform="translate(440, 180)">
        <circle r="36" fill="#f6f7f8" stroke="#e2e4e7" strokeWidth="2" />
        <g transform="translate(0, -26)">
          <circle
            r="12"
            fill={buttons.Y ? '#eab308' : '#ffffff'}
            stroke={buttons.Y ? '#fef08a' : '#cbd0d8'}
            strokeWidth={buttons.Y ? "2" : "1.5"}
            filter={buttons.Y ? 'url(#rgbGlowFilter)' : 'none'}
          />
          <text x="0" y="4" textAnchor="middle" fill={buttons.Y ? '#ffffff' : '#111111'} fontSize="9" fontWeight="bold">4 (Y)</text>
        </g>
        <g transform="translate(26, 0)">
          <circle
            r="12"
            fill={buttons.B ? '#ef4444' : '#ffffff'}
            stroke={buttons.B ? '#fecaca' : '#cbd0d8'}
            strokeWidth={buttons.B ? "2" : "1.5"}
            filter={buttons.B ? 'url(#rgbGlowFilter)' : 'none'}
          />
          <text x="0" y="4" textAnchor="middle" fill={buttons.B ? '#ffffff' : '#111111'} fontSize="9" fontWeight="bold">3 (B)</text>
        </g>
        <g transform="translate(0, 26)">
          <circle
            r="12"
            fill={buttons.A ? '#22c55e' : '#ffffff'}
            stroke={buttons.A ? '#bbf7d0' : '#cbd0d8'}
            strokeWidth={buttons.A ? "2" : "1.5"}
            filter={buttons.A ? 'url(#rgbGlowFilter)' : 'none'}
          />
          <text x="0" y="4" textAnchor="middle" fill={buttons.A ? '#ffffff' : '#111111'} fontSize="9" fontWeight="bold">2 (A)</text>
        </g>
        <g transform="translate(-26, 0)">
          <circle
            r="12"
            fill={buttons.X ? '#0ea5e9' : '#ffffff'}
            stroke={buttons.X ? '#bae6fd' : '#cbd0d8'}
            strokeWidth={buttons.X ? "2" : "1.5"}
            filter={buttons.X ? 'url(#rgbGlowFilter)' : 'none'}
          />
          <text x="0" y="4" textAnchor="middle" fill={buttons.X ? '#ffffff' : '#111111'} fontSize="9" fontWeight="bold">1 (X)</text>
        </g>
      </g>
    </g>
  );
}
