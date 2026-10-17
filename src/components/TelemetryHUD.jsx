import React from 'react';
import { Activity, Zap, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function TelemetryHUD({ networkState }) {
  const { latency = 0, latencyHistory = [], packetsPerSecond = 0, packetsSent = 0, status } = networkState;
  const isConnected = status === 'connected';

  // Determinar calidad de conexión
  let qualityText = 'Inactivo';
  let qualityColor = '#8c9bb0';
  let qualityIcon = ShieldCheck;

  if (isConnected) {
    if (latency < 25) {
      qualityText = 'Excelente (<25ms)';
      qualityColor = '#00ff5f';
    } else if (latency < 60) {
      qualityText = 'Buena (Juego Fluido)';
      qualityColor = '#00f0ff';
    } else if (latency < 120) {
      qualityText = 'Aceptable';
      qualityColor = '#ffb900';
    } else {
      qualityText = 'Latencia Alta';
      qualityColor = '#ff4d4f';
      qualityIcon = AlertTriangle;
    }
  }

  // Generar puntos SVG para el gráfico de latencia (Sparkline)
  const sparklinePoints = React.useMemo(() => {
    if (!latencyHistory || latencyHistory.length < 2) return '';
    const width = 160;
    const height = 36;
    const maxVal = Math.max(50, ...latencyHistory);
    const minVal = 0;
    const range = maxVal - minVal || 1;

    return latencyHistory
      .map((val, idx) => {
        const x = (idx / (latencyHistory.length - 1)) * width;
        const y = height - ((val - minVal) / range) * (height - 6) - 3;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [latencyHistory]);

  return (
    <div className="telemetry-bar">
      {/* Tarjeta Latencia RTT */}
      <div className="telemetry-card">
        <div className="telemetry-card-top">
          <Activity size={16} className="telemetry-icon" style={{ color: qualityColor }} />
          <span className="telemetry-label">Latencia (Ping RTT)</span>
        </div>
        <div className="telemetry-val-row">
          <span className="telemetry-val" style={{ color: isConnected ? qualityColor : '#8892b0' }}>
            {isConnected ? `${latency} ms` : '--'}
          </span>
          <span className="telemetry-sub">{qualityText}</span>
        </div>
      </div>

      {/* Gráfico Sparkline de estabilidad */}
      <div className="telemetry-card sparkline-card">
        <div className="telemetry-card-top">
          <Zap size={16} className="telemetry-icon" style={{ color: '#00f0ff' }} />
          <span className="telemetry-label">Estabilidad de Red</span>
        </div>
        <div className="sparkline-container">
          {isConnected && sparklinePoints ? (
            <svg viewBox="0 0 160 36" className="sparkline-svg">
              <polyline
                fill="none"
                stroke="#00f0ff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={sparklinePoints}
              />
            </svg>
          ) : (
            <span className="sparkline-placeholder">Conéctate para ver el historial</span>
          )}
        </div>
      </div>

      {/* Tarjeta de Tasa de Paquetes */}
      <div className="telemetry-card">
        <div className="telemetry-card-top">
          <Zap size={16} className="telemetry-icon" style={{ color: '#00ff5f' }} />
          <span className="telemetry-label">Tasa de Envío</span>
        </div>
        <div className="telemetry-val-row">
          <span className="telemetry-val">
            {isConnected ? `${packetsPerSecond} pps` : '0 pps'}
          </span>
          <span className="telemetry-sub">Frecuencia en tiempo real</span>
        </div>
      </div>

      {/* Tarjeta Paquetes Totales */}
      <div className="telemetry-card">
        <div className="telemetry-card-top">
          <CheckCircle2 size={16} className="telemetry-icon" style={{ color: '#107c10' }} />
          <span className="telemetry-label">Paquetes Transmitidos</span>
        </div>
        <div className="telemetry-val-row">
          <span className="telemetry-val">
            {packetsSent.toLocaleString()}
          </span>
          <span className="telemetry-sub">Comandos entregados</span>
        </div>
      </div>
    </div>
  );
}
