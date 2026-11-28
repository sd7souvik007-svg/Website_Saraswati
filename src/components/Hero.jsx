import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import HeroCanvas from './HeroCanvas.jsx'
import BloomTrail from './BloomTrail.jsx'
import MusicMode from './MusicMode.jsx'
import { person } from '../content.js'

const rise = (d) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 1, delay: d, ease: [0.22, 1, 0.36, 1] },
})

export default function Hero() {
  const [ready, setReady] = useState(false)
  const simulateTilt = import.meta.env.DEV && typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).has('phonePreview') &&
    !window.matchMedia('(pointer: coarse)').matches
  // phones: a small hint that tilting moves her (iPhone needs a tap first to allow motion)
  const tiltHint = (() => {
    if (typeof window === 'undefined' || !window.matchMedia('(pointer: coarse)').matches) return null
    const DOE = window.DeviceOrientationEvent
    if (!DOE) return null
    return typeof DOE.requestPermission === 'function' ? 'Tap, then tilt your phone' : 'Tilt your phone'
  })()
  // the "Stop tilt" button: on Android tilt starts by itself, on iPhone after the first tap
  const [tiltOn, setTiltOn] = useState(() => !!tiltHint && tiltHint === 'Tilt your phone')
  useEffect(() => {
    const onState = (e) => e.detail && setTiltOn(!!e.detail.on)
    window.addEventListener('hero-tilt-state', onState)
    return () => window.removeEventListener('hero-tilt-state', onState)
  }, [])
  const toggleTilt = () => window.dispatchEvent(new CustomEvent('hero-tilt-set', { detail: { on: !tiltOn } }))
  const heroRef = useRef(null)
  const onReady = useCallback(() => setReady(true), [])
  const onBackground = useCallback((c) => {
    document.documentElement.style.setProperty('--hero-red', c)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', c)
  }, [])
  // The pinned portrait dims as the next section covers it.
  const { scrollY } = useScroll()
  const dim = useTransform(scrollY, (v) => Math.min(v / window.innerHeight, 1) * 0.55)

  return (
    <section className="hero" id="top" ref={heroRef}>
      <HeroCanvas onReady={onReady} onBackground={onBackground} simulateTilt={simulateTilt} />
      <MusicMode />
      <BloomTrail hostRef={heroRef} />
      <motion.div className="hero-dim" style={{ opacity: dim }} aria-hidden />
      {ready && (simulateTilt ? tiltOn : tiltHint && !tiltOn) && (
        <p className="tilt-hint" aria-hidden>
          <span>✦</span> {simulateTilt ? 'Move your pointer to simulate tilt' : tiltHint}
        </p>
      )}
      {(simulateTilt || tiltHint) && ready && (
        <button className="tilt-btn" type="button" onClick={toggleTilt} aria-pressed={tiltOn}>
          {tiltOn ? 'Stop tilt' : 'Start tilt'}
        </button>
      )}
      <div className={`hero-copy ${ready ? 'is-ready' : ''}`}>
        <motion.p className="hero-hi" {...rise(0.2)}>
          {person.greeting}
        </motion.p>
        <motion.h1 className="hero-name" {...rise(0.35)}>
          {person.name}
        </motion.h1>
        <motion.p className="hero-line" {...rise(0.55)}>
          {person.heroLine}
        </motion.p>
        <motion.div className="hero-buttons" {...rise(0.7)}>
          <a className="btn btn-solid" href="#portfolio">
            Watch my reels
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
              <path d="M3 8h9M8.5 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
            </svg>
          </a>
          <a className="btn btn-glass" href="#collaborate">
            Work with me
          </a>
        </motion.div>
      </div>
    </section>
  )
}
