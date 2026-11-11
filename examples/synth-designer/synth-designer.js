/**
 * Sonance example: Synth Designer
 *
 * Standalone rebuild of the host site's photonics synth-designer. The 3D
 * node board is now a plain page list, but the work is the same: pick a
 * preset, look at its modulators, sounds, and soundtrack channels as
 * nodes, edit a node's plain values, then apply and play the scene. It
 * imports @codecube/sonance as an ES module, saves and loads through
 * SonanceSceneManager, and injects the example modulation system through
 * options.modulation so preset modulators run instead of being skipped.
 */
import { SonanceEngine, SonanceSceneManager } from '@codecube/sonance';
import { createExampleModulation } from '../shared/example-modulation.js';

function nodesOf(def) {
  const nodes = [];
  (def.modulators ?? []).forEach(m => nodes.push({ kind: 'modulator', id: m.id, label: `Modulator ${m.id}`, data: m }));
  (def.sounds ?? []).forEach(s => nodes.push({ kind: 'sound', id: s.id, label: `Sound ${s.id}`, data: s }));
  (def.soundtracks ?? []).forEach(st => {
    Object.entries(st.channels ?? {}).forEach(([name, ch]) => {
      nodes.push({ kind: 'channel', id: `${st.name}:${name}`, label: `Channel ${name} (${st.name})`, data: ch, soundtrack: st });
    });
  });
  return nodes;
}

function editableFields(node) {
  const d = node.data;
  if (node.kind === 'modulator') return ['type', 'frequency', 'divisor', 'multiplier', 'clockRef'];
  if (node.kind === 'sound') return ['oscillator', 'note', 'duration', 'volume'];
  return ['volume'];
}

export function startSynthDesigner(doc = document) {
  const presetSelect = doc.querySelector('#preset-select');
  const nodeList = doc.querySelector('#node-list');
  const paramPanel = doc.querySelector('#param-panel');
  const status = doc.querySelector('#designer-status');
  const savedSelect = doc.querySelector('#saved-select');

  let currentName = SonanceSceneManager.listPresets()[0];
  let currentDef = structuredClone(SonanceSceneManager.getPreset(currentName));
  let selected = null;
  let engine = null;
  let playing = false;

  function setStatus(msg) { if (status) status.textContent = msg; }

  function refreshSaved() {
    if (!savedSelect) return;
    const names = SonanceSceneManager.listSaved();
    savedSelect.innerHTML = names.map(n => `<option value="${n}">${n}</option>`).join('');
  }

  function renderNodes() {
    const nodes = nodesOf(currentDef);
    nodeList.innerHTML = '';
    nodes.forEach(node => {
      const btn = doc.createElement('button');
      btn.type = 'button';
      btn.className = 'node';
      btn.dataset.nodeId = node.id;
      btn.textContent = node.label;
      btn.addEventListener('click', () => { selected = node; renderParams(); });
      nodeList.appendChild(btn);
    });
    if (!selected && nodes.length) selected = nodes[0];
    renderParams();
  }

  function renderParams() {
    if (!selected) { paramPanel.innerHTML = ''; return; }
    const fields = editableFields(selected);
    paramPanel.innerHTML = `<h3>${selected.label}</h3>` + fields.map(f => {
      const v = selected.data[f];
      if (v === undefined) return '';
      return `<label>${f} <input data-field="${f}" value="${v}"></label>`;
    }).join('') + '<p class="hint">Edit a value, then Apply &amp; Play to hear it.</p>';
    paramPanel.querySelectorAll('input').forEach(input => {
      input.addEventListener('change', () => {
        const field = input.dataset.field;
        const raw = input.value;
        const num = Number(raw);
        selected.data[field] = raw !== '' && Number.isFinite(num) && !/^[A-Za-z]/.test(raw) ? num : raw;
        setStatus(`Edited ${selected.label}: ${field} = ${input.value}`);
      });
    });
  }

  function loadPreset(name) {
    currentName = name;
    currentDef = structuredClone(SonanceSceneManager.getPreset(name));
    selected = null;
    renderNodes();
    setStatus(`Preset loaded: ${name} — ${currentDef.description ?? ''}`);
  }

  presetSelect.innerHTML = SonanceSceneManager.listPresets().map(n => `<option value="${n}">${n}</option>`).join('');
  presetSelect.addEventListener('change', () => loadPreset(presetSelect.value));

  doc.querySelector('#designer-play')?.addEventListener('click', async () => {
    if (engine) { engine.dispose(); engine = null; }
    engine = new SonanceEngine({ modulation: createExampleModulation() });
    SonanceSceneManager.applyScene(engine, structuredClone(currentDef));
    await engine.start();
    for (const st of engine.soundtracks.values()) await st.play();
    playing = true;
    setStatus(`Playing: ${currentName} (${engine.sounds.size} sound(s), ${engine.soundtracks.size} soundtrack(s), modulators ${engine.modulation ? 'on' : 'off'})`);
    doc.querySelector('#designer-state') && (doc.querySelector('#designer-state').textContent = 'playing');
  });

  doc.querySelector('#designer-stop')?.addEventListener('click', () => {
    if (engine) {
      for (const st of engine.soundtracks.values()) st.stop();
      engine.dispose();
      engine = null;
    }
    playing = false;
    setStatus('Stopped');
    doc.querySelector('#designer-state') && (doc.querySelector('#designer-state').textContent = 'stopped');
  });

  doc.querySelector('#designer-audition')?.addEventListener('click', async () => {
    if (!engine) { setStatus('Apply & Play first, then audition a sound.'); return; }
    await engine.start();
    const first = engine.sounds.keys().next().value;
    if (first) { engine.triggerSound(first); setStatus(`Auditioned sound: ${first}`); }
    else setStatus('This preset has no entity sounds to audition.');
  });

  doc.querySelector('#designer-save')?.addEventListener('click', () => {
    const name = doc.querySelector('#save-name')?.value?.trim() || currentName;
    SonanceSceneManager.save(name, currentDef);
    refreshSaved();
    setStatus(`Saved scene: ${name}`);
  });

  doc.querySelector('#designer-load-saved')?.addEventListener('click', () => {
    const name = savedSelect?.value;
    const def = name ? SonanceSceneManager.load(name) : null;
    if (def) { currentName = name; currentDef = def; selected = null; renderNodes(); setStatus(`Loaded saved scene: ${name}`); }
    else setStatus('No saved scene to load.');
  });

  doc.querySelector('#designer-export')?.addEventListener('click', () => {
    SonanceSceneManager.download(currentDef, `${currentName.replace(/\s+/g, '-').toLowerCase()}.json`);
    setStatus('Exported scene as JSON');
  });

  doc.querySelector('#designer-import')?.addEventListener('click', async () => {
    try {
      const def = await SonanceSceneManager.upload();
      currentDef = def;
      currentName = def.name ?? 'Imported scene';
      selected = null;
      renderNodes();
      setStatus(`Imported scene: ${currentName}`);
    } catch {
      setStatus('Import cancelled or failed.');
    }
  });

  loadPreset(currentName);
  refreshSaved();

  return {
    get engine() { return engine; },
    get playing() { return playing; },
    get currentDef() { return currentDef; },
    nodesOf,
    SonanceSceneManager
  };
}

if (typeof document !== 'undefined') {
  window.__sonanceSynthDesigner = startSynthDesigner(document);
}
