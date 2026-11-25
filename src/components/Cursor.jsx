import { useEffect, useRef } from 'react'

// Glowing dot with a trailing ring that swells over anything clickable. Mouse only.
export default function Cursor() {
  const dot = useRef(null)
  const ring = useRef(null)

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return
    document.documentElement.classList.add('custom-cursor')
    const p = { x: innerWidth / 2, y: innerHeight / 2 }
    const r = { x: p.x, y: p.y, s: 1 }
    let hover = false
    let raf
    const move = (e) => {
      p.x = e.clientX
      p.y = e.clientY
      hover = !!e.target?.closest?.('a, button, [data-hover]')
    }
    const loop = () => {
      r.x += (p.x - r.x) * 0.16
      r.y += (p.y - r.y) * 0.16
      r.s += ((hover ? 1.9 : 1) - r.s) * 0.15
      if (dot.current) dot.current.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`
      if (ring.current)
        ring.current.style.transform = `translate3d(${r.x}px, ${r.y}px, 0) scale(${r.s})`
      raf = requestAnimationFrame(loop)
    }
    window.addEventListener('pointermove', move, { passive: true })
    raf = requestAnimationFrame(loop)
    return () => {
      document.documentElement.classList.remove('custom-cursor')
      window.removeEventListener('pointermove', move)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <>
      <div ref={ring} className="cursor-ring" aria-hidden />
      <div ref={dot} className="cursor-dot" aria-hidden />
    </>
  )
}
