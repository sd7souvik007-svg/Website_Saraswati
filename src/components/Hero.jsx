import { useCallback, useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import HeroCanvas from './HeroCanvas.jsx'
import BloomTrail from './BloomTrail.jsx'
import { person } from '../content.js'

const rise = (d) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 1, delay: d, ease: [0.22, 1, 0.36, 1] },
})

export default function Hero() {
  const [ready, setReady] = useState(false)
  const heroRef = useRef(null)
  const onReady = useCallback(() => setReady(true), [])
  const onBackground = useCallback((c) => {
    document.documentElement.style.setProperty('--hero-red', c)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', c)
  }, [])
  // as the next section slides over, the hero dims toward burgundy (no movement, no tilt)
  const { scrollY } = useScroll()
  const dim = useTransform(scrollY, (v) => Math.min(v / window.innerHeight, 1) * 0.55)

  return (
    <section className="hero" id="top" ref={heroRef}>
      <HeroCanvas onReady={onReady} onBackground={onBackground} />
      <BloomTrail hostRef={heroRef} />
      <motion.div className="hero-dim" style={{ opacity: dim }} aria-hidden />
      <div className={`hero-copy ${ready ? 'is-ready' : ''}`}>
        <motion.p className="hero-hi" {...rise(0.2)}>
          Hi, I'm
        </motion.p>
        <motion.h1 className="hero-name" {...rise(0.35)}>
          {person.name}
        </motion.h1>
        <motion.p className="hero-line" {...rise(0.55)}>
          {person.heroLine}
        </motion.p>
        <motion.div className="hero-buttons" {...rise(0.7)}>
          <a className="btn btn-solid" href="#portfolio">
            Portfolio
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
              <path d="M3 8h9M8.5 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
            </svg>
          </a>
          <a className="btn btn-glass" href="#contact">
            Let's Talk
          </a>
        </motion.div>
      </div>
    </section>
  )
}
