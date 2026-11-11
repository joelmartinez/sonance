/**
 * Sonance - SonanceSceneManager
 * Utilities for loading, saving, and managing Sonance scenes.
 *
 * A "scene" is a plain JSON object describing:
 *   - modulators  : array of modulator definitions  { id, type, ...options }
 *   - sounds      : array of Sound definitions      { id, ...soundOptions }
 *   - soundtracks : array of Soundtrack definitions { name, bpm, channels: {...} }
 *
 * Usage:
 *   import { SonanceSceneManager } from './SonanceSceneManager.js';
 *
 *   // Apply a built-in preset
 *   const preset = SonanceSceneManager.getPreset('Ambient Drone');
 *   SonanceSceneManager.applyScene(engine, preset);
 *
 *   // Save / load from localStorage
 *   SonanceSceneManager.save('my-scene', myDef);
 *   const saved = SonanceSceneManager.load('my-scene');
 *
 *   // Export / import as JSON file
 *   SonanceSceneManager.download(myDef);
 *   const imported = await SonanceSceneManager.upload();
 */

const LS_PREFIX = 'sonance-scene:';

// ─── Built-in presets ─────────────────────────────────────────────────────────

const BUILTIN_PRESETS = {
  'Ambient Drone': {
    name: 'Ambient Drone',
    description: 'Sine-wave drone with a slow LFO filter sweep.',
    modulators: [
      { id: 'clock',      type: 'square',  frequency: 0.5 },
      { id: 'filterSweep', type: 'sine',   clockRef: 'clock', divisor: 1, amplitude: 1, offset: 0 },
      { id: 'spaceSweep', type: 'triangle', clockRef: 'clock', divisor: 2, amplitude: 1, offset: 0 }
    ],
    sounds: [],
    soundtracks: [
      {
        name: 'drone',
        bpm: 80,
        channels: {
          pad: {
            instrument: {
              oscillator: 'sawtooth',
              envelope: { attack: 0.5, decay: 0.2, sustain: 0.8, release: 2.0 },
              maxPolyphony: 4,
              effects: [
                { id: 'padFilter', type: 'filter', filterType: 'lowpass', frequency: 2000, Q: 2, rolloff: -24 },
                { id: 'padReverb', type: 'reverb', decay: 5.0, wet: 0.4 }
              ]
            },
            volume: -12,
            loop: true,
            sequence: [
              { note: ['C3', 'E3', 'G3'], duration: '2n' },
              { note: ['F3', 'A3', 'C4'], duration: '2n' },
              { note: ['G3', 'B3', 'D4'], duration: '2n' },
              { note: ['C3', 'E3', 'G3'], duration: '2n' }
            ]
          }
        }
      }
    ]
  },

  'Lead Synth': {
    name: 'Lead Synth',
    description: 'Sawtooth lead with a tremolo and vibrato from relative-clock LFOs.',
    modulators: [
      { id: 'clock',   type: 'square',   frequency: 1.33 },
      { id: 'tremolo', type: 'triangle', clockRef: 'clock', divisor: 2 },
      { id: 'vibrato', type: 'sine',     clockRef: 'clock', multiplier: 4 }
    ],
    sounds: [
      { id: 'lead', oscillator: 'square', note: 'E4', duration: '8n', volume: -8 }
    ],
    soundtracks: [
      {
        name: 'lead-track',
        bpm: 120,
        channels: {
          bass: {
            instrument: {
              oscillator: 'sawtooth',
              envelope: { attack: 0.01, decay: 0.18, sustain: 0.7, release: 0.4 }
            },
            volume: -8,
            loop: true,
            sequence: [
              { note: 'C2', duration: '4n' }, { note: 'C2', duration: '4n' },
              { note: 'G2', duration: '4n' }, { note: 'F2', duration: '4n' }
            ]
          }
        }
      }
    ]
  },

  'Drum Machine': {
    name: 'Drum Machine',
    description: 'Kick, snare, and hi-hat driven by relative clock modulators.',
    modulators: [
      { id: 'clock',  type: 'square', frequency: 2 },
      { id: 'half',   type: 'square', clockRef: 'clock', divisor: 2 },
      { id: 'double', type: 'square', clockRef: 'clock', multiplier: 2 }
    ],
    sounds: [
      {
        id: 'kick',
        layers: [
          { type: 'membrane', pitchDecay: 0.05, octaves: 4.2,
            envelope: { attack: 0.001, decay: 0.45, sustain: 0, release: 0.05 }, volume: -1 },
          { type: 'noise', envelope: { attack: 0.001, decay: 0.018, sustain: 0, release: 0.01 }, volume: -20,
            effects: [{ type: 'filter', filterType: 'highpass', frequency: 2400, rolloff: -24 }] }
        ],
        note: 'C1', duration: '8n'
      },
      {
        id: 'snare',
        layers: [
          { type: 'synth', polyphonic: false, oscillator: 'triangle', note: '185Hz',
            envelope: { attack: 0.001, decay: 0.085, sustain: 0, release: 0.02 }, volume: -7 },
          { type: 'noise', envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.02 }, volume: -8,
            effects: [{ type: 'filter', filterType: 'highpass', frequency: 1800, rolloff: -24 }] }
        ],
        note: 'C4', duration: '16n'
      },
      {
        id: 'hihat',
        layers: [
          { type: 'metal', frequency: 260, harmonicity: 5.1, modulationIndex: 30,
            resonance: 4600, octaves: 1.5,
            envelope: { attack: 0.001, decay: 0.08, release: 0.02 }, volume: -11,
            effects: [{ type: 'filter', filterType: 'highpass', frequency: 7200, rolloff: -24 }] }
        ],
        note: 'C5', duration: '32n'
      }
    ],
    soundtracks: []
  },

  'Clock & Dividers': {
    name: 'Clock & Dividers',
    description: 'Demonstrates relative modulators: one master clock driving divisions and multiples.',
    modulators: [
      { id: 'masterClock', type: 'square',   frequency: 2 },
      { id: 'half',        type: 'square',   clockRef: 'masterClock', divisor: 2 },
      { id: 'quarter',     type: 'triangle', clockRef: 'masterClock', divisor: 4 },
      { id: 'double',      type: 'sine',     clockRef: 'masterClock', multiplier: 2 }
    ],
    sounds: [],
    soundtracks: [
      {
        name: 'clocks',
        bpm: 120,
        channels: {
          bass: {
            instrument: {
              oscillator: 'sawtooth',
              envelope: { attack: 0.01, decay: 0.16, sustain: 0.72, release: 0.38 },
              effects: [
                { id: 'bassFilter', type: 'filter', filterType: 'lowpass', frequency: 800, Q: 4, rolloff: -24 }
              ]
            },
            volume: -8,
            loop: true,
            sequence: [
              { note: 'C2', duration: '4n' }, { note: 'C2', duration: '4n' },
              { note: 'G2', duration: '4n' }, { note: 'F2', duration: '4n' },
              { note: 'C2', duration: '4n' }, { note: 'C2', duration: '4n' },
              { note: 'Ab2', duration: '4n' }, { note: 'G2', duration: '4n' }
            ]
          },
          keys: {
            instrument: {
              oscillator: 'triangle',
              envelope: { attack: 0.002, decay: 1.1, sustain: 0, release: 0.35 }
            },
            volume: -18,
            loop: true,
            sequence: [
              { note: 'E4', duration: '8n' }, { note: 'G4', duration: '8n' },
              { note: 'A4', duration: '4n' }, { note: 'G4', duration: '8n' },
              { note: 'E4', duration: '8n' }, { note: 'C4', duration: '4n' }
            ]
          }
        }
      }
    ]
  }
};

// ─── SonanceSceneManager ──────────────────────────────────────────────────────

export class SonanceSceneManager {
  /**
   * Return all built-in preset names.
   * @returns {string[]}
   */
  static listPresets() {
    return Object.keys(BUILTIN_PRESETS);
  }

  /**
   * Return a built-in preset definition by name.
   * @param {string} name
   * @returns {Object|null}
   */
  static getPreset(name) {
    return BUILTIN_PRESETS[name] ?? null;
  }

  /**
   * Apply a scene definition to an engine.
   * Creates the modulators, sounds, and soundtracks described in the definition.
   * Existing items with the same id/name are replaced.
   * @param {import('./SonanceEngine.js').SonanceEngine} engine
   * @param {Object} definition
   */
  static applyScene(engine, definition) {
    const { modulators = [], sounds = [], soundtracks = [] } = definition;

    if (modulators.length > 0 && !engine.modulation) {
      console.warn(`[SonanceSceneManager] Skipping ${modulators.length} modulator(s) (${modulators.map(m => m.id).join(', ')}): engine has no modulation system.`);
    } else {
      modulators.forEach(({ id, type, ...opts }) => {
        engine.createModulator(id, { type, ...opts });
      });
    }

    sounds.forEach(({ id, ...opts }) => {
      engine.createSound(id, opts);
    });

    soundtracks.forEach((stDef) => {
      const soundtrack = engine.createSoundtrack(stDef.name, { bpm: stDef.bpm ?? 120 });
      Object.entries(stDef.channels ?? {}).forEach(([channelName, ch]) => {
        const channel = soundtrack.addChannel(channelName, {
          instrument: ch.instrument,
          effects: ch.effects,
          volume: ch.volume ?? 0
        });
        if (Array.isArray(ch.sequence) && ch.sequence.length > 0) {
          channel.playSequence(ch.sequence, { loop: ch.loop !== false });
        }
      });
    });
  }

  // ─── localStorage ────────────────────────────────────────────────────────────

  /**
   * Save a scene definition to localStorage under the given name.
   * @param {string} name
   * @param {Object} definition
   */
  static save(name, definition) {
    if (typeof localStorage === 'undefined') {
      console.warn('[SonanceSceneManager] localStorage is not available.');
      return;
    }
    localStorage.setItem(`${LS_PREFIX}${name}`, JSON.stringify(definition));
  }

  /**
   * Load a scene definition from localStorage by name.
   * @param {string} name
   * @returns {Object|null}
   */
  static load(name) {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    const raw = localStorage.getItem(`${LS_PREFIX}${name}`);
    if (!raw) {
      return null;
    }
    try {
      const parsed = JSON.parse(raw);
      return SonanceSceneManager._validateDef(parsed) ? parsed : null;
    } catch {
      console.warn(`[SonanceSceneManager] Could not parse scene '${name}'.`);
      return null;
    }
  }

  /**
   * List all scene names saved in localStorage.
   * @returns {string[]}
   */
  static listSaved() {
    if (typeof localStorage === 'undefined') {
      return [];
    }
    return Object.keys(localStorage)
      .filter(k => k.startsWith(LS_PREFIX))
      .map(k => k.slice(LS_PREFIX.length));
  }

  /**
   * Delete a saved scene from localStorage.
   * @param {string} name
   */
  static deleteSaved(name) {
    if (typeof localStorage === 'undefined') {
      return;
    }
    localStorage.removeItem(`${LS_PREFIX}${name}`);
  }

  // ─── JSON file I/O ────────────────────────────────────────────────────────────

  /**
   * Trigger a browser download of the scene definition as a JSON file.
   * @param {Object} definition
   * @param {string} [filename]
   */
  static download(definition, filename = 'sonance-scene.json') {
    if (typeof document === 'undefined') {
      return;
    }
    const json = JSON.stringify(definition, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Open a file-picker and parse the selected JSON file as a scene definition.
   * @returns {Promise<Object>} Resolves with the parsed scene definition.
   */
  static upload() {
    return new Promise((resolve, reject) => {
      if (typeof document === 'undefined') {
        reject(new Error('No document available'));
        return;
      }
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) {
          reject(new Error('No file selected'));
          return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const parsed = JSON.parse(e.target.result);
            if (!SonanceSceneManager._validateDef(parsed)) {
              reject(new Error('File does not contain a valid Sonance scene definition'));
              return;
            }
            resolve(parsed);
          } catch (err) {
            reject(new Error(`Invalid JSON: ${err.message}`));
          }
        };
        reader.onerror = () => reject(new Error('File read error'));
        reader.readAsText(file);
      };
      input.click();
    });
  }

  /**
   * Basic structural validation: checks that the parsed value is a plain object
   * with at least one recognised top-level array (modulators, sounds, soundtracks,
   * or nodes). Returns true when the definition looks valid, false otherwise.
   * @param {*} def
   * @returns {boolean}
   */
  static _validateDef(def) {
    if (!def || typeof def !== 'object' || Array.isArray(def)) {
      console.warn('[SonanceSceneManager] Scene definition must be a plain object.');
      return false;
    }
    const hasArrays =
      Array.isArray(def.modulators) ||
      Array.isArray(def.sounds) ||
      Array.isArray(def.soundtracks) ||
      Array.isArray(def.nodes);
    if (!hasArrays) {
      console.warn('[SonanceSceneManager] Scene definition has no recognised arrays (modulators, sounds, soundtracks, nodes).');
      return false;
    }
    return true;
  }
}
