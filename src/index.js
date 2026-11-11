/**
 * Sonance - Audio Engine for the Web
 * An audio engine built on Tone.js with two primary concepts:
 *   - Sounds: one-shot or looping sounds assignable to entities
 *   - Soundtracks: DAW-style multi-channel music with effects, synths, and MIDI
 *
 * Consumed as an ES module: import Sonance from '@codecube/sonance'.
 */
import { SonanceEngine } from './SonanceEngine.js';
import { Sound } from './Sound.js';
import { Soundtrack } from './Soundtrack.js';
import { Channel } from './Channel.js';
import { Instrument } from './Instrument.js';
import * as MidiUtils from './MidiUtils.js';
import { loadSoundtrack } from './SoundtrackLoader.js';
import { SonanceSceneManager } from './SonanceSceneManager.js';
import * as Tone from 'tone';

const Sonance = {
  /** Create a new SonanceEngine instance. */
  createEngine(options = {}) {
    return new SonanceEngine(options);
  },

  /** Direct class access for custom instantiation. */
  SonanceEngine,
  Sound,
  Soundtrack,
  Channel,
  Instrument,
  MidiUtils,
  loadSoundtrack,
  SonanceSceneManager,

  /** Tone.js library for advanced usage. */
  Tone
};

export default Sonance;
export {
  SonanceEngine,
  Sound,
  Soundtrack,
  Channel,
  Instrument,
  MidiUtils,
  loadSoundtrack,
  SonanceSceneManager,
  Tone
};
