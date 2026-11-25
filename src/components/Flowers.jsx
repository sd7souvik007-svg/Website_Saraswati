// Hand-built floral pieces, used until the ChatGPT floral textures arrive.

export function Bloom({ size = 120, petals = 6, color = '#7a1626', light = '#a83244', center = '#3d070d', className, style }) {
  const id = `g${petals}${color.slice(1)}${light.slice(1)}`
  return (
    <svg className={className} style={style} width={size} height={size} viewBox="-50 -50 100 100" aria-hidden>
      <defs>
        <radialGradient id={id} cx="50%" cy="15%" r="90%">
          <stop offset="0%" stopColor={light} />
          <stop offset="70%" stopColor={color} />
        </radialGradient>
      </defs>
      {Array.from({ length: petals }, (_, i) => (
        <path
          key={i}
          d="M0 0 C -15 -12 -17 -36 0 -46 C 17 -36 15 -12 0 0 Z"
          fill={`url(#${id})`}
          stroke={center}
          strokeOpacity="0.25"
          strokeWidth="0.8"
          transform={`rotate(${(360 / petals) * i})`}
        />
      ))}
      <circle r="7" fill={center} />
      {Array.from({ length: 10 }, (_, i) => (
        <circle key={i} r="1.4" fill="#c9a063" cx={Math.cos(i * 0.63) * 9} cy={Math.sin(i * 0.63) * 9} />
      ))}
    </svg>
  )
}

export function Leaf({ size = 60, color = '#6b6a3c', className, style }) {
  return (
    <svg className={className} style={style} width={size} height={size * 0.5} viewBox="0 0 100 50" aria-hidden>
      <path d="M2 25 C 30 -2 70 -2 98 25 C 70 52 30 52 2 25 Z" fill={color} />
      <path d="M2 25 L 98 25" stroke="#00000033" strokeWidth="1.5" />
    </svg>
  )
}

// A falling petal shape for the drifting layer.
export function Petal({ color = '#b3122a', style, className }) {
  return (
    <svg className={className} style={style} viewBox="0 0 40 50" aria-hidden>
      <path d="M20 48 C 2 34 2 10 20 2 C 38 10 38 34 20 48 Z" fill={color} />
      <path d="M20 46 C 16 30 16 16 20 4" stroke="#00000022" strokeWidth="1.2" fill="none" />
    </svg>
  )
}

// Hanging blossom strands for the contact section.
export function HangingBlossoms() {
  const strands = [
    { x: 4, len: 46, n: 7 }, { x: 12, len: 62, n: 9 }, { x: 21, len: 38, n: 6 }, { x: 30, len: 70, n: 10 },
    { x: 41, len: 50, n: 7 }, { x: 52, len: 34, n: 5 }, { x: 63, len: 58, n: 8 }, { x: 74, len: 44, n: 6 },
    { x: 84, len: 66, n: 9 }, { x: 94, len: 40, n: 6 },
  ]
  return (
    <div className="hanging" aria-hidden>
      {strands.map((s, i) => (
        <div key={i} className="strand" style={{ left: `${s.x}%`, height: `${s.len}%`, animationDelay: `${-i * 0.7}s` }}>
          <span className="stem" />
          {Array.from({ length: s.n }, (_, j) => (
            <Bloom
              key={j}
              size={18 + ((i * 7 + j * 5) % 16)}
              petals={5}
              color={j % 3 ? '#9c1027' : '#7a0f20'}
              light={j % 2 ? '#d4334a' : '#c21f37'}
              center="#4a0810"
              className="strand-bloom"
              style={{ top: `${(j / s.n) * 96}%`, left: `${((i + j) % 3) * 10 - 10}px` }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
