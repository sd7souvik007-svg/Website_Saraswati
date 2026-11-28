import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import './music-mode.css'

const MEDIA = '/hero-preview/music'
const DROP_TIME = 10.385 // The edit starts at 0:30. The first full kick enters at 0:40.385.
const BEAT_DURATION = 0.48

function latestKick(kicks, time) {
  let low = 0
  let high = kicks.length
  while (low < high) {
    const middle = (low + high) >>> 1
    if (kicks[middle][0] <= time) low = middle + 1
    else high = middle
  }
  return kicks[low - 1]
}

function kickLevelAt([onset, strength], time) {
  const age = time - onset
  if (age >= 0.32) return 0
  const attack = Math.min(age / 0.025, 1)
  return strength * attack * (1 - age / 0.32) ** 1.5
}

export default function MusicMode() {
  const audioRef = useRef(null)
  const lightsRef = useRef(null)
  const [kicks, setKicks] = useState([])
  const [playing, setPlaying] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    fetch(`${MEDIA}/kicks.json`, { signal: controller.signal })
      .then((response) => response.ok && response.json())
      .then((cues) => { if (Array.isArray(cues)) setKicks(cues) })
      .catch(() => {})
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (!playing) return
    const audio = audioRef.current
    const heroLights = lightsRef.current
    const root = document.documentElement
    let frame = 0
    let stage = ''

    const draw = () => {
      const elapsed = audio.currentTime
      const afterDrop = elapsed >= DROP_TIME
      const nextStage = afterDrop ? 'drop' : 'intro'
      const kick = latestKick(kicks, elapsed)
      const light = kick ? kickLevelAt(kick, elapsed) : 0
      root.style.setProperty('--music-kick', (light * (afterDrop ? 1.32 : 0.38)).toFixed(3))

      // Keep the accents tied to the song's beat grid, even where a kick drops out.
      const beat = kick ? Math.round((kick[0] - DROP_TIME) / BEAT_DURATION) : 0
      const downbeat = afterDrop && beat % 4 === 0
      const leftLead = beat % 2 === 0
      const heroHit = light * (afterDrop ? 1.5 : 0.75)
      heroLights.style.setProperty('--rose-hit', (heroHit * (leftLead || downbeat ? 1 : 0.28)).toFixed(3))
      heroLights.style.setProperty('--amber-hit', (heroHit * (!leftLead || downbeat ? 1 : 0.28)).toFixed(3))
      heroLights.style.setProperty('--accent-hit', (heroHit * (downbeat ? 0.82 : 0.36)).toFixed(3))

      if (stage !== nextStage) {
        stage = nextStage
        root.dataset.music = stage
      }

      frame = requestAnimationFrame(draw)
    }

    frame = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(frame)
      delete root.dataset.music
      root.style.removeProperty('--music-kick')
      heroLights.style.removeProperty('--rose-hit')
      heroLights.style.removeProperty('--amber-hit')
      heroLights.style.removeProperty('--accent-hit')
    }
  }, [playing, kicks])

  const toggle = async () => {
    const audio = audioRef.current
    if (!audio.paused) {
      audio.pause()
      return
    }
    setError('')
    try {
      audio.currentTime = 0
      await audio.play()
    } catch (error) {
      if (error.name !== 'AbortError') setError('Music couldn’t start. Tap to try again.')
    }
  }

  // The soundtrack and cues are included together in local review builds.
  if (!kicks.length) return null

  return (
    <>
      <audio ref={audioRef} src={`${MEDIA}/track.mp3`} preload="none" onPlaying={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} />
      <div className="music-hero-lights" ref={lightsRef} aria-hidden="true">
        <span className="music-rose-light" />
        <span className="music-amber-light" />
        <span className="music-accent-light" />
      </div>
      {createPortal(
        <>
          <button className="music-toggle" type="button" aria-pressed={playing} onClick={toggle}>
            <svg viewBox="0 0 20 20" width="17" height="17" aria-hidden="true">
              <path d="M3 8v4m4-7v10m3-13v16m3-13v10m4-7v4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            {playing ? 'Music on' : 'Music off'}
          </button>
          <span className="music-status" role="status">{error}</span>
        </>, document.body,
      )}
    </>
  )
}
