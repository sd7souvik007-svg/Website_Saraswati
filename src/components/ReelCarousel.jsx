import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView, useMotionValue, useMotionValueEvent, useReducedMotion } from 'motion/react'
import { reels } from '../content.js'

/*
  The animated reel carousel: tall glossy cards on a slowly turning ring. Hover a card (or let it
  come to the front on a phone) and it lifts and plays muted; click opens it full screen with sound.
  Drag sideways to spin it.
*/

function Card({ reel, angle, radius, focused, onHover, onOpen }) {
  const video = useRef(null)
  useEffect(() => {
    const v = video.current
    if (!v) return
    if (focused) {
      if (!v.src) v.src = `/reels/${reel.id}.mp4`
      v.muted = true
      v.play().catch(() => {})
    } else {
      v.pause()
    }
  }, [focused, reel.id])
  return (
    <div
      className={`reel-card ${focused ? 'is-focused' : ''}`}
      style={{ transform: `rotateY(${angle}deg) translateZ(${radius}px)` }}
      onPointerEnter={(e) => e.pointerType === 'mouse' && onHover(reel.id)}
      onPointerLeave={(e) => e.pointerType === 'mouse' && onHover(null)}
      onClick={() => onOpen(reel)}
      data-hover
      role="button"
      tabIndex={0}
      aria-label={`Play ${reel.title}`}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onOpen(reel)}
    >
      <div className="reel-inner">
        <video ref={video} poster={`/reels/${reel.id}.jpg`} playsInline loop muted preload="none" />
        <div className="reel-gloss" />
        <div className="reel-meta">
          <span className="reel-tag">{reel.tag}</span>
          <span className="reel-title">{reel.title}</span>
        </div>
        <span className="reel-play" aria-hidden>
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path d="M5 3.5v11l9-5.5z" fill="currentColor" />
          </svg>
        </span>
      </div>
    </div>
  )
}

export default function ReelCarousel() {
  const n = reels.length
  const step = 360 / n
  const [hovered, setHovered] = useState(null)
  const [open, setOpen] = useState(null)
  const [dims, setDims] = useState({ w: 250, r: 380 })
  const [front, setFront] = useState(reels[0].id)
  const drag = useRef({ on: false, x: 0, start: 0, moved: 0 })
  const stageRef = useRef(null)
  const rotation = useMotionValue(0)
  const inView = useInView(stageRef)
  const reducedMotion = useReducedMotion()
  const coarse = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches

  useMotionValueEvent(rotation, 'change', (angle) => {
    if (!coarse) return
    const next = reels[((Math.round(-angle / step) % n) + n) % n].id
    if (next !== front) setFront(next)
  })

  useEffect(() => {
    const fit = () => {
      const w = Math.max(170, Math.min(260, window.innerWidth * 0.42))
      const r = Math.max((w / 2) / Math.tan(Math.PI / n) * 1.35, w * 1.25)
      setDims({ w, r })
    }
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [n])

  // Keep rotation on a motion value so the cards do not rerender every frame.
  useEffect(() => {
    if (!inView || reducedMotion || hovered || open) return
    let raf
    let last = performance.now()
    const loop = (t) => {
      const dt = Math.min((t - last) / 1000, 0.05)
      last = t
      if (!drag.current.on) rotation.set(rotation.get() - dt * 9)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [hovered, inView, open, reducedMotion, rotation])

  // the card facing the viewer (used on touch screens, where there is no hover)
  const focusedId = inView && !open ? hovered || (coarse && !reducedMotion ? front : null) : null

  const down = (e) => {
    drag.current = { on: true, x: e.clientX, start: rotation.get(), moved: 0 }
  }
  const move = (e) => {
    if (!drag.current.on) return
    const dx = e.clientX - drag.current.x
    drag.current.moved = Math.abs(dx)
    rotation.set(drag.current.start + dx * 0.25)
  }
  const up = () => {
    drag.current.on = false
  }
  const openReel = (r) => {
    if (drag.current.moved > 6) return
    setOpen(r)
  }

  return (
    <div className="carousel">
      <div
        className="ring-stage"
        ref={stageRef}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onPointerLeave={up}
        style={{ '--card-w': `${dims.w}px` }}
      >
        <motion.div className="ring" style={{ z: -dims.r, rotateY: rotation }}>
          {reels.map((r, i) => (
            <Card
              key={r.id}
              reel={r}
              angle={i * step}
              radius={dims.r}
              focused={focusedId === r.id}
              onHover={setHovered}
              onOpen={openReel}
            />
          ))}
        </motion.div>
        <div className={`ring-dim ${focusedId ? 'on' : ''}`} aria-hidden />
      </div>
      <p className="carousel-hint">{coarse ? 'Swipe to spin · tap to watch' : 'Hover to preview · click to watch with sound · drag to spin'}</p>

      <AnimatePresence>
        {open && (
          <motion.div
            className="lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(null)}
          >
            <motion.div
              className="lightbox-card"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 24, stiffness: 240 }}
              onClick={(e) => e.stopPropagation()}
            >
              <video src={`/reels/${open.id}.mp4`} poster={`/reels/${open.id}.jpg`} autoPlay controls playsInline />
              <button className="lightbox-close" onClick={() => setOpen(null)} aria-label="Close">
                ×
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
