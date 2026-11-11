// Sonance public API types. Hand-written to match src/index.js at runtime.
// Tone.js objects that cross the API (nodes, modulation targets) are typed
// structurally or as unknown, so consumers are not forced into a Tone.js
// type dependency beyond the package they already install at runtime.

export type NoteValue = string | string[];
export type TimeValue = string | number;

export interface NoteEvent {
  note?: NoteValue | null;
  duration?: string;
  velocity?: number;
  rest?: boolean;
  [key: string]: unknown;
}

export interface EffectDescriptor {
  type: string;
  id?: string;
  [key: string]: unknown;
}

export interface ModulationSystem {
  createModulator(id: string, options?: Record<string, unknown>): unknown;
  getModulator(id: string): unknown;
  bind(options?: Record<string, unknown>): unknown;
  update(deltaTime: number, context?: Record<string, unknown>): void;
  dispose(): void;
}

export interface SonanceEngineOptions {
  modulation?: ModulationSystem | null;
  [key: string]: unknown;
}

export interface SoundOptions {
  note?: NoteValue;
  duration?: TimeValue;
  volume?: number;
  id?: string;
  oscillator?: string;
  envelope?: Record<string, number>;
  layers?: Array<Record<string, unknown>>;
  effects?: EffectDescriptor[];
  variation?: Record<string, unknown> | null;
  maxPolyphony?: number;
  [key: string]: unknown;
}

export interface InstrumentOptions {
  oscillator?: string;
  envelope?: Record<string, number>;
  volume?: number;
  layers?: Array<Record<string, unknown>>;
  effects?: EffectDescriptor[];
  variation?: Record<string, unknown> | null;
  maxPolyphony?: number;
  [key: string]: unknown;
}

export interface ChannelOptions {
  name?: string;
  volume?: number;
  instrument?: InstrumentOptions;
  effects?: EffectDescriptor[];
  [key: string]: unknown;
}

export interface SoundtrackOptions {
  name?: string;
  bpm?: number;
  [key: string]: unknown;
}

export interface PlaySequenceOptions {
  loop?: boolean;
  bpm?: number;
}

export interface SoundtrackChannelDefinition {
  instrument?: InstrumentOptions;
  effects?: EffectDescriptor[];
  volume?: number;
  sequence?: NoteEvent[];
  loop?: boolean;
  [key: string]: unknown;
}

export interface SoundtrackDefinition {
  name?: string;
  bpm?: number;
  channels?: Record<string, SoundtrackChannelDefinition>;
  [key: string]: unknown;
}

export interface LoadSoundtrackResult {
  soundtrack: Soundtrack;
  channels: Record<string, Channel>;
}

export interface SceneDefinition {
  name?: string;
  description?: string;
  modulators?: Array<Record<string, unknown> & { id: string }>;
  sounds?: Array<Record<string, unknown> & { id: string }>;
  soundtracks?: SoundtrackDefinition[];
  nodes?: unknown[];
  [key: string]: unknown;
}

export declare class Instrument {
  constructor(options?: InstrumentOptions);
  connect(destination: unknown): this;
  disconnect(): this;
  setOscillator(type: string): this;
  setEnvelope(envelope: Record<string, number>): this;
  triggerAttackRelease(notes: NoteValue, duration?: string, time?: TimeValue, velocity?: number): this;
  triggerAttack(notes: NoteValue, time?: TimeValue, velocity?: number): this;
  triggerRelease(notes: NoteValue, time?: TimeValue): this;
  dispose(): void;
  readonly toneNode: unknown;
  readonly outputNode: unknown;
  readonly modulationTargets: Record<string, unknown>;
}

export declare class Sound {
  constructor(options?: SoundOptions);
  readonly id: string | null;
  trigger(note?: NoteValue, duration?: TimeValue, time?: TimeValue, velocity?: number): this;
  setNote(note: NoteValue): this;
  setVolume(db: number): this;
  setOscillator(type: string): this;
  connect(destination: unknown): this;
  dispose(): void;
  readonly toneNode: unknown;
  readonly modulationTargets: Record<string, unknown>;
}

export declare class Channel {
  constructor(options?: ChannelOptions);
  readonly name: string;
  setVolume(db: number): this;
  setMuted(muted: boolean): this;
  playSequence(notes: NoteEvent[], options?: PlaySequenceOptions): this;
  stopSequence(): this;
  dispose(): void;
  readonly instrument: Instrument;
  readonly modulationTargets: Record<string, unknown>;
}

export declare class Soundtrack {
  constructor(options?: SoundtrackOptions);
  readonly name: string;
  setBpm(bpm: number): this;
  addChannel(name: string, options?: ChannelOptions): Channel;
  getChannel(name: string): Channel | undefined;
  removeChannel(name: string): this;
  play(): Promise<this>;
  pause(): this;
  stop(): this;
  dispose(): void;
  readonly channelNames: string[];
}

export declare class SonanceEngine {
  constructor(options?: SonanceEngineOptions);
  start(): Promise<this>;
  createSound(id: string, options?: SoundOptions): Sound;
  getSound(id: string): Sound | undefined;
  triggerSound(id: string, note?: string, duration?: string): this;
  createModulator(id: string, options?: Record<string, unknown>): unknown;
  getModulator(id: string): unknown;
  bindModulator(options?: Record<string, unknown>): unknown;
  updateModulation(deltaTime: number, context?: Record<string, unknown>): this;
  removeSound(id: string): this;
  createSoundtrack(name: string, options?: SoundtrackOptions): Soundtrack;
  getSoundtrack(name: string): Soundtrack | undefined;
  removeSoundtrack(name: string): this;
  dispose(): void;
  readonly Tone: unknown;
  readonly sounds: Map<string, Sound>;
  readonly soundtracks: Map<string, Soundtrack>;
  readonly modulation: ModulationSystem | null;
}

export declare class SonanceSceneManager {
  static listPresets(): string[];
  static getPreset(name: string): SceneDefinition | null;
  static applyScene(engine: SonanceEngine, definition: SceneDefinition): void;
  static save(name: string, definition: SceneDefinition): void;
  static load(name: string): SceneDefinition | null;
  static listSaved(): string[];
  static deleteSaved(name: string): void;
  static download(definition: SceneDefinition, filename?: string): void;
  static upload(): Promise<SceneDefinition>;
}

export interface MidiUtilsApi {
  midiToNote(midi: number): string;
  noteToMidi(note: string): number;
  parseNoteSequence(sequence: string): Array<{ note: string; duration: string }>;
  buildTimedEvents(notes: NoteEvent[], bpm?: number): Array<NoteEvent & { time: string }>;
  scaleToNotes(rootNote: string, scale: number[], octaves?: number, duration?: string): Array<{ note: string; duration: string }>;
  readonly DURATION_MAP: Record<string, number>;
  readonly Scales: Record<string, number[]>;
}

export declare const MidiUtils: MidiUtilsApi;

export declare function loadSoundtrack(
  engine: SonanceEngine,
  definition: SoundtrackDefinition,
  overrides?: Record<string, Partial<SoundtrackChannelDefinition>>
): LoadSoundtrackResult;

/** The Tone.js namespace, re-exported for advanced usage. */
export declare const Tone: any;

export interface SonanceApi {
  createEngine(options?: SonanceEngineOptions): SonanceEngine;
  SonanceEngine: typeof SonanceEngine;
  Sound: typeof Sound;
  Soundtrack: typeof Soundtrack;
  Channel: typeof Channel;
  Instrument: typeof Instrument;
  MidiUtils: MidiUtilsApi;
  loadSoundtrack: typeof loadSoundtrack;
  SonanceSceneManager: typeof SonanceSceneManager;
  Tone: any;
}

declare const Sonance: SonanceApi;
export default Sonance;
