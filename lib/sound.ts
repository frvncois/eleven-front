"use client";

// Eleven · sound kit. Ported from the Framer build (framer/code/Sound.tsx), same engine on `window.__elevenSound`.
// One audio engine for the whole visit; survives client-side page changes.
// - unlock(): audio needs a user gesture. The Gate calls it; any later click also unlocks if sound was on before.
// - setMuted / toggle: fades the master over 0.4 s, remembered for the session.
// - play(urls): one-shot hover sounds. Random take, never the same take twice in a row.
// - tone(): soft synthesized blip, the placeholder until Eleven's real sounds arrive.
// - registerMedia / duck / unduck: background media on a bus that overlays can fade.
import { useEffect, useState, startTransition } from "react";

type Kit = { tone: (f?: number, d?: number, v?: number) => void; whoosh: (d?: number, v?: number, a?: number, b?: number) => void }
type Cue = { files: string[]; volume: number; sequence?: boolean; placeholder: (k: Kit) => void }

// UI sound cues. `files`: takes from public/sounds, a random take each time (never twice in a row),
// or played in order when `sequence` is set. A cue with no files plays its synthesized placeholder.
// PROTOTYPE ONLY: the files in public/sounds/placeholder-auge are AUGE's (auge-xp.com), stand-ins
// until Eleven makes the real ones. Replace them and that folder before launch.
const A = (n: string) => `/sounds/placeholder-auge/${n}.mp3`
const HOVERS = [A("hover-1"), A("hover-2"), A("hover-3"), A("hover-4")]
const STEPS = [A("step-1"), A("step-2"), A("step-3"), A("step-4"), A("step-5"), A("step-6")]
const CUES = {
  navHover: { files: HOVERS, volume: 0.6, placeholder: (k: Kit) => k.tone(880, 0.12, 0.08) },
  click: { files: [A("click")], volume: 0.6, placeholder: (k: Kit) => k.tone(520, 0.1, 0.1) },
  menuOpen: { files: [A("menu-open")], volume: 0.7, placeholder: (k: Kit) => k.whoosh(0.5, 0.12, 300, 1800) },
  sweepIn: { files: [A("transition")], volume: 0.7, placeholder: (k: Kit) => k.whoosh(0.9, 0.14, 250, 2200) },
  sweepOut: { files: [] as string[], volume: 0.6, placeholder: () => {} }, // the transition file covers both halves
  step: { files: STEPS, volume: 0.6, sequence: true, placeholder: (k: Kit) => k.tone(660, 0.15, 0.1) },
  // Index list → grid: "the line explodes with a sound" (annotation).
  explode: { files: [A("scramble")], volume: 0.8, placeholder: (k: Kit) => (k.whoosh(0.5, 0.22, 3000, 120), k.tone(90, 0.5, 0.25)) },
  gather: { files: [A("menu-open")], volume: 0.6, placeholder: (k: Kit) => k.whoosh(0.6, 0.12, 400, 2600) },
} satisfies Record<string, Cue>
const seqPos = new Map<string, number>()

export type RoomPreset = "studio" | "lobby" | "outside"
export type RoomHandle = { setPan: (x: number) => void; setNear: (y: number) => void; stop: () => void; analyser: AnalyserNode | null }

type Listener = () => void
const KEY = "eleven-sound"
const FADE = 0.4
const isBrowser = () => typeof window !== "undefined"

// iPhone: Web Audio follows the ring / silent switch (the films don't), so with the switch on silent every UI sound
// is dropped even with "sound on". Declaring a playback session (Safari 16.4+) and, for older iOS, keeping a silent
// <audio> element playing moves the page into the playback category, where the switch no longer applies.
const SILENT_WAV = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA"
let keepAlive: HTMLAudioElement | null = null
function playbackSession() {
  try {
    const nav = navigator as Navigator & { audioSession?: { type: string } }
    if (nav.audioSession) nav.audioSession.type = "playback"
  } catch {}
  if (!keepAlive) {
    keepAlive = new Audio(SILENT_WAV)
    keepAlive.loop = true
    keepAlive.setAttribute("playsinline", "")
  }
  keepAlive.play().catch(() => {})
}

function createKit() {
  let ctx: AudioContext | null = null
  let master: GainNode | null = null
  let bg: GainNode | null = null
  let unlocked = false
  let muted = isBrowser() && sessionStorage.getItem(KEY) === "muted"
  let ducked = false
  const listeners = new Set<Listener>()
  const buffers = new Map<string, Promise<AudioBuffer | null>>()
  const lastTake = new Map<string, number>()
  const media = new Set<HTMLMediaElement>()
  const emit = () => listeners.forEach((l) => l())

  const ramp = (g: GainNode | null, to: number, dur = FADE) => {
    if (!ctx || !g) return
    const t = ctx.currentTime
    g.gain.cancelScheduledValues(t)
    g.gain.setValueAtTime(g.gain.value, t)
    g.gain.linearRampToValueAtTime(to, t + dur)
  }
  // Media we could not route through Web Audio (cross-origin): tween element.volume instead.
  const fadeMedia = (to: number, dur = FADE) => {
    media.forEach((el) => {
      // Routed through Web Audio: the bus gain sets the level, the element itself must stay unmuted.
    if ((el as HTMLMediaElement & { __elevenRouted?: boolean }).__elevenRouted) {
      el.muted = false
      return
    }
      el.muted = false
      const from = el.volume
      const t0 = performance.now()
      const step = () => {
        const k = Math.min(1, (performance.now() - t0) / (dur * 1000))
        el.volume = from + (to - from) * k
        if (k < 1) requestAnimationFrame(step)
      }
      step()
    })
  }
  const load = (url: string) => {
    if (!buffers.has(url)) {
      buffers.set(
        url,
        fetch(url)
          .then((r) => r.arrayBuffer())
          .then((b) => (ctx ? ctx.decodeAudioData(b) : null))
          .catch(() => null)
      )
    }
    return buffers.get(url)!
  }

  const kit = {
    get unlocked() {
      return unlocked
    },
    get muted() {
      return muted
    },
    subscribe(l: Listener) {
      listeners.add(l)
      return () => void listeners.delete(l)
    },
    /** Call from a user gesture (the Gate's click). */
    unlock() {
      if (!isBrowser()) return
      if (!ctx) {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        ctx = new AC()
        master = ctx.createGain()
        master.gain.value = 0
        master.connect(ctx.destination)
        bg = ctx.createGain()
        bg.connect(master)
        media.forEach((el) => kit.registerMedia(el))
      }
      ctx.resume()
      playbackSession()
      unlocked = true
      sessionStorage.setItem(KEY, muted ? "muted" : "on")
      ramp(master, muted ? 0 : 1)
      fadeMedia(muted || ducked ? 0 : 1)
      emit()
    },
    setMuted(m: boolean) {
      muted = m
      if (isBrowser()) sessionStorage.setItem(KEY, m ? "muted" : "on")
      if (!unlocked) {
        if (!m) kit.unlock()
        else emit()
        return
      }
      // Turning sound on is a gesture: wake the engine too, in case iOS put it to sleep.
      if (!m && ctx && ctx.state !== "running") ctx.resume().catch(() => {})
      if (!m) playbackSession()
      ramp(master, m ? 0 : 1)
      fadeMedia(m || ducked ? 0 : 1)
      emit()
    },
    toggle() {
      kit.setMuted(unlocked && !muted) // on → mute; off or still locked → sound on (unlocks)
    },
    /** Hover sounds. `key` groups the takes (e.g. one person) for the no-repeat rule. */
    async play(urls: (string | undefined | null)[], key = "default", volume = 1) {
      const takes = urls.filter(Boolean) as string[]
      if (!takes.length || !unlocked || muted || !ctx || !master) return
      let i = Math.floor(Math.random() * takes.length)
      if (takes.length > 1 && i === lastTake.get(key)) i = (i + 1) % takes.length
      lastTake.set(key, i)
      const buf = await load(takes[i])
      if (!buf || !ctx || !master) return
      const src = ctx.createBufferSource()
      const g = ctx.createGain()
      g.gain.value = volume
      src.buffer = buf
      src.connect(g).connect(master)
      src.start()
    },
    /** Placeholder: a soft synthesized blip, used until the real sound files exist. */
    tone(freq = 660, dur = 0.2, volume = 0.2) {
      if (!unlocked || muted || !ctx || !master) return
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      const t = ctx.currentTime
      o.type = "sine"
      o.frequency.value = freq
      g.gain.setValueAtTime(0, t)
      g.gain.linearRampToValueAtTime(volume, t + 0.012)
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
      o.connect(g).connect(master)
      o.start(t)
      o.stop(t + dur + 0.02)
    },
    /** Placeholder: a soft filtered-noise sweep (page transitions) until Eleven's file arrives. */
    whoosh(dur = 0.9, volume = 0.16, from = 300, to = 2400) {
      if (!unlocked || muted || !ctx || !master) return
      const t = ctx.currentTime
      const len = Math.ceil(ctx.sampleRate * dur)
      const buf = ctx.createBuffer(1, len, ctx.sampleRate)
      const data = buf.getChannelData(0)
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
      const src = ctx.createBufferSource()
      const bp = ctx.createBiquadFilter()
      const g = ctx.createGain()
      src.buffer = buf
      bp.type = "bandpass"
      bp.Q.value = 1.2
      bp.frequency.setValueAtTime(from, t)
      bp.frequency.exponentialRampToValueAtTime(to, t + dur)
      g.gain.setValueAtTime(0, t)
      g.gain.linearRampToValueAtTime(volume, t + dur * 0.4)
      g.gain.linearRampToValueAtTime(0, t + dur)
      src.connect(bp).connect(g).connect(master)
      src.start(t)
      src.stop(t + dur + 0.02)
    },
    /**
     * A room's ambience for "Hear the rooms": Eleven's recording when `src` is given (looped), otherwise a
     * synthesized placeholder by `preset`. Runs through distance (low-pass + level), left/right pan and an
     * analyser for the meter, on the master bus (so mute works). Fades in; `stop()` fades out.
     */
    ambience(preset: RoomPreset, src?: string | null): RoomHandle {
      if (!ctx || !master) return { setPan() {}, setNear() {}, stop() {}, analyser: null }
      const c = ctx
      const t0 = c.currentTime
      const bus = c.createGain()
      const distance = c.createBiquadFilter()
      const pan = c.createStereoPanner()
      const level = c.createGain()
      const analyser = c.createAnalyser()
      distance.type = "lowpass"
      distance.frequency.value = 6000
      analyser.fftSize = 1024
      level.gain.setValueAtTime(0, t0)
      level.gain.linearRampToValueAtTime(1, t0 + 0.8)
      bus.connect(distance).connect(pan).connect(level).connect(analyser).connect(master)

      const stops: (() => void)[] = []
      const noise = (() => {
        // Pink-ish noise (Paul Kellet's filter), 3 s, looped.
        const b = c.createBuffer(2, c.sampleRate * 3, c.sampleRate)
        for (let ch = 0; ch < 2; ch++) {
          const d = b.getChannelData(ch)
          let b0 = 0, b1 = 0, b2 = 0
          for (let i = 0; i < d.length; i++) {
            const w = Math.random() * 2 - 1
            b0 = 0.99765 * b0 + w * 0.099046
            b1 = 0.963 * b1 + w * 0.2965164
            b2 = 0.57 * b2 + w * 1.0526913
            d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.12
          }
        }
        return b
      })()
      const bed = (type: BiquadFilterType, freq: number, gain: number, q = 0.7) => {
        const n = c.createBufferSource()
        const f = c.createBiquadFilter()
        const g = c.createGain()
        n.buffer = noise
        n.loop = true
        f.type = type
        f.frequency.value = freq
        f.Q.value = q
        g.gain.value = gain
        n.connect(f).connect(g).connect(bus)
        n.start()
        stops.push(() => n.stop())
        return { f, g }
      }
      const tone = (freq: number, gain: number) => {
        const o = c.createOscillator()
        const g = c.createGain()
        o.frequency.value = freq
        g.gain.value = gain
        o.connect(g).connect(bus)
        o.start()
        stops.push(() => o.stop())
      }
      const lfo = (target: AudioParam, rate: number, depth: number) => {
        const o = c.createOscillator()
        const g = c.createGain()
        o.frequency.value = rate
        g.gain.value = depth
        o.connect(g).connect(target)
        o.start()
        stops.push(() => o.stop())
      }
      const every = (ms: () => number, fn: (t: number) => void) => {
        let id = 0
        const go = () => {
          fn(c.currentTime + 0.02)
          id = window.setTimeout(go, ms())
        }
        id = window.setTimeout(go, ms())
        stops.push(() => window.clearTimeout(id))
      }
      const blip = (f0: number, f1: number, dur: number, vol: number, t: number, type: OscillatorType = "sine") => {
        const o = c.createOscillator()
        const g = c.createGain()
        o.type = type
        o.frequency.setValueAtTime(f0, t)
        o.frequency.exponentialRampToValueAtTime(f1, t + dur)
        g.gain.setValueAtTime(vol, t)
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
        o.connect(g).connect(bus)
        o.start(t)
        o.stop(t + dur + 0.02)
      }

      if (src) {
        let node: AudioBufferSourceNode | null = null
        load(src).then((buf) => {
          if (!buf || !ctx) return
          node = ctx.createBufferSource()
          node.buffer = buf
          node.loop = true
          node.connect(bus)
          node.start()
        })
        stops.push(() => node?.stop())
      } else if (preset === "studio") {
        bed("lowpass", 380, 0.9) // the room's air
        tone(60, 0.012) // gear hum
        tone(120, 0.006)
      } else if (preset === "lobby") {
        bed("lowpass", 1400, 0.7)
        const murmur = bed("bandpass", 520, 1.4, 1.6) // voices through a door
        lfo(murmur.g.gain, 0.35, 0.9)
        lfo(murmur.f.frequency, 0.13, 180)
      } else if (preset === "outside") {
        const wind = bed("bandpass", 600, 1.6, 0.6)
        lfo(wind.f.frequency, 0.08, 320)
        lfo(wind.g.gain, 0.05, 0.8)
        every(() => 1400 + Math.random() * 2600, (t) => {
          // a bird
          blip(3200, 4300, 0.09, 0.05, t)
          blip(3600, 4800, 0.08, 0.04, t + 0.12)
        })
      }

      return {
        analyser,
        /** -1 (left) … 1 (right) */
        setPan(x: number) {
          pan.pan.setTargetAtTime(Math.max(-1, Math.min(1, x)), c.currentTime, 0.08)
        },
        /** 0 (far, muffled) … 1 (close, bright and louder) */
        setNear(y: number) {
          const k = Math.max(0, Math.min(1, y))
          distance.frequency.setTargetAtTime(700 + 9000 * k * k, c.currentTime, 0.1)
          bus.gain.setTargetAtTime(0.45 + 0.85 * k, c.currentTime, 0.1)
        },
        stop() {
          const t = c.currentTime
          level.gain.cancelScheduledValues(t)
          level.gain.setValueAtTime(level.gain.value, t)
          level.gain.linearRampToValueAtTime(0, t + 0.6)
          window.setTimeout(() => {
            stops.forEach((f) => {
              try {
                f()
              } catch {}
            })
            bus.disconnect()
            analyser.disconnect()
          }, 700)
        },
      }
    },
    /**
     * Named UI sounds. Each cue plays Eleven's file when one is listed in CUES, otherwise its placeholder.
     * Swapping in the real sounds = adding the file in public/sounds and its path here.
     */
    cue(name: keyof typeof CUES) {
      const c: Cue = CUES[name]
      if (!c.files.length) return c.placeholder(kit)
      if (c.sequence) {
        const i = seqPos.get(name) ?? 0
        seqPos.set(name, (i + 1) % c.files.length)
        return kit.play([c.files[i]], name, c.volume)
      }
      return kit.play(c.files, name, c.volume)
    },
    registerMedia(el: HTMLMediaElement) {
      media.add(el)
      if (ctx && bg && !(el as HTMLMediaElement & { __elevenRouted?: boolean }).__elevenRouted) {
        try {
          el.crossOrigin = el.crossOrigin || "anonymous"
          ctx.createMediaElementSource(el).connect(bg)
          ;(el as HTMLMediaElement & { __elevenRouted?: boolean }).__elevenRouted = true
        } catch {
          /* cross-origin: volume fallback */
        }
      }
      el.muted = (el as HTMLMediaElement & { __elevenRouted?: boolean }).__elevenRouted ? false : !unlocked || muted
      return () => void media.delete(el)
    },
    duck(dur = 0.6) {
      ducked = true
      ramp(bg, 0, dur)
      fadeMedia(0, dur)
    },
    unduck(dur = 0.6) {
      ducked = false
      ramp(bg, 1, dur)
      fadeMedia(muted ? 0 : 1, dur)
    },
  }

  // Returning visitor in the same session: re-unlock on the first gesture if they had sound on. And on any gesture,
  // wake the engine if iOS put it to sleep (screen lock, another app, a film taking the audio): it stays "unlocked"
  // but silent until resumed. iOS only counts touchend / click as gestures that may start audio, not touchstart.
  if (isBrowser()) {
    const resume = (e: Event) => {
      // A click on the sound toggle itself decides on its own (otherwise it would unlock, then flip back off).
      if ((e.target as Element | null)?.closest?.("[data-sound-toggle]")) return
      if (!unlocked && sessionStorage.getItem(KEY) === "on") return kit.unlock()
      if (unlocked && !muted && ctx && ctx.state !== "running") {
        ctx.resume().catch(() => {})
        playbackSession()
      }
    }
    for (const type of ["pointerdown", "touchend", "click", "keydown"]) window.addEventListener(type, resume, { capture: true })
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && unlocked && !muted && ctx && ctx.state !== "running") ctx.resume().catch(() => {})
    })
  }
  return kit
}

export type SoundKit = ReturnType<typeof createKit>
export const sound: SoundKit = isBrowser()
  ? ((window as unknown as { __elevenSound?: SoundKit }).__elevenSound ||= createKit())
  : createKit()

export function useSound() {
  const [, set] = useState(0)
  useEffect(() => sound.subscribe(() => startTransition(() => set((n) => n + 1))), [])
  return sound
}
