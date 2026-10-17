import React, { useState, useEffect, useRef, useCallback } from 'react';
import Header from './components/Header';
import XboxVisualizer from './components/XboxVisualizer';
import ControllerSelector from './components/ControllerSelector';
import NetworkPanel from './components/NetworkPanel';
import TelemetryHUD from './components/TelemetryHUD';
import RemapModal from './components/RemapModal';
import CalibrationPanel from './components/CalibrationPanel';
import GuideModal from './components/GuideModal';
import DownloadModal from './components/DownloadModal';
import HackerIntro from './components/HackerIntro';
import './App.css';

import {
  getControllerProfile,
  saveControllerProfile,
  resetControllerProfile,
  normalizeGamepadToXboxOne,
  identifyGamepadType
} from './services/gamepadEngine';
import { networkService } from './services/networkService';
import { soundEffects } from './services/soundEffects';

export default function App() {
  const [gamepads, setGamepads] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeProfile, setActiveProfile] = useState(null);
  const [normalizedState, setNormalizedState] = useState(null);
  const [networkState, setNetworkState] = useState(networkService.getState());
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Animación hacker al entrar al sistema
  const [showHackerIntro, setShowHackerIntro] = useState(true);

  // Modales
  const [isRemapOpen, setIsRemapOpen] = useState(false);
  const [isCalibrationOpen, setIsCalibrationOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  // Capturar evento PWA de instalación para Android / Escritorio
  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  // Referencias para el bucle de polling a 60-120fps sin re-renderizar todo innecesariamente
  const profileRef = useRef(activeProfile);
  profileRef.current = activeProfile;

  const selectedIndexRef = useRef(selectedIndex);
  selectedIndexRef.current = selectedIndex;

  const previousButtonsPressed = useRef(new Set());

  // Suscribirse a cambios de red
  useEffect(() => {
    const unsubscribe = networkService.subscribe((state) => {
      setNetworkState(state);
    });
    return () => unsubscribe();
  }, []);

  const currentGamepadId = gamepads[selectedIndex]?.id || '';

  // Cargar perfil cuando cambia el mando seleccionado o su identificador de hardware
  useEffect(() => {
    if (gamepads[selectedIndex]) {
      const prof = getControllerProfile(gamepads[selectedIndex], selectedIndex);
      setActiveProfile(prof);
    } else {
      setActiveProfile(null);
    }
  }, [selectedIndex, gamepads.length, currentGamepadId]);

  // Manejar eventos de conexión y desconexión nativos de Gamepad API
  useEffect(() => {
    const handleConnected = (e) => {
      soundEffects.playConnect();
      updateGamepadList();
    };

    const handleDisconnected = (e) => {
      soundEffects.playDisconnect();
      updateGamepadList();
    };

    window.addEventListener('gamepadconnected', handleConnected);
    window.addEventListener('gamepaddisconnected', handleDisconnected);

    return () => {
      window.removeEventListener('gamepadconnected', handleConnected);
      window.removeEventListener('gamepaddisconnected', handleDisconnected);
    };
  }, []);

  const updateGamepadList = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return;
    const rawList = navigator.getGamepads();
    const validPads = Array.from(rawList).filter(Boolean);
    setGamepads(validPads);

    if (validPads.length > 0 && selectedIndexRef.current >= validPads.length) {
      setSelectedIndex(0);
    }
  }, []);

  const [playersStates, setPlayersStates] = useState([null, null, null, null]);

  // Bucle principal de polling de mandos con requestAnimationFrame
  useEffect(() => {
    let animFrameId;

    const pollLoop = () => {
      if (typeof navigator !== 'undefined' && navigator.getGamepads) {
        const rawPads = navigator.getGamepads();
        const validPads = Array.from(rawPads).filter(Boolean);

        // Detectar si la lista de mandos conectados cambió
        if (validPads.length !== gamepads.length || validPads.some((p, i) => p?.id !== gamepads[i]?.id)) {
          setGamepads(validPads);
        }

        const currentProfile = profileRef.current;
        const currentStates = [null, null, null, null];

        // Procesar hasta 4 mandos físicos conectados simultáneamente (P1, P2, P3, P4)
        for (let i = 0; i < Math.min(validPads.length, 4); i++) {
          const pad = validPads[i];
          if (pad) {
            const prof = (i === selectedIndexRef.current && currentProfile)
              ? currentProfile
              : getControllerProfile(pad, i);
            const norm = normalizeGamepadToXboxOne(pad, prof);
            currentStates[i] = norm;

            // Retransmitir al servidor cada mando con su playerIndex (P1=0, P2=1, P3=2, P4=3)
            networkService.sendPlayerState(i, norm);
          }
        }

        setPlayersStates(currentStates);
        const activeNormalized = currentStates[selectedIndexRef.current] || null;
        setNormalizedState(activeNormalized);

        // Efecto de sonido al presionar botones en el mando seleccionado
        if (activeNormalized?.buttons) {
          const newlyPressed = new Set();
          for (const [btnName, isPressed] of Object.entries(activeNormalized.buttons)) {
            if (isPressed && (isPressed === true || isPressed > 0.5)) {
              newlyPressed.add(btnName);
              if (!previousButtonsPressed.current.has(btnName)) {
                soundEffects.playClick(650);
              }
            }
          }
          previousButtonsPressed.current = newlyPressed;
        }
      }

      animFrameId = requestAnimationFrame(pollLoop);
    };

    animFrameId = requestAnimationFrame(pollLoop);
    return () => cancelAnimationFrame(animFrameId);
  }, [gamepads.length]);

  // Manejadores de perfiles independientes por jugador
  const handleSaveProfile = (newProfile) => {
    const activePad = gamepads[selectedIndex];
    if (activePad) {
      saveControllerProfile(activePad.id, newProfile, selectedIndex);
      setActiveProfile(newProfile);
    }
  };

  const handleResetProfile = () => {
    const activePad = gamepads[selectedIndex];
    if (activePad) {
      resetControllerProfile(activePad.id, selectedIndex);
      const def = getControllerProfile(activePad, selectedIndex);
      setActiveProfile(def);
    }
  };

  const activePad = gamepads[selectedIndex] || null;
  const detectedInfo = activePad ? identifyGamepadType(activePad.id) : null;

  return (
    <div className="app-container">
      {/* Animación Hacker Matrix al entrar al sistema */}
      {showHackerIntro && (
        <HackerIntro
          onFinish={() => setShowHackerIntro(false)}
          onDismiss={() => setShowHackerIntro(false)}
        />
      )}

      {/* Encabezado con estado global, sonido, descargas y ayuda */}
      <Header
        networkState={networkState}
        networkStatus={networkState.status}
        soundEnabled={soundEnabled}
        onToggleSound={setSoundEnabled}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenDownload={() => setIsDownloadOpen(true)}
        onReplayIntro={() => setShowHackerIntro(true)}
        activeGamepad={activePad}
        gamepadCount={gamepads.length}
        detectedGamepadInfo={detectedInfo}
        selectedPlayerIndex={selectedIndex}
      />

      {/* Contenido Principal en Grid */}
      <main className="dashboard-grid">
        {/* Columna Izquierda: Detección y Mando Xbox One */}
        <section className="dashboard-column column-left">
          {/* Parrilla Multijugador de hasta 4 Mandos */}
          <ControllerSelector
            gamepads={gamepads}
            selectedIndex={selectedIndex}
            onSelectIndex={setSelectedIndex}
            onOpenRemap={(idx) => {
              if (typeof idx === 'number') setSelectedIndex(idx);
              setIsRemapOpen(true);
            }}
            onOpenCalibration={(idx) => {
              if (typeof idx === 'number') setSelectedIndex(idx);
              setIsCalibrationOpen(true);
            }}
            profile={activeProfile}
            playersStates={playersStates}
          />

          {/* Visualizador Dinámico de Mando Xbox One */}
          <XboxVisualizer
            state={normalizedState}
            rawGamepad={activePad}
            profile={activeProfile}
            playerIndex={selectedIndex}
          />
        </section>

        {/* Columna Derecha: Conexión de Red, Telemetría e Instrucciones */}
        <section className="dashboard-column column-right">
          {/* Panel de Retransmisión a Xbox One vía Internet */}
          <NetworkPanel
            networkState={networkState}
            onConnect={(code, name) => networkService.connect(code, name)}
            onConnectDirect={(ip) => networkService.connectDirect(ip)}
            onDiscoverConsoles={() => networkService.discoverConsoles()}
            onDisconnect={() => networkService.disconnect()}
            onUpdateUrl={(url) => networkService.setUrl(url)}
            onUpdateFps={(fps) => networkService.setTargetFps(fps)}
            activeControllerName={detectedInfo?.displayName || 'Mando Genérico'}
          />

          {/* HUD de Telemetría (Ping, Tasa de Envío, Estabilidad) */}
          <TelemetryHUD networkState={networkState} />

          {/* Banner de Ayuda Rápida */}
          <div className="quick-help-banner">
            <h3 className="help-banner-title">Consejos de Rendimiento para Xbox One</h3>
            <ul className="help-banner-list">
              <li>
                <strong>Latencia Mínima:</strong> Conecta tu PC Host a tu router por cable Ethernet para un ping inferior a 15ms.
              </li>
              <li>
                <strong>Compatibilidad de Mandos:</strong> Los mandos de PS4 funcionan tanto por cable micro-USB como por Bluetooth nativo.
              </li>
              <li>
                <strong>Xbox Clásico:</strong> Si usas un adaptador USB para mandos Duke/Controller S, los botones Blanco y Negro se mapean como LB y RB.
              </li>
            </ul>
          </div>
        </section>
      </main>

      {/* Modales */}
      <RemapModal
        isOpen={isRemapOpen}
        onClose={() => setIsRemapOpen(false)}
        rawGamepad={activePad}
        profile={activeProfile}
        onSaveProfile={handleSaveProfile}
        onResetProfile={handleResetProfile}
        playerIndex={selectedIndex}
      />

      <CalibrationPanel
        isOpen={isCalibrationOpen}
        onClose={() => setIsCalibrationOpen(false)}
        profile={activeProfile}
        state={normalizedState}
        onSaveCalibration={handleSaveProfile}
        playerIndex={selectedIndex}
      />

      <GuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      <DownloadModal
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
        deferredPrompt={deferredPrompt}
      />
    </div>
  );
}
