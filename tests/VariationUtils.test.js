import { applyParamVariations, applyTriggerVariations } from '../src/variation.js';

const NOTE_FREQUENCIES = {
  C4: 261.6255653005986,
  E4: 329.6275569128699,
  G4: 391.99543598174927
};

function toFrequency(value) {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string' && value.endsWith('Hz')) {
    return parseFloat(value.slice(0, -2));
  }

  return NOTE_FREQUENCIES[value];
}

const ToneMock = {
  Frequency(value) {
    const baseFrequency = toFrequency(value);
    return {
      transpose(semitones) {
        return {
          toFrequency() {
            return baseFrequency * (2 ** (semitones / 12));
          }
        };
      }
    };
  },
  Time(value) {
    return {
      toSeconds() {
        if (typeof value === 'number') {
          return value;
        }

        return {
          '4n': 0.5,
          '8n': 0.25,
          '16n': 0.125
        }[value];
      }
    };
  }
};

describe('Sonance variation utilities', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('applies pitch, duration, and velocity variation to a trigger', () => {
    jest.spyOn(Math, 'random')
      .mockReturnValueOnce(1)
      .mockReturnValueOnce(1)
      .mockReturnValueOnce(1);

    const result = applyTriggerVariations(ToneMock, {
      note: 'C4',
      duration: '8n',
      velocity: 0.5
    }, [{
      detune: 25,
      duration: 0.1,
      velocity: 0.2
    }]);

    expect(result.note).toBeCloseTo(
      NOTE_FREQUENCIES.C4 * (2 ** ((25 / 100) / 12)),
      6
    );
    expect(result.duration).toBeCloseTo(0.275, 6);
    expect(result.velocity).toBeCloseTo(0.6, 6);
  });

  test('applies multiply and add parameter variations to numeric targets', () => {
    jest.spyOn(Math, 'random')
      .mockReturnValueOnce(1)
      .mockReturnValueOnce(1);

    const targets = {
      filter: {
        frequency: { value: 1000 }
      },
      source: {
        envelope: {
          decay: 0.1
        }
      }
    };

    applyParamVariations(targets, [{
      params: {
        'filter.frequency': 0.2,
        'source.envelope.decay': { min: -0.01, max: 0.01, mode: 'add' }
      }
    }]);

    expect(targets.filter.frequency.value).toBeCloseTo(1200, 6);
    expect(targets.source.envelope.decay).toBeCloseTo(0.11, 6);
  });
});
