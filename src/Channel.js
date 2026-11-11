/**
 * Sonance - Channel
 * A DAW-style channel with an instrument, effects chain, and MIDI sequencer.
 * Part of a Soundtrack, multiple channels can play simultaneously.
 */
import * as Tone from 'tone';
import { Instrument } from './Instrument.js';
import { buildEffectChain } from './EffectChain.js';
import { buildTimedEvents, DURATION_MAP } from './MidiUtils.js';

function registerNamedNodes(targets, descriptors = [], nodes = []) {
  descriptors.forEach((desc, index) => {
    const node = nodes[index];
    if (!node) {
      return;
    }

    if (desc.id) {
      targets[desc.id] = node;
    }

    if (desc.type && !targets[desc.type]) {
      targets[desc.type] = node;
    }
  });
}

export class Channel {
  /**
   * @param {Object} options
   * @param {string} [options.name='Channel'] - Channel name
   * @param {number} [options.volume=0] - Channel volume in dB
   * @param {Object} [options.instrument] - Instrument options (see Instrument class)
   * @param {Object[]} [options.effects] - Array of effect descriptors
   *   Each: { type: 'reverb'|'echo'|'chorus'|'distortion'|'eq', ...params }
   */
  constructor(options = {}) {
    const {
      name = 'Channel',
      volume = 0,
      instrument = {},
      effects = []
    } = options;

    this.name = name;
    this._sequence = null;
    this._loop = null;

    // Create a Tone.Channel for routing and volume
    this._channel = new Tone.Channel(volume).toDestination();

    // Build effects chain (right to left: last effect → channel input)
    this._effects = buildEffectChain(effects, this._channel);

    // Create instrument connected to the effects chain or channel directly
    this._instrument = new Instrument(instrument);
    const chainInput = this._effects.length > 0 ? this._effects[0] : this._channel;
    this._instrument.connect(chainInput);

    this._modulationTargets = {
      output: this._channel,
      channel: this._channel,
      effects: this._effects,
      instrument: this._instrument.modulationTargets,
      nodes: {
        channel: this._channel,
        output: this._channel,
        volume: this._channel.volume,
        ...this._instrument.modulationTargets.nodes
      }
    };

    registerNamedNodes(this._modulationTargets.nodes, effects, this._effects);
  }

  /**
   * Set channel volume.
   * @param {number} db - Volume in dB
   */
  setVolume(db) {
    this._channel.volume.value = db;
    return this;
  }

  /**
   * Mute or unmute the channel.
   * @param {boolean} muted
   */
  setMuted(muted) {
    this._channel.mute = muted;
    return this;
  }

  /**
   * Get the instrument on this channel.
   * @returns {Instrument}
   */
  get instrument() {
    return this._instrument;
  }

  /**
   * Play a sequence of MIDI note events programmatically.
   * @param {Array<{note: string, duration: string}>} notes - Note sequence
   * @param {Object} [options]
   * @param {boolean} [options.loop=false] - Whether to loop the sequence
   * @param {number} [options.bpm] - Override transport BPM for this sequence
   */
  playSequence(notes, options = {}) {
    this.stopSequence();

    const { loop = false, bpm } = options;
    const transport = Tone.getTransport();
    if (bpm) transport.bpm.value = bpm;

    const timedEvents = buildTimedEvents(notes, transport.bpm.value);

    if (loop) {
      // Use a Tone.Part for loop support
      const part = new Tone.Part((time, event) => {
        if (event.rest || event.note == null) {
          return;
        }

        this._instrument.triggerAttackRelease(
          event.note,
          event.duration,
          time,
          event.velocity ?? 1
        );
      }, timedEvents.map(e => [e.time, e]));

      // Calculate total duration for loop length
      const lastEvent = timedEvents[timedEvents.length - 1];
      const secPerBeat = 60 / transport.bpm.value;
      const lastDuration = DURATION_MAP[lastEvent.duration] ?? 0.5;
      // buildTimedEvents always produces '+N.NN' format; slice(1) strips the leading '+'
      const lastTime = parseFloat(lastEvent.time.slice(1));
      const loopEnd = lastTime + lastDuration * secPerBeat;

      part.loopEnd = loopEnd;
      part.loop = true;
      part.start(0);
      this._loop = part;
    } else {
      // One-shot: schedule each event at absolute offset from now
      // buildTimedEvents always produces '+N.NN' format; slice(1) strips the leading '+'
      const now = Tone.now();
      timedEvents.forEach(({ note, duration, time, velocity, rest }) => {
        if (rest || note == null) {
          return;
        }

        const offset = parseFloat(time.slice(1));
        this._instrument.triggerAttackRelease(note, duration, now + offset, velocity ?? 1);
      });
    }

    return this;
  }

  /**
   * Stop any currently playing sequence on this channel.
   */
  stopSequence() {
    if (this._loop) {
      this._loop.stop();
      this._loop.dispose();
      this._loop = null;
    }
    return this;
  }

  /**
   * Dispose and free all resources.
   */
  dispose() {
    this.stopSequence();
    this._instrument.dispose();
    this._effects.forEach(e => e.dispose());
    this._channel.dispose();
  }

  get modulationTargets() {
    return this._modulationTargets;
  }
}
