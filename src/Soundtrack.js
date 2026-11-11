/**
 * Sonance - Soundtrack
 * A DAW-style multi-channel soundtrack.
 * Contains channels, each with an instrument, effects chain, and MIDI sequencer.
 * The Soundtrack manages a shared Tone.js Transport for synchronized playback.
 */
import * as Tone from 'tone';
import { Channel } from './Channel.js';

export class Soundtrack {
  /**
   * @param {Object} options
   * @param {string} [options.name='Soundtrack'] - Soundtrack name
   * @param {number} [options.bpm=120] - Tempo in beats per minute
   */
  constructor(options = {}) {
    const { name = 'Soundtrack', bpm = 120 } = options;
    this.name = name;
    this._channels = new Map();
    this._transport = Tone.getTransport();
    this._transport.bpm.value = bpm;
  }

  /**
   * Set the tempo.
   * @param {number} bpm
   */
  setBpm(bpm) {
    this._transport.bpm.value = bpm;
    return this;
  }

  /**
   * Add a channel to this soundtrack.
   * @param {string} name - Channel name (used as key)
   * @param {Object} [options] - Channel options (see Channel class)
   * @returns {Channel} The created channel
   */
  addChannel(name, options = {}) {
    if (this._channels.has(name)) {
      console.warn(`[Sonance] Channel '${name}' already exists — replacing.`);
      this._channels.get(name).dispose();
    }
    const channel = new Channel({ name, ...options });
    this._channels.set(name, channel);
    return channel;
  }

  /**
   * Get a channel by name.
   * @param {string} name
   * @returns {Channel|undefined}
   */
  getChannel(name) {
    return this._channels.get(name);
  }

  /**
   * Remove a channel by name.
   * @param {string} name
   */
  removeChannel(name) {
    const ch = this._channels.get(name);
    if (ch) {
      ch.dispose();
      this._channels.delete(name);
    }
    return this;
  }

  /**
   * Start playback of all looping sequences.
   * The engine is responsible for resuming the AudioContext from a user gesture.
   */
  async play() {
    this._transport.start();
    return this;
  }

  /**
   * Pause playback.
   */
  pause() {
    this._transport.pause();
    return this;
  }

  /**
   * Stop playback and reset transport to beginning.
   */
  stop() {
    this._transport.stop();
    return this;
  }

  /**
   * Dispose all channels and free resources.
   */
  dispose() {
    this.stop();
    for (const ch of this._channels.values()) {
      ch.dispose();
    }
    this._channels.clear();
  }

  /** List of all channel names. */
  get channelNames() {
    return Array.from(this._channels.keys());
  }
}
