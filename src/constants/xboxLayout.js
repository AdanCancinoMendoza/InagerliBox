/**
 * Definiciones estándar del Mando Xbox One y Mapeos Predeterminados
 */

export const XBOX_BUTTONS = [
  { id: 'A', label: 'Botón A', color: '#107c10', description: 'Acción principal / Aceptar' },
  { id: 'B', label: 'Botón B', color: '#d83b01', description: 'Cancelar / Atrás' },
  { id: 'X', label: 'Botón X', color: '#0078d7', description: 'Recargar / Acción secundaria' },
  { id: 'Y', label: 'Botón Y', color: '#ffb900', description: 'Cambio de arma / Salto alterno' },
  { id: 'LB', label: 'LB (Bumper Izq.)', color: '#68768a', description: 'Hombro izquierdo' },
  { id: 'RB', label: 'RB (Bumper Der.)', color: '#68768a', description: 'Hombro derecho' },
  { id: 'LT', label: 'LT (Gatillo Izq.)', color: '#00f0ff', description: 'Apuntar / Freno (Analógico)' },
  { id: 'RT', label: 'RT (Gatillo Der.)', color: '#00f0ff', description: 'Disparar / Acelerar (Analógico)' },
  { id: 'View', label: 'View (Atrás)', color: '#888888', description: 'Mapa / Puntuaciones' },
  { id: 'Menu', label: 'Menu (Start)', color: '#888888', description: 'Pausa / Menú principal' },
  { id: 'Xbox', label: 'Botón Xbox (Guía)', color: '#ffffff', description: 'Menú del sistema Xbox' },
  { id: 'LS', label: 'LS (Clic Stick Izq.)', color: '#00ff5f', description: 'Correr / L3' },
  { id: 'RS', label: 'RS (Clic Stick Der.)', color: '#00ff5f', description: 'Cuerpo a cuerpo / R3' },
  { id: 'DpadUp', label: 'D-Pad Arriba', color: '#555555', description: 'Cruceta Arriba' },
  { id: 'DpadDown', label: 'D-Pad Abajo', color: '#555555', description: 'Cruceta Abajo' },
  { id: 'DpadLeft', label: 'D-Pad Izquierda', color: '#555555', description: 'Cruceta Izquierda' },
  { id: 'DpadRight', label: 'D-Pad Derecha', color: '#555555', description: 'Cruceta Derecha' },
];

export const XBOX_AXES = [
  { id: 'leftStickX', label: 'Stick Izquierdo Horizontal (X)', defaultAxis: 0 },
  { id: 'leftStickY', label: 'Stick Izquierdo Vertical (Y)', defaultAxis: 1 },
  { id: 'rightStickX', label: 'Stick Derecho Horizontal (X)', defaultAxis: 2 },
  { id: 'rightStickY', label: 'Stick Derecho Vertical (Y)', defaultAxis: 3 },
];

/**
 * Perfiles de mapeo estándar de la API de Gamepad del navegador:
 * Estándar (W3C standard mapping):
 * 0: A/Cruz, 1: B/Círculo, 2: X/Cuadrado, 3: Y/Triángulo,
 * 4: LB/L1, 5: RB/R1, 6: LT/L2, 7: RT/R2,
 * 8: Back/Share, 9: Start/Options, 10: LS/L3, 11: RS/R3,
 * 12: D-Up, 13: D-Down, 14: D-Left, 15: D-Right, 16: Xbox/PS
 */
export const DEFAULT_PROFILES = {
  // PlayStation 4 (DualShock 4)
  ps4: {
    name: 'PlayStation 4 (DualShock 4)',
    type: 'ps4',
    buttons: {
      A: 0,       // Cruz (X) -> A
      B: 1,       // Círculo -> B
      X: 2,       // Cuadrado -> X
      Y: 3,       // Triángulo -> Y
      LB: 4,      // L1 -> LB
      RB: 5,      // R1 -> RB
      LT: 6,      // L2 -> LT (analógico)
      RT: 7,      // R2 -> RT (analógico)
      View: 8,    // Share -> View
      Menu: 9,    // Options -> Menu
      LS: 10,     // L3 -> LS
      RS: 11,     // R3 -> RS
      DpadUp: 12, // D-Pad
      DpadDown: 13,
      DpadLeft: 14,
      DpadRight: 15,
      Xbox: 16,   // Botón PS -> Botón Xbox Guía
    },
    axes: {
      leftStickX: 0,
      leftStickY: 1,
      rightStickX: 2,
      rightStickY: 3,
    },
    deadzone: 0.08,
    sensitivityCurve: 'linear',
    invertLeftY: false,
    invertRightY: false,
    triggerDeadzone: 0.05,
    triggerThreshold: 0.95,
    require100PercentLT: false,
    require100PercentRT: false,
    require100PercentLS: false,
  },

  // Xbox One / Xbox Series X|S
  xboxOne: {
    name: 'Xbox One / Series X|S',
    type: 'xboxOne',
    buttons: {
      A: 0,
      B: 1,
      X: 2,
      Y: 3,
      LB: 4,
      RB: 5,
      LT: 6,
      RT: 7,
      View: 8, // Back / View
      Menu: 9, // Start / Menu
      LS: 10,  // Clic stick izquierdo
      RS: 11,  // Clic stick derecho
      DpadUp: 12,
      DpadDown: 13,
      DpadLeft: 14,
      DpadRight: 15,
      Xbox: 16, // Botón Xbox Guía
    },
    axes: {
      leftStickX: 0,
      leftStickY: 1,
      rightStickX: 2,
      rightStickY: 3,
    },
    deadzone: 0.08,
    sensitivityCurve: 'linear',
    invertLeftY: false,
    invertRightY: false,
    triggerDeadzone: 0.05,
    triggerThreshold: 0.95,
    require100PercentLT: false,
    require100PercentRT: false,
    require100PercentLS: false,
  },

  // Xbox 360 (XInput estándar)
  xbox360: {
    name: 'Xbox 360',
    type: 'xbox360',
    buttons: {
      A: 0,
      B: 1,
      X: 2,
      Y: 3,
      LB: 4,
      RB: 5,
      LT: 6,
      RT: 7,
      View: 8, // Back
      Menu: 9, // Start
      LS: 10,
      RS: 11,
      DpadUp: 12,
      DpadDown: 13,
      DpadLeft: 14,
      DpadRight: 15,
      Xbox: 16, // Guía Xbox
    },
    axes: {
      leftStickX: 0,
      leftStickY: 1,
      rightStickX: 2,
      rightStickY: 3,
    },
    deadzone: 0.10,
    sensitivityCurve: 'linear',
    invertLeftY: false,
    invertRightY: false,
    triggerDeadzone: 0.05,
    triggerThreshold: 0.95,
    require100PercentLT: false,
    require100PercentRT: false,
    require100PercentLS: false,
  },

  // Xbox Clásico (Original Xbox con adaptador USB)
  xboxClassic: {
    name: 'Xbox Clásico (Duke / Controller S)',
    type: 'xboxClassic',
    buttons: {
      A: 0,       // Verde A
      B: 1,       // Rojo B
      X: 2,       // Azul X
      Y: 3,       // Amarillo Y
      LB: 4,      // Botón Blanco -> LB
      RB: 5,      // Botón Negro -> RB
      LT: 6,      // Gatillo Izquierdo
      RT: 7,      // Gatillo Derecho
      View: 8,    // Back
      Menu: 9,    // Start
      LS: 10,     // L-Thumb click
      RS: 11,     // R-Thumb click
      DpadUp: 12,
      DpadDown: 13,
      DpadLeft: 14,
      DpadRight: 15,
      Xbox: 8,    // Back sostenido o simulado
    },
    axes: {
      leftStickX: 0,
      leftStickY: 1,
      rightStickX: 2,
      rightStickY: 3,
    },
    deadzone: 0.12,
    sensitivityCurve: 'linear',
    invertLeftY: false,
    invertRightY: false,
    triggerDeadzone: 0.05,
    triggerThreshold: 0.95,
    require100PercentLT: false,
    require100PercentRT: false,
    require100PercentLS: false,
  },

  // Mandos Genéricos USB / DirectInput (10 o 12 botones)
  generic: {
    name: 'Mando Genérico USB / DirectInput',
    type: 'generic',
    buttons: {
      A: 2,       // Comúnmente el botón 2 o 1 es A/1
      B: 1,
      X: 3,
      Y: 0,
      LB: 4,
      RB: 5,
      LT: 6,
      RT: 7,
      View: 8,    // Select
      Menu: 9,    // Start
      LS: 10,
      RS: 11,
      DpadUp: 12,
      DpadDown: 13,
      DpadLeft: 14,
      DpadRight: 15,
      Xbox: 9,
    },
    axes: {
      leftStickX: 0,
      leftStickY: 1,
      rightStickX: 2,
      rightStickY: 3,
    },
    deadzone: 0.15,
    sensitivityCurve: 'linear',
    invertLeftY: false,
    invertRightY: false,
    triggerDeadzone: 0.05,
    triggerThreshold: 0.95,
    require100PercentLT: false,
    require100PercentRT: false,
    require100PercentLS: false,
  }
};
