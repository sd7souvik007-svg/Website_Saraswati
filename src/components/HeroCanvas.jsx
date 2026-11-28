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
// phone "orbit" mode (ring set on a touch device): she is always travelling round the ring
const ORBIT_SLOW = 22 // degrees per second while nobody steers her, clockwise like the clip
const ORBIT_FAST = 320 // top speed when steering her to where the phone is tilted
const ORBIT_FAST_MOUSE = 420 // top speed when a mouse steers her
const ORBIT_DEAD = 0.16 // gaze strength below which nobody is steering
const RING_DWELL = 700 // ms the cursor must rest inside the ring before she plays the idle loop
const RING_IN = 0.3 // gaze strength below which she plays the smile loop (inside the ring)
const RING_OUT = 0.38 // gaze strength above which her head follows round the ring
const DISSOLVE_MS = 140
const BIG_JUMP = 12 // degrees
const IDLE_MS = 3500 // no pointer movement for this long: she looks at you, blinks and smiles
const TILT_RANGE = 18 // degrees of phone tilt that count as a full turn
const TILT_RECENTER = 0.0015 // per sensor reading: slowly treats the way you hold the phone as centre
const TILT_MOVE = 2.5 // degrees of change that count as "the phone is moving"

const wrap = (a) => ((((a + 180) % 360) + 360) % 360) - 180

const options = new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search)
const desktopPhoneIdle = !import.meta.env.DEV || options.get('idle') !== 'portrait'
const PHONE_RING_SCALE = 1.19
const PHONE_RING_Y_OFFSET = 41
const DESKTOP_RING_SCALE = 0.97
const GRID = 81

// nearest still on a direction x turn-amount map; -1 means "looking at you"
function buildMap(m) {
  const vx = m.frames.map((f) => f.mag * Math.cos((f.angle * Math.PI) / 180))
  const vy = m.frames.map((f) => f.mag * Math.sin((f.angle * Math.PI) / 180))
  const lut = new Int16Array(GRID * GRID)
  for (let j = 0; j < GRID; j++)
    for (let i = 0; i < GRID; i++) {
      const x = (i / (GRID - 1)) * 2 - 1
      const y = (j / (GRID - 1)) * 2 - 1
      let best = -1
      // inside a small circle around the centre she simply looks at you
      if (x * x + y * y > 0.1 * 0.1) {
        let bd = Infinity
        for (let k = 0; k < vx.length; k++) {
          const d = (vx[k] - x) ** 2 + (vy[k] - y) ** 2
          if (d < bd) {
            bd = d
            best = k
          }
        }
      }
      lut[j * GRID + i] = best
    }
  return { lut, vx, vy }
}

function loadSet(kind) {
  const base = `/hero-v2/${kind}/`
  const idleFolder = desktopPhoneIdle && kind === 'phone' ? 'idle-desktop/' : 'idle/'
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
      // The idle loop starts loading at once and she STARTS IN IT: it streams in frame by frame, in order, like a
      // video, and the first frames are enough to begin (no still picture first). The ring stills, which are only needed
      // once somebody steers her, load after the idle.
      let idleDone = Promise.resolve()
      const idle = fetch(base + idleFolder + 'manifest.json')
        .then((r) => (r.ok && (r.headers.get('content-type') || '').includes('json') ? r.json() : null))
        .then((im) => {
          if (!im) return null
          const li = (f) => load(idleFolder + f)
          if (!im.full) return Promise.all([li(im.base), Promise.all(im.frames.map(li))]).then(([b, p]) => ({ ...im, baseImg: b, patches: p }))
          const n = im.frames.length
          const id = { ...im, imgs: new Array(n).fill(null), loaded: 0, total: n }
          let next = 0
          let running = 0
          idleDone = new Promise((resolve) => {
            const pump = () => {
              while (running < 4 && next < n) {
                const i = next++
                running++
                li(im.frames[i]).then((img) => {
                  id.imgs[i] = img
                  running--
                  while (id.loaded < n && id.imgs[id.loaded]) id.loaded++ // frames ready from the start, in order
                  if (id.loaded >= n) resolve()
                  else pump()
                })
              }
            }
            pump()
          })
          // ready to start as soon as the first few frames are here
          return new Promise((res) => {
            const check = () => (id.loaded >= Math.min(8, n) ? res(id) : setTimeout(check, 25))
            check()
          })
        })
        .catch(() => null)
      const frames = idle.then(() => idleDone).then(async () => {
        // Bound simultaneous decodes on phones once the idle loop is primed.
        const images = new Array(m.frames.length)
        let next = 0
        await Promise.all(Array.from({ length: 6 }, async () => {
          while (next < m.frames.length) {
            const index = next++
            images[index] = await load(m.frames[index].file)
          }
        }))
        return images
      })
      return { m, center, frames, idle }
    })
}

export default function HeroCanvas({ onReady, onBackground, simulateTilt }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d', { alpha: false })
    const phoneQuery = window.matchMedia('(max-aspect-ratio: 1/1)')
    const coarse = window.matchMedia('(pointer: coarse)').matches
    const tiltMode = coarse || simulateTilt
    let set = null
    let kind = null
    let phoneB = false
    let raf = 0
    let disposed = false
    let bounds

    const pointer = { x: 0, y: 0, active: false, last: 0 }
    // phone tilt: on = sensor is giving readings; x/y = gaze target (-1..1); last = last real move
    const tilt = { on: false, engaged: false, x: 0, y: 0, b0: null, g0: null, bAct: 0, gAct: 0, last: 0 }
    const gaze = { x: 0, y: 0, looking: false }
    const orbit = { angle: null, t: performance.now(), inside: true, insideSince: 0, fresh: true }
    if (import.meta.env.DEV)
      window.__heroDbg = () => ({
        kind, hasSet: !!set, waiting: set && set.waiting, idle: !!(set && set.idle), loaded: set && set.idle && set.idle.loaded,
        total: set && set.idle && set.idle.total, ring: set && set.ring, rings: set && set.imgs && set.imgs.length,
        pointerActive: pointer.active, tiltEngaged: tilt.engaged, idleSince,
      })
    if (import.meta.env.DEV) window.__orbit = orbit // local testing only, never in the live build
    // what is on screen: current still, plus the one it is dissolving from
    const shown = { img: null, angle: null, from: null, t0: 0, drawnAlpha: -1 }

    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.imageSmoothingQuality = 'high'
      bounds = { width, height, unit: Math.min(width, height), portrait: layout(width, height) }
      shown.drawnAlpha = -1
    }

    // whole still visible, body on the bottom edge, flat red fills the rest
    const layout = (vw, vh) => {
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
      const { portrait: r, width, height } = bounds
      ctx.globalAlpha = 1
      ctx.fillStyle = set.m.background
      ctx.fillRect(0, 0, width, height)
      if (shown.from) drawSrc(shown.from, r)
      ctx.globalAlpha = shown.from ? alpha * alpha * (3 - 2 * alpha) : 1
      if (phoneB && (shown.angle !== null || shown.img === set.centerImg)) {
        // Match face scale first, then shift the crop to align the sweater edge.
        const { x, y } = set.m.face
        drawSrc(shown.img, {
          x: r.x - r.w * x * (PHONE_RING_SCALE - 1),
          y: r.y + r.h * (PHONE_RING_Y_OFFSET / set.m.height - y * (PHONE_RING_SCALE - 1)),
          w: r.w * PHONE_RING_SCALE,
          h: r.h * PHONE_RING_SCALE,
        })
      } else if (kind === 'desktop' && shown.angle !== null) {
        // Scale about the bottom edge so the sweater stays level with idle.
        drawSrc(shown.img, {
          x: r.x + r.w * set.m.face.x * (1 - DESKTOP_RING_SCALE),
          y: r.y + r.h * (1 - DESKTOP_RING_SCALE),
          w: r.w * DESKTOP_RING_SCALE,
          h: r.h * DESKTOP_RING_SCALE,
        })
      } else drawSrc(shown.img, r)
      ctx.globalAlpha = 1
      shown.drawnAlpha = alpha
    }

    // idle clip frame for time t, played forward then backward so it never jumps
    const idleFrames = []
    const idleSrc = (t) => {
      const id = set.idle
      const list = id.imgs || id.patches
      const n = id.total || list.length
      const step = Math.floor(((t - idleSince) / 1000) * id.fps) % (2 * n - 2)
      let i = step < n ? step : 2 * n - 2 - step
      // still streaming in: like a video that is buffering, hold the last frame that has arrived
      if (id.loaded !== undefined && i > id.loaded - 1) i = Math.max(id.loaded - 1, 0)
      if (id.imgs) return id.imgs[i] // whole frames: plays like video, nothing is pasted over anything
      if (!idleFrames[i]) idleFrames[i] = { base: id.baseImg, patch: id.patches[i], idle: id }
      return idleFrames[i]
    }
    let idleSince = 0

    const show = (img, angle, t) => {
      if (img === shown.img) return
      // hard cuts only: a cross-fade between two different poses shows two half-faces at once,
      // which looks like her face is morphing
      shown.from = null
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
      if (!set || set.waiting || window.scrollY > window.innerHeight * 1.2) return

      const { portrait: r, unit } = bounds
      const fx = r.x + set.m.face.x * r.w
      const fy = r.y + set.m.face.y * r.h

      // idle: nobody has moved for a while (or the mouse left the window, or a phone was never
      // touched). She looks back at you; if the idle clip exists she blinks and smiles.
      const touchedRecently = pointer.active && t - pointer.last < IDLE_MS
      const tiltedRecently = tilt.on && (t - tilt.last < IDLE_MS || (phoneB && tilt.engaged))
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
      const k = 1 - Math.pow(1 - (phoneB ? 0.2 : SMOOTH), dt)
      gaze.x += (gx - gaze.x) * k
      gaze.y += (gy - gaze.y) * k

      const strength = Math.hypot(gaze.x, gaze.y)

      // phone orbit: no static pose and no jumps. She is always on the ring, creeping round it; when the
      // phone is tilted she travels along the circle to that direction through every pose in between
      // (so a left-to-right tilt sweeps her round the bottom or top, never cuts across her face)
      // The same on a computer with a mouse: the cursor steers her along the circle. Near her face (inside
      // the ring) or when nobody moves, she plays her subtle idle loop instead.
      if (set.orbit && set.imgs.length) {
        const ds = Math.min((t - orbit.t) / 1000, 0.1)
        orbit.t = t
        let useIdle
        if (tiltMode) {
          // phone: she starts in her idle loop and stays there until the phone is really tilted; once tilt has
          // engaged she never sits still. Stop tilt (or no sensor, or iPhone not yet allowed) brings the idle back
          // when nobody is touching her
          useIdle = !tilt.engaged && idle
        } else {
          // mouse: she only drops into the idle loop when the cursor RESTS near her face (or stops moving);
          // a cursor passing over her face keeps her travelling round the circle, like the gyro
          if (orbit.inside && strength > RING_OUT) orbit.inside = false
          else if (!orbit.inside && strength < RING_IN) {
            orbit.inside = true
            orbit.insideSince = t
          }
          useIdle = (orbit.inside && t - orbit.insideSince > RING_DWELL) || idle
        }
        if (useIdle) {
          if (set.idle) {
            if (!idleSince) idleSince = t
            show(idleSrc(t), null, t)
          } else show(set.centerImg, null, t) // idle not here yet: hold the default picture, never swing to "up"
          orbit.fresh = true
          paint(t)
          return
        }
        idleSince = 0
        let a = orbit.angle === null ? 90 : orbit.angle
        const steering = strength > (tiltMode ? ORBIT_DEAD : 0.04)
        if (steering) {
          const target = (Math.atan2(gaze.y, gaze.x) * 180) / Math.PI
          if (orbit.fresh) {
            a = target // coming out of the idle loop: start at the cursor's side, no long swing
            orbit.fresh = false
          }
          let diff = wrap(target - a)
          if (import.meta.env.DEV) orbit.dbg = { mag: strength, target, diff, gx: gaze.x, gy: gaze.y, px: pointer.x, py: pointer.y, fx, fy }
          if (!phoneB && diff > 170) diff -= 360
          const fast = tiltMode ? ORBIT_FAST : ORBIT_FAST_MOUSE
          const response = phoneB ? 14 : 9
          if (!phoneB || Math.abs(diff) > 0.8) {
            a += Math.max(-fast * ds, Math.min(fast * ds, diff * Math.min(1, response * ds)))
          }
        } else if (tiltMode && !phoneB) a -= ORBIT_SLOW * ds
        orbit.angle = wrap(a)
        const oi = set.lookup[(Math.round(orbit.angle * 4) + 720 + 1440) % 1440]
        show(set.imgs[oi], set.m.frames[oi].angle, t)
        paint(t)
        return
      }
      if (set.map) {
        // preview: pick by direction AND turn amount, so she passes through half turns
        const i = Math.min(Math.max(Math.round(((gaze.x + 1) / 2) * (GRID - 1)), 0), GRID - 1)
        const j = Math.min(Math.max(Math.round(((gaze.y + 1) / 2) * (GRID - 1)), 0), GRID - 1)
        const idx = set.map.lut[j * GRID + i]
        gaze.looking = idx >= 0
        if (gaze.looking) {
          idleSince = 0
          const f = set.m.frames[idx]
          const prevMag = shown.mag ?? 0
          shown.mag = f.mag
          show(set.imgs[idx], Math.abs(f.mag - prevMag) > 0.3 ? null : f.angle, t)
          paint(t)
          return
        }
        shown.mag = 0
      } else {
        // with the smile loop present, the inside of a ring (cursor near her face, or phone held
        // level) is her loop, and only beyond the ring does her head circle round to follow
        const lin = set.ring ? RING_IN : LOOK_IN
        const lout = set.ring ? RING_OUT : LOOK_OUT
        if (gaze.looking && strength < lin) gaze.looking = false
        else if (!gaze.looking && strength > lout) gaze.looking = true
      }

      if (!gaze.looking || !set.imgs.length) {
        // ring set: the inside of the ring is always her smile loop; otherwise only when idle
        if (set.idle && (set.ring || idle)) {
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
      phoneB = desktopPhoneIdle && kind === 'phone'
      loadSet(next).then(({ m, center, frames, idle }) => {
        idle.then((id) => {
          if (!disposed && kind === next && id && set) set.idle = id
        })
        center.then((centerImg) => {
          if (disposed || kind !== next) return
          onBackground && onBackground(m.background)
          // Nothing is drawn yet (the page's own red shows). Her first picture is the first frame of her idle video, which
          // starts playing at once; only if the idle does not arrive within ~2.5 s (slow connection, or no idle) does the
          // default picture appear instead.
          set = { m, centerImg, imgs: [], lookup: [], idle: null, waiting: true }
          size()
          shown.img = null
          Promise.race([idle, new Promise((r) => setTimeout(() => r(null), 2500))]).then((id) => {
            if (disposed || kind !== next || !set) return
            const now = performance.now()
            if (id && !set.idle) set.idle = id
            set.waiting = false
            if (set.idle) {
              idleSince = now
              show(idleSrc(now), null, now)
            } else show(centerImg, null, now)
            paint(now)
          })
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
            const map = !m.ring && m.frames.some((f) => f.mag !== undefined) ? buildMap(m) : null
            set = { m, centerImg, imgs, lookup, map, ring: !!m.ring, orbit: !!m.orbit, idle: set && set.idle, waiting: false }
            onReady && onReady()
          })
        })
      })
    }

    const toLocal = (e) => {
      if (coarse && e.pointerType !== 'mouse') return
      if (simulateTilt && (!listening || e.target.closest?.('.tilt-btn'))) return
      const rect = canvas.getBoundingClientRect()
      pointer.x = e.clientX - rect.left
      pointer.y = e.clientY - rect.top
      pointer.active = true
      pointer.last = performance.now()
      if (simulateTilt) tilt.engaged = true
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
      if (!listening || e.beta == null || e.gamma == null) return
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
        tilt.engaged = true // the phone really moved: from now on she circles and follows the tilt
      }
    }
    let listening = false
    const DOE = window.DeviceOrientationEvent
    const needsPermission = DOE && typeof DOE.requestPermission === 'function'
    const emitTilt = () =>
      window.dispatchEvent(new CustomEvent('hero-tilt-state', { detail: { supported: simulateTilt || !!(coarse && DOE), on: listening } }))
    const listenTilt = () => {
      if (disposed || listening) return
      listening = true
      if (!simulateTilt) window.addEventListener('deviceorientation', onOrient)
      emitTilt()
    }
    const stopTilt = () => {
      if (listening) window.removeEventListener('deviceorientation', onOrient)
      listening = false
      tilt.on = false
      tilt.engaged = false
      tilt.b0 = null
      tilt.g0 = null
      if (simulateTilt) pointer.active = false
      emitTilt()
    }
    const startTilt = () => {
      if (listening || (!simulateTilt && !(coarse && DOE))) return
      if (simulateTilt || !needsPermission) {
        listenTilt()
        return
      }
      DOE.requestPermission()
        .then((permission) => permission === 'granted' && listenTilt())
        .catch(() => {})
    }
    const onTiltSet = (e) => (e.detail?.on ? startTilt() : stopTilt())
    window.addEventListener('hero-tilt-set', onTiltSet)
    if (import.meta.env.DEV) window.__heroTilt = onOrient // local testing only, never in the live build
    emitTilt()

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
      window.removeEventListener('deviceorientation', onOrient)
      window.removeEventListener('hero-tilt-set', onTiltSet)
      document.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('resize', onResize)
      phoneQuery.removeEventListener('change', onQuery)
    }
  }, [onReady, onBackground, simulateTilt])

  return <canvas ref={canvasRef} className="hero-canvas" aria-label="Saraswati, illustrated, looking toward your cursor" role="img" />
}
