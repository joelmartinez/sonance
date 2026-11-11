function normalizeSpec(spec, defaultCenter, defaultMode) {
  if (spec == null) {
    return null;
  }

  if (typeof spec === 'number') {
    return {
      min: defaultCenter - spec,
      max: defaultCenter + spec,
      mode: defaultMode
    };
  }

  if (Array.isArray(spec) && spec.length === 2) {
    return {
      min: spec[0],
      max: spec[1],
      mode: defaultMode
    };
  }

  if (typeof spec === 'object') {
    return {
      min: spec.min ?? defaultCenter,
      max: spec.max ?? defaultCenter,
      mode: spec.mode ?? defaultMode
    };
  }

  return null;
}

export function sampleSpec(spec, defaultCenter = 0, defaultMode = 'add') {
  const normalized = normalizeSpec(spec, defaultCenter, defaultMode);
  if (!normalized) {
    return defaultCenter;
  }

  const { min, max } = normalized;
  return min + ((max - min) * Math.random());
}

export function getNumericPathValue(targets, path) {
  const parts = path.split('.');
  let current = targets;

  for (const part of parts) {
    if (current == null) {
      return undefined;
    }

    current = current[part];
  }

  if (current && typeof current === 'object' && typeof current.value === 'number') {
    return current.value;
  }

  return typeof current === 'number' ? current : undefined;
}

export function setNumericPathValue(targets, path, nextValue) {
  const parts = path.split('.');
  let current = targets;

  for (let i = 0; i < parts.length - 1; i += 1) {
    if (current == null) {
      return false;
    }

    current = current[parts[i]];
  }

  if (current == null) {
    return false;
  }

  const lastPart = parts[parts.length - 1];
  const leaf = current[lastPart];

  if (leaf && typeof leaf === 'object' && typeof leaf.value === 'number') {
    leaf.value = nextValue;
    return true;
  }

  if (typeof leaf === 'number') {
    current[lastPart] = nextValue;
    return true;
  }

  return false;
}

function transposeNoteValue(ToneLib, note, semitones) {
  if (note == null || !Number.isFinite(semitones) || semitones === 0) {
    return note;
  }

  if (Array.isArray(note)) {
    return note.map(entry => transposeNoteValue(ToneLib, entry, semitones));
  }

  return ToneLib.Frequency(note).transpose(semitones).toFrequency();
}

export function applyTriggerVariations(ToneLib, trigger, variations = []) {
  let nextTrigger = {
    note: trigger.note,
    duration: trigger.duration,
    velocity: trigger.velocity ?? 1
  };

  for (const variation of variations.filter(Boolean)) {
    if (variation.transpose != null) {
      const semitones = sampleSpec(variation.transpose, 0, 'add');
      nextTrigger.note = transposeNoteValue(ToneLib, nextTrigger.note, semitones);
    }

    if (variation.detune != null) {
      const cents = sampleSpec(variation.detune, 0, 'add');
      nextTrigger.note = transposeNoteValue(ToneLib, nextTrigger.note, cents / 100);
    }

    if (variation.duration != null && nextTrigger.duration != null) {
      const multiplier = sampleSpec(variation.duration, 1, 'multiply');
      nextTrigger.duration = ToneLib.Time(nextTrigger.duration).toSeconds() * multiplier;
    }

    if (variation.velocity != null) {
      const multiplier = sampleSpec(variation.velocity, 1, 'multiply');
      nextTrigger.velocity = Math.max(0, nextTrigger.velocity * multiplier);
    }
  }

  return nextTrigger;
}

export function applyParamVariations(targets, variations = []) {
  for (const variation of variations.filter(Boolean)) {
    const params = variation.params ?? {};

    for (const [path, spec] of Object.entries(params)) {
      const currentValue = getNumericPathValue(targets, path);
      if (!Number.isFinite(currentValue)) {
        continue;
      }

      const normalized = normalizeSpec(spec, 1, 'multiply');
      if (!normalized) {
        continue;
      }

      const sampled = sampleSpec(spec, normalized.mode === 'multiply' ? 1 : 0, normalized.mode);
      const nextValue = normalized.mode === 'multiply'
        ? currentValue * sampled
        : currentValue + sampled;

      setNumericPathValue(targets, path, nextValue);
    }
  }
}
