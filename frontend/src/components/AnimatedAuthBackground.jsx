/**
 * AnimatedAuthBackground Component
 * Renders animated particles with subtle connections and gradient shifts
 * Creates a professional tech/neural network vibe for auth pages
 */

const PARTICLE_SEED = [
  { x: 12, y: 22, size: 3.5, duration: 27, delay: 0.4 },
  { x: 18, y: 68, size: 4.1, duration: 31, delay: 1.2 },
  { x: 26, y: 38, size: 2.9, duration: 29, delay: 0.7 },
  { x: 34, y: 81, size: 5.0, duration: 33, delay: 2.1 },
  { x: 41, y: 18, size: 3.0, duration: 26, delay: 1.8 },
  { x: 48, y: 55, size: 4.6, duration: 34, delay: 0.9 },
  { x: 55, y: 29, size: 3.3, duration: 30, delay: 2.6 },
  { x: 62, y: 74, size: 4.8, duration: 28, delay: 1.5 },
  { x: 69, y: 41, size: 2.7, duration: 35, delay: 0.2 },
  { x: 74, y: 86, size: 4.2, duration: 32, delay: 2.8 },
  { x: 80, y: 24, size: 3.8, duration: 29, delay: 1.1 },
  { x: 86, y: 60, size: 4.4, duration: 36, delay: 2.0 },
  { x: 90, y: 35, size: 3.1, duration: 28, delay: 0.6 },
  { x: 94, y: 77, size: 4.9, duration: 30, delay: 1.9 },
  { x: 96, y: 14, size: 2.8, duration: 34, delay: 2.3 },
]

export default function AnimatedAuthBackground() {
  const particles = PARTICLE_SEED.map((particle, index) => ({
    id: index,
    ...particle,
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
