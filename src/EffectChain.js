import * as Tone from 'tone';

export function createEffect(desc = {}) {
  switch (desc.type) {
    case 'reverb':
      return new Tone.Reverb({
        decay: desc.decay ?? 2.5,
        preDelay: desc.preDelay ?? 0.01,
        wet: desc.wet ?? 0.4
      });
    case 'echo':
    case 'delay':
      return new Tone.FeedbackDelay({
        delayTime: desc.delayTime ?? '8n',
        feedback: desc.feedback ?? 0.3,
        wet: desc.wet ?? 0.3
      });
    case 'chorus':
      return new Tone.Chorus({
        frequency: desc.frequency ?? 1.5,
        delayTime: desc.delayTime ?? 3.5,
        depth: desc.depth ?? 0.7,
        wet: desc.wet ?? 0.5
      }).start();
    case 'distortion':
      return new Tone.Distortion({
        distortion: desc.distortion ?? 0.4,
        wet: desc.wet ?? 0.5
      });
    case 'phaser':
      return new Tone.Phaser({
        frequency: desc.frequency ?? 0.5,
        octaves: desc.octaves ?? 3,
        wet: desc.wet ?? 0.5
      });
    case 'bitcrusher':
      return new Tone.BitCrusher({
        bits: desc.bits ?? 4,
        wet: desc.wet ?? 1
      });
    case 'filter':
      return new Tone.Filter({
        type: desc.filterType ?? desc.shape ?? 'lowpass',
        frequency: desc.frequency ?? 1200,
        rolloff: desc.rolloff ?? -12,
        Q: desc.Q ?? 1,
        gain: desc.gain ?? 0
      });
    case 'gain':
      return new Tone.Gain(desc.gain ?? 1);
    case 'compressor':
      return new Tone.Compressor({
        threshold: desc.threshold ?? -24,
        ratio: desc.ratio ?? 3,
        attack: desc.attack ?? 0.003,
        release: desc.release ?? 0.25,
        knee: desc.knee ?? 30
      });
    default:
      console.warn(`[Sonance] Unknown effect type: ${desc.type}`);
      return new Tone.Gain(1);
  }
}

export function buildEffectChain(effectDescriptors = [], destination) {
  const nodes = effectDescriptors.map(desc => createEffect(desc));

  for (let i = 0; i < nodes.length; i += 1) {
    if (i < nodes.length - 1) {
      nodes[i].connect(nodes[i + 1]);
    } else if (destination) {
      nodes[i].connect(destination);
    }
  }

  return nodes;
}
