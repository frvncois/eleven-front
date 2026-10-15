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

type Listener = () => void
const KEY = "eleven-sound"
const FADE = 0.4
const isBrowser = () => typeof window !== "undefined"

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
  let party: { timer: number; out: GainNode } | null = null
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
     * Party mode music (Contact / Privacy butterfly). A synthesized 124 bpm loop (kick, off-beat hat,
     * bass line, stabs) scheduled ahead on the master bus, so the mute toggle still works.
     * Placeholder until Eleven picks a track. `onBeat` fires on every quarter note.
     */
    startParty(onBeat: (beat: number) => void) {
      kit.stopParty()
      if (!ctx || !master) return
      const c = ctx
      const out = c.createGain()
      out.gain.value = 0.55
      out.connect(master)
      const bpm = 124
      const sixteenth = 60 / bpm / 4
      const bass = [41, 0, 41, 0, 44, 0, 41, 0, 39, 0, 39, 0, 46, 0, 44, 0] // MIDI notes, 0 = rest
      const hz = (m: number) => 440 * Math.pow(2, (m - 69) / 12)
      const noise = c.createBuffer(1, c.sampleRate * 0.1, c.sampleRate)
      noise.getChannelData(0).forEach((_, i, a) => (a[i] = Math.random() * 2 - 1))
      let step = 0
      let next = c.currentTime + 0.05
      const voice = (type: OscillatorType, f: number, t: number, dur: number, vol: number, to?: number) => {
        const o = c.createOscillator()
        const g = c.createGain()
        o.type = type
        o.frequency.setValueAtTime(f, t)
        if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur)
        g.gain.setValueAtTime(vol, t)
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
        o.connect(g).connect(out)
        o.start(t)
        o.stop(t + dur + 0.02)
      }
      const hat = (t: number) => {
        const src = c.createBufferSource()
        const hp = c.createBiquadFilter()
        const g = c.createGain()
        src.buffer = noise
        hp.type = "highpass"
        hp.frequency.value = 7000
        g.gain.setValueAtTime(0.25, t)
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05)
        src.connect(hp).connect(g).connect(out)
        src.start(t)
      }
      const timer = window.setInterval(() => {
        while (next < c.currentTime + 0.12) {
          const s = step % 16
          if (s % 4 === 0) {
            voice("sine", 150, next, 0.28, 0.9, 45) // kick
            const beat = step / 4
            window.setTimeout(() => onBeat(beat), Math.max(0, (next - c.currentTime) * 1000))
          }
          if (s % 4 === 2) hat(next)
          if (bass[s]) voice("sawtooth", hz(bass[s]), next, sixteenth * 1.6, 0.18)
          if (s === 4 || s === 12) [65, 68, 72].forEach((m) => voice("square", hz(m), next, 0.12, 0.05)) // stabs
          next += sixteenth
          step++
        }
      }, 25)
      party = { timer, out }
    },
    stopParty() {
      if (!party) return
      window.clearInterval(party.timer)
      const { out } = party
      if (ctx) {
        out.gain.setTargetAtTime(0, ctx.currentTime, 0.08)
        window.setTimeout(() => out.disconnect(), 600)
      }
      party = null
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
    preload(urls: (string | undefined | null)[]) {
      if (ctx) urls.filter(Boolean).forEach((u) => load(u as string))
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

  // Returning visitor in the same session: re-unlock on the first gesture if they had sound on.
  if (isBrowser()) {
    const resume = (e: Event) => {
      // A click on the sound toggle itself decides on its own (otherwise it would unlock, then flip back off).
      if ((e.target as Element | null)?.closest?.("[data-sound-toggle]")) return
      if (!unlocked && sessionStorage.getItem(KEY) === "on") kit.unlock()
    }
    window.addEventListener("pointerdown", resume, { capture: true })
    window.addEventListener("keydown", resume, { capture: true })
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
