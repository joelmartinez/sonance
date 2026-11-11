/**
 * Sonance - SoundtrackLoader
 * Loads a soundtrack definition from a JSON object and creates a fully
 * wired Sonance Soundtrack with channels and looping sequences.
 *
 * Usage (loadSoundtrack only needs the parsed object, no bundler required):
 *   const trackDef = await fetch(new URL('./soundtracks/ambient-demo.json', import.meta.url)).then(r => r.json());
 *   // Or, where the runtime supports it:
 *   // import trackDef from './soundtracks/ambient-demo.json' with { type: 'json' };
 *   const { soundtrack, channels } = loadSoundtrack(engine, trackDef);
 *   await soundtrack.play();
 */

/**
 * Load a soundtrack from a JSON definition object.
 * @param {SonanceEngine} engine - The Sonance engine instance
 * @param {Object} definition - Soundtrack JSON definition
 * @param {Object} [overrides] - Optional per-channel overrides { channelName: { volume, effects, ... } }
 * @returns {{ soundtrack: Soundtrack, channels: Object<string, Channel> }}
 */
export function loadSoundtrack(engine, definition, overrides = {}) {
  const { name = 'track', bpm = 120, channels: channelDefs = {} } = definition;

  const soundtrack = engine.createSoundtrack(name, { bpm });
  const channels = {};

  for (const [channelName, def] of Object.entries(channelDefs)) {
    const channelOverrides = overrides[channelName] ?? {};
    const channelOptions = {
      instrument: def.instrument,
      effects: channelOverrides.effects ?? def.effects,
      volume: channelOverrides.volume ?? def.volume ?? 0
    };

    const channel = soundtrack.addChannel(channelName, channelOptions);
    channels[channelName] = channel;

    const sequence = channelOverrides.sequence ?? def.sequence;
    if (sequence && sequence.length > 0) {
      channel.playSequence(sequence, { loop: def.loop ?? false });
    }
  }

  return { soundtrack, channels };
}
