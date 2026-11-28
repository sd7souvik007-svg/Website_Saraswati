import { useEffect, useRef, useState } from 'react'

const colors = ['#f7c1ba', '#deb088', '#f4d6cb', '#c88880']
const random = (min, max) => min + Math.random() * (max - min)

export default function Petals() {
  const layer = useRef(null)
  const [petals] = useState(() => Array.from({ length: 9 }, (_, index) => ({
    left: `${(index + random(0.14, 0.86)) * 100 / 9}%`,
    width: `${random(7, 15)}px`,
    color: colors[index % colors.length],
    '--petal-duration': `${random(10, 18)}s`,
    '--petal-delay': `${-random(0, 14)}s`,
    '--petal-drift': `${random(-50, 50)}px`,
    '--petal-turn': `${random(-215, 215)}deg`,
  })))

  useEffect(() => {
    const element = layer.current
    const observer = new IntersectionObserver(([entry]) => {
      element.classList.toggle('is-in-view', entry.isIntersecting)
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="petals" ref={layer} aria-hidden="true">
      {petals.map((style, index) => (
        <span className="petal-flight" key={index} style={style}>
          <svg viewBox="0 0 40 50">
            <path d="M20 48C2 34 2 10 20 2C38 10 38 34 20 48Z" fill="currentColor" />
            <path d="M20 46C16 30 16 16 20 4" stroke="#0002" strokeWidth="1.2" fill="none" />
          </svg>
        </span>
      ))}
    </div>
  )
}
