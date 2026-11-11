/**
 * Sonance example: Audio Demo
 *
 * Standalone rebuild of the host site's photonics audio-demo. The 3D cubes
 * are now plain page tiles and the camera-distance modulator is now a
 * distance slider, but the sounds, the ambient soundtrack, and the shared
 * modulators sweeping the filters are the host demo's own. It imports
 * @codecube/sonance as an ES module and injects the example modulation
 * system through options.modulation.
 */
import Sonance, { SonanceEngine, Tone } from '@codecube/sonance';
import { createExampleModulation } from '../shared/example-modulation.js';

const MODULATION_DEFAULTS = {
  bassFilter: 16000, hatFilter: 14000, padFilter: 12000, padReverbWet: 0.05,
  padVolume: -20, leadFilter: 12000, leadVolume: -18, snareVolume: -10,
  entityFilter: 16000, entityReverbWet: 0.08
};

const KICK_PATCH = {
  variation: { detune: 4, velocity: 0.04 },
  layers: [
    { id: 'body', type: 'membrane', note: 'C1', pitchDecay: 0.05, octaves: 4.2, envelope: { attack: 0.001, decay: 0.45, sustain: 0, release: 0.05 }, volume: -1 },
    { id: 'click', type: 'noise', envelope: { attack: 0.001, decay: 0.018, sustain: 0, release: 0.01 }, volume: -20, effects: [{ id: 'clickFilter', type: 'filter', filterType: 'highpass', frequency: 2400, rolloff: -24 }] }
  ]
};

const SNARE_PATCH = {
  variation: { velocity: 0.08 },
  effects: [{ type: 'compressor', threshold: -20, ratio: 3, attack: 0.003, release: 0.12 }],
  layers: [
    { id: 'body', type: 'synth', polyphonic: false, note: '185Hz', oscillator: 'triangle', envelope: { attack: 0.001, decay: 0.085, sustain: 0, release: 0.02 }, pitchEnvelope: { attack: 0.001, decay: 0.045, sustain: 0, release: 0.01, baseFrequency: 175, octaves: 1.4 }, volume: -7, variation: { detune: 10, params: { 'pitchEnvelope.baseFrequency': 0.05, 'source.envelope.decay': 0.12 } } },
    { id: 'sizzle', type: 'noise', envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.02 }, volume: -8, effects: [{ id: 'noiseFilter', type: 'filter', filterType: 'highpass', frequency: 1800, rolloff: -24 }, { type: 'distortion', distortion: 0.08, wet: 1 }], variation: { params: { 'noiseFilter.frequency': 0.08, 'source.envelope.decay': 0.12 } } },
    { id: 'click', type: 'noise', envelope: { attack: 0.001, decay: 0.022, sustain: 0, release: 0.01 }, volume: -19, effects: [{ id: 'clickBand', type: 'filter', filterType: 'bandpass', frequency: 4200, Q: 4, rolloff: -24 }], variation: { params: { 'clickBand.frequency': 0.05 } } }
  ]
};

const HIHAT_PATCH = {
  variation: { velocity: 0.08 },
  layers: [
    { id: 'metal', type: 'metal', frequency: 260, harmonicity: 5.1, modulationIndex: 30, resonance: 4600, octaves: 1.5, envelope: { attack: 0.001, decay: 0.08, release: 0.02 }, volume: -11, effects: [{ id: 'hatFilter', type: 'filter', filterType: 'highpass', frequency: 7200, rolloff: -24 }, { type: 'distortion', distortion: 0.03, wet: 0.4 }], variation: { params: { 'source.frequency': 0.04, 'source.envelope.decay': 0.18, 'hatFilter.frequency': 0.05 } } },
    { id: 'air', type: 'noise', envelope: { attack: 0.001, decay: 0.03, sustain: 0, release: 0.01 }, volume: -17, effects: [{ id: 'airFilter', type: 'filter', filterType: 'highpass', frequency: 9200, rolloff: -24 }], variation: { params: { 'source.envelope.decay': 0.2, 'airFilter.frequency': 0.04 } } }
  ]
};

const PIANOISH_PATCH = {
  variation: { detune: 3, velocity: 0.05 },
  effects: [{ type: 'filter', filterType: 'lowpass', frequency: 3600, rolloff: -24 }, { type: 'reverb', decay: 2.2, wet: 0.18 }],
  layers: [
    { id: 'core', type: 'synth', polyphonic: false, oscillator: 'triangle', envelope: { attack: 0.002, decay: 1.1, sustain: 0, release: 0.35 }, volume: -8 },
    { id: 'shimmer', type: 'synth', polyphonic: false, oscillator: 'sine', transpose: 12, envelope: { attack: 0.001, decay: 0.55, sustain: 0, release: 0.22 }, volume: -18 },
    { id: 'hammer', type: 'noise', envelope: { attack: 0.001, decay: 0.025, sustain: 0, release: 0.01 }, volume: -24, effects: [{ id: 'hammerFilter', type: 'filter', filterType: 'bandpass', frequency: 2600, Q: 2, rolloff: -24 }], variation: { params: { 'hammerFilter.frequency': 0.08 } } }
  ]
};

const SPHERE_SOUNDS = [
  { id: 'kick', note: 'C1', duration: '8n', color: '#ff4444', label: 'kick', preview: 'C1', sound: KICK_PATCH },
  { id: 'snare', note: 'C4', duration: '16n', color: '#44ff44', label: 'snare', preview: 'layered', sound: SNARE_PATCH },
  { id: 'hihat', note: 'C5', duration: '32n', color: '#4444ff', label: 'hat', preview: 'metal+air', sound: HIHAT_PATCH },
  { id: 'piano', note: 'G4', duration: '4n', color: '#ffaa00', label: 'piano-ish', preview: 'G4', sound: PIANOISH_PATCH }
];

const BASS_NOTES = [
  { note: 'C2', duration: '4n' }, { note: 'C2', duration: '4n' },
  { note: 'G2', duration: '4n' }, { note: 'F2', duration: '4n' },
  { note: 'C2', duration: '4n' }, { note: 'C2', duration: '4n' },
  { note: 'Ab2', duration: '4n' }, { note: 'G2', duration: '4n' }
];

const LEAD_NOTES = [
  { note: 'E4', duration: '8n', velocity: 0.82 }, { note: 'G4', duration: '8n', velocity: 0.72 },
  { note: 'A4', duration: '4n', velocity: 0.9 }, { note: 'G4', duration: '8n', velocity: 0.75 },
  { note: 'E4', duration: '8n', velocity: 0.78 }, { note: 'C4', duration: '4n', velocity: 0.88 },
  { note: 'D4', duration: '8n', velocity: 0.74 }, { note: 'E4', duration: '4n', velocity: 0.9 }
];

const PAD_CHORDS = [
  { note: ['C3', 'E3', 'G3'], duration: '2n' },
  { note: ['F3', 'A3', 'C4'], duration: '2n' },
  { note: ['G3', 'B3', 'D4'], duration: '2n' },
  { note: ['C3', 'E3', 'G3'], duration: '2n' }
];

const SNARE_PATTERN = [
  { note: null, duration: '8n', rest: true }, { note: 'C4', duration: '8n', velocity: 0.95 },
  { note: null, duration: '8n', rest: true }, { note: null, duration: '8n', rest: true },
  { note: null, duration: '8n', rest: true }, { note: 'C4', duration: '8n', velocity: 0.85 },
  { note: null, duration: '8n', rest: true }, { note: null, duration: '8n', rest: true }
];

const HAT_PATTERN = Array.from({ length: 16 }, (_, i) => ({
  note: 'C5', duration: '16n', velocity: [0.62, 0.42, 0.58, 0.44][i % 4]
}));

let distanceValue = 0.5;

function setToneParam(param, value) {
  if (!param) return;
  if (typeof param.rampTo === 'function') param.rampTo(value, 0.02);
  else if ('value' in param) param.value = value;
}

export function startAudioDemo(doc = document) {
  const modulation = createExampleModulation();
  const engine = new SonanceEngine({ modulation });
  const status = doc.querySelector('#sonance-status');
  const readout = doc.querySelector('#mod-readouts');
  const tiles = [...doc.querySelectorAll('[data-sound]')];

  const entityFilter = new Tone.Filter({ type: 'lowpass', frequency: MODULATION_DEFAULTS.entityFilter, Q: 3, rolloff: -24 });
  const entityReverb = new Tone.Reverb({ decay: 2.5, wet: MODULATION_DEFAULTS.entityReverbWet });
  entityFilter.connect(entityReverb);
  entityReverb.toDestination();

  SPHERE_SOUNDS.forEach(def => {
    const sound = engine.createSound(def.id, { note: def.note, duration: def.duration, volume: -6, ...def.sound });
    sound.connect(entityFilter);
  });

  const ambientTrack = engine.createSoundtrack('ambient', { bpm: 100 });
  const bassChannel = ambientTrack.addChannel('bass', {
    instrument: { oscillator: 'sawtooth', envelope: { attack: 0.01, decay: 0.16, sustain: 0.72, release: 0.38 } },
    effects: [
      { id: 'bassFilter', type: 'filter', filterType: 'lowpass', frequency: MODULATION_DEFAULTS.bassFilter, Q: 4.5, rolloff: -24 },
      { type: 'echo', delayTime: '8n', feedback: 0.2, wet: 0.25 }
    ],
    volume: -5
  });
  bassChannel.playSequence(BASS_NOTES, { loop: true });

  const leadChannel = ambientTrack.addChannel('keys', {
    instrument: PIANOISH_PATCH,
    effects: [{ id: 'leadFilter', type: 'filter', filterType: 'lowpass', frequency: MODULATION_DEFAULTS.leadFilter, Q: 2.8, rolloff: -24 }],
    volume: MODULATION_DEFAULTS.leadVolume
  });
  leadChannel.playSequence(LEAD_NOTES, { loop: true });

  const padChannel = ambientTrack.addChannel('pad', {
    instrument: { oscillator: 'sawtooth', envelope: { attack: 0.3, decay: 0.5, sustain: 0.7, release: 1.5 }, maxPolyphony: 4 },
    effects: [
      { id: 'padFilter', type: 'filter', filterType: 'lowpass', frequency: MODULATION_DEFAULTS.padFilter, Q: 3.2, rolloff: -24 },
      { type: 'chorus', depth: 0.5, wet: 0.4 },
      { id: 'padSpace', type: 'reverb', decay: 6.5, wet: MODULATION_DEFAULTS.padReverbWet }
    ],
    volume: MODULATION_DEFAULTS.padVolume
  });
  padChannel.playSequence(PAD_CHORDS, { loop: true });

  const snareChannel = ambientTrack.addChannel('snare', { instrument: SNARE_PATCH, volume: MODULATION_DEFAULTS.snareVolume });
  snareChannel.playSequence(SNARE_PATTERN, { loop: true });

  const hatChannel = ambientTrack.addChannel('hat', { instrument: HIHAT_PATCH, volume: -16 });
  hatChannel.playSequence(HAT_PATTERN, { loop: true });

  const toneRefs = {
    bassFilterFreq: bassChannel._effects[0]?.frequency,
    padFilterFreq: padChannel._effects[0]?.frequency,
    padSpaceWet: padChannel._effects[2]?.wet,
    padVolume: padChannel._instrument._output?.volume,
    leadFilterFreq: leadChannel._effects[0]?.frequency,
    leadVolume: leadChannel._channel?.volume,
    snareVolume: snareChannel._instrument._output?.volume,
    hatFilterFreq: hatChannel._instrument._layers?.[0]?.effects?.[0]?.frequency,
    entityFilterFreq: entityFilter?.frequency,
    entityReverbWet: entityReverb?.wet
  };

  modulation.createModulator('bassSweep', { type: 'sine', frequency: 0.24, phase: 0.15 });
  modulation.createModulator('sharedPulse', { type: 'triangle', frequency: 0.65 });
  modulation.createModulator('distance', { type: 'value', getValue: () => distanceValue });

  const bind = (id, source, setter, extra) => modulation.bind({ id, source, setter, ...extra });
  bind('bass-filter-sweep', 'bassSweep', v => setToneParam(toneRefs.bassFilterFreq, v), { baseValue: MODULATION_DEFAULTS.bassFilter, min: 8, max: 16000, amount: 1 });
  bind('entity-filter-sweep', 'bassSweep', v => setToneParam(toneRefs.entityFilterFreq, v), { baseValue: MODULATION_DEFAULTS.entityFilter, min: 80, max: 16000, amount: 1 });
  bind('shared-hat-sweep', 'sharedPulse', v => setToneParam(toneRefs.hatFilterFreq, v), { baseValue: MODULATION_DEFAULTS.hatFilter, min: 200, max: 16000, amount: 1 });
  bind('shared-snare-volume', 'sharedPulse', v => setToneParam(toneRefs.snareVolume, v), { baseValue: MODULATION_DEFAULTS.snareVolume, min: -28, max: 2, amount: 1 });
  bind('shared-pad-filter', 'sharedPulse', v => setToneParam(toneRefs.padFilterFreq, v), { baseValue: MODULATION_DEFAULTS.padFilter, min: 40, max: 16000, amount: 1 });
  bind('shared-pad-space', 'sharedPulse', v => setToneParam(toneRefs.padSpaceWet, v), { baseValue: MODULATION_DEFAULTS.padReverbWet, min: 0, max: 0.98, amount: 1 });
  bind('shared-pad-volume', 'sharedPulse', v => setToneParam(toneRefs.padVolume, v), { baseValue: MODULATION_DEFAULTS.padVolume, min: -32, max: -4, amount: 1 });
  bind('distance-lead-filter', 'distance', v => setToneParam(toneRefs.leadFilterFreq, v), { baseValue: MODULATION_DEFAULTS.leadFilter, inputRange: [0, 1], min: 80, max: 16000 });
  bind('distance-lead-volume', 'distance', v => setToneParam(toneRefs.leadVolume, v), { baseValue: MODULATION_DEFAULTS.leadVolume, inputRange: [0, 1], min: -30, max: -2 });
  bind('distance-entity-reverb', 'distance', v => setToneParam(toneRefs.entityReverbWet, v), { baseValue: MODULATION_DEFAULTS.entityReverbWet, inputRange: [0, 1], min: 0.02, max: 0.85 });
  bind('shared-tile-glow', 'sharedPulse', v => {
    const glow = 0.35 + ((v + 1) / 2) * 0.65;
    tiles.forEach(t => { t.style.opacity = String(glow); });
  }, {});

  let modulatorsEnabled = true;
  let rafId = null;
  let lastTs = null;

  function applyBypass() {
    setToneParam(toneRefs.bassFilterFreq, MODULATION_DEFAULTS.bassFilter);
    setToneParam(toneRefs.hatFilterFreq, MODULATION_DEFAULTS.hatFilter);
    setToneParam(toneRefs.padFilterFreq, MODULATION_DEFAULTS.padFilter);
    setToneParam(toneRefs.padSpaceWet, MODULATION_DEFAULTS.padReverbWet);
    setToneParam(toneRefs.padVolume, MODULATION_DEFAULTS.padVolume);
    setToneParam(toneRefs.leadFilterFreq, MODULATION_DEFAULTS.leadFilter);
    setToneParam(toneRefs.leadVolume, MODULATION_DEFAULTS.leadVolume);
    setToneParam(toneRefs.snareVolume, MODULATION_DEFAULTS.snareVolume);
    setToneParam(toneRefs.entityFilterFreq, MODULATION_DEFAULTS.entityFilter);
    setToneParam(toneRefs.entityReverbWet, MODULATION_DEFAULTS.entityReverbWet);
  }

  function frame(ts) {
    const delta = lastTs === null ? 0 : Math.min(0.1, (ts - lastTs) / 1000);
    lastTs = ts;
    if (modulatorsEnabled) {
      modulation.update(delta, {});
      if (readout) {
        readout.textContent = `bass sweep ${modulation.sample('bassSweep').toFixed(2)} · shared pulse ${modulation.sample('sharedPulse').toFixed(2)} · distance ${Math.round(distanceValue * 100)}%`;
      }
    }
    rafId = requestAnimationFrame(frame);
  }
  rafId = requestAnimationFrame(frame);

  tiles.forEach(tile => {
    tile.addEventListener('click', async () => {
      await engine.start();
      engine.triggerSound(tile.dataset.sound);
      tile.classList.add('pulse');
      setTimeout(() => tile.classList.remove('pulse'), 180);
    });
  });

  doc.querySelector('#sonance-play')?.addEventListener('click', async () => {
    await engine.start();
    await ambientTrack.play();
    if (status) status.textContent = 'Ambient track playing';
  });
  doc.querySelector('#sonance-stop')?.addEventListener('click', () => {
    ambientTrack.stop();
    if (status) status.textContent = 'Stopped';
  });
  doc.querySelector('#sonance-distance')?.addEventListener('input', e => {
    distanceValue = Number(e.currentTarget.value) / 100;
  });
  doc.querySelector('#sonance-modulators-enabled')?.addEventListener('change', e => {
    modulatorsEnabled = e.currentTarget.checked;
    if (!modulatorsEnabled) applyBypass();
  });

  return {
    engine, ambientTrack, modulation, Sonance,
    stop() {
      if (rafId) cancelAnimationFrame(rafId);
      ambientTrack.stop();
      engine.dispose();
      entityFilter.dispose();
      entityReverb.dispose();
    }
  };
}

if (typeof document !== 'undefined') {
  window.__sonanceAudioDemo = startAudioDemo(document);
}
