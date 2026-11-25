import { useEffect, useRef } from 'react'

/*
  Cursor-tracking character. Pre-extracted stills only (no video seeking, no 3D transforms).

  Her gaze is a smoothed 2D vector from her face toward the pointer, not just an angle. When the
  pointer crosses straight over her face the vector glides through zero, so she passes through
  looking at you instead of spinning round. Each still carries the real screen angle she looks at
  (about 1.5 degrees apart); neighbouring stills swap directly, and only bigger jumps (to and from
  the straight-on look, or the one gap left by a blink) get a very short dissolve.
*/

const LOOK_IN = 0.085 // gaze strength below which she looks straight at you
const LOOK_OUT = 0.11
const REACH = 0.42 // pointer distance (fraction of the shorter side) that counts as full gaze
const SMOOTH = 0.12 // per 60 fps frame: lower = silkier, higher = snappier
const DISSOLVE_MS = 140
const BIG_JUMP = 12 // degrees
const IDLE_MS = 3500 // no pointer movement for this long: she looks at you, blinks and smiles
const TILT_RANGE = 18 // degrees of phone tilt that count as a full turn
const TILT_RECENTER = 0.004 // per sensor reading: slowly treats the way you hold the phone as centre
const TILT_MOVE = 2.5 // degrees of change that count as "the phone is moving"

const wrap = (a) => ((((a + 180) % 360) + 360) % 360) - 180

function loadSet(kind) {
  const base = `/hero/${kind}/`
  return fetch(base + 'manifest.json')
    .then((r) => r.json())
    .then((m) => {
      const load = (file) => {
        const img = new Image()
        img.decoding = 'async'
        img.src = base + file
        return img.decode().then(() => img).catch(() => img)
      }
      const center = load(m.center)
      const frames = center.then(() => Promise.all(m.frames.map((f) => load(f.file))))
      // optional idle clip (blink and smile): a full base still plus small face patches
      const idle = frames
        .then(() => fetch(base + 'idle/manifest.json'))
        .then((r) => (r.ok ? r.json() : null))
        .then((im) => {
          if (!im) return null
          const li = (f) => load('idle/' + f)
          return Promise.all([li(im.base), Promise.all(im.frames.map(li))]).then(([b, p]) => ({ ...im, baseImg: b, patches: p }))
        })
        .catch(() => null)
      return { m, center, frames, idle }
    })
}

export default function HeroCanvas({ onReady, onBackground }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d', { alpha: false })
    const phoneQuery = window.matchMedia('(max-aspect-ratio: 1/1)')
    let set = null
    let kind = null
    let raf = 0
    let disposed = false

    const pointer = { x: 0, y: 0, active: false, last: 0 }
    // phone tilt: on = sensor is giving readings; x/y = gaze target (-1..1); last = last real move
    const tilt = { on: false, x: 0, y: 0, b0: null, g0: null, bAct: 0, gAct: 0, last: 0 }
    const gaze = { x: 0, y: 0, looking: false }
    // what is on screen: current still, plus the one it is dissolving from
    const shown = { img: null, angle: null, from: null, t0: 0, drawnAlpha: -1 }

    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(canvas.clientWidth * dpr)
      canvas.height = Math.round(canvas.clientHeight * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.imageSmoothingQuality = 'high'
      shown.drawnAlpha = -1
    }

    // whole still visible, body on the bottom edge, flat red fills the rest
    const layout = () => {
      const vw = canvas.clientWidth
      const vh = canvas.clientHeight
      const { width: iw, height: ih } = set.m
      if (kind === 'phone') {
        const s = Math.max(vw / iw, (vh * 0.92) / ih)
        return { x: (vw - iw * s) / 2, y: vh - ih * s, w: iw * s, h: ih * s }
      }
      const s = Math.min(vw / iw, vh / ih) * 0.97
      const shift = vw / vh > 1.25 ? vw * 0.07 : 0
      return { x: (vw - iw * s) / 2 + shift, y: vh - ih * s, w: iw * s, h: ih * s }
    }

    // a "source" is either a still, or an idle frame { base, patch, idle } drawn as base + face patch
    const drawSrc = (src, r) => {
      if (src instanceof HTMLImageElement) return ctx.drawImage(src, r.x, r.y, r.w, r.h)
      ctx.drawImage(src.base, r.x, r.y, r.w, r.h)
      const s = r.w / set.m.width
      const p = src.idle.patch
      ctx.drawImage(src.patch, r.x + p.x * s, r.y + p.y * s, p.w * s, p.h * s)
    }

    const paint = (t) => {
      let alpha = 1
      if (shown.from) {
        alpha = Math.min((t - shown.t0) / DISSOLVE_MS, 1)
        if (alpha >= 1) shown.from = null
      }
      if (alpha === shown.drawnAlpha && !shown.from) return
      const r = layout()
      ctx.globalAlpha = 1
      ctx.fillStyle = set.m.background
      ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight)
      if (shown.from) drawSrc(shown.from, r)
      ctx.globalAlpha = shown.from ? alpha * alpha * (3 - 2 * alpha) : 1
      drawSrc(shown.img, r)
      ctx.globalAlpha = 1
      shown.drawnAlpha = alpha
    }

    // idle clip frame for time t, played forward then backward so it never jumps
    const idleFrames = []
    const idleSrc = (t) => {
      const id = set.idle
      const n = id.patches.length
      const step = Math.floor(((t - idleSince) / 1000) * id.fps) % (2 * n - 2)
      const i = step < n ? step : 2 * n - 2 - step
      if (!idleFrames[i]) idleFrames[i] = { base: id.baseImg, patch: id.patches[i], idle: id }
      return idleFrames[i]
    }
    let idleSince = 0

    const show = (img, angle, t) => {
      if (img === shown.img) return
      const jump =
        shown.img && (angle === null || shown.angle === null || Math.abs(wrap(angle - shown.angle)) > BIG_JUMP)
      shown.from = jump ? shown.img : null
      shown.t0 = t
      shown.img = img
      shown.angle = angle
      shown.drawnAlpha = -1
    }

    let lastT = performance.now()
    const tick = (t) => {
      raf = requestAnimationFrame(tick)
      const dt = Math.min((t - lastT) / 16.67, 4)
      lastT = t
      // the hero stays pinned behind the story; stop working once it is covered
      if (!set || window.scrollY > window.innerHeight * 1.2) return

      const r = layout()
      const fx = r.x + set.m.face.x * r.w
      const fy = r.y + set.m.face.y * r.h
      const unit = Math.min(canvas.clientWidth, canvas.clientHeight)

      // idle: nobody has moved for a while (or the mouse left the window, or a phone was never
      // touched). She looks back at you; if the idle clip exists she blinks and smiles.
      const touchedRecently = pointer.active && t - pointer.last < IDLE_MS
      const tiltedRecently = tilt.on && t - tilt.last < IDLE_MS
      const idle = !touchedRecently && !tiltedRecently
      let tx = fx
      let ty = fy
      if (touchedRecently && (!tiltedRecently || pointer.last > tilt.last)) {
        tx = pointer.x
        ty = pointer.y
      }

      // target gaze vector, screen up = +y, strength capped at 1
      let gx = (tx - fx) / (unit * REACH)
      let gy = (fy - ty) / (unit * REACH)
      if (tiltedRecently && !(touchedRecently && pointer.last > tilt.last)) {
        gx = tilt.x
        gy = tilt.y
      }
      const len = Math.hypot(gx, gy)
      if (len > 1) {
        gx /= len
        gy /= len
      }
      const k = 1 - Math.pow(1 - SMOOTH, dt)
      gaze.x += (gx - gaze.x) * k
      gaze.y += (gy - gaze.y) * k

      const strength = Math.hypot(gaze.x, gaze.y)
      if (gaze.looking && strength < LOOK_IN) gaze.looking = false
      else if (!gaze.looking && strength > LOOK_OUT) gaze.looking = true

      if (!gaze.looking || !set.imgs.length) {
        if (idle && set.idle) {
          if (!idleSince) idleSince = t
          show(idleSrc(t), null, t)
          // idle frames are tiny changes: swap without a dissolve
          if (shown.from && !(shown.from instanceof HTMLImageElement)) shown.from = null
        } else {
          idleSince = 0
          show(set.centerImg, null, t)
        }
      } else {
        idleSince = 0
        const angle = (Math.atan2(gaze.y, gaze.x) * 180) / Math.PI
        const i = set.lookup[(Math.round(angle * 4) + 720 + 1440) % 1440]
        show(set.imgs[i], set.m.frames[i].angle, t)
      }
      paint(t)
    }

    const useSet = (next) => {
      if (next === kind) return
      kind = next
      loadSet(next).then(({ m, center, frames, idle }) => {
        idle.then((id) => {
          if (!disposed && kind === next && id && set) set.idle = id
        })
        center.then((centerImg) => {
          if (disposed || kind !== next) return
          onBackground && onBackground(m.background)
          // show her straight away while the rest load
          set = { m, centerImg, imgs: [], lookup: [] }
          size()
          shown.img = null
          show(centerImg, null, performance.now())
          paint(performance.now())
          frames.then((imgs) => {
            if (disposed || kind !== next) return
            // quarter-degree lookup of the nearest still
            const lookup = new Uint16Array(1440)
            for (let q = 0; q < 1440; q++) {
              const a = q / 4 - 180
              let best = 0
              let bd = 999
              for (let i = 0; i < m.frames.length; i++) {
                const d = Math.abs(wrap(m.frames[i].angle - a))
                if (d < bd) {
                  bd = d
                  best = i
                }
              }
              lookup[q] = best
            }
            set = { m, centerImg, imgs, lookup, idle: set && set.idle }
            onReady && onReady()
          })
        })
      })
    }

    const toLocal = (e) => {
      const rect = canvas.getBoundingClientRect()
      pointer.x = e.clientX - rect.left
      pointer.y = e.clientY - rect.top
      pointer.active = true
      pointer.last = performance.now()
    }
    const onLeave = () => {
      pointer.active = false
    }
    const onResize = () => {
      if (set) size()
    }
    const onQuery = () => useSet(phoneQuery.matches ? 'phone' : 'desktop')

    // phone tilt: gamma = left/right, beta = forward/back. Tilt right, she looks right;
    // tip the top away from you, she looks up. Centre drifts to however the phone is held.
    const clamp = (v) => Math.max(-1, Math.min(1, v))
    const onOrient = (e) => {
      if (e.beta == null || e.gamma == null) return
      if (tilt.b0 === null) {
        tilt.b0 = tilt.bAct = e.beta
        tilt.g0 = tilt.gAct = e.gamma
      }
      tilt.b0 += (e.beta - tilt.b0) * TILT_RECENTER
      tilt.g0 += (e.gamma - tilt.g0) * TILT_RECENTER
      tilt.x = clamp((e.gamma - tilt.g0) / TILT_RANGE)
      tilt.y = clamp((tilt.b0 - e.beta) / TILT_RANGE)
      tilt.on = true
      if (Math.abs(e.gamma - tilt.gAct) + Math.abs(e.beta - tilt.bAct) > TILT_MOVE) {
        tilt.gAct = e.gamma
        tilt.bAct = e.beta
        tilt.last = performance.now()
      }
    }
    const coarse = window.matchMedia('(pointer: coarse)').matches
    let listening = false
    const listenTilt = () => {
      if (listening) return
      listening = true
      window.addEventListener('deviceorientation', onOrient)
    }
    const DOE = window.DeviceOrientationEvent
    const needsPermission = DOE && typeof DOE.requestPermission === 'function'
    // iPhone: motion needs a yes from the visitor, which can only be asked on a tap
    const askTilt = () => {
      if (!needsPermission || listening) return
      DOE.requestPermission()
        .then((r) => r === 'granted' && listenTilt())
        .catch(() => {})
    }
    if (import.meta.env.DEV) window.__heroTilt = onOrient // local testing only, never in the live build
    if (coarse && DOE && !needsPermission) listenTilt()
    if (coarse && needsPermission) window.addEventListener('pointerdown', askTilt, { passive: true })

    window.addEventListener('pointermove', toLocal, { passive: true })
    window.addEventListener('pointerdown', toLocal, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    window.addEventListener('resize', onResize)
    phoneQuery.addEventListener('change', onQuery)
    onQuery()
    raf = requestAnimationFrame(tick)

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', toLocal)
      window.removeEventListener('pointerdown', toLocal)
      window.removeEventListener('pointerdown', askTilt)
      window.removeEventListener('deviceorientation', onOrient)
      document.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('resize', onResize)
      phoneQuery.removeEventListener('change', onQuery)
    }
  }, [onReady, onBackground])

  return <canvas ref={canvasRef} className="hero-canvas" aria-label="Saraswati, illustrated, looking toward your cursor" role="img" />
}
