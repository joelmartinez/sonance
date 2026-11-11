import { buildTimedEvents } from '../src/MidiUtils.js';

describe('Sonance MidiUtils', () => {
  test('preserves metadata while computing event timings', () => {
    const events = buildTimedEvents([
      { note: 'C4', duration: '8n', velocity: 0.8 },
      { note: null, duration: '8n', rest: true },
      { note: 'G4', duration: '4n', velocity: 0.6 }
    ], 120);

    expect(events).toEqual([
      { note: 'C4', duration: '8n', time: '+0', velocity: 0.8 },
      { note: null, duration: '8n', time: '+0.25', rest: true },
      { note: 'G4', duration: '4n', time: '+0.5', velocity: 0.6 }
    ]);
  });
});
