/**
 * Sonance - Sound
 * A one-shot or looping sound that can be assigned to and triggered by entities.
 * Wraps an Instrument so entity sounds can use the same layered patches as channels.
 */
import * as Tone from 'tone';
import { Instrument } from './Instrument.js';

export class Sound {
  /**
   * @param {Object} options
   * @param {string|string[]} [options.note='C4'] - Default note to play
   * @param {string|number} [options.duration='16n'] - Default note duration
   * @param {number} [options.volume=0] - Volume in dB
   * @param {string} [options.id] - Optional identifier for this sound
   */
  constructor(options = {}) {
    const {
      note = 'C4',
      duration = '16n',
      volume = 0,
      id = null,
      ...instrumentOptions
    } = options;

    this.id = id;
    this._defaultNote = note;
    this._defaultDuration = duration;

    this._vol = new Tone.Volume(volume);
    this._instrument = new Instrument(instrumentOptions);
    this._instrument.connect(this._vol);
    this._vol.toDestination();
    this._modulationTargets = {
      output: this._vol,
      volume: this._vol.volume,
      instrument: this._instrument.modulationTargets,
      nodes: {
        output: this._vol,
        volume: this._vol.volume,
        ...this._instrument.modulationTargets.nodes
      }
    };
  }

  /**
   * Trigger the sound, optionally overriding note/duration.
   * @param {string|string[]} [note] - Override note
   * @param {string|number} [duration] - Override duration
   * @param {Tone.Unit.Time} [time] - When to play (default: now)
   * @param {number} [velocity=1] - Trigger velocity
   */
  trigger(note, duration, time, velocity = 1) {
    const nextNote = note ?? this._defaultNote;
    const nextDuration = duration ?? this._defaultDuration;
    this._instrument.triggerAttackRelease(nextNote, nextDuration, time ?? Tone.now(), velocity);
    return this;
  }

  setNote(note) {
    this._defaultNote = note;
    return this;
  }

  setVolume(db) {
    this._vol.volume.value = db;
    return this;
  }

  setOscillator(type) {
    this._instrument.setOscillator(type);
    return this;
  }

  connect(destination) {
    this._vol.disconnect();
    this._vol.connect(destination);
    return this;
  }

  dispose() {
    this._instrument.dispose();
    this._vol.dispose();
  }

  get toneNode() {
    return this._instrument.toneNode;
  }

  get modulationTargets() {
    return this._modulationTargets;
  }
}
