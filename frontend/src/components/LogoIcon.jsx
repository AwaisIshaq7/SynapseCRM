/**
 * LogoIcon Component - Neural network icon only (no text)
 * Used in Sidebar and other compact branding spots
 */
export default function LogoIcon({ size = 48, className = '', decorative = true }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 148 148"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} transition-transform hover:scale-110`}
    >
      <defs>
        {/* Animated gradient */}
        <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6">
            <animate
              attributeName="stopColor"
              values="#8B5CF6;#06B6D4;#8B5CF6"
              dur="4s"
              repeatCount="indefinite"
            />
          </stop>
          <stop offset="50%" stopColor="#06B6D4">
            <animate
              attributeName="stopColor"
              values="#06B6D4;#EC4899;#06B6D4"
              dur="4s"
              repeatCount="indefinite"
            />
          </stop>
          <stop offset="100%" stopColor="#EC4899">
            <animate
              attributeName="stopColor"
              values="#EC4899;#8B5CF6;#EC4899"
              dur="4s"
              repeatCount="indefinite"
            />
          </stop>
        </linearGradient>

        {decorative && (
          <>
            {/* Glow effect */}
            <filter id="iconGlow">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Soft shadow */}
            <filter id="iconShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#000000" floodOpacity="0.25" />
            </filter>
          </>
        )}
      </defs>

      {decorative && (
        <>
          {/* Circular background */}
          <circle cx="74" cy="74" r="72" fill="#070B14" opacity="0.3" className="dark:fill-slate-900" />

          {/* Floating glow circles */}
          <circle cx="120" cy="30" r="18" fill="#8B5CF6" opacity="0.06">
            <animate attributeName="r" values="18;24;18" dur="5s" repeatCount="indefinite" />
          </circle>

          <circle cx="100" cy="110" r="14" fill="#06B6D4" opacity="0.06">
            <animate attributeName="r" values="14;18;14" dur="4s" repeatCount="indefinite" />
          </circle>
        </>
      )}

      {/* Neural icon */}
      <g transform="translate(19,19)" {...(decorative ? { filter: 'url(#iconShadow)' } : {})}>
        {/* Connection lines */}
        <path
          d="M15 25 L40 10 L65 25 L40 40 Z"
          stroke="url(#iconGradient)"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.95"
        >
          <animate
            attributeName="strokeDasharray"
            values="0,140;140,0"
            dur="2s"
            repeatCount="indefinite"
          />
        </path>

        {/* Nodes */}
        <circle cx="15" cy="25" r="5" {...(decorative ? { filter: 'url(#iconGlow)' } : {})}>
          <animate attributeName="r" values="5;7;5" dur="1.5s" repeatCount="indefinite" />
        </circle>

        <circle cx="40" cy="10" r="5" {...(decorative ? { filter: 'url(#iconGlow)' } : {})}>
          <animate attributeName="r" values="5;7;5" dur="1.8s" repeatCount="indefinite" />
        </circle>

        <circle cx="65" cy="25" r="5" {...(decorative ? { filter: 'url(#iconGlow)' } : {})}>
          <animate attributeName="r" values="5;7;5" dur="1.5s" repeatCount="indefinite" />
        </circle>

        <circle cx="40" cy="40" r="5" {...(decorative ? { filter: 'url(#iconGlow)' } : {})}>
          <animate attributeName="r" values="5;7;5" dur="1.8s" repeatCount="indefinite" />
        </circle>

        {/* Center pulse */}
        <circle cx="40" cy="25" r="3" fill="#F8FAFC">
          <animate attributeName="r" values="3;8;3" dur="1.6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.9;0.2;0.9" dur="1.6s" repeatCount="indefinite" />
        </circle>
      </g>
    </svg>
  );
}
