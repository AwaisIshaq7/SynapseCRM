/**
 * AnimatedAuthBackground Component
 * Renders animated particles with subtle connections and gradient shifts
 * Creates a professional tech/neural network vibe for auth pages
 */

export default function AnimatedAuthBackground() {
  // Generate random particles - increased size for more visibility
  const particles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 5 + 2.5,
    duration: Math.random() * 20 + 25,
    delay: Math.random() * 5,
  }))

  return (
    <>
      {/* Animated gradient background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(219,234,254,0.7), rgba(216,180,254,0.6), rgba(186,230,253,0.5))',
          animation: 'gradientShift 8s ease-in-out infinite',
        }}
        aria-hidden="true"
      />

      {/* Particle system SVG */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <filter id="particleGlow">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Particles */}
        {particles.map((particle) => (
          <g key={particle.id}>
            <circle
              cx={`${particle.x}%`}
              cy={`${particle.y}%`}
              r={particle.size}
              fill="url(#particleGradient)"
              opacity="0.85"
              filter="url(#particleGlow)"
              style={{
                animation: `floatParticle ${particle.duration}s ease-in-out infinite`,
                animationDelay: `${particle.delay}s`,
              }}
            />
          </g>
        ))}

        {/* Connection lines between nearby particles */}
        {particles.map((p1, i) =>
          particles.slice(i + 1).map((p2, j) => {
            const distance = Math.sqrt(
              Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)
            )
            if (distance < 25) {
              return (
                <line
                  key={`line-${i}-${j}`}
                  x1={`${p1.x}%`}
                  y1={`${p1.y}%`}
                  x2={`${p2.x}%`}
                  y2={`${p2.y}%`}
                  stroke="url(#lineGradient)"
                  strokeWidth="1"
                  opacity="0.5"
                  style={{
                    animation: `pulseConnection 4s ease-in-out infinite`,
                  }}
                />
              )
            }
            return null
          })
        )}

        {/* Gradient definitions */}
        <defs>
          <linearGradient id="particleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="50%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#d946ef" />
          </linearGradient>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" opacity="0.8" />
            <stop offset="100%" stopColor="#06b6d4" opacity="0.6" />
          </linearGradient>
        </defs>
      </svg>
    </>
  )
}
