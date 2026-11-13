// Live example for the Sonance landing and install pages. It runs the real
// library: the README quickstart's engine, sound, and soundtrack are built on
// page load (no audio until the reader presses Start, because browsers gate
// audio behind a user gesture), and Start runs the same calls for real.
import Sonance from '../sonance/sonance.bundle.js';

const container = document.getElementById('sonance-quickstart-demo');
const statusOut = document.getElementById('sonance-quickstart-status');
const startButton = document.getElementById('sonance-quickstart-start');

if (container && statusOut && startButton) {
  const engine = Sonance.createEngine();
  const blip = engine.createSound('blip', { note: 'G5', duration: '32n', oscillator: 'square' });
  const track = engine.createSoundtrack('main', { bpm: 130 });
  const bass = track.addChannel('bass', { instrument: { oscillator: 'sawtooth' } });
  bass.playSequence(
    Sonance.MidiUtils.parseNoteSequence('C2:4n C2:4n G2:4n F2:4n'),
    { loop: true }
  );
  const presets = Sonance.SonanceSceneManager.listPresets();

  statusOut.textContent = `Built live by the real library: 1 engine, 1 sound (blip), 1 looping soundtrack with a bass channel, and the ${presets.length} built-in scene presets (${presets.join(', ')}). Press Start to hear it.`;
  container.dataset.liveStatus = 'ok';
  container.dataset.presetCount = String(presets.length);

  startButton.addEventListener('click', async () => {
    await engine.start();
    blip.trigger();
    await track.play();
    statusOut.textContent = 'Audio started: the blip played and the bass soundtrack is looping. This is the library running, not a recording.';
    container.dataset.audioStatus = 'playing';
  });
}
