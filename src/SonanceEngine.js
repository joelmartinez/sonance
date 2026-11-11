/**
 * Sonance - SonanceEngine
 * The main audio engine. Manages a registry of Sounds (for entities)
 * and Soundtracks (for DAW-style music).
 *
 * Usage:
 *   const engine = new SonanceEngine();
 *   await engine.start();
 *
 *   // Entity sounds
 *   const shoot = engine.createSound('shoot', { note: 'G5', duration: '32n', oscillator: 'square' });
 *   shoot.trigger();
 *
 *   // Soundtracks
 *   const ost = engine.createSoundtrack('main', { bpm: 130 });
 *   const bassLine = ost.addChannel('bass', {
 *     instrument: { oscillator: 'sawtooth' },
 *     effects: [{ type: 'reverb', decay: 1.5 }]
 *   });
 *   bassLine.playSequence([{ note: 'C2', duration: '4n' }, ...], { loop: true });
 *   await ost.play();
 *
 * Modulation is optional and injected, never imported: pass a system as
 * options.modulation. The engine calls createModulator(id, options),
 * getModulator(id), bind(options), update(deltaTime, context), and dispose()
 * on it. With no system injected, the modulation methods throw a clear error.
 */
import * as Tone from 'tone';
import { Sound } from './Sound.js';
import { Soundtrack } from './Soundtrack.js';

export class SonanceEngine {
  constructor(options = {}) {
    this._sounds = new Map();
    this._soundtracks = new Map();
    this._started = false;
    this._modulation = options.modulation ?? null;
  }

  _requireModulation() {
    if (!this._modulation) {
      throw new Error('Sonance: no modulation system - pass one as options.modulation to use modulation');
    }
    return this._modulation;
  }

  /**
   * Start the AudioContext. Must be called from a user gesture (click, keypress, etc.).
   * Safe to call multiple times.
   */
  async start() {
    if (!this._started) {
      await Tone.start();
      this._started = true;
    }
    return this;
  }

  // ─── Sounds (entity-level) ────────────────────────────────────────────────

  /**
   * Create a named Sound for use with entities.
   * @param {string} id - Unique identifier
   * @param {Object} [options] - Sound options (see Sound class)
   * @returns {Sound}
   */
  createSound(id, options = {}) {
    if (this._sounds.has(id)) {
      this._sounds.get(id).dispose();
    }
    const sound = new Sound({ id, ...options });
    this._sounds.set(id, sound);
    return sound;
  }

  /**
   * Retrieve a Sound by id.
   * @param {string} id
   * @returns {Sound|undefined}
   */
  getSound(id) {
    return this._sounds.get(id);
  }

  /**
   * Trigger a Sound by id.
   * @param {string} id
   * @param {string} [note] - Optional note override
   * @param {string} [duration] - Optional duration override
   */
  triggerSound(id, note, duration) {
    const sound = this._sounds.get(id);
    if (sound) {
      sound.trigger(note, duration);
    } else {
      console.warn(`[Sonance] Sound '${id}' not found.`);
    }
    return this;
  }

  createModulator(id, options = {}) {
    return this._requireModulation().createModulator(id, options);
  }

  getModulator(id) {
    return this._requireModulation().getModulator(id);
  }

  bindModulator(options = {}) {
    return this._requireModulation().bind(options);
  }

  updateModulation(deltaTime, context = {}) {
    this._requireModulation().update(deltaTime, context);
    return this;
  }

  /**
   * Remove and dispose a Sound.
   * @param {string} id
   */
  removeSound(id) {
    const sound = this._sounds.get(id);
    if (sound) {
      sound.dispose();
      this._sounds.delete(id);
    }
    return this;
  }

  // ─── Soundtracks (DAW-style) ──────────────────────────────────────────────

  /**
   * Create a named Soundtrack.
   * @param {string} name - Unique name
   * @param {Object} [options] - Soundtrack options (see Soundtrack class)
   * @returns {Soundtrack}
   */
  createSoundtrack(name, options = {}) {
    if (this._soundtracks.has(name)) {
      this._soundtracks.get(name).dispose();
    }
    const soundtrack = new Soundtrack({ name, ...options });
    this._soundtracks.set(name, soundtrack);
    return soundtrack;
  }

  /**
   * Retrieve a Soundtrack by name.
   * @param {string} name
   * @returns {Soundtrack|undefined}
   */
  getSoundtrack(name) {
    return this._soundtracks.get(name);
  }

  /**
   * Remove and dispose a Soundtrack.
   * @param {string} name
   */
  removeSoundtrack(name) {
    const st = this._soundtracks.get(name);
    if (st) {
      st.dispose();
      this._soundtracks.delete(name);
    }
    return this;
  }

  /**
   * Dispose all sounds and soundtracks.
   */
  dispose() {
    for (const sound of this._sounds.values()) sound.dispose();
    this._sounds.clear();
    for (const st of this._soundtracks.values()) st.dispose();
    this._soundtracks.clear();
    if (this._modulation) this._modulation.dispose();
    this._started = false;
  }

  /** Expose Tone.js for advanced usage. */
  get Tone() {
    return Tone;
  }

  /** @returns {Map<string, Sound>} */
  get sounds() {
    return this._sounds;
  }

  /** @returns {Map<string, Soundtrack>} */
  get soundtracks() {
    return this._soundtracks;
  }

  get modulation() {
    return this._modulation;
  }
}
