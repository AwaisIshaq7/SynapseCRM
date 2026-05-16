/**
 * Logo Component - Full horizontal logo with animated gradient and neural icon
 * Used in Navbar and other locations requiring the full branding
 */
export default function Logo({ size = 'normal', className = '' }) {
  const sizeMap = {
    small: { width: 160, height: 60, viewBox: '0 0 540 150' },
    normal: { width: 320, height: 90, viewBox: '0 0 540 150' },
    large: { width: 420, height: 120, viewBox: '0 0 540 150' },
  };

  const sizeConfig = sizeMap[size] || sizeMap.normal;

  return (
    <svg
      width={sizeConfig.width}
      height={sizeConfig.height}
      viewBox={sizeConfig.viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} transition-transform hover:scale-105`}
    >
      <defs>
        {/* Neon pink/purple animated gradient (matches provided image) */}
        <linearGradient id="luxGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF6FD8">
            <animate attributeName="stopColor" values="#FF6FD8;#B794F4;#FF6FD8" dur="4s" repeatCount="indefinite" />
          </stop>
          <stop offset="50%" stopColor="#8B5CF6">
            <animate attributeName="stopColor" values="#8B5CF6;#D946EF;#8B5CF6" dur="4s" repeatCount="indefinite" />
          </stop>
          <stop offset="100%" stopColor="#D946EF">
            <animate attributeName="stopColor" values="#D946EF;#FF6FD8;#D946EF" dur="4s" repeatCount="indefinite" />
          </stop>
        </linearGradient>

        {/* Glow effect */}
        <filter id="glow">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Soft shadow */}
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#000000" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* Background */}
      <rect width="540" height="0" rx="28" fill="#070B14" className="light:fill-slate-950" />

      {/* Floating glow circles */}
      <circle cx="480" cy="35" r="40" fill="#8B5CF6" opacity="0.08">
        <animate attributeName="r" values="40;50;40" dur="5s" repeatCount="indefinite" />
      </circle>

      <circle cx="430" cy="120" r="30" fill="#D946EF" opacity="0.08">
        <animate attributeName="r" values="30;38;30" dur="4s" repeatCount="indefinite" />
      </circle>

      {/* Neural icon */}
      <g transform="translate(32,34)" filter="url(#shadow)">
        {/* Connection lines */}
        <path
          d="M30 40 L70 15 L110 40 L70 65 Z"
          stroke="url(#luxGradient)"
          strokeWidth="3"
          strokeLinecap="circle"
          fill="none"
          opacity="0.95"
        >
          <animate
            attributeName="strokeDasharray"
            values="0,280;280,0"
            dur="10s"
            repeatCount="indefinite"
          />
        </path>

        {/* Nodes */}
        <circle cx="30" cy="40" r="8" fill="#FF6FD8" filter="url(#glow)">
          <animate attributeName="r" values="8;11;8" dur="1.5s" repeatCount="indefinite" />
        </circle>

        <circle cx="70" cy="15" r="8" fill="#8B5CF6" filter="url(#glow)">
          <animate attributeName="r" values="8;12;8" dur="1.8s" repeatCount="indefinite" />
        </circle>

        <circle cx="110" cy="40" r="8" fill="#D946EF" filter="url(#glow)">
          <animate attributeName="r" values="8;11;8" dur="1.5s" repeatCount="indefinite" />
        </circle>

        <circle cx="70" cy="65" r="8" fill="#8B5CF6" filter="url(#glow)">
          <animate attributeName="r" values="8;12;8" dur="1.8s" repeatCount="indefinite" />
        </circle>

        {/* Center pulse */}
        <circle cx="70" cy="40" r="5" fill="#FFFFFF">
          <animate attributeName="r" values="5;15;5" dur="1s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.5;0.1;0.5" dur="4.6s" repeatCount="indefinite" />
        </circle>
      </g>

      {/* Main text */}
      <text
        x="175"
        y="88"
        fontFamily="Poppins, Arial, Helvetica, sans-serif"
        fontSize="46"
        fontWeight="700"
        fill="url(#luxGradient)"
        filter="url(#glow)"
      >
        SynapseCRM
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 0; 0 -1.5; 0 "
          dur="2.2s"
          repeatCount="indefinite"
        />
      </text>

      {/* Elegant underline */}
      <rect x="178" y="103" width="210" height="4" rx="3" fill="url(#luxGradient)" opacity="0.95">
        <animate
          attributeName="width"
          values="110;210;110"
          dur="2.4s"
          repeatCount="indefinite"
        />
      </rect>
    </svg>
  );
}
