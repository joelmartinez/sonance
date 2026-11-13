// Live example for the Sonance using-the-library page. It runs both real
// libraries: a ModulationSystem from @codecube/modulator is injected into a
// real Sonance engine, a modulator is created through the engine, and a
// binding through the engine writes the sweeping value into a plain target,
// stepped by engine.updateModulation — the exact injection contract the page
// documents. No audio is needed, so it runs on page load.
import Sonance from '../sonance/sonance.bundle.js';
import { ModulationSystem } from '../modulator/modulator.bundle.js';

const container = document.getElementById('sonance-modulation-demo');
const valueOut = document.getElementById('sonance-modulation-value');
const bar = document.getElementById('sonance-modulation-bar');
const plainOut = document.getElementById('sonance-modulation-plain');

if (container && valueOut && bar && plainOut) {
  const engine = Sonance.createEngine({ modulation: new ModulationSystem() });
  engine.createModulator('pulse', { type: 'sine', frequency: 1 });

  const light = { intensity: 0 };
  engine.bindModulator({ modulator: 'pulse', target: light, path: 'intensity', min: 200, max: 800 });

  const plain = Sonance.createEngine();
  let plainError = '';
  try {
    plain.createModulator('pulse', { type: 'sine', frequency: 1 });
  } catch (error) {
    plainError = error.message;
  }
  plainOut.textContent = `The same call on an engine with no system injected throws, by design: "${plainError}" — and that engine's modulation is ${plain.modulation}.`;

  function step() {
    engine.updateModulation(0.05);
    valueOut.textContent = light.intensity.toFixed(0);
    bar.style.width = `${((light.intensity - 200) / 600) * 100}%`;
    container.dataset.liveStatus = 'ok';
    container.dataset.lightIntensity = light.intensity.toFixed(0);
  }

  step();
  setInterval(step, 120);
}
