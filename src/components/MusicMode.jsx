import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import './music-mode.css'

const MEDIA = '/music'
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

function pulseLevel(age, strength) {
  if (age >= 0.32) return 0
  const attack = Math.min(age / 0.035, 1)
  const easedAttack = attack * attack * (3 - 2 * attack)
  return strength * easedAttack * (1 - age / 0.32) ** 1.5
}

export default function MusicMode() {
  const audioRef = useRef(null)
  const lightsRef = useRef(null)
  const audioGraph = useRef(null)
  const [kicks, setKicks] = useState([])
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(100)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    fetch(`${MEDIA}/kicks.json`, { signal: controller.signal })
      .then((response) => response.ok && response.json())
      .then((cues) => { if (Array.isArray(cues)) setKicks(cues) })
      .catch(() => {})
    return () => {
      controller.abort()
      audioGraph.current?.context.close().catch(() => {})
    }
  }, [])

  useEffect(() => {
    if (!playing) return
    const audio = audioRef.current
    const heroLights = lightsRef.current
    const root = document.documentElement
    let frame = 0
    let stage = ''
    let lastLight = ''
    let lastBeat = null

    const draw = () => {
      const elapsed = audio.currentTime
      const afterDrop = elapsed >= DROP_TIME
      const nextStage = afterDrop ? 'drop' : 'intro'
      const kick = latestKick(kicks, elapsed)
      const kickLight = kick ? pulseLevel(elapsed - kick[0], kick[1]) : 0
      const introBeat = Math.floor((elapsed - DROP_TIME) / BEAT_DURATION)
      // The intro has no full kicks for several seconds. Start with a soft pulse
      // on play, then follow the song grid up to the first measured kicks.
      const introOnset = Math.max(0, DROP_TIME + introBeat * BEAT_DURATION)
      const light = afterDrop ? kickLight : Math.max(kickLight, pulseLevel(elapsed - introOnset, 0.44))
      const beat = afterDrop && kick ? Math.round((kick[0] - DROP_TIME) / BEAT_DURATION) : introBeat
      const level = light.toFixed(3)
      if (level !== lastLight || (level !== '0.000' && (beat !== lastBeat || nextStage !== stage))) {
        const downbeat = afterDrop && beat % 4 === 0
        const leftLead = beat % 2 === 0
        const heroHit = light * (afterDrop ? 1.5 : 0.75)
        root.style.setProperty('--music-kick', (light * (afterDrop ? 1.32 : 0.38)).toFixed(3))
        heroLights.style.setProperty('--rose-hit', (heroHit * (leftLead || downbeat ? 1 : 0.28)).toFixed(3))
        heroLights.style.setProperty('--amber-hit', (heroHit * (!leftLead || downbeat ? 1 : 0.28)).toFixed(3))
        heroLights.style.setProperty('--accent-hit', (heroHit * (downbeat ? 0.82 : 0.36)).toFixed(3))
        lastLight = level
        lastBeat = beat
      }
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
      // A gain node also gives browsers with fixed media-element volume a slider.
      if (!audioGraph.current && window.AudioContext) {
        const context = new AudioContext()
        const gain = context.createGain()
        gain.gain.value = volume / 100
        context.createMediaElementSource(audio).connect(gain).connect(context.destination)
        audioGraph.current = { context, gain }
      }
      await Promise.all([audioGraph.current?.context.resume(), audio.play()])
    } catch (error) {
      if (error.name !== 'AbortError') {
        audio.pause()
        setError('Music couldn’t start. Tap to try again.')
      }
    }
  }

  const changeVolume = (event) => {
    const percent = event.currentTarget.valueAsNumber
    setVolume(percent)
    const graph = audioGraph.current
    if (graph) graph.gain.gain.setTargetAtTime(percent / 100, graph.context.currentTime, 0.02)
    else audioRef.current.volume = percent / 100
  }

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
          {playing && (
            <label className="music-volume">
              <span>Volume</span>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={changeVolume}
                aria-label="Music volume"
                aria-valuetext={`${volume}%`}
              />
              <span aria-hidden="true">{volume}%</span>
            </label>
          )}
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
