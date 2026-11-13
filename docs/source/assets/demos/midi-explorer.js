// Live example for the Sonance concepts page. It runs the real library: the
// note sequence a reader types is parsed and timed by Sonance's own
// MidiUtils (parseNoteSequence and buildTimedEvents), and the table and the
// timeline are drawn from the events those functions return.
import Sonance from '../sonance/sonance.bundle.js';

const container = document.getElementById('sonance-midi-demo');
const sequenceInput = document.getElementById('sonance-midi-sequence');
const bpmInput = document.getElementById('sonance-midi-bpm');
const eventsBody = document.getElementById('sonance-midi-events');
const readout = document.getElementById('sonance-midi-readout');
const canvas = document.getElementById('sonance-midi-canvas');

if (container && sequenceInput && bpmInput && eventsBody && readout && canvas) {
  const context = canvas.getContext('2d');

  function render() {
    const bpm = Number(bpmInput.value) || 120;
    let events;
    try {
      events = Sonance.MidiUtils.buildTimedEvents(
        Sonance.MidiUtils.parseNoteSequence(sequenceInput.value),
        bpm
      );
    } catch (error) {
      readout.textContent = `The library could not parse that sequence: ${error.message}`;
      return;
    }

    eventsBody.innerHTML = '';
    for (const event of events) {
      const row = document.createElement('tr');
      const startSeconds = Number(String(event.time).replace('+', ''));
      row.innerHTML = `<td>${event.note}</td><td>${event.duration}</td><td>${startSeconds.toFixed(3)} s</td><td>${Sonance.MidiUtils.noteToMidi(event.note)}</td>`;
      eventsBody.appendChild(row);
    }

    const width = canvas.width;
    const height = canvas.height;
    context.clearRect(0, 0, width, height);
    const secPerBeat = 60 / bpm;
    const totalSeconds = events.reduce((sum, e) => sum + (Sonance.MidiUtils.DURATION_MAP[e.duration] ?? 0.5) * secPerBeat, 0) || 1;
    context.fillStyle = '#d4c389';
    events.forEach((event, index) => {
      const startSeconds = Number(String(event.time).replace('+', ''));
      const durationSeconds = (Sonance.MidiUtils.DURATION_MAP[event.duration] ?? 0.5) * secPerBeat;
      const x = (startSeconds / totalSeconds) * (width - 8) + 4;
      const w = Math.max((durationSeconds / totalSeconds) * (width - 8) - 2, 3);
      const y = 12 + (index % 4) * 26;
      context.fillRect(x, y, w, 16);
    });

    readout.textContent = `${events.length} events at ${bpm} BPM, ${totalSeconds.toFixed(2)} s total — parsed and timed by MidiUtils on this page.`;
    container.dataset.liveStatus = 'ok';
    container.dataset.eventCount = String(events.length);
  }

  sequenceInput.addEventListener('input', render);
  bpmInput.addEventListener('input', render);
  render();
}
