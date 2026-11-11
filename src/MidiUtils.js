/**
 * Sonance - MidiUtils
 * Utilities for working with MIDI note data and simple note sequences.
 */

/** MIDI note number to note name (e.g. 60 → 'C4') */
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * Convert a MIDI note number to a note name string.
 * @param {number} midi - MIDI note number (0–127)
 * @returns {string} e.g. 'C4'
 */
export function midiToNote(midi) {
  const octave = Math.floor(midi / 12) - 1;
  const name = NOTE_NAMES[midi % 12];
  return `${name}${octave}`;
}

/**
 * Convert a note name to a MIDI number.
 * @param {string} note - e.g. 'C4', 'F#3'
 * @returns {number} MIDI note number
 */
export function noteToMidi(note) {
  const match = note.match(/^([A-G]#?)(-?\d+)$/);
  if (!match) throw new Error(`Invalid note: ${note}`);
  const idx = NOTE_NAMES.indexOf(match[1]);
  const octave = parseInt(match[2], 10);
  return (octave + 1) * 12 + idx;
}

/**
 * Parse a simple text-based note sequence into an array of note events.
 * Format: "C4:8n D4:8n E4:4n ..." where each token is "note:duration".
 * Durations follow Tone.js notation (e.g. 4n = quarter, 8n = eighth, 2n = half).
 *
 * @param {string} sequence - Space-separated note:duration tokens
 * @returns {Array<{note: string, duration: string}>}
 */
export function parseNoteSequence(sequence) {
  return sequence.trim().split(/\s+/).map(token => {
    const [note, duration = '8n'] = token.split(':');
    return { note, duration };
  });
}

/**
 * Build a timed event list from a note sequence.
 * Each event gets an absolute time offset based on accumulated Tone.js durations.
 *
 * @param {Array<{note: string, duration: string}>} notes
 * @param {number} [bpm=120] - Beats per minute (used for duration calculations)
 * @returns {Array<{note: string, duration: string, time: string}>}
 */

/** Duration map: Tone.js notation → beats (quarter note = 1 beat). */
export const DURATION_MAP = {
  '1n': 4, '2n': 2, '4n': 1, '8n': 0.5, '16n': 0.25, '32n': 0.125,
  '1t': 4 / 3, '2t': 2 / 3, '4t': 1 / 3, '8t': 0.25 / 3
};

export function buildTimedEvents(notes, bpm = 120) {
  const secPerBeat = 60 / bpm;

  let offset = 0;
  return notes.map(({ note, duration, ...rest }) => {
    const beats = DURATION_MAP[duration] ?? 0.5;
    const time = offset;
    offset += beats * secPerBeat;
    return { note, duration, time: `+${time}`, ...rest };
  });
}

/**
 * Common musical scales as semitone offsets from root.
 */
export const Scales = {
  major:       [0, 2, 4, 5, 7, 9, 11],
  minor:       [0, 2, 3, 5, 7, 8, 10],
  pentatonic:  [0, 2, 4, 7, 9],
  blues:       [0, 3, 5, 6, 7, 10],
  chromatic:   [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
};

/**
 * Generate a note sequence from a scale, root note, and number of octaves.
 * @param {string} rootNote - e.g. 'C4'
 * @param {number[]} scale - Semitone offsets (e.g. Scales.major)
 * @param {number} [octaves=1]
 * @param {string} [duration='8n']
 * @returns {Array<{note: string, duration: string}>}
 */
export function scaleToNotes(rootNote, scale, octaves = 1, duration = '8n') {
  const rootMidi = noteToMidi(rootNote);
  const notes = [];
  for (let oct = 0; oct < octaves; oct++) {
    for (const semitone of scale) {
      notes.push({ note: midiToNote(rootMidi + semitone + oct * 12), duration });
    }
  }
  return notes;
}
