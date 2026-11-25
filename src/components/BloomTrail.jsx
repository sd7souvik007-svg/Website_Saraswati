import { useEffect, useRef } from 'react'

/*
  Flowers that bloom along the cursor in the hero: every few dozen pixels of movement a small
  blossom (or a leaf) opens, turns, drifts down and fades. Over the buttons they bloom a little
  bigger. Mouse only; on phones a tap leaves one blossom. Drawn as plain DOM nodes, capped.
*/

const PALETTE = [
  ['#f6eadb', '#ffffff', '#c9a063'], // cream
  ['#f3c9c6', '#ffe3e1', '#b3122a'], // blush
  ['#7a1626', '#b3203a', '#3d070d'], // wine
  ['#ffd7dd', '#ffffff', '#d4334a'], // pale pink
]
const MAX = 28
const SPACING = 46

function bloomSVG(size, [petal, light, center], petals) {
  const id = `bt${Math.random().toString(36).slice(2, 8)}`
  let paths = ''
  for (let i = 0; i < petals; i++)
    paths += `<path d="M0 0 C -15 -12 -17 -36 0 -46 C 17 -36 15 -12 0 0 Z" fill="url(#${id})" transform="rotate(${(360 / petals) * i})"/>`
  return `<svg width="${size}" height="${size}" viewBox="-50 -50 100 100"><defs><radialGradient id="${id}" cx="50%" cy="15%" r="90%"><stop offset="0%" stop-color="${light}"/><stop offset="75%" stop-color="${petal}"/></radialGradient></defs>${paths}<circle r="8" fill="${center}"/></svg>`
}
const leafSVG = (size) =>
  `<svg width="${size}" height="${size / 2}" viewBox="0 0 100 50"><path d="M2 25 C 30 -2 70 -2 98 25 C 70 52 30 52 2 25 Z" fill="#6b7a3a"/><path d="M2 25 L98 25" stroke="#00000033" stroke-width="2"/></svg>`

export default function BloomTrail({ hostRef }) {
  const layer = useRef(null)

  useEffect(() => {
    const host = hostRef.current
    const el = layer.current
    if (!host || !el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let last = null
    let count = 0

    const spawn = (x, y, big) => {
      if (count >= MAX) return
      count++
      const node = document.createElement('span')
      const leaf = !big && Math.random() < 0.22
      const size = (big ? 36 : 20) + Math.random() * (big ? 18 : 20)
      node.className = 'trail-bloom'
      node.innerHTML = leaf ? leafSVG(size * 1.3) : bloomSVG(size, PALETTE[(Math.random() * PALETTE.length) | 0], Math.random() < 0.5 ? 5 : 6)
      node.style.left = `${x}px`
      node.style.top = `${y}px`
      node.style.setProperty('--rot', `${(Math.random() * 120 - 60) | 0}deg`)
      node.style.setProperty('--drift', `${(Math.random() * 40 - 20) | 0}px`)
      node.style.setProperty('--fall', `${40 + Math.random() * 50}px`)
      node.style.animationDuration = `${1.5 + Math.random() * 0.9}s`
      el.appendChild(node)
      node.addEventListener('animationend', () => {
        node.remove()
        count--
      })
    }

    const move = (e) => {
      if (e.pointerType !== 'mouse') return
      const r = host.getBoundingClientRect()
      const x = e.clientX - r.left
      const y = e.clientY - r.top
      if (!last) {
        last = { x, y }
        return
      }
      const d = Math.hypot(x - last.x, y - last.y)
      if (d < SPACING) return
      last = { x, y }
      const overButton = !!e.target?.closest?.('.btn')
      spawn(x + (Math.random() * 14 - 7), y + (Math.random() * 14 - 7), overButton)
    }
    const tap = (e) => {
      if (e.pointerType === 'mouse') return
      const r = host.getBoundingClientRect()
      spawn(e.clientX - r.left, e.clientY - r.top, true)
    }
    const leave = () => {
      last = null
    }
    host.addEventListener('pointermove', move, { passive: true })
    host.addEventListener('pointerdown', tap, { passive: true })
    host.addEventListener('pointerleave', leave)
    return () => {
      host.removeEventListener('pointermove', move)
      host.removeEventListener('pointerdown', tap)
      host.removeEventListener('pointerleave', leave)
    }
  }, [hostRef])

  return <div ref={layer} className="trail-layer" aria-hidden />
}
