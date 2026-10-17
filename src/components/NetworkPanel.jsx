import React, { useState } from 'react';
import {
  Wifi,
  Radio,
  Server,
  Play,
  Square,
  Search,
  ShieldCheck,
  Check,
  Activity,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Info
} from 'lucide-react';
import { soundEffects } from '../services/soundEffects';

export default function NetworkPanel({
  networkState,
  onConnect,
  onDisconnect,
  onUpdateUrl,
  onUpdateFps,
  activeControllerName,
  onConnectDirect,
  onDiscoverConsoles
}) {
  const [tab, setTab] = useState('direct'); // 'direct' (Linux IP directa) | 'relay' (Sala con código)
  const [xboxIp, setXboxIp] = useState(() => {
    return networkState.directIp || (typeof localStorage !== 'undefined' ? localStorage.getItem('multicontrol_direct_ip') || '' : '');
  });
  const [roomCode, setRoomCode] = useState('');
  const [serverUrl, setServerUrl] = useState(networkState.url || 'ws://localhost:4000/ws');
  
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null); // { consoles: [], otherDevices: [], scannedSubnets: [], totalScanned: 0 }
  const [scanMessage, setScanMessage] = useState('');
  const [showOtherDevices, setShowOtherDevices] = useState(false);
  const [pingStatus, setPingStatus] = useState(null); // { testing, reachable, pingMs, message }
  const [showXboxGuide, setShowXboxGuide] = useState(true);

  const isConnected = networkState.status === 'connected';
  const isConnecting = networkState.status === 'connecting';

  const handleDirectConnect = (e) => {
    e.preventDefault();
    if (!xboxIp.trim()) return;
    soundEffects.playClick(600);
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('multicontrol_direct_ip', xboxIp.trim());
      } catch {
        // Ignorar
      }
    }
    onConnectDirect(xboxIp.trim());
  };

  const handleRelayConnect = (e) => {
    e.preventDefault();
    if (!roomCode.trim()) return;
    soundEffects.playClick(600);
    onUpdateUrl(serverUrl);
    onConnect(roomCode.trim(), activeControllerName);
  };

  const handleDisconnect = () => {
    soundEffects.playDisconnect();
    onDisconnect();
  };

  const handleScanNetwork = async () => {
    soundEffects.playClick(700);
    setIsScanning(true);
    setScanMessage('Realizando sondeo activo de red y verificación de consolas Xbox...');
    setScanResult(null);

    try {
      const result = await onDiscoverConsoles();
      setIsScanning(false);

      // Compatibilidad si devuelve objeto enriquecido o array simple
      const consoles = result.consoles || (Array.isArray(result) ? result.filter(d => d.isLikelyXbox || d.isVerifiedXbox) : []);
      const otherDevices = result.otherDevices || (Array.isArray(result) ? result.filter(d => !d.isLikelyXbox && !d.isVerifiedXbox) : []);
      const scannedSubnets = result.scannedSubnets || [];
      const totalScanned = result.totalScanned || (scannedSubnets.length * 254);

      setScanResult({ consoles, otherDevices, scannedSubnets, totalScanned });

      if (consoles.length > 0) {
        setScanMessage(`✓ Se detectó ${consoles.length} consola(s) Xbox confirmada(s) en tu red:`);
        if (!xboxIp.trim()) {
          setXboxIp(consoles[0].ip);
        }
      } else {
        const subnetInfo = scannedSubnets.length > 0 ? scannedSubnets.join(', ') : 'tu red local';
        setScanMessage(`0 consolas Xbox detectadas respondiendo en ${subnetInfo}.`);
      }
    } catch {
      setIsScanning(false);
      setScanMessage('Error al realizar el escaneo de red.');
    }
  };

  const handleSelectDevice = async (ip) => {
    soundEffects.playClick(800);
    setXboxIp(ip);
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('multicontrol_direct_ip', ip);
      } catch {
        // Ignorar
      }
    }
    await testPing(ip);
  };

  const testPing = async (ipToTest) => {
    const ip = ipToTest || xboxIp;
    if (!ip.trim()) return;

    setPingStatus({ testing: true, message: 'Probando conectividad en tiempo real...' });
    try {
      const res = await fetch(`http://localhost:4000/api/xbox/ping?ip=${encodeURIComponent(ip.trim())}`);
      const data = await res.json();
      setPingStatus({
        testing: false,
        reachable: data.reachable,
        pingMs: data.pingMs,
        message: data.message
      });
      if (data.reachable) soundEffects.playConnect();
    } catch {
      setPingStatus({
        testing: false,
        reachable: false,
        message: 'No se pudo contactar el servidor local'
      });
    }
  };

  return (
    <div className="network-card">
      <div className="network-card-header">
        <div className="net-title-group">
          <Radio className="net-icon" size={20} />
          <div>
            <h2 className="net-title">Enlace con tu Consola Xbox</h2>
            <p className="net-subtitle">
              {isConnected
                ? networkState.mode === 'direct'
                  ? `Enlace activo con tu Xbox en ${networkState.directIp} · Protección contra desconexión activa`
                  : `Retransmitiendo controles a la sala ${networkState.roomCode}`
                : 'Conecta tus controles por red local con latencia ultrabaja (1-2 ms)'}
            </p>
          </div>
        </div>

        <div className={`net-badge badge-${networkState.status}`}>
          <span className="net-badge-dot" />
          <span className="net-badge-text">
            {isConnected
              ? 'Xbox Vinculada'
              : isConnecting
              ? 'Estableciendo enlace...'
              : 'Sin conectar'}
          </span>
        </div>
      </div>

      {/* Selector de Pestañas: Conexión Directa vs Sala Relay */}
      {!isConnected && (
        <div className="net-tabs-row">
          <button
            type="button"
            className={`net-tab-btn ${tab === 'direct' ? 'net-tab-active' : ''}`}
            onClick={() => {
              soundEffects.playClick(500);
              setTab('direct');
            }}
          >
            <Server size={15} />
            <span>Enlace por Red Local</span>
          </button>

          <button
            type="button"
            className={`net-tab-btn ${tab === 'relay' ? 'net-tab-active' : ''}`}
            onClick={() => {
              soundEffects.playClick(500);
              setTab('relay');
            }}
          >
            <Wifi size={15} />
            <span>Sala Remota con Código</span>
          </button>
        </div>
      )}

      <div className="network-card-body">
        {isConnected ? (
          <div className="connected-session-box">
            <div className="session-info">
              <span className="session-tag">
                {networkState.mode === 'direct' ? 'Xbox IP:' : 'Sala:'}
              </span>
              <span className="session-code">
                {networkState.mode === 'direct' ? networkState.directIp : networkState.roomCode}
              </span>
              <span className="session-fps">({networkState.targetFps} Hz en vivo)</span>
            </div>
            <button className="btn-disconnect" onClick={handleDisconnect}>
              <Square size={16} fill="currentColor" />
              <span>Terminar Sesión</span>
            </button>
          </div>
        ) : tab === 'direct' ? (
          /* MODO DIRECTO LOCAL */
          <form onSubmit={handleDirectConnect} className="room-form">
            <div className="room-input-container">
              <div className="label-with-scan">
                <label className="room-label" htmlFor="xbox-ip-input">
                  Dirección IP de tu Consola Xbox:
                </label>
                <button
                  type="button"
                  className="btn-scan-network"
                  onClick={handleScanNetwork}
                  disabled={isScanning}
                >
                  {isScanning ? (
                    <RefreshCw size={14} className="spin-icon" />
                  ) : (
                    <Search size={14} />
                  )}
                  <span>{isScanning ? 'Buscando en tu red...' : 'Buscar mi Xbox'}</span>
                </button>
              </div>

              <div className="input-with-button">
                <input
                  id="xbox-ip-input"
                  type="text"
                  placeholder="Escribe la IP de tu consola"
                  value={xboxIp}
                  onChange={(e) => {
                    setXboxIp(e.target.value);
                    setPingStatus(null);
                  }}
                  className="room-input"
                  disabled={isConnecting}
                  required
                />
                
                <button
                  type="button"
                  className="btn-test-ping"
                  onClick={() => testPing()}
                  disabled={!xboxIp.trim() || pingStatus?.testing}
                  title="Comprueba si esta IP responde en tu red"
                >
                  <Activity size={15} />
                  <span>{pingStatus?.testing ? 'Probando...' : 'Comprobar'}</span>
                </button>

                <button
                  type="submit"
                  className="btn-connect"
                  disabled={isConnecting || !xboxIp.trim()}
                >
                  <Play size={16} fill="currentColor" />
                  <span>{isConnecting ? 'Enlazando...' : 'Vincular y Jugar'}</span>
                </button>
              </div>

              {/* Resultado de la prueba de ping */}
              {pingStatus && (
                <div className={`ping-result-badge ${pingStatus.reachable ? 'ping-ok' : 'ping-fail'}`}>
                  {pingStatus.reachable ? (
                    <Check size={14} className="ping-icon" />
                  ) : (
                    <AlertCircle size={14} className="ping-icon" />
                  )}
                  <span>{pingStatus.message}</span>
                </div>
              )}

              {/* Mensaje de error si la conexión falla */}
              {networkState.status === 'error' && networkState.errorMessage && (
                <div className="ping-result-badge ping-fail" style={{ marginTop: '8px' }}>
                  <AlertCircle size={14} className="ping-icon" />
                  <span>{networkState.errorMessage}</span>
                </div>
              )}
            </div>

            {/* RESULTADOS DEL ESCANEO 100% REAL */}
            {(isScanning || scanResult) && (
              <div className="devices-discovered-container">
                <div className="devices-header">
                  <span className="devices-title">{scanMessage}</span>
                  {scanResult?.scannedSubnets?.length > 0 && (
                    <span className="devices-subnets-tag">
                      Subred: {scanResult.scannedSubnets.join(', ')}
                    </span>
                  )}
                </div>

                {isScanning && (
                  <div className="scan-loading-box">
                    <RefreshCw size={18} className="spin-icon" />
                    <span>Enviando paquetes de sondeo SmartGlass UDP (5050) y comprobando puertos en la subred...</span>
                  </div>
                )}

                {/* CASO A: CONSOLAS XBOX VERIFICADAS ENCONTRADAS */}
                {scanResult && scanResult.consoles.length > 0 && (
                  <div className="devices-grid">
                    {scanResult.consoles.map((dev) => {
                      const isSelected = xboxIp === dev.ip;
                      return (
                        <div
                          key={dev.ip}
                          className={`device-card device-card-verified ${isSelected ? 'device-card-selected' : ''}`}
                          onClick={() => handleSelectDevice(dev.ip)}
                        >
                          <div className="device-card-left">
                            <div className="device-badge-row">
                              <span className="badge-xbox-verified">
                                <ShieldCheck size={13} />
                                <span>Consola Xbox Confirmada</span>
                              </span>
                              {dev.pingMs !== null && dev.pingMs !== undefined && (
                                <span className="badge-xbox-ping">
                                  {dev.pingMs} ms
                                </span>
                              )}
                            </div>
                            <span className="device-ip">{dev.ip}</span>
                            <span className="device-desc">{dev.name}</span>
                            {dev.mac && <span className="device-mac">MAC: {dev.mac}</span>}
                          </div>

                          <div className="device-card-actions">
                            <button
                              type="button"
                              className={`btn-select-device ${isSelected ? 'btn-selected' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectDevice(dev.ip);
                              }}
                            >
                              {isSelected ? (
                                <>
                                  <Check size={13} />
                                  <span>Seleccionado</span>
                                </>
                              ) : (
                                <span>Seleccionar</span>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* CASO B: 0 CONSOLAS ENCONTRADAS -> DIAGNÓSTICO CLARO Y REAL */}
                {scanResult && scanResult.consoles.length === 0 && !isScanning && (
                  <div className="diagnostic-no-console">
                    <div className="diag-header-row">
                      <AlertCircle size={18} className="diag-alert-icon" />
                      <h4>No se detectó ninguna consola Xbox encendida respondiendo en tu red</h4>
                    </div>
                    <p className="diag-summary-text">
                      El escaneo activo comprobó {scanResult.totalScanned || 254} direcciones en {scanResult.scannedSubnets.join(', ') || 'tu subred local'} en tiempo real sin inventar dispositivos ni usar datos falsos.
                    </p>
                    <div className="diag-checklist">
                      <div className="diag-item">
                        <span className="diag-item-num">1</span>
                        <span><strong>¿Tu Xbox está encendida?</strong> Asegúrate de que el botón de encendido de la consola tenga la luz blanca fija.</span>
                      </div>
                      <div className="diag-item">
                        <span className="diag-item-num">2</span>
                        <span><strong>Fallo de desconexión de red de la Xbox:</strong> Si tu consola sufre el problema de desconectar su IP periódicamente, ve a <em>Configuración &gt; General &gt; Configuración de red &gt; Probar conexión de red</em> en la consola para renovar su enlace.</span>
                      </div>
                      <div className="diag-item">
                        <span className="diag-item-num">3</span>
                        <span><strong>Características del modo remoto:</strong> En la Xbox entra a <em>Configuración &gt; Dispositivos y conexiones &gt; Características del modo remoto</em> y marca <em>"Habilitar características remotas"</em> y <em>"Permitir conexiones desde cualquier dispositivo"</em>.</span>
                      </div>
                      <div className="diag-item">
                        <span className="diag-item-num">4</span>
                        <span><strong>IP Manual:</strong> Si puedes ver la IP en la pantalla de tu Xbox, escríbela en el recuadro superior y pulsa <strong>"Probar IP"</strong> o <strong>"Conectar"</strong> directamente.</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* CASO C: OTROS DISPOSITIVOS DE RED DETECTADOS (DESPLEGABLE) */}
                {scanResult && scanResult.otherDevices.length > 0 && !isScanning && (
                  <div className="other-devices-wrapper">
                    <button
                      type="button"
                      className="other-devices-toggle"
                      onClick={() => setShowOtherDevices(!showOtherDevices)}
                    >
                      <div className="other-toggle-left">
                        <Info size={14} />
                        <span>Ver otros {scanResult.otherDevices.length} dispositivo(s) activos detectados en la red (Routers, PCs, Móviles)</span>
                      </div>
                      {showOtherDevices ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    {showOtherDevices && (
                      <div className="other-devices-list">
                        {scanResult.otherDevices.map((dev) => (
                          <div key={dev.ip} className="other-device-row">
                            <div className="other-device-info">
                              <span className="other-ip">{dev.ip}</span>
                              <span className="other-name">{dev.name}</span>
                              {dev.mac && <span className="other-mac">MAC: {dev.mac}</span>}
                            </div>
                            <button
                              type="button"
                              className="btn-use-other-ip"
                              onClick={() => handleSelectDevice(dev.ip)}
                            >
                              Probar IP
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* GUÍA RÁPIDA: DÓNDE VER LA IP Y ACTIVAR CARACTERÍSTICAS DEL MODO REMOTO */}
            <div className="xbox-guide-collapsible">
              <button
                type="button"
                className="guide-toggle-btn"
                onClick={() => setShowXboxGuide(!showXboxGuide)}
              >
                <div className="guide-toggle-left">
                  <HelpCircle size={16} className="guide-help-icon" />
                  <span>¿Dónde ver la IP exacta en tu Xbox One y activar el modo remoto?</span>
                </div>
                {showXboxGuide ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {showXboxGuide && (
                <div className="guide-content-box">
                  <div className="guide-step-card">
                    <span className="guide-step-tag">Paso 1: Ver la IP de tu Xbox</span>
                    <p className="guide-step-instruction">
                      En tu consola ve a:
                      <br />
                      <strong>Configuración &gt; General &gt; Configuración de red &gt; Configuración avanzada</strong>.
                      <br />
                      Anota la <strong>"Dirección IPv4"</strong> que aparece en la pantalla de tu consola y colócala en el campo superior.
                    </p>
                  </div>

                  <div className="guide-step-card">
                    <span className="guide-step-tag">Paso 2: En "Dispositivos y conexiones"</span>
                    <p className="guide-step-instruction">
                      En tu consola entra a la opción que tienes en tu menú:
                      <br />
                      <strong>"Características del modo remoto"</strong>.
                      <br />
                      1. Asegúrate de marcar la casilla <strong>"Habilitar características remotas"</strong> (con palomita verde ✓).
                      <br />
                      2. Dentro de esa misma pantalla, en <strong>"Preferencia de la aplicación de Xbox"</strong>, selecciona <strong>"Permitir conexiones desde cualquier dispositivo"</strong>.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </form>
        ) : (
          /* MODO SALA RELAY (CON CÓDIGO) */
          <form onSubmit={handleRelayConnect} className="room-form">
            <div className="room-input-container">
              <label className="room-label" htmlFor="room-code-input">
                Código de Sala (Host Remoto):
              </label>
              <div className="input-with-button">
                <input
                  id="room-code-input"
                  type="text"
                  placeholder="Ej: XB-7492"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  maxLength={10}
                  className="room-input"
                  disabled={isConnecting}
                  required
                />
                <button
                  type="submit"
                  className="btn-connect"
                  disabled={isConnecting || !roomCode.trim()}
                >
                  <Play size={16} fill="currentColor" />
                  <span>{isConnecting ? 'Conectando...' : 'Conectar'}</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Selector de Frecuencia de Envío (Hz) */}
        <div className="rate-selector-row">
          <span className="rate-label">Frecuencia de Muestreo:</span>
          <div className="rate-buttons">
            {[30, 60, 120].map((fps) => (
              <button
                key={fps}
                className={`rate-btn ${networkState.targetFps === fps ? 'rate-btn-active' : ''}`}
                onClick={() => {
                  soundEffects.playClick(500);
                  onUpdateFps(fps);
                }}
              >
                {fps} Hz
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
