/**
 * Example modulation system for the Sonance examples.
 *
 * Sonance ships no built-in modulation. This small system is example code,
 * not part of the library: it implements the five methods the engine calls
 * on an injected system (createModulator, getModulator, bind, update,
 * dispose) plus the sample and reset helpers the examples use, and it is
 * passed to the engine only through options.modulation.
 *
 * Modulators are sine, triangle, or square waves, or a value modulator
 * whose getValue callback supplies the current value (a slider, say).
 * A modulator may name a clockRef with a divisor or multiplier, in which
 * case its frequency follows that clock modulator's frequency. Values are
 * bipolar (-1 to 1) for waves; bindings map a source value onto a setter:
 * with an inputRange the value is first normalized from that range, and
 * with min and max the result is mapped across that span, otherwise the
 * setter receives baseValue plus value times amount.
 */

function waveValue(type, phase) {
  const p = phase - Math.floor(phase);
  if (type === 'square') return p < 0.5 ? 1 : -1;
  if (type === 'triangle') return p < 0.25 ? p * 4 : p < 0.75 ? 2 - p * 4 : p * 4 - 4;
  return Math.sin(p * Math.PI * 2);
}

export function createExampleModulation() {
  const modulators = new Map();
  const bindings = new Map();
  let time = 0;
  let frame = 0;

  function frequencyOf(mod) {
    if (mod.options.clockRef && modulators.has(mod.options.clockRef)) {
      const clock = modulators.get(mod.options.clockRef);
      const base = frequencyOf(clock);
      if (mod.options.divisor) return base / mod.options.divisor;
      if (mod.options.multiplier) return base * mod.options.multiplier;
      return base;
    }
    return mod.options.frequency ?? 1;
  }

  function currentValue(mod) {
    if (mod.type === 'value') {
      return typeof mod.options.getValue === 'function' ? mod.options.getValue({ time, frame }) : 0;
    }
    const phase = (time * frequencyOf(mod)) + (mod.options.phase ?? 0);
    const raw = waveValue(mod.type, phase);
    return (mod.options.offset ?? 0) + raw * (mod.options.amplitude ?? 1);
  }

  const system = {
    createModulator(id, options = {}) {
      const mod = { id, type: options.type ?? 'sine', options, value: 0 };
      modulators.set(id, mod);
      return mod;
    },
    getModulator(id) {
      return modulators.get(id) ?? null;
    },
    bind(options = {}) {
      bindings.set(options.id ?? `binding-${bindings.size}`, options);
      return options;
    },
    sample(id) {
      const mod = modulators.get(id);
      return mod ? mod.value : 0;
    },
    reset() {
      time = 0;
      frame = 0;
      for (const mod of modulators.values()) mod.value = currentValue(mod);
    },
    update(deltaTime, context = {}) {
      time += deltaTime;
      frame += 1;
      for (const mod of modulators.values()) mod.value = currentValue(mod);
      for (const b of bindings.values()) {
        const mod = modulators.get(b.source);
        if (!mod || typeof b.setter !== 'function') continue;
        let v = mod.value;
        if (Array.isArray(b.inputRange)) {
          const [lo, hi] = b.inputRange;
          v = hi === lo ? 0 : (v - lo) / (hi - lo);
          if (b.min !== undefined && b.max !== undefined) v = b.min + v * (b.max - b.min);
        } else if (b.min !== undefined && b.max !== undefined) {
          v = b.min + ((v + 1) / 2) * (b.max - b.min);
        } else {
          v = (b.baseValue ?? 0) + v * (b.amount ?? 1);
        }
        b.setter(v, context);
      }
      return { time, frame };
    },
    dispose() {
      modulators.clear();
      bindings.clear();
    }
  };
  return system;
}
