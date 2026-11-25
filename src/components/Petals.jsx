import { Petal } from './Flowers.jsx'

// A few petals drifting down the page, behind the cursor and above the sections.
const PETALS = Array.from({ length: 11 }, (_, i) => ({
  left: (i * 9.3 + 4) % 100,
  dur: 16 + (i % 5) * 4,
  delay: -(i * 3.1),
  size: 12 + (i % 4) * 5,
  color: ['#b3122a', '#d4334a', '#8f1022', '#e8a3a8'][i % 4],
}))

export default function Petals() {
  return (
    <div className="petals" aria-hidden>
      {PETALS.map((p, i) => (
        <span
          key={i}
          className="petal"
          style={{ left: `${p.left}%`, animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s`, width: p.size, height: p.size * 1.25 }}
        >
          <Petal color={p.color} />
        </span>
      ))}
    </div>
  )
}
