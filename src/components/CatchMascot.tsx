import React from 'react';

type MascotState = 'idle' | 'processing' | 'success' | 'error' | 'capturing';

interface CatchMascotProps {
  state?: MascotState;
  size?: number;
  className?: string;
}

export const CatchMascot: React.FC<CatchMascotProps> = ({
  state = 'idle',
  size = 120,
  className = '',
}) => {
  // Determine color and animation classes based on state
  const getGlowColor = () => {
    switch (state) {
      case 'success':
        return 'rgba(52, 211, 153, 0.4)';
      case 'error':
        return 'rgba(248, 113, 113, 0.4)';
      case 'processing':
      case 'capturing':
        return 'rgba(45, 212, 191, 0.45)';
      case 'idle':
      default:
        return 'rgba(45, 212, 191, 0.15)';
    }
  };

  const getAccentColor = () => {
    switch (state) {
      case 'success':
        return 'var(--success)';
      case 'error':
        return 'var(--error)';
      case 'processing':
      case 'capturing':
      case 'idle':
      default:
        return 'var(--accent)';
    }
  };

  const glowColor = getGlowColor();
  const accentColor = getAccentColor();

  // Mouth notch path changes in capturing state to represent opening up
  const deltaPath = state === 'capturing'
    ? "M 50 12 L 88 80 L 60 80 Q 50 50 40 80 L 12 80 Z" // deeper notch
    : "M 50 15 L 85 80 L 58 80 Q 50 68 42 80 L 15 80 Z";

  return (
    <div
      className={`catch-mascot-wrapper ${state} ${className}`}
      style={{
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Glow effect behind mascot */}
      <div
        className="catch-glow-back"
        style={{
          position: 'absolute',
          width: '70%',
          height: '70%',
          borderRadius: '50%',
          background: glowColor,
          filter: 'blur(24px)',
          opacity: state === 'idle' ? 0.3 : 0.8,
          transform: 'scale(1)',
          zIndex: 0,
          transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />

      {/* Orbiting particles for processing / capturing states */}
      {(state === 'processing' || state === 'capturing') && (
        <svg
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            top: 0,
            left: 0,
            pointerEvents: 'none',
            zIndex: 1,
            animation: 'spin 8s linear infinite',
          }}
          viewBox="0 0 100 100"
        >
          <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(45, 212, 191, 0.12)" strokeDasharray="5 8" />
          <circle cx="95" cy="50" r="3" fill="var(--accent)" className="animate-pulse-glow" />
          <circle cx="5" cy="50" r="2" fill="var(--accent)" style={{ opacity: 0.6 }} />
          <circle cx="50" cy="5" r="2.5" fill="var(--accent)" className="animate-pulse-glow" style={{ animationDelay: '1s' }} />
        </svg>
      )}

      {/* Main mascot SVG */}
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        style={{
          position: 'relative',
          zIndex: 2,
          overflow: 'visible',
          transformOrigin: '50% 60%',
        }}
        className="catch-svg"
      >
        <defs>
          <linearGradient id="catch-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.25" />
            <stop offset="100%" stopColor={accentColor} stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="catch-grad-success" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--success)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--success)" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="catch-grad-error" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--error)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--error)" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Triangle Body */}
        <path
          d={deltaPath}
          fill={
            state === 'success' ? 'url(#catch-grad-success)' :
            state === 'error' ? 'url(#catch-grad-error)' : 'url(#catch-grad)'
          }
          stroke={accentColor}
          strokeWidth="4"
          strokeLinejoin="round"
          strokeLinecap="round"
          style={{
            transition: 'd 0.3s ease, stroke 0.5s ease, fill 0.5s ease',
          }}
        />

        {/* Capturing flow particles (inward movement) */}
        {state === 'capturing' && (
          <>
            <circle cx="50" cy="90" r="1.5" fill="var(--accent)">
              <animate attributeName="cy" values="90;60" dur="1s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0;1;0" dur="1s" repeatCount="indefinite" />
            </circle>
            <circle cx="45" cy="85" r="1" fill="var(--accent)">
              <animate attributeName="cy" values="85;62" dur="1.2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0;1;0" dur="1.2s" repeatCount="indefinite" />
            </circle>
            <circle cx="55" cy="87" r="1.2" fill="var(--accent)">
              <animate attributeName="cy" values="87;61" dur="0.8s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0;1;0" dur="0.8s" repeatCount="indefinite" />
            </circle>
          </>
        )}

        {/* Eyes (tilt / animate according to state) */}
        <g className="catch-eyes" style={{ transformOrigin: '50% 38%' }}>
          {/* Left Eye */}
          <circle
            cx="43"
            cy="38"
            r={state === 'error' ? '2.5' : '3'}
            fill={state === 'error' ? 'var(--error)' : 'var(--text-primary)'}
            style={{
              transition: 'fill 0.5s ease, r 0.5s ease',
            }}
          />
          {/* Right Eye */}
          <circle
            cx="57"
            cy="38"
            r={state === 'error' ? '2.5' : '3'}
            fill={state === 'error' ? 'var(--error)' : 'var(--text-primary)'}
            style={{
              transition: 'fill 0.5s ease, r 0.5s ease',
            }}
          />

          {/* Expressions */}
          {state === 'error' && (
            <path
              d="M 41 34 L 45 36 M 59 34 L 55 36"
              stroke="var(--error)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          )}
        </g>
      </svg>

      {/* CSS Animation styles for the mascot states */}
      <style>{`
        .catch-mascot-wrapper.idle .catch-svg {
          animation: catch-float 4s ease-in-out infinite;
        }
        .catch-mascot-wrapper.processing .catch-svg {
          animation: catch-thinking 2s ease-in-out infinite;
        }
        .catch-mascot-wrapper.success .catch-svg {
          animation: catch-happy 2.5s ease-in-out infinite;
        }
        .catch-mascot-wrapper.error .catch-svg {
          animation: catch-sad 3s ease-in-out infinite;
        }
        .catch-mascot-wrapper.capturing .catch-svg {
          animation: catch-harvesting 1.5s ease-in-out infinite;
        }

        @keyframes catch-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        @keyframes catch-thinking {
          0%, 100% { transform: rotate(-3deg) translateY(0); }
          50% { transform: rotate(3deg) translateY(-3px); }
        }

        @keyframes catch-happy {
          0%, 100% { transform: scale(1) translateY(0); }
          50% { transform: scale(1.05) translateY(-8px); }
        }

        @keyframes catch-sad {
          0%, 100% { transform: rotate(12deg) translateY(2px); }
          50% { transform: rotate(10deg) translateY(4px); }
        }

        @keyframes catch-harvesting {
          0%, 100% { transform: scale(1) translateY(0); }
          50% { transform: scale(0.97) translateY(2px); }
        }
      `}</style>
    </div>
  );
};
