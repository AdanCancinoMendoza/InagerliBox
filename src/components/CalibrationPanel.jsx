import React, { useState, useEffect } from 'react';
import { X, Sliders, Check, RotateCcw, ShieldCheck, Zap, AlertTriangle } from 'lucide-react';
import { soundEffects } from '../services/soundEffects';

export default function CalibrationPanel({
  isOpen,
  onClose,
  profile,
  state,
  onSaveCalibration,
  playerIndex = 0
}) {
  const [deadzone, setDeadzone] = useState(0.10);
  const [sensitivityCurve, setSensitivityCurve] = useState('linear');
  const [invertLeftY, setInvertLeftY] = useState(false);
  const [invertRightY, setInvertRightY] = useState(false);

  // Configuraciones Anti-Drift para Gatillos y Stick Izquierdo
  const [require100PercentLT, setRequire100PercentLT] = useState(false);
  const [require100PercentRT, setRequire100PercentRT] = useState(false);
  const [require100PercentLS, setRequire100PercentLS] = useState(false);
  const [triggerThreshold, setTriggerThreshold] = useState(0.95);
  const [triggerDeadzone, setTriggerDeadzone] = useState(0.05);

  useEffect(() => {
    if (profile) {
      setDeadzone(profile.deadzone ?? 0.10);
      setSensitivityCurve(profile.sensitivityCurve || 'linear');
      setInvertLeftY(!!profile.invertLeftY);
      setInvertRightY(!!profile.invertRightY);
      setRequire100PercentLT(!!profile.require100PercentLT);
      setRequire100PercentRT(!!profile.require100PercentRT);
      setRequire100PercentLS(!!profile.require100PercentLS);
      setTriggerThreshold(profile.triggerThreshold ?? 0.95);
      setTriggerDeadzone(profile.triggerDeadzone ?? 0.05);
    }
  }, [profile, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    soundEffects.playConnect();
    onSaveCalibration({
      ...profile,
      deadzone,
      sensitivityCurve,
      invertLeftY,
      invertRightY,
      require100PercentLT,
      require100PercentRT,
      require100PercentLS,
      triggerThreshold,
      triggerDeadzone
    });
    onClose();
  };

  const handleActivateAll100 = () => {
    soundEffects.playClick(800);
    setRequire100PercentLT(true);
    setRequire100PercentRT(true);
    setRequire100PercentLS(true);
    setTriggerThreshold(0.95);
  };

  const axes = state?.axes || { leftStickX: 0, leftStickY: 0, rightStickX: 0, rightStickY: 0 };
  const lx = axes.leftStickX || 0;
  const ly = axes.leftStickY || 0;
  const rx = axes.rightStickX || 0;
  const ry = axes.rightStickY || 0;

  // Valores de gatillos (crudo vs procesado)
  const rawLT = state?.raw?.rawLT ?? (state?.buttons?.LT || 0);
  const rawRT = state?.raw?.rawRT ?? (state?.buttons?.RT || 0);
  const processedLT = state?.buttons?.LT || 0;
  const processedRT = state?.buttons?.RT || 0;
  const isLSPressed = !!state?.buttons?.LS;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-card-calib" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-row">
            <Sliders size={20} className="modal-title-icon" />
            <div>
              <h2 className="modal-title">Calibración y Anti-Drift · Jugador {playerIndex + 1}</h2>
              <p className="modal-desc">
                Corrige errores de drift en gatillos (LT/RT) y joysticks requiriendo 100% de pulsación.
              </p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        <div className="calibration-body">
          {/* ================= SECCIÓN ANTI-DRIFT DE GATILLOS Y LS ================= */}
          <div className="anti-drift-highlight-card">
            <div className="anti-drift-header">
              <div className="anti-drift-title-group">
                <ShieldCheck size={20} className="shield-icon" />
                <div>
                  <h3 className="anti-drift-title">Filtro Anti-Drift: Activar solo al 100% de Presión</h3>
                  <p className="anti-drift-subtitle">
                    Evita que gatillos o sticks flojos se activen solos por drift. Solo enviarán señal cuando se presionen al 100%.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="btn-quick-drift"
                onClick={handleActivateAll100}
                title="Activa el modo 100% en Gatillo Izquierdo, Derecho y Stick Izquierdo"
              >
                <Zap size={14} />
                <span>Activar 100% en Todos</span>
              </button>
            </div>

            <div className="drift-toggles-grid">
              {/* Toggle Gatillo Izquierdo (LT) */}
              <label className={`drift-toggle-card ${require100PercentLT ? 'drift-active' : ''}`}>
                <input
                  type="checkbox"
                  checked={require100PercentLT}
                  onChange={(e) => {
                    soundEffects.playClick(600);
                    setRequire100PercentLT(e.target.checked);
                  }}
                />
                <div className="drift-toggle-info">
                  <div className="drift-btn-badge">LT</div>
                  <div>
                    <span className="drift-name">Gatillo Izquierdo (LT)</span>
                    <span className="drift-hint">Solo detecta al 100% (evita apuntar solo)</span>
                  </div>
                </div>
              </label>

              {/* Toggle Gatillo Derecho (RT) */}
              <label className={`drift-toggle-card ${require100PercentRT ? 'drift-active' : ''}`}>
                <input
                  type="checkbox"
                  checked={require100PercentRT}
                  onChange={(e) => {
                    soundEffects.playClick(600);
                    setRequire100PercentRT(e.target.checked);
                  }}
                />
                <div className="drift-toggle-info">
                  <div className="drift-btn-badge">RT</div>
                  <div>
                    <span className="drift-name">Gatillo Derecho (RT)</span>
                    <span className="drift-hint">Solo detecta al 100% (evita disparar solo)</span>
                  </div>
                </div>
              </label>

              {/* Toggle Stick Izquierdo (LS) */}
              <label className={`drift-toggle-card ${require100PercentLS ? 'drift-active' : ''}`}>
                <input
                  type="checkbox"
                  checked={require100PercentLS}
                  onChange={(e) => {
                    soundEffects.playClick(600);
                    setRequire100PercentLS(e.target.checked);
                  }}
                />
                <div className="drift-toggle-info">
                  <div className="drift-btn-badge badge-ls">LS</div>
                  <div>
                    <span className="drift-name">Stick Izquierdo (LS - Clic)</span>
                    <span className="drift-hint">Requiere 100% de fuerza para clic (evita falsos clics)</span>
                  </div>
                </div>
              </label>
            </div>

            {/* Slider de Umbral al 100% */}
            <div className="drift-slider-box">
              <div className="slider-header-row">
                <span className="calib-label">Umbral de activación plena (Tope 100%):</span>
                <span className="calib-value">{(triggerThreshold * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.70"
                max="1.00"
                step="0.01"
                value={triggerThreshold}
                onChange={(e) => setTriggerThreshold(parseFloat(e.target.value))}
                className="calib-range"
              />
              <p className="calib-hint">
                Si tu gatillo mecánico está gastado y no alcanza el 1.0 numérico perfecto al apretarlo a fondo, ajusta este valor entre 90% y 98%.
              </p>
            </div>

            {/* Medidor en vivo de prueba anti-drift */}
            <div className="live-trigger-test-row">
              <div className="live-meter-col">
                <div className="live-meter-header">
                  <span>LT Físico: <strong>{(rawLT * 100).toFixed(0)}%</strong></span>
                  <span className={processedLT >= 0.9 ? 'tag-activated' : 'tag-idle'}>
                    Salida Xbox: {processedLT >= 0.9 ? '100% (ACTIVO)' : '0% (FILTRADO)'}
                  </span>
                </div>
                <div className="mini-meter-bar">
                  <div className="mini-meter-fill" style={{ width: `${rawLT * 100}%` }} />
                </div>
              </div>

              <div className="live-meter-col">
                <div className="live-meter-header">
                  <span>RT Físico: <strong>{(rawRT * 100).toFixed(0)}%</strong></span>
                  <span className={processedRT >= 0.9 ? 'tag-activated' : 'tag-idle'}>
                    Salida Xbox: {processedRT >= 0.9 ? '100% (ACTIVO)' : '0% (FILTRADO)'}
                  </span>
                </div>
                <div className="mini-meter-bar">
                  <div className="mini-meter-fill" style={{ width: `${rawRT * 100}%` }} />
                </div>
              </div>

              <div className="live-meter-col">
                <div className="live-meter-header">
                  <span>LS Clic:</span>
                  <span className={isLSPressed ? 'tag-activated' : 'tag-idle'}>
                    {isLSPressed ? 'PRESIONADO (100%)' : 'LIBERADO (0%)'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ================= ZONA MUERTA DE JOYSTICKS ================= */}
          <div className="calibration-section">
            <div className="slider-header-row">
              <label className="calib-label">Zona Muerta Central de Joysticks (Anti-Drift de Mira):</label>
              <span className="calib-value">{(deadzone * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.30"
              step="0.01"
              value={deadzone}
              onChange={(e) => setDeadzone(parseFloat(e.target.value))}
              className="calib-range"
            />
            <p className="calib-hint">
              Aumenta este valor si la mira o tu personaje se mueven solos cuando sueltas las palancas.
            </p>
          </div>

          {/* Curva de respuesta */}
          <div className="calibration-section">
            <label className="calib-label">Curva de Sensibilidad:</label>
            <div className="curve-buttons-row">
              <button
                className={`curve-btn ${sensitivityCurve === 'linear' ? 'curve-active' : ''}`}
                onClick={() => setSensitivityCurve('linear')}
              >
                Lineal (1:1)
              </button>
              <button
                className={`curve-btn ${sensitivityCurve === 'smooth' ? 'curve-active' : ''}`}
                onClick={() => setSensitivityCurve('smooth')}
              >
                Suave (Precisión / Shooters)
              </button>
              <button
                className={`curve-btn ${sensitivityCurve === 'aggressive' ? 'curve-active' : ''}`}
                onClick={() => setSensitivityCurve('aggressive')}
              >
                Agresiva (Arcade)
              </button>
            </div>
          </div>

          {/* Invertir ejes Y */}
          <div className="calibration-section">
            <label className="calib-label">Inversión de Ejes Verticales:</label>
            <div className="toggle-group">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={invertLeftY}
                  onChange={(e) => setInvertLeftY(e.target.checked)}
                />
                <span>Invertir Eje Y - Stick Izquierdo</span>
              </label>

              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={invertRightY}
                  onChange={(e) => setInvertRightY(e.target.checked)}
                />
                <span>Invertir Eje Y - Stick Derecho (Cámara)</span>
              </label>
            </div>
          </div>

          {/* Monitor en vivo de los dos sticks con zona muerta */}
          <div className="stick-monitors-row">
            <div className="stick-monitor-box">
              <span className="monitor-title">Stick Izquierdo</span>
              <div className="monitor-circle">
                <div
                  className="deadzone-circle"
                  style={{ width: `${deadzone * 100 * 2}%`, height: `${deadzone * 100 * 2}%` }}
                />
                <div
                  className="stick-dot"
                  style={{
                    left: `calc(50% + ${lx * 38}px)`,
                    top: `calc(50% + ${ly * 38}px)`
                  }}
                />
              </div>
              <span className="monitor-coords">
                X: {lx.toFixed(2)} | Y: {ly.toFixed(2)}
              </span>
            </div>

            <div className="stick-monitor-box">
              <span className="monitor-title">Stick Derecho</span>
              <div className="monitor-circle">
                <div
                  className="deadzone-circle"
                  style={{ width: `${deadzone * 100 * 2}%`, height: `${deadzone * 100 * 2}%` }}
                />
                <div
                  className="stick-dot"
                  style={{
                    left: `calc(50% + ${rx * 38}px)`,
                    top: `calc(50% + ${ry * 38}px)`
                  }}
                />
              </div>
              <span className="monitor-coords">
                X: {rx.toFixed(2)} | Y: {ry.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="btn-secondary"
            onClick={() => {
              setDeadzone(0.10);
              setSensitivityCurve('linear');
              setInvertLeftY(false);
              setInvertRightY(false);
              setRequire100PercentLT(false);
              setRequire100PercentRT(false);
              setRequire100PercentLS(false);
              setTriggerThreshold(0.95);
            }}
          >
            <RotateCcw size={16} />
            <span>Valores por Defecto</span>
          </button>

          <div className="modal-actions-right">
            <button className="btn-cancel" onClick={onClose}>
              Cancelar
            </button>
            <button className="btn-primary" onClick={handleSave}>
              <Check size={16} />
              <span>Guardar Configuración</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
