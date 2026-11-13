---
template: Default
title: Sounds and Soundtracks — Sonance
subtitle: The two main ideas, channels and instruments, MIDI sequences, and scenes.
---

# Sounds and Soundtracks

Sonance has two main ideas, and most of the library is one or the other. A Sound is a single thing that makes noise: a blip, a kick drum, a looping hum — something you attach to an entity in a scene or a control on a page, and trigger when the moment comes. A Soundtrack is a piece of music: several channels playing in sync, each with its own instrument and effects, driven by note sequences the way a DAW drives tracks. The engine holds both kinds at once, so a page can run background music and still fire one-shot sounds over it.

## Sounds

A sound is created with `engine.createSound(id, options)` and fired with `trigger()`. The options describe a small synth patch — a note, a duration in Tone.js notation such as `32n`, and an oscillator type such as `square` or `sawtooth` — and richer patches can layer instruments and effects the same way soundtrack channels do. Sounds are named, so game code or page code can keep a library of them (`kick`, `snare`, `pickup`) and trigger any of them by name with an optional note override. Nothing about a sound needs an audio file: the patch is data, and Tone.js synthesizes the noise when it is triggered.

## Soundtracks, channels, and instruments

A soundtrack is created with `engine.createSoundtrack(name, { bpm })`, and each `addChannel(name, options)` call adds one voice to it: an instrument (a synth with an oscillator and envelope), an optional effects chain (filters, reverb, delay, and friends, built in order), and the sequences that channel plays. Channels in one soundtrack share the soundtrack's clock, so a bass line, a pad, and a hat pattern started together stay together. A channel's music is data too: `playSequence` takes note events and a loop flag, and a whole soundtrack definition — channels, instruments, effects, sequences — can be loaded from a plain object with `loadSoundtrack`, which is all a soundtrack JSON file is.

## MIDI sequences, live

Note sequences are written as text: space-separated `note:duration` tokens such as `C2:4n`, where the duration is Tone.js notation (`4n` a quarter note, `8n` an eighth, and so on). `MidiUtils.parseNoteSequence` turns that text into note events, and `MidiUtils.buildTimedEvents` lays the events out in time at a given tempo. The explorer below runs those exact functions from the real library on this page: edit the sequence or the tempo and the table and timeline are rebuilt from the events the library returns — each row also shows the note's MIDI number from `MidiUtils.noteToMidi`.

<div id="sonance-midi-demo" class="live-example">
    <p>
        <label>Sequence <input id="sonance-midi-sequence" type="text" size="42" value="C2:4n C2:4n G2:4n A2:8n G2:8n F2:4n" /></label>
        <label>Tempo (BPM) <input id="sonance-midi-bpm" type="number" min="40" max="240" value="130" style="width: 5em;" /></label>
    </p>
    <canvas id="sonance-midi-canvas" width="800" height="130"></canvas>
    <table>
        <thead><tr><th>Note</th><th>Duration</th><th>Starts at</th><th>MIDI</th></tr></thead>
        <tbody id="sonance-midi-events"></tbody>
    </table>
    <p id="sonance-midi-readout">Loading the live example…</p>
</div>

<script type="module" src="../assets/demos/midi-explorer.js"></script>

The same `MidiUtils` helpers cover the rest of the note arithmetic a consumer needs: `midiToNote` and `noteToMidi` convert both ways, the `Scales` table holds the common scale shapes, and `scaleToNotes` turns a root note and a scale into a ready-to-play sequence.

## Scenes

A scene is a whole setup as plain JSON: the sounds, the soundtracks, and (when a modulation system is injected) the modulators a moment needs, all in one definition. `SonanceSceneManager` lists and returns the four built-in presets — Ambient Drone, Lead Synth, Drum Machine, and Clock & Dividers — applies a scene to an engine, validates a definition before it is applied, and saves, loads, lists, and deletes a reader's own scenes through the browser's local storage, with export and import helpers for moving scene files around. Applying a scene that defines modulators to an engine with no modulation system is safe by design: the manager skips the modulators with a warning and still applies the scene's sounds and soundtracks. The quickstart on the [home page](../) lists the presets live, from the library itself.
