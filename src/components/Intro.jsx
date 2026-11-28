import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { intro } from '../content.js'
import Petals from './Petals.jsx'

function Word({ children, progress, range }) {
  const opacity = useTransform(progress, range, [0.65, 1])
  const y = useTransform(progress, range, [5, 0])
  return (
    <motion.span className="word" style={{ opacity, y }}>
      {children}{' '}
    </motion.span>
  )
}

export default function Intro() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.9', 'start 0.52'] })
  const words = intro.split(' ')
  return (
    <section className="intro" id="about">
      <Petals />
      <div className="intro-content">
        <p className="eyebrow">About</p>
        <p className="intro-text" ref={ref}>
          {words.map((w, i) => {
            const start = i / words.length
            return (
              <Word key={i} progress={scrollYProgress} range={[start, Math.min(start + 1.5 / words.length, 1)]}>
                {w}
              </Word>
            )
          })}
        </p>
      </div>
    </section>
  )
}
