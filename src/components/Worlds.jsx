import { useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from 'motion/react'
import { worlds } from '../content.js'

export default function Worlds() {
  const ref = useRef(null)
  const pinRef = useRef(null)
  const reduceMotion = useReducedMotion()
  const [active, setActive] = useState(0)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    if (!reduceMotion) setActive(Math.min(worlds.length - 1, Math.floor(v * worlds.length)))
  })
  const selectWorld = (index) => {
    if (reduceMotion) {
      setActive(index)
      return
    }
    const sectionTop = ref.current.getBoundingClientRect().top + window.scrollY
    const scrollDistance = ref.current.offsetHeight - pinRef.current.offsetHeight
    const step = (index + 0.5) / worlds.length
    const target = sectionTop + scrollDistance * step
    if (window.__lenis) window.__lenis.scrollTo(target, { duration: 0.55 })
    else window.scrollTo(0, target)
  }
  const w = worlds[active]
  return (
    <section className="worlds" ref={ref} aria-labelledby="worlds-heading">
      <div className="worlds-pin" ref={pinRef}>
        <div className="worlds-copy">
          <h2 className="eyebrow" id="worlds-heading">Four worlds</h2>
          <ul className="worlds-list">
            {worlds.map((x, i) => (
              <li key={x.key} className={i === active ? 'on' : ''}>
                <button type="button" aria-current={i === active ? 'step' : undefined} onClick={() => selectWorld(i)}>
                  {x.title}
                </button>
              </li>
            ))}
          </ul>
          <div className="worlds-caption">
            <AnimatePresence initial={false} mode="wait">
              <motion.p
                key={w.key}
                className="worlds-line"
                initial={{ opacity: 0, y: reduceMotion ? 0 : 9 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: reduceMotion ? 0 : -6 }}
                transition={{ duration: reduceMotion ? 0 : 0.16 }}
              >
                {w.line}
              </motion.p>
            </AnimatePresence>
          </div>
          <div className="worlds-progress" aria-hidden>
            <motion.span style={{ scaleX: scrollYProgress }} />
          </div>
        </div>
        <div className="worlds-frame">
          <AnimatePresence initial={false}>
            <motion.div
              key={w.key}
              className="worlds-img"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.32, ease: [0.22, 1, 0.36, 1] }}
            >
              {w.image ? <img src={w.image} alt={w.imageAlt} width="540" height="960" /> : (
                <div className="world-placeholder"><span>Coming soon</span></div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
