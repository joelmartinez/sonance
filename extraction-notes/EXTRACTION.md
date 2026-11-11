# Sonance extraction notes — E1

Sonance was extracted from joelmartinez/Static-Site-Generator on 2026-11-11, at source commit 03b4f6647bb5c3d9438726bc07c4ed3a40ad7e72 (the ref the GitHub contents API reported for the repo root at extraction time). Every file below was pulled through the GitHub read lane and verified byte-identical by recomputing its git blob SHA-1 locally and matching it against the SHA the source repo reported. The layout mirrors the source: everything that lived under frontend/src/sonance/ now lives under src/ here with the same relative structure, and the two Sonance tests that lived under frontend/tests/ now live under tests/.

A note on method: GitHub code search returned zero results for both "sonance" and "SonanceEngine" in this repo even though the tree plainly exists, so the search index is unreliable here and was not used. The tree was located and verified by walking directories with the contents API instead: repo root, frontend/, frontend/src/, then the sonance tree itself. The full sonance tree is just the twelve files below plus one subdirectory; there are no other subdirectories and no other Sonance source files elsewhere in frontend/src/ (the components, estimation, explorables, os, photonics, and viz trees were all listed and checked).

## File mapping

| Source (Static-Site-Generator) | This repo | Bytes | Blob SHA-1 (verified match) |
|---|---|---|---|
| frontend/src/sonance/Channel.js | src/Channel.js | 5245 | 1347e09b18d956e3a48f5a80a085fc81f10ef315 |
| frontend/src/sonance/EffectChain.js | src/EffectChain.js | 2135 | 9a3218c20a36f0b01d5108208fdfe89f0f878849 |
| frontend/src/sonance/Instrument.js | src/Instrument.js | 13244 | 30868644489b94d5cf37156815d53a41667aa932 |
| frontend/src/sonance/MidiUtils.js | src/MidiUtils.js | 3331 | 718b8c569510072765eaa2cd2ba3131a80c5d4ac |
| frontend/src/sonance/SonanceEngine.js | src/SonanceEngine.js | 4825 | d25220776f5f06d00811b33c732c97c22bca8ae9 |
| frontend/src/sonance/SonanceSceneManager.js | src/SonanceSceneManager.js | 13610 | 921b33f39887e01c95825315925109cbd818e7b7 |
| frontend/src/sonance/Sound.js | src/Sound.js | 2453 | 0ab652a599435f6da569164e766f98f0a6c0d45e |
| frontend/src/sonance/Soundtrack.js | src/Soundtrack.js | 2533 | 67d32fecb29698ce29e746ea1279fc9af8d9209b |
| frontend/src/sonance/SoundtrackLoader.js | src/SoundtrackLoader.js | 1592 | 36d94b6b44eedd062d35dbb1b75d47413d312b6b |
| frontend/src/sonance/index.js | src/index.js | 2018 | d60c037cc4e112962fdbba5652b637489b85ad17 |
| frontend/src/sonance/variation.js | src/variation.js | 4088 | fa4da2cd82b0524b926d3486a8e4557e14c2b365 |
| frontend/src/sonance/soundtracks/ambient-demo.json | src/soundtracks/ambient-demo.json | 8309 | 1d209ae17efd154164e68b1cd1833fbaf874d123 |
| frontend/tests/MidiUtils.test.js | tests/MidiUtils.test.js | 620 | ea9c79d78cd548a855095449aca348d65319efae |
| frontend/tests/VariationUtils.test.js | tests/VariationUtils.test.js | 2321 | b8d385b560732a490a5aa35d789923aec98fd649 |

## Host build evidence (copies kept in this folder)

The host frontend's build files at extraction time are copied into this folder as coupling evidence: frontend-package.json is frontend/package.json (SHA 371d137ea2c7216d16d6869ecb6d6bcde54bbfc7), webpack.config.js is frontend/webpack.config.js (SHA db332bc6aaa7e79f03a9e6bffe91936a03d1a763), jest.config.js is frontend/jest.config.js (SHA aabc40451ae4745935949604156498288881916a), and babel.config.json is frontend/babel.config.json (SHA d8f8aa50c056526670f5406b16f3f1a0dd223dba). These are evidence copies only; they are not part of the Sonance library.

## Coupling inventory

The one true external dependency is the npm package tone, pinned at ^15.1.22 in the host package.json. It is imported as `import * as Tone from 'tone'` by Channel.js, EffectChain.js, Instrument.js, Sound.js, SonanceEngine.js, Soundtrack.js, and index.js, and index.js re-exports it as Sonance.Tone for consumers. No other package is imported anywhere in the Sonance tree; every other import is a relative path inside the tree, with one exception covered next.

The biggest coupling is the cross-tree import of the Modulation workstream. SonanceEngine.js imports ModulationSystem from '../modulation/index.js' and constructs one by default when the caller does not pass options.modulation, and index.js imports ModulationSystem, Modulator, ModulationBinding, clamp, createPhotonicFrameContext, distance3D, lerp, normalizeToUnit, and readPath from the same place and re-exports all of them as part of the public Sonance surface, including inside a Modulation namespace object. The Modulation sources themselves (frontend/src/modulation/ModulationSystem.js and frontend/src/modulation/index.js, verified present and exporting exactly those names) were not extracted; Modulation is a sibling piece that Photonic's decoupling also left behind, and deciding whether Sonance declares it as a dependency, internalizes it, or drops the re-exports is the central question for the D1 decoupling audit.

The host build gives Sonance its own webpack entry: webpack.config.js declares `sonance: './src/sonance/index.js'` alongside the app, os, and viz entries, and emits it as sonance.gen.js into CodeCubeConsole/out/script, processed by babel-loader with preset-env and preset-react. The site's main entry (frontend/src/index.js) does not import Sonance at all; pages that want audio load the sonance bundle separately. Nothing in the Sonance sources themselves depends on webpack, but the JSON soundtrack file carries a bundler assumption: SoundtrackLoader.js documents consuming ambient-demo.json through a module import of the .json file, which needs a bundler or a runtime with JSON module support.

The public surface assumes a browser global: index.js assigns the Sonance object to window.Sonance whenever window exists (the check is guarded, so importing in Node does not crash). Both known host consumers lean on that global rather than importing the bundle. frontend/src/photonics/audio-demo.js checks for window.Sonance, logs an error naming sonance.gen.js if it is missing, and builds its engine through window.Sonance.createEngine() and window.Sonance.Tone; frontend/src/photonics/synth-designer.js does the same and additionally imports SonanceSceneManager directly from '../sonance/SonanceSceneManager.js'. Those two modules are the Photonic examples that were parked as unsupported after Photonic's extraction; they stay in the host repo for now and are roadmap item X1 here, not part of this extraction. Both also import helpers from '../modulation/index.js' directly, and audio-demo registers itself as window.PhotonicModules['audio-demo'].

Browser platform assumptions inside the library are narrow and mostly guarded. SonanceSceneManager uses localStorage for named scene storage under the key prefix 'sonance-scene:', checks `typeof localStorage === 'undefined'` before touching it, and uses document.createElement plus document.body for its scene download and upload helpers, which are DOM-only by nature. The AudioContext itself comes from Tone: SonanceEngine.start() calls Tone.start(), and the code documents that it must be called from a user gesture. There are no fetch calls, no audio file URLs, and no other asset paths anywhere in the tree; all sound is synthesized, and ambient-demo.json is pure note and effect data with no URLs in it.

The two extracted tests carry a host-layout assumption: they import from '../src/sonance/MidiUtils.js' and '../src/sonance/variation.js', which are the correct paths inside the host repo but do not resolve in this repo's layout, where the tests sit beside src/ rather than beside a frontend folder. They were kept byte-identical on purpose; fixing their import paths belongs to the E2 scaffold or the D1 decoupling work, not to the extraction. The host jest setup that ran them (jsdom environment, babel-jest transform, testMatch over tests folders, and a tests/setup.js file) was not pulled, since setup.js serves the whole host test suite and not Sonance specifically. A host test for ModulationSystem exists (frontend/tests/ModulationSystem.test.js) but tests the Modulation workstream, not Sonance, so it was not pulled either.

Nothing Sonance-related was left unlocated. Every directory under frontend/src/ was listed, the sonance and soundtracks trees were walked completely, and the only Sonance consumers in the host are the two photonics example modules named above.
