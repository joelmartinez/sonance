/**
 * Sonance - Instrument
 * A triggerable Tone.js instrument that can be a single synth voice or a layered
 * composite patch. Each layer can shape its own source, effects, and variation.
 */
import * as Tone from 'tone';
import { buildEffectChain } from './EffectChain.js';
import { applyParamVariations, applyTriggerVariations } from './variation.js';

function normalizeEnvelope(envelope = {}, defaults) {
  return {
    attack: envelope.attack ?? defaults.attack,
    decay: envelope.decay ?? defaults.decay,
    sustain: envelope.sustain ?? defaults.sustain,
    release: envelope.release ?? defaults.release
  };
}

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

function applyStaticTranspose(ToneLib, note, semitones = 0) {
  if (note == null || semitones === 0) {
    return note;
  }

  if (Array.isArray(note)) {
    return note.map(entry => applyStaticTranspose(ToneLib, entry, semitones));
  }

  return ToneLib.Frequency(note).transpose(semitones).toFrequency();
}

function createSynthLayer(layer, destination) {
  const output = new Tone.Volume(layer.volume ?? 0);
  output.connect(destination);

  const effects = buildEffectChain(layer.effects ?? [], output);
  const input = effects[0] ?? output;
  const envelope = normalizeEnvelope(layer.envelope, {
    attack: 0.02,
    decay: 0.1,
    sustain: 0.5,
    release: 0.8
  });

  const commonOptions = {
    oscillator: { type: layer.oscillator ?? 'triangle' },
    envelope,
    detune: layer.detune ?? 0
  };

  const polyphonic = layer.polyphonic !== false;
  const source = polyphonic
    ? new Tone.PolySynth(Tone.Synth, {
      ...commonOptions,
      maxPolyphony: layer.maxPolyphony ?? 8
    })
    : new Tone.Synth(commonOptions);

  source.connect(input);

  let pitchEnvelope = null;
  if (!polyphonic && layer.pitchEnvelope) {
    pitchEnvelope = new Tone.FrequencyEnvelope({
      attack: layer.pitchEnvelope.attack ?? 0.001,
      decay: layer.pitchEnvelope.decay ?? 0.04,
      sustain: layer.pitchEnvelope.sustain ?? 0,
      release: layer.pitchEnvelope.release ?? 0.01,
      baseFrequency: layer.pitchEnvelope.baseFrequency ?? 180,
      octaves: layer.pitchEnvelope.octaves ?? 1
    });
    pitchEnvelope.connect(source.oscillator.frequency);
  }

  const targets = {
    source,
    gain: output,
    effects
  };

  registerNamedNodes(targets, layer.effects, effects);

  if (pitchEnvelope) {
    targets.pitchEnvelope = pitchEnvelope;
    if (layer.pitchEnvelope.id) {
      targets[layer.pitchEnvelope.id] = pitchEnvelope;
    }
  }

  return {
    type: 'synth',
    source,
    output,
    effects,
    pitchEnvelope,
    targets,
    layer
  };
}

function createNoiseLayer(layer, destination) {
  const output = new Tone.Volume(layer.volume ?? 0);
  output.connect(destination);

  const effects = buildEffectChain(layer.effects ?? [], output);
  const input = effects[0] ?? output;
  const source = new Tone.NoiseSynth({
    noise: layer.noise ?? { type: 'white' },
    envelope: normalizeEnvelope(layer.envelope, {
      attack: 0.001,
      decay: 0.1,
      sustain: 0,
      release: 0.02
    })
  });

  source.connect(input);

  const targets = {
    source,
    gain: output,
    effects
  };

  registerNamedNodes(targets, layer.effects, effects);

  return {
    type: 'noise',
    source,
    output,
    effects,
    targets,
    layer
  };
}

function createMetalLayer(layer, destination) {
  const output = new Tone.Volume(layer.volume ?? 0);
  output.connect(destination);

  const effects = buildEffectChain(layer.effects ?? [], output);
  const input = effects[0] ?? output;
  const source = new Tone.MetalSynth({
    frequency: layer.frequency ?? 250,
    harmonicity: layer.harmonicity ?? 5.1,
    modulationIndex: layer.modulationIndex ?? 32,
    resonance: layer.resonance ?? 5000,
    octaves: layer.octaves ?? 1.5,
    envelope: {
      attack: layer.envelope?.attack ?? 0.001,
      decay: layer.envelope?.decay ?? 0.08,
      release: layer.envelope?.release ?? 0.02
    }
  });

  source.connect(input);

  const targets = {
    source,
    gain: output,
    effects
  };

  registerNamedNodes(targets, layer.effects, effects);

  return {
    type: 'metal',
    source,
    output,
    effects,
    targets,
    layer
  };
}

function createMembraneLayer(layer, destination) {
  const output = new Tone.Volume(layer.volume ?? 0);
  output.connect(destination);

  const effects = buildEffectChain(layer.effects ?? [], output);
  const input = effects[0] ?? output;
  const source = new Tone.MembraneSynth({
    pitchDecay: layer.pitchDecay ?? 0.05,
    octaves: layer.octaves ?? 4,
    envelope: normalizeEnvelope(layer.envelope, {
      attack: 0.001,
      decay: 0.4,
      sustain: 0,
      release: 0.05
    })
  });

  source.connect(input);

  const targets = {
    source,
    gain: output,
    effects
  };

  registerNamedNodes(targets, layer.effects, effects);

  return {
    type: 'membrane',
    source,
    output,
    effects,
    targets,
    layer
  };
}

function createSamplerLayer(layer, destination) {
  const output = new Tone.Volume(layer.volume ?? 0);
  output.connect(destination);

  const effects = buildEffectChain(layer.effects ?? [], output);
  const input = effects[0] ?? output;
  const source = new Tone.Sampler({
    urls: layer.urls ?? {},
    baseUrl: layer.baseUrl ?? '',
    attack: layer.attack,
    release: layer.release,
    curve: layer.curve
  });

  source.connect(input);

  const targets = {
    source,
    gain: output,
    effects
  };

  registerNamedNodes(targets, layer.effects, effects);

  return {
    type: 'sampler',
    source,
    output,
    effects,
    targets,
    layer
  };
}

function createLayer(layer, destination) {
  switch (layer.type ?? 'synth') {
    case 'noise':
      return createNoiseLayer(layer, destination);
    case 'metal':
      return createMetalLayer(layer, destination);
    case 'membrane':
      return createMembraneLayer(layer, destination);
    case 'sampler':
      return createSamplerLayer(layer, destination);
    case 'synth':
    default:
      return createSynthLayer(layer, destination);
  }
}

function resolveLayerConfig(options = {}) {
  if (Array.isArray(options.layers) && options.layers.length > 0) {
    return options.layers;
  }

  return [{
    type: 'synth',
    oscillator: options.oscillator ?? 'triangle',
    envelope: options.envelope ?? {},
    maxPolyphony: options.maxPolyphony ?? 8,
    polyphonic: true,
    effects: options.layerEffects ?? []
  }];
}

function resolveTrigger(layer, ToneLib, note, duration, velocity, variations) {
  const layeredNote = applyStaticTranspose(
    ToneLib,
    layer.note ?? note,
    layer.transpose ?? 0
  );

  return applyTriggerVariations(ToneLib, {
    note: layeredNote,
    duration: layer.duration ?? duration,
    velocity: (velocity ?? 1) * (layer.velocity ?? 1)
  }, variations);
}

function maybeTriggerPitchEnvelope(layerState, duration, time) {
  if (layerState.pitchEnvelope) {
    layerState.pitchEnvelope.triggerAttackRelease(duration ?? '16n', time);
  }
}

function triggerLayerAttackRelease(layerState, ToneLib, note, duration, time, velocity, variations) {
  const trigger = resolveTrigger(layerState.layer, ToneLib, note, duration, velocity, variations);
  applyParamVariations(layerState.targets, variations);

  switch (layerState.type) {
    case 'noise':
      layerState.source.triggerAttackRelease(trigger.duration ?? '16n', time, trigger.velocity);
      break;
    case 'metal':
      layerState.source.triggerAttack(time, trigger.velocity);
      break;
    default:
      if (trigger.note == null) {
        return;
      }
      maybeTriggerPitchEnvelope(layerState, trigger.duration, time);
      layerState.source.triggerAttackRelease(trigger.note, trigger.duration ?? '8n', time, trigger.velocity);
      break;
  }
}

function triggerLayerAttack(layerState, ToneLib, note, time, velocity, variations) {
  const trigger = resolveTrigger(layerState.layer, ToneLib, note, undefined, velocity, variations);
  applyParamVariations(layerState.targets, variations);

  switch (layerState.type) {
    case 'noise':
      if (typeof layerState.source.triggerAttack === 'function') {
        layerState.source.triggerAttack(time, trigger.velocity);
      }
      break;
    case 'metal':
      layerState.source.triggerAttack(time, trigger.velocity);
      break;
    default:
      if (trigger.note == null) {
        return;
      }
      maybeTriggerPitchEnvelope(layerState, undefined, time);
      layerState.source.triggerAttack(trigger.note, time, trigger.velocity);
      break;
  }
}

function triggerLayerRelease(layerState, note, time) {
  switch (layerState.type) {
    case 'noise':
      if (typeof layerState.source.triggerRelease === 'function') {
        layerState.source.triggerRelease(time);
      }
      break;
    case 'metal':
      break;
    default:
      if (note != null) {
        layerState.source.triggerRelease(note, time);
      } else {
        layerState.source.triggerRelease(time);
      }
      break;
  }
}

export class Instrument {
  /**
   * @param {Object} options
   * @param {string} [options.oscillator='triangle'] - Backward-compatible shorthand for a single synth layer
   * @param {Object} [options.envelope] - Backward-compatible shorthand for a single synth layer
   * @param {number} [options.maxPolyphony=8] - Backward-compatible shorthand for a single synth layer
   * @param {Object[]} [options.layers] - Composite layer descriptors
   * @param {Object[]} [options.effects] - Instrument-level effects applied after layers are mixed
   * @param {Object} [options.variation] - Trigger variation shared by all layers
   */
  constructor(options = {}) {
    this._variation = options.variation ?? null;
    this._output = new Tone.Volume(options.volume ?? 0);
    this._effects = buildEffectChain(options.effects ?? [], this._output);
    this._mixInput = this._effects[0] ?? this._output;
    this._layers = resolveLayerConfig(options).map(layer => createLayer(layer, this._mixInput));
    this._modulationTargets = {
      output: this._output,
      mix: this._mixInput,
      effects: this._effects,
      layers: {},
      nodes: {
        output: this._output,
        mix: this._mixInput,
        volume: this._output.volume
      }
    };

    registerNamedNodes(this._modulationTargets.nodes, options.effects, this._effects);

    this._layers.forEach((layer, index) => {
      const layerKey = layer.layer.id ?? `layer${index}`;
      this._modulationTargets.layers[layerKey] = layer.targets;
      this._modulationTargets.nodes[layerKey] = layer.targets;

      Object.entries(layer.targets).forEach(([name, node]) => {
        if (!(name in this._modulationTargets.nodes)) {
          this._modulationTargets.nodes[name] = node;
        }
      });
    });
  }

  connect(destination) {
    this._output.disconnect();
    this._output.connect(destination);
    return this;
  }

  disconnect() {
    this._output.disconnect();
    return this;
  }

  setOscillator(type) {
    this._layers.forEach(layer => {
      if (layer.type === 'synth') {
        layer.source.set({ oscillator: { type } });
      }
    });
    return this;
  }

  setEnvelope(envelope) {
    this._layers.forEach(layer => {
      if (layer.type === 'synth') {
        layer.source.set({ envelope });
      }
    });
    return this;
  }

  triggerAttackRelease(notes, duration = '8n', time = undefined, velocity = 1) {
    const variations = this._variation ? [this._variation] : [];
    this._layers.forEach(layer => {
      const layerVariations = [...variations, layer.layer.variation].filter(Boolean);
      triggerLayerAttackRelease(layer, Tone, notes, duration, time, velocity, layerVariations);
    });
    return this;
  }

  triggerAttack(notes, time = undefined, velocity = 1) {
    const variations = this._variation ? [this._variation] : [];
    this._layers.forEach(layer => {
      const layerVariations = [...variations, layer.layer.variation].filter(Boolean);
      triggerLayerAttack(layer, Tone, notes, time, velocity, layerVariations);
    });
    return this;
  }

  triggerRelease(notes, time = undefined) {
    this._layers.forEach(layer => {
      triggerLayerRelease(layer, notes, time);
    });
    return this;
  }

  dispose() {
    this._layers.forEach(layer => {
      if (layer.pitchEnvelope) {
        layer.pitchEnvelope.dispose();
      }
      layer.source.dispose();
      layer.effects.forEach(effect => effect.dispose());
      layer.output.dispose();
    });
    this._effects.forEach(effect => effect.dispose());
    this._output.dispose();
  }

  /** Underlying Tone node for advanced usage. */
  get toneNode() {
    if (this._layers.length === 1 && this._effects.length === 0) {
      return this._layers[0].source;
    }

    return this._output;
  }

  get outputNode() {
    return this._output;
  }

  get modulationTargets() {
    return this._modulationTargets;
  }
}
