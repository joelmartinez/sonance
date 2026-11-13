---
template: Default
title: Install — Sonance
subtitle: Getting the @codecube/sonance package and running the quickstart.
---

# Install

The package is `@codecube/sonance`, version 0.1.0, and its home is the public GitHub repository [joelmartinez/sonance](https://github.com/joelmartinez/sonance). It is plain ES modules with no build step: the library you install is exactly the source you can read in the repository, and its one runtime dependency, `tone` at ^15.1.22, arrives from Sonance's own declaration.

Honest status, stated plainly: the package is not on npm yet, and npm publishing happens only when the owner decides it does. Until then, the supported routes are the ones below — installing straight from the GitHub repo, which is how the CodeCube projects consume their sibling libraries today, or a folder dependency for local work.

## Install from GitHub (available now)

Point your `package.json` at the GitHub repo and run `npm install`:

```json
{
  "dependencies": {
    "@codecube/sonance": "github:joelmartinez/sonance"
  }
}
```

Imports then read exactly as they will after npm publishing:

```js
import Sonance from '@codecube/sonance';
```

## Folder install

Check out the repository beside your project, then point your `package.json` at the checkout folder:

```json
{
  "dependencies": {
    "@codecube/sonance": "file:../sonance"
  }
}
```

## What it needs

The package needs Node 18 or newer for Node-side use, or any browser with ES module support for browser use. There is no bundler, transpiler, or build step required on either side; in a browser page without a bundler, load the module files directly (an import map can give them the package name), which is how the live examples on this site run the library. One browser rule shapes every page that uses Sonance: audio can only start from a user gesture, so `engine.start()` belongs inside a click or key handler, while everything else can be set up ahead of time.

## Modulation, if you want it

Modulation is optional and injected, never built in: Sonance declares `@codecube/modulator` as an optional peer dependency, so a consumer who wants modulation has a declared, versioned path and a consumer who does not is never forced to install it. That package is not on npm yet either; today it comes from a checkout of [joelmartinez/modulator](https://github.com/joelmartinez/modulator) beside your project, pointed at the package folder inside that checkout, `"@codecube/modulator": "file:../modulator/ts"`. The [using the library](../library-usage/) page shows the wiring and runs it live.

## The quickstart, running live

The panel below runs the README quickstart against the real library on this page — the engine, sound, and soundtrack are built on load, the readout lists the library's own four built-in scene presets, and Start plays the blip and the looping bass line.

<div id="sonance-quickstart-demo" class="live-example">
    <p id="sonance-quickstart-status">Loading the live example…</p>
    <p><button id="sonance-quickstart-start">▶ Start audio and play</button></p>
</div>

<script type="module" src="../assets/demos/quickstart-demo.js"></script>

Next: [sounds and soundtracks](../concepts/) explains the two main ideas, and [using the library](../library-usage/) walks the whole API.
