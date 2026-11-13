---
template: Default
title: Sonance Library
subtitle: A web audio and synth engine built on Tone.js — entity sounds and DAW-style multi-channel soundtracks, synthesized live in the browser.
---

# Welcome to Sonance!

Sonance is a web audio and synth engine built on Tone.js, published as the ES module package `@codecube/sonance`. It has two main ideas: Sounds, which are one-shot or looping sounds you can attach to things and trigger, and Soundtracks, which are DAW-style multi-channel pieces of music with instruments, effects chains, and MIDI sequences that play together in sync. A scene manager saves and loads whole setups as plain JSON, and a soundtrack file is just note and effect data, so everything Sonance plays is synthesized in the browser with no audio files to ship.

Sonance was extracted from the frontend of codecube.net, where it lived inside the site the same way its sibling engine Photonic did before its own extraction. It now stands alone under the MIT license, and this site is its documentation: every page explains one part of the library, and the examples on the pages run the real library in your browser, not a recording or a picture of one.

## The quickstart, running live

The quickstart below is the first code most readers run. The panel under it runs that same code against the real library on this page: the engine, the sound, and the soundtrack are already built, and the readout lists what the library reports back, including its four built-in scene presets. Browsers gate audio behind a user gesture, so the sound itself waits for the Start button — pressing it calls `engine.start()`, triggers the blip, and plays the looping bass soundtrack, exactly as the code does.

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

<div id="sonance-quickstart-demo" class="live-example">
    <p id="sonance-quickstart-status">Loading the live example…</p>
    <p><button id="sonance-quickstart-start">▶ Start audio and play</button></p>
</div>

<script type="module" src="assets/demos/quickstart-demo.js"></script>

## Explore the documentation

- [Sounds and soundtracks](concepts/) — the two main ideas, channels and instruments, MIDI sequences, and scenes, with a live sequence explorer.
- [Using the library](library-usage/) — the full API walkthrough, with a live modulation demo that runs Sonance and Modulator together.
- [Install](install/) — how to get the package from GitHub today, and what it needs to run.

The source code can be found here: https://github.com/joelmartinez/sonance
