---
template: Default
title: Using the Library — Sonance
subtitle: Complete guide to the Sonance engine, sounds, soundtracks, scenes, and the modulation injection contract.
---

# Using the Library

Everything in the package is imported from its single entry point. The default export carries the whole surface — `createEngine` plus the classes and helpers as properties — and named imports cover the same names for consumers who prefer them:

```js
import Sonance from '@codecube/sonance';
// or
import { SonanceEngine, SonanceSceneManager, loadSoundtrack } from '@codecube/sonance';
```

Hand-written type declarations in `src/index.d.ts` cover the same public surface for TypeScript consumers, including the option, note-event, effect, soundtrack-definition, and scene-definition shapes.

## The engine

One `SonanceEngine` owns a page's sounds and soundtracks. `Sonance.createEngine(options)` constructs one, and `await engine.start()` starts the audio context — a call that must come from a user gesture such as a click, because browsers refuse to start audio on their own. Starting is safe to call more than once. The engine's sound methods are `createSound(id, options)`, `getSound(id)`, `triggerSound(id, note, duration)`, and `removeSound(id)`; its soundtrack methods are `createSoundtrack(name, options)`, `getSoundtrack(name)`, and `removeSoundtrack(name)`; and `dispose()` tears the whole engine down.

## Sounds and soundtracks in code

A sound's options pick its note, duration, and oscillator, and a trigger can override the note for that one hit:

```js
const engine = Sonance.createEngine();
await engine.start();

const blip = engine.createSound('blip', { note: 'G5', duration: '32n', oscillator: 'square' });
blip.trigger();
engine.triggerSound('blip', 'A5');
```

A soundtrack groups channels that share its tempo. Each channel gets an instrument, an optional effects chain, and sequences to play; sequences are written as text and parsed by `MidiUtils`, as the [concepts page](../concepts/) explorer shows live:

```js
const track = engine.createSoundtrack('main', { bpm: 130 });
const bass = track.addChannel('bass', { instrument: { oscillator: 'sawtooth' } });
bass.playSequence(
  Sonance.MidiUtils.parseNoteSequence('C2:4n C2:4n G2:4n F2:4n'),
  { loop: true }
);
await track.play();
```

A whole soundtrack can also come from data: `loadSoundtrack(engine, definition)` builds the soundtrack a plain object describes — the shape a soundtrack JSON file holds — and returns it ready to play.

## Scenes

`SonanceSceneManager` is a static helper, so scene work needs no instance: `listPresets()` returns the four built-in preset names, `getPreset(name)` returns one preset's definition, `applyScene(engine, definition)` builds a scene's sounds and soundtracks on an engine, and `validateScene(definition)` checks a definition first. The save, load, list, and delete methods store a reader's own scenes in the browser's local storage under the `sonance-scene:` prefix and no-op safely where local storage is unavailable, and the download and upload helpers move scene definitions as files. The core operations — listing presets, getting a preset, applying a scene, and validating — work anywhere, including outside a browser.

## Modulation, live

Sonance ships no built-in modulation system. Modulation arrives only by injection: pass a system as `options.modulation` when the engine is created, and the engine calls five methods on it — `createModulator(id, options)`, `getModulator(id)`, `bind(options)`, `update(deltaTime, context)`, and `dispose()`. With no system injected, the engine works fully for sounds and soundtracks, its `modulation` getter returns `null`, and the modulation methods throw a clear error naming the missing piece. The intended system is `@codecube/modulator`, declared as an optional peer dependency; the [install page](../install/) gives the GitHub route for getting it today.

The demo below runs both real libraries on this page: a real `ModulationSystem` is injected into a real Sonance engine, a sine modulator is created through the engine, and a binding through the engine writes its value into a plain target, stepped by `engine.updateModulation` — the exact contract this section documents.

```js
import Sonance from '@codecube/sonance';
import { ModulationSystem } from '@codecube/modulator';

const engine = Sonance.createEngine({ modulation: new ModulationSystem() });
engine.createModulator('pulse', { type: 'sine', frequency: 1 });

const light = { intensity: 0 };
engine.bindModulator({ modulator: 'pulse', target: light, path: 'intensity', min: 200, max: 800 });
engine.updateModulation(0.25); // light.intensity is 800, the sine's peak
```

<div id="sonance-modulation-demo" class="live-example">
    <p>Live: <code>light.intensity</code> is <strong id="sonance-modulation-value">—</strong> (range 200–800, swept by the injected system's sine modulator through the engine).</p>
    <div style="background: rgba(255,255,255,0.08); height: 12px; max-width: 800px;"><div id="sonance-modulation-bar" style="background: #d4c389; height: 12px; width: 0%;"></div></div>
    <p id="sonance-modulation-plain">Loading the live example…</p>
</div>

<script type="module" src="../assets/demos/modulation-demo.js"></script>

## What is not supported

The boundary of the standalone library is plain: built-in modulation (there is none — injection only), the old `window.Sonance` script-tag consumption model and the host site's generated bundle as a way to consume this package, the host site's original 3D forms of the two examples (the rebuilt standalone versions under this repo's `examples/` are the supported ones), and the scene manager's download and upload helpers outside a browser, which are DOM helpers by nature and degrade safely rather than being supported in Node.
