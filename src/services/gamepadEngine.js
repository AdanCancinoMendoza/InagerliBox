import { DEFAULT_PROFILES } from '../constants/xboxLayout.js';

/**
 * Identifica el tipo de control a partir de la propiedad `id` del Gamepad.
 */
export function identifyGamepadType(gamepadId = '') {
  const idLower = gamepadId.toLowerCase();

  // 1. PlayStation 5 (DualSense)
  if (
    idLower.includes('dualsense') ||
    idLower.includes('ps5') ||
    (idLower.includes('054c') && (idLower.includes('0ce6') || idLower.includes('0df2')))
  ) {
    return {
      type: 'ps4', // Mapeo compatible con layout PlayStation
      displayName: 'PlayStation 5 (DualSense)',
      badgeColor: '#00439c',
      iconType: 'playstation'
    };
  }

  // 2. PlayStation 4 (Sony DualShock 4)
  // Vendor ID Sony: 054c, DualShock 4 v1: 05c4, v2: 09cc, Dongle: 0ba0
  if (
    idLower.includes('dualshock 4') ||
    idLower.includes('ps4') ||
    (idLower.includes('054c') && (idLower.includes('05c4') || idLower.includes('09cc') || idLower.includes('0ba0'))) ||
    (idLower.includes('wireless controller') && !idLower.includes('xbox')) ||
    (idLower.includes('sony') && idLower.includes('controller'))
  ) {
    return {
      type: 'ps4',
      displayName: 'PlayStation 4 (DualShock 4)',
      badgeColor: '#00439c',
      iconType: 'playstation'
    };
  }

  // 3. PlayStation 3 (Sixaxis / DualShock 3)
  if (
    idLower.includes('ps3') ||
    idLower.includes('dualshock 3') ||
    idLower.includes('sixaxis') ||
    (idLower.includes('054c') && idLower.includes('0268'))
  ) {
    return {
      type: 'ps4',
      displayName: 'PlayStation 3 (DualShock 3)',
      badgeColor: '#00439c',
      iconType: 'playstation'
    };
  }

  // 4. Xbox Clásico (Duke / Controller S original con adaptador)
  if (
    idLower.includes('classic') ||
    idLower.includes('original xbox') ||
    idLower.includes('duke') ||
    idLower.includes('controller s') ||
    idLower.includes('super joy box') ||
    (idLower.includes('045e') && (idLower.includes('0202') || idLower.includes('0289')))
  ) {
    return {
      type: 'xboxClassic',
      displayName: 'Xbox Clásico (Duke / Controller S)',
      badgeColor: '#107c10',
      iconType: 'xbox'
    };
  }

  // 5. Xbox One / Xbox Series X|S
  // Modelos: 02d1 (Xbox One 2013), 02dd (One 3.5mm), 02e3 (Elite v1), 02ea (One S USB), 02fd (One S BT)
  // 0b00 (Elite 2 USB), 0b05 (Elite 2 BT), 0b12 (Series X|S USB), 0b13 (Series X|S BT)
  const isXboxOneSpecific =
    idLower.includes('xbox one') ||
    idLower.includes('x-box one') ||
    idLower.includes('series x') ||
    idLower.includes('series s') ||
    idLower.includes('xbox wireless controller') ||
    idLower.includes('model 1708') ||
    idLower.includes('model 1697') ||
    idLower.includes('model 1537') ||
    idLower.includes('model 1914') ||
    idLower.includes('02d1') ||
    idLower.includes('02dd') ||
    idLower.includes('02e3') ||
    idLower.includes('02ea') ||
    idLower.includes('02fd') ||
    idLower.includes('0b00') ||
    idLower.includes('0b05') ||
    idLower.includes('0b12') ||
    idLower.includes('0b13');

  if (isXboxOneSpecific) {
    return {
      type: 'xboxOne',
      displayName: 'Xbox One / Series X|S',
      badgeColor: '#107c10',
      iconType: 'xbox'
    };
  }

  // 6. Xbox 360
  // Modelos: 028e (Cableado), 028f (Inalámbrico), 02a1 / 0719 (Receptor inalámbrico)
  const isXbox360Specific =
    idLower.includes('xbox 360') ||
    idLower.includes('x-box 360') ||
    idLower.includes('360 pad') ||
    idLower.includes('028e') ||
    idLower.includes('028f') ||
    idLower.includes('02a1') ||
    idLower.includes('0719');

  if (isXbox360Specific) {
    return {
      type: 'xbox360',
      displayName: 'Xbox 360',
      badgeColor: '#107c10',
      iconType: 'xbox'
    };
  }

  // 7. Fallback para mandos con protocolo Microsoft / XInput genérico
  if (
    idLower.includes('045e') ||
    idLower.includes('xbox') ||
    idLower.includes('x-box') ||
    idLower.includes('xinput')
  ) {
    // Si menciona '360'
    if (idLower.includes('360')) {
      return {
        type: 'xbox360',
        displayName: 'Xbox 360',
        badgeColor: '#107c10',
        iconType: 'xbox'
      };
    }
    // Por defecto en mandos modernos Xbox/XInput
    return {
      type: 'xboxOne',
      displayName: 'Xbox One / Series X|S',
      badgeColor: '#107c10',
      iconType: 'xbox'
    };
  }

  // 8. Nintendo Switch (Pro Controller / Joy-Con)
  if (
    idLower.includes('057e') ||
    idLower.includes('pro controller') ||
    idLower.includes('joy-con') ||
    idLower.includes('switch') ||
    idLower.includes('nintendo')
  ) {
    return {
      type: 'generic',
      displayName: 'Nintendo Switch (Pro Controller)',
      badgeColor: '#e60012',
      iconType: 'nintendo'
    };
  }

  // 9. Controles Genéricos USB o DirectInput
  return {
    type: 'generic',
    displayName: 'Mando Genérico USB / DirectInput',
    badgeColor: '#6e40c9',
    iconType: 'generic'
  };
}

/**
 * Aplica zona muerta (deadzone) y curva de sensibilidad a un valor de eje (-1.0 a 1.0)
 */
export function applyAxisCalibration(rawVal, deadzone = 0.1, curve = 'linear', inverted = false) {
  let val = rawVal;
  if (inverted) val = -val;

  // Zona muerta radial/lineal
  if (Math.abs(val) <= deadzone) {
    return 0;
  }

  // Escalar valor de (deadzone a 1) para mantener suavidad
  const sign = Math.sign(val);
  const normalized = (Math.abs(val) - deadzone) / (1 - deadzone);

  let curved = normalized;
  if (curve === 'smooth') {
    // Curva cuadrática para apuntado fino
    curved = Math.pow(normalized, 1.8);
  } else if (curve === 'aggressive') {
    // Respuesta rápida
    curved = Math.pow(normalized, 0.7);
  }

  return Math.min(1, Math.max(-1, sign * curved));
}

/**
 * Obtiene el perfil guardado o el perfil predeterminado según el tipo detectado y el slot del jugador (P1-P4).
 */
export function getControllerProfile(gamepad, playerIndex = 0) {
  if (!gamepad) return DEFAULT_PROFILES.generic;

  const detected = identifyGamepadType(gamepad.id);
  const baseProfile = DEFAULT_PROFILES[detected.type] || DEFAULT_PROFILES.generic;

  const playerKey = `multicontrol_profile_${gamepad.id}_p${playerIndex}`;
  const generalKey = `multicontrol_profile_${gamepad.id}`;

  try {
    const savedStr = localStorage.getItem(playerKey) || localStorage.getItem(generalKey);
    if (savedStr) {
      const saved = JSON.parse(savedStr);
      // Si el perfil guardado en caché tiene el nombre combinado viejo o tipo incorrecto, actualizar
      if (saved.name === 'Xbox 360 / Xbox One Nativo' || !saved.name || (detected.type === 'xboxOne' && saved.type === 'xbox360')) {
        saved.name = detected.displayName;
        saved.type = detected.type;
      }
      return saved;
    }
  } catch (e) {
    console.warn('Error reading from localStorage:', e);
  }

  // Devolver perfil por defecto clonado
  return JSON.parse(JSON.stringify(baseProfile));
}

/**
 * Guarda el perfil en localStorage para el mando y slot de jugador específico.
 */
export function saveControllerProfile(gamepadId, profile, playerIndex = 0) {
  try {
    const playerKey = `multicontrol_profile_${gamepadId}_p${playerIndex}`;
    const generalKey = `multicontrol_profile_${gamepadId}`;
    localStorage.setItem(playerKey, JSON.stringify(profile));
    localStorage.setItem(generalKey, JSON.stringify(profile));
  } catch (e) {
    console.error('Error saving profile to localStorage:', e);
  }
}

/**
 * Elimina la personalización del slot de jugador y vuelve al predeterminado.
 */
export function resetControllerProfile(gamepadId, playerIndex = 0) {
  try {
    const playerKey = `multicontrol_profile_${gamepadId}_p${playerIndex}`;
    const generalKey = `multicontrol_profile_${gamepadId}`;
    localStorage.removeItem(playerKey);
    localStorage.removeItem(generalKey);
  } catch (e) {
    console.error('Error removing profile from localStorage:', e);
  }
}

/**
 * Normaliza los datos crudos del Gamepad de la Web al estándar de Xbox One
 */
export function normalizeGamepadToXboxOne(gamepad, profile) {
  if (!gamepad) return null;

  const buttonsState = {};
  const mapping = profile.buttons || {};

  // Mapear botones
  for (const [targetXboxBtn, physicalIndex] of Object.entries(mapping)) {
    if (physicalIndex !== undefined && gamepad.buttons[physicalIndex]) {
      const btnObj = gamepad.buttons[physicalIndex];
      // Para gatillos LT y RT, capturar valor analógico (0.0 a 1.0)
      if (targetXboxBtn === 'LT' || targetXboxBtn === 'RT') {
        buttonsState[targetXboxBtn] = typeof btnObj.value === 'number' ? btnObj.value : (btnObj.pressed ? 1.0 : 0.0);
      } else {
        buttonsState[targetXboxBtn] = !!btnObj.pressed;
      }
    } else {
      buttonsState[targetXboxBtn] = (targetXboxBtn === 'LT' || targetXboxBtn === 'RT') ? 0 : false;
    }
  }

  // Si LT o RT no están asignados en botones, verificar si están asignados a un eje (algunos mandos genéricos los colocan en ejes)
  if (profile.triggerAxes) {
    if (profile.triggerAxes.LT !== undefined && gamepad.axes[profile.triggerAxes.LT] !== undefined) {
      const rawLtAxis = gamepad.axes[profile.triggerAxes.LT];
      buttonsState.LT = Math.max(0, Math.min(1, (rawLtAxis + 1) / 2));
    }
    if (profile.triggerAxes.RT !== undefined && gamepad.axes[profile.triggerAxes.RT] !== undefined) {
      const rawRtAxis = gamepad.axes[profile.triggerAxes.RT];
      buttonsState.RT = Math.max(0, Math.min(1, (rawRtAxis + 1) / 2));
    }
  }

  // Guardar valores crudos de LT y RT antes de aplicar filtros anti-drift
  const rawLT = buttonsState.LT;
  const rawRT = buttonsState.RT;
  const triggerThresh = profile.triggerThreshold ?? 0.95;
  const triggerDeadzone = profile.triggerDeadzone ?? 0.05;

  // Anti-Drift Gatillo Izquierdo (LT): Requiere 100% (o umbral configurado) para detectarse presionado
  if (profile.require100PercentLT) {
    buttonsState.LT = rawLT >= triggerThresh ? 1.0 : 0.0;
  } else if (rawLT < triggerDeadzone) {
    buttonsState.LT = 0.0;
  }

  // Anti-Drift Gatillo Derecho (RT): Requiere 100% para detectarse presionado
  if (profile.require100PercentRT) {
    buttonsState.RT = rawRT >= triggerThresh ? 1.0 : 0.0;
  } else if (rawRT < triggerDeadzone) {
    buttonsState.RT = 0.0;
  }

  // Anti-Drift Stick Izquierdo (LS - Clic): Requiere pulsación firme al 100% para evitar clics accidentales por drift
  if (profile.require100PercentLS && mapping.LS !== undefined && gamepad.buttons[mapping.LS]) {
    const lsBtn = gamepad.buttons[mapping.LS];
    const lsVal = typeof lsBtn.value === 'number' ? lsBtn.value : (lsBtn.pressed ? 1.0 : 0.0);
    // Solo se activa si la presión física supera el 95% o el botón está presionado al 100%
    buttonsState.LS = lsVal >= 0.95;
  }

  // Mapear y calibrar joysticks analógicos
  const axesMap = profile.axes || { leftStickX: 0, leftStickY: 1, rightStickX: 2, rightStickY: 3 };
  const deadzone = profile.deadzone ?? 0.10;
  const curve = profile.sensitivityCurve || 'linear';

  const rawLX = gamepad.axes[axesMap.leftStickX] ?? 0;
  const rawLY = gamepad.axes[axesMap.leftStickY] ?? 0;
  const rawRX = gamepad.axes[axesMap.rightStickX] ?? 0;
  const rawRY = gamepad.axes[axesMap.rightStickY] ?? 0;

  const leftStickX = applyAxisCalibration(rawLX, deadzone, curve, false);
  const leftStickY = applyAxisCalibration(rawLY, deadzone, curve, profile.invertLeftY);
  const rightStickX = applyAxisCalibration(rawRX, deadzone, curve, false);
  const rightStickY = applyAxisCalibration(rawRY, deadzone, curve, profile.invertRightY);

  return {
    buttons: buttonsState,
    axes: {
      leftStickX,
      leftStickY,
      rightStickX,
      rightStickY,
    },
    raw: {
      buttons: gamepad.buttons.map(b => ({ pressed: b.pressed, value: b.value })),
      axes: Array.from(gamepad.axes),
      rawLT,
      rawRT
    }
  };
}

/**
 * Prueba de vibración háptica en el mando físico
 */
export async function triggerRumble(gamepad, duration = 400, strong = 0.8, weak = 0.6) {
  if (!gamepad) return false;

  try {
    if (gamepad.vibrationActuator && typeof gamepad.vibrationActuator.playEffect === 'function') {
      await gamepad.vibrationActuator.playEffect('dual-rumble', {
        startDelay: 0,
        duration: duration,
        weakMagnitude: weak,
        strongMagnitude: strong,
      });
      return true;
    }
  } catch (err) {
    console.warn('VibrationActuator error:', err);
  }

  // Fallback con navigator.vibrate si es soportado
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(duration);
    return true;
  }

  return false;
}
