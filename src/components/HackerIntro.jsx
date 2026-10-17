import React, { useEffect, useRef, useState } from 'react';
import { Terminal, SkipForward } from 'lucide-react';

const BOOT_LOGS = [
  '> Holaaa, me llamo Adan Cancino Mendoza y este es un proyecto para ustedes creado con mucho amor.',
  '> (Tranquilos, no es ningún virus ni les voy a hackear el router de la casa...)',
  '> Dato curioso: A este sistema en un principio lo iba a llamar "Cuca"',
  '> Pero sonaba medio sospechoso decir: "Amigos, conéctense todos a mi Cuca para jugar"...',
  '> Así que mejor lo llamé Inagerlibox para mantener la paz y la decencia familiar.',
  '> Calibrando controles al 100% para que nadie ponga de excusa que perdió por culpa del mando...',
  '> Regla oficial: Prohibido desconectarle el cable al compa cuando te vaya ganando en el juego.',
  '> ¡Todo listo y sincronizado! Conecten sus controles y a disfrutar.'
];

export default function HackerIntro({ onFinish, onDismiss }) {
  const canvasRef = useRef(null);
  const [logIndex, setLogIndex] = useState(0);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Caracteres hacker estilo Matrix + Caritas y letras divertidas
    const chars = '0123456789ABCDEF!@#$%&*<>INAGERLIBOX_CUCA_XBOX_PAD_LT_RT_5050_A_B_X_Y_XD_:D';
    const fontSize = 15;
    const columns = Math.floor(canvas.width / fontSize);
    const drops = Array(columns).fill(1);

    const draw = () => {
      ctx.fillStyle = 'rgba(10, 12, 16, 0.12)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#d6ad44';
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        if (Math.random() > 0.88) {
          ctx.fillStyle = '#ffffff';
        } else {
          ctx.fillStyle = '#b8860b';
        }

        ctx.fillText(text, x, y);

        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // Animación de logs en consola tipo terminal
  useEffect(() => {
    const logTimer = setInterval(() => {
      setLogIndex((prev) => {
        if (prev < BOOT_LOGS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 380);

    return () => clearInterval(logTimer);
  }, []);

  // Finalizar automáticamente después de 5.5 segundos para dar tiempo a leer los chistes con calma
  useEffect(() => {
    const exitTimer = setTimeout(() => {
      handleExit();
    }, 5500);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        handleExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(exitTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleExit = () => {
    setFadingOut(true);
    setTimeout(() => {
      if (onFinish) onFinish();
      if (onDismiss) onDismiss();
    }, 450);
  };

  return (
    <div
      className={`hacker-intro-overlay ${fadingOut ? 'fade-out' : ''}`}
      onClick={handleExit}
      title="Haz clic o pulsa ESC para omitir"
    >
      <canvas ref={canvasRef} className="hacker-rain-canvas" />

      <div className="hacker-terminal-card" onClick={(e) => e.stopPropagation()}>
        <div className="terminal-header">
          <div className="terminal-dots">
            <span className="dot dot-red" />
            <span className="dot dot-yellow" />
            <span className="dot dot-green" />
          </div>
          <div className="terminal-title">
            <img src="/inagerlibox-stag.png" alt="Inagerlibox" className="terminal-stag-mini" />
            <span>INAGERLIBOX // MENSAJE DE BIENVENIDA</span>
          </div>
          <button type="button" className="btn-skip-intro" onClick={handleExit}>
            <SkipForward size={12} />
            <span>Saltar (ESC)</span>
          </button>
        </div>

        <div className="terminal-body">
          <div className="terminal-logs">
            {BOOT_LOGS.slice(0, logIndex + 1).map((log, i) => (
              <div key={i} className={`terminal-log-line ${i === 0 ? 'log-highlight-author' : ''}`}>
                <span className="log-prefix">{i === logIndex ? '●' : '✓'}</span>
                <span className="log-text">{log}</span>
              </div>
            ))}
          </div>

          <div className="terminal-status-bar">
            <div className="status-item">
              <span className="status-label">PROYECTO:</span>
              <span className="status-val val-green">Inagerlibox (Alias Cuca)</span>
            </div>
            <div className="status-item">
              <span className="status-label">LATENCIA:</span>
              <span className="status-val val-green">1 ms (Cero excusas)</span>
            </div>
            <div className="status-item">
              <span className="status-label">REGLA:</span>
              <span className="status-val">El que pierde pone las pizzas</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
