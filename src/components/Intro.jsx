import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { intro } from '../content.js'
import { Bloom } from './Flowers.jsx'

function Word({ children, progress, range }) {
  const opacity = useTransform(progress, range, [0.14, 1])
  const y = useTransform(progress, range, [8, 0])
  return (
    <motion.span className="word" style={{ opacity, y }}>
      {children}{' '}
    </motion.span>
  )
}

// embossed tone-on-tone flowers, like velvet relief
const EMBOSS = [
  { x: -6, y: 6, s: 300, r: 10 }, { x: 78, y: -4, s: 240, r: -20 }, { x: 64, y: 62, s: 360, r: 30 },
  { x: 6, y: 70, s: 200, r: 0 }, { x: 40, y: 30, s: 140, r: 45 },
]

export default function Intro() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.75', 'end 0.55'] })
  const words = intro.split(' ')
  return (
    <section className="intro" id="about" ref={ref}>
      <div className="emboss" aria-hidden>
        {EMBOSS.map((b, i) => (
          <Bloom
            key={i}
            size={b.s}
            petals={i % 2 ? 5 : 6}
            color="#55101a"
            light="#6d1722"
            center="#430b13"
            className="emboss-bloom"
            style={{ left: `${b.x}%`, top: `${b.y}%`, transform: `rotate(${b.r}deg)` }}
          />
        ))}
      </div>
      <p className="eyebrow">About</p>
      <p className="intro-text">
        {words.map((w, i) => {
          const start = i / words.length
          return (
            <Word key={i} progress={scrollYProgress} range={[start, Math.min(start + 1.5 / words.length, 1)]}>
              {w}
            </Word>
          )
        })}
      </p>
    </section>
  )
}
