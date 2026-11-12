# Sonance

Sonance is a web audio and synth engine built on Tone.js. It has two main ideas: Sounds, which are one-shot or looping sounds you can attach to things and trigger, and Soundtracks, which are DAW-style multi-channel pieces of music with instruments, effects chains, and MIDI sequences that play together in sync. A scene manager saves and loads whole setups as plain JSON, and a soundtrack file is just note and effect data, so everything Sonance plays is synthesized in the browser with no audio files to ship.

This repo is the standalone library, named `@codecube/sonance`. It was extracted from joelmartinez/Static-Site-Generator, the repo behind codecube.net, where Sonance lived inside the site's frontend the same way Photonic did before its extraction. The extraction (roadmap item E1) pulled the sources in unchanged, and this scaffold (roadmap item E2) gives the library its own package name, license, and home. The public GitHub repo joelmartinez/sonance is its mirror, and registry publishing happens only on Joel's word.

## What was extracted

The twelve files under `src/` are the complete Sonance tree from `frontend/src/sonance/` in the source repo, pulled byte-identical at source commit 03b4f6647bb5c3d9438726bc07c4ed3a40ad7e72 and verified file by file against the source repo's hashes. That covers the engine (`SonanceEngine.js`), the Sound, Soundtrack, Channel, and Instrument classes, the effects chain builder, the MIDI and variation helpers, the soundtrack loader, the scene manager, the library entry point (`src/index.js`), and one demo soundtrack (`src/soundtracks/ambient-demo.json`). The two Sonance tests from the source repo's `frontend/tests/` live under `tests/` here, also unchanged. The full file-by-file mapping, the hashes, and the inventory of every tie back to the host site are recorded in `extraction-notes/EXTRACTION.md`, and that folder also keeps copies of the host frontend's package and build files from extraction time as evidence.

## Layout

`src/` holds the library itself, with `src/index.js` as the entry point named by package.json. `tests/` holds the two extracted tests. `extraction-notes/` holds the extraction record and the host build evidence; it is documentation, not part of the library. `ROADMAP.md` is the phased plan for the work ahead and `PROGRESS.md` is the running log of what each work session did.

## Quickstart

Install the package, then import it as an ES module. Browsers gate audio behind a user gesture, so in a real page the `engine.start()` call belongs inside a click or key handler; everything else can be set up ahead of time.

```js
import Sonance from '@codecube/sonance';

const engine = Sonance.createEngine();
await engine.start();

// A one-shot sound you can trigger any time.
const blip = engine.createSound('blip', { note: 'G5', duration: '32n', oscillator: 'square' });
blip.trigger();

// A small looping soundtrack.
const track = engine.createSoundtrack('main', { bpm: 130 });
const bass = track.addChannel('bass', { instrument: { oscillator: 'sawtooth' } });
bass.playSequence(
  Sonance.MidiUtils.parseNoteSequence('C2:4n C2:4n G2:4n F2:4n'),
  { loop: true }
);
await track.play();

// The built-in scene presets.
console.log(Sonance.SonanceSceneManager.listPresets());
```

This exact code was run from the packed tarball in a clean folder for roadmap item P1: it creates the engine, the sound, and the looping soundtrack with no errors, and prints the four built-in preset names. Named imports work too — `import { SonanceEngine, SonanceSceneManager, loadSoundtrack } from '@codecube/sonance'` — and hand-written type declarations in `src/index.d.ts` cover the same public surface for TypeScript consumers.

## Modulation (optional, injected)

Sonance ships no built-in modulation system. Modulation is available only by injecting a system through the engine options, for example `createEngine({ modulation: mySystem })` or `new SonanceEngine({ modulation: mySystem })`. The engine calls five methods on an injected system: `createModulator(id, options)`, `getModulator(id)`, `bind(options)`, `update(deltaTime, context)`, and `dispose()`. With no system injected, the engine works fully for Sounds and Soundtracks, its `modulation` getter returns `null`, and the modulation methods throw a clear error naming the missing piece. When a scene that defines modulators is applied to an engine with no modulation system, the scene manager skips the modulators with a warning and still applies the scene's sounds and soundtracks.

The intended system is `@codecube/modulator`, and package.json declares it as an optional peer dependency (`^0.1.0`, marked optional in `peerDependenciesMeta`): a consumer who wants modulation gets a declared, versioned path, and a consumer who does not is never forced to install it, because Sonance itself never imports the package. The modulator package is not on npm yet, so the route today is the GitHub one this ecosystem already uses for sibling libraries: check out [joelmartinez/modulator](https://github.com/joelmartinez/modulator) beside your project and point your own `package.json` at the package folder inside that checkout, `"@codecube/modulator": "file:../modulator/ts"` (the checkout folder name is yours to choose; the `ts/` part is the package's home in that repo). Once it is installed under its real name, wiring it in is the whole job:

```js
import Sonance from '@codecube/sonance';
import { ModulationSystem } from '@codecube/modulator';

const engine = Sonance.createEngine({ modulation: new ModulationSystem() });
engine.createModulator('pulse', { type: 'sine', frequency: 1 });
```

That exact shape was verified for roadmap item M1 in scratch installs of the packed Sonance tarball: with the modulator present (installed from a fresh clone of its GitHub repo, as above) the engine's modulators and bindings run against the real package, and with it absent the install is clean, no modulator code is present, and the engine loads and runs as described above.

## Scenes outside a browser

Scene storage and file helpers are optional browser conveniences that degrade safely outside a browser. The `SonanceSceneManager` save, load, list, and delete methods use `localStorage` under the prefix `sonance-scene:` and no-op safely when it is unavailable, and the `download` and `upload` helpers need a browser document. The core scene operations — listing presets, getting a preset, applying a scene, and validating a definition — work anywhere.

## Examples

`examples/` holds Sonance's own examples, rebuilt for roadmap item X1 from the host's parked photonics modules: an audio demo (four layered sounds, a five-channel ambient soundtrack, shared modulators sweeping the filters) and a synth designer (the built-in scene presets as an editable node list, with save, load, export, and import through the scene manager). Both import `@codecube/sonance` as an ES module, run standalone in a plain page, and inject a small example-only modulation system through `options.modulation` where they still need modulators. See `examples/README.md` for how to run them.

## Status

Decoupling is done (roadmap items D1 and D2): the package is named `@codecube/sonance`, carries the MIT license in `LICENSE` (Copyright (c) 2026 Joel Martinez), and declares its one real dependency, `tone` at ^15.1.22, as a regular dependency. The cross-tree Modulation imports and re-exports are severed, the `window.Sonance` global is gone from the library entry, no build step is needed (the library is consumed as native ES modules), the soundtrack loader example no longer assumes a bundler, and the extracted tests run in this repo under a minimal jest setup (`npm test`). A standalone-consumption test proves the claim: a fresh folder with only Sonance and its declared dependencies runs an example with no site files present. The examples are also done (roadmap item X1): the audio demo and synth designer live under `examples/` as standalone pages that import the library as an ES module. Package readiness is also done (roadmap item P1): the exports map is finished, hand-written type declarations in `src/index.d.ts` match the public surface and were compiled against a test consumer, the quickstart above was run from the packed tarball in a clean folder, and `CHANGELOG.md` records the version discipline. The package was published to the public GitHub repo on 2026-11-11, and the modulation dependency is now declared too (roadmap item M1): `@codecube/modulator` is an optional peer dependency, as the Modulation section above describes, verified in scratch installs with the modulator both present and absent. Registry publishing happens only on Joel's word, and the record for the package step is in `design/PACKAGING.md`. What remains on the roadmap is the documentation site (DOCS).

## Explicitly unsupported

The boundary of the standalone library is plain: (1) built-in modulation — Sonance ships no ModulationSystem; modulation works only through the injection seam above, and the nine host-era Modulation re-exports are gone; (2) the `window.Sonance` script-tag consumption model and the host's `sonance.gen.js` webpack bundle as a way to consume this package; (3) the host photonics consumers `audio-demo.js` and `synth-designer.js` in their original 3D, Photonic-hosted form — roadmap item X1 rebuilt both as standalone Sonance examples under `examples/`, and only those rebuilt versions are supported; (4) the host test infrastructure — the host's `tests/setup.js`, its babel and React preset stack, and the host jest config — none of which Sonance's own minimal setup replaces or needs; and (5) `SonanceSceneManager.download` and `upload` outside a browser, which are DOM helpers by nature and degrade as documented above rather than being supported in Node.
