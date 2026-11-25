import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react'
import { worlds } from '../content.js'
import { Bloom, Leaf } from './Flowers.jsx'

// Pinned section: one world per scroll step, image crossfades while the list highlights.
function useScene(w) {
  // use the ChatGPT scene when it exists, else the stand-in
  const [ok, setOk] = useState(false)
  useEffect(() => {
    if (!w.scene) return
    let live = true
    const img = new Image()
    img.onload = () => live && setOk(true)
    img.src = w.scene
    return () => {
      live = false
    }
  }, [w.scene])
  return ok ? w.scene : w.image
}

function Visual({ w }) {
  const src = useScene(w)
  if (!src)
    return (
      <div className="world-placeholder">
        <Bloom size={220} color="#b3122a" light="#e0485c" center="#5a0f17" />
        <Leaf size={120} style={{ position: 'absolute', left: '18%', bottom: '24%', transform: 'rotate(-30deg)' }} />
        <Leaf size={100} style={{ position: 'absolute', right: '16%', top: '26%', transform: 'rotate(140deg)' }} />
        <span>Coming soon</span>
      </div>
    )
  return <img src={src} alt={`${w.title}: Saraswati`} loading="lazy" />
}

export default function Worlds() {
  const ref = useRef(null)
  const [active, setActive] = useState(0)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    setActive(Math.min(worlds.length - 1, Math.floor(v * worlds.length)))
  })
  const w = worlds[active]
  return (
    <section className="worlds" ref={ref} style={{ height: `${worlds.length * 90 + 30}vh` }}>
      <div className="worlds-pin">
        <div className="worlds-copy">
          <p className="eyebrow">Four worlds</p>
          <ul className="worlds-list">
            {worlds.map((x, i) => (
              <li key={x.key} className={i === active ? 'on' : ''}>
                <span className="num">0{i + 1}</span>
                {x.title}
              </li>
            ))}
          </ul>
          <AnimatePresence mode="wait">
            <motion.p
              key={w.key}
              className="worlds-line"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.45 }}
            >
              {w.line}
            </motion.p>
          </AnimatePresence>
        </div>
        <div className="worlds-frame">
          <AnimatePresence>
            <motion.div
              key={w.key}
              className="worlds-img"
              initial={{ opacity: 0, scale: 1.06 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <Visual w={w} />
            </motion.div>
          </AnimatePresence>
          <Bloom size={110} className="frame-bloom tl" color="#b3122a" light="#e0485c" center="#5a0f17" />
          <Bloom size={80} className="frame-bloom br" petals={5} color="#9c1027" light="#d4334a" center="#4a0810" />
        </div>
      </div>
    </section>
  )
}
