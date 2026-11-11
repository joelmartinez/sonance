# Sonance roadmap

## E1 — Extraction
Locate the Sonance sources inside joelmartinez/Static-Site-Generator and pull them into this repo byte-identical, with extraction notes recording where every file came from and every coupling back to the host site (imports reaching outside the Sonance tree, host build assumptions, globals, asset paths). Verify claims against the actual files, not workstream notes alone.

## E2 — Canonicalization
Package scaffold under the name @codecube/sonance, MIT LICENSE once the project goes public (copyright holder as Joel directs), README that describes the standalone library. Nothing published at this stage.

## ⛔ GATE — GitHub repo
Joel creates the public repo (expected joelmartinez/sonance, MIT). An interactive session then pushes the first snapshot mirror and verifies it by read-back. The chain never pushes.

## D1 — Decoupling audit and plan
Every host coupling from E1 gets a fix approach: sever, internalize, declare as a dependency, or drop to an explicitly unsupported list, with a standalone-consumption test defined.

## D2 — Decoupling implementation
Execute the plan; the standalone-consumption test passes: a fresh folder with only Sonance and its declared dependencies runs an example with no site files present.

## X1 — Examples in their own home
The synth-designer and audio-demo experiences that were parked in Photonic as unsupported (they depend on Sonance pieces) are rebuilt or adopted here as Sonance's own examples, once the engine stands alone.

## P1 — Package readiness
Exports map, type declarations, README quickstart verified from the packed file in a clean folder, version and changelog discipline.

## ⛔ GATE — Publish
Upstream first via GitHub, the route Joel chose for Photonic on 2026-11-10: consumers reference the GitHub repo. Registry (npm) publishing only on Joel's explicit word in an interactive session, with his credentials through the secure flow. The chain prepares everything and stops at this gate.

## C1 — Consumer flip after the gate
Projects that use Sonance pieces through the site take the published or GitHub dependency instead, each verified through that project's real build.

## Added 2026-11-11 (Joel, interactive)

- **M1 — Modulation dependency.** Once `@codecube/modulator` is published from the Modulator (TypeScript) project, declare it as Sonance's optional modulation dependency and wire it as the default plug-in for the injection point D2 built. Until then the engine keeps working with no modulation system, exactly as D2 left it.
- **DOCS — Documentation site.** Give Sonance a documentation site following the pattern the C# Modulator library uses: a Chloroplast docs folder in this repo (SiteConfig, markdown source pages covering concepts and library usage, menu) with a workflow that publishes it to GitHub Pages. The modulator docs live at https://joelmartinez.github.io/modulator/; Sonance's will live at the matching address for its repo. Runs after X1. Live examples are required (Joel, 2026-11-11): the docs pages must run the real library in the page, not only show code listings — the Modulator C# docs' on-page waveform demos are the floor, and the Chloroplast project carries any engine features this needs.
