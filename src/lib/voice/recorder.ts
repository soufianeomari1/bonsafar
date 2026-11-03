"use client";

/**
 * Microphone capture for the voice note. MediaRecorder keeps the compressed
 * take in memory only (webm/opus on Chrome, mp4 on iOS Safari); an
 * AnalyserNode on the same stream gives the live level for the radar.
 */

export type RecorderErrorKind = "denied" | "unsupported" | "failed";

export class RecorderError extends Error {
  constructor(readonly kind: RecorderErrorKind) {
    super(kind);
  }
}

const MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4;codecs=mp4a.40.2",
  "audio/mp4",
  "audio/aac",
];

export const MAX_RECORDING_MS = 60_000;

export function canRecord(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof MediaRecorder !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia
  );
}

function pickMimeType(): string | undefined {
  return MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type));
}

export class VoiceRecorder {
  private stream: MediaStream | null = null;
  private context: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private samples: Float32Array<ArrayBuffer> | null = null;
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private smoothed = 0;
  private startedAt = 0;
  private pausedAt = 0;
  private pausedTotal = 0;

  /** Asks for the microphone and starts recording. */
  async start(): Promise<void> {
    if (!canRecord()) throw new RecorderError("unsupported");
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 },
      });
    } catch (error) {
      const name = error instanceof DOMException ? error.name : "";
      if (name === "NotAllowedError" || name === "SecurityError") {
        throw new RecorderError("denied");
      }
      throw new RecorderError(name === "NotFoundError" ? "unsupported" : "failed");
    }

    try {
      this.context = new AudioContext();
      const source = this.context.createMediaStreamSource(this.stream);
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = 1024;
      this.samples = new Float32Array(this.analyser.fftSize);
      source.connect(this.analyser);

      const mimeType = pickMimeType();
      this.recorder = new MediaRecorder(this.stream, mimeType ? { mimeType } : undefined);
      this.chunks = [];
      this.recorder.ondataavailable = (event) => {
        if (event.data.size > 0) this.chunks.push(event.data);
      };
      this.recorder.start(250);
      this.startedAt = performance.now();
    } catch {
      this.release();
      throw new RecorderError("failed");
    }
  }

  /** Voice level from 0 to 1, smoothed so the radar does not flicker. */
  level(): number {
    if (!this.analyser || !this.samples || this.recorder?.state !== "recording") {
      this.smoothed *= 0.8;
      return this.smoothed;
    }
    this.analyser.getFloatTimeDomainData(this.samples);
    let sum = 0;
    for (const sample of this.samples) sum += sample * sample;
    const rms = Math.sqrt(sum / this.samples.length);
    // Speech sits around 0.02 to 0.2 RMS; map it onto 0..1 on a soft curve.
    const target = Math.min(1, Math.sqrt(rms * 6));
    this.smoothed += (target - this.smoothed) * (target > this.smoothed ? 0.5 : 0.15);
    return this.smoothed;
  }

  /** Captured audio only. The clock starts when MediaRecorder starts, after the permission prompt, never at pointerdown. */
  elapsedMs(): number {
    if (!this.startedAt) return 0;
    const now = this.recorder?.state === "paused" ? this.pausedAt : performance.now();
    return now - this.startedAt - this.pausedTotal;
  }

  get paused(): boolean {
    return this.recorder?.state === "paused";
  }

  pause(): void {
    if (this.recorder?.state !== "recording") return;
    this.recorder.pause();
    this.pausedAt = performance.now();
  }

  resume(): void {
    if (this.recorder?.state !== "paused") return;
    this.recorder.resume();
    this.pausedTotal += performance.now() - this.pausedAt;
  }

  /** Stops and returns the compressed take. Nothing is written anywhere. */
  stop(): Promise<Blob> {
    const recorder = this.recorder;
    if (!recorder || recorder.state === "inactive") {
      this.release();
      return Promise.resolve(new Blob([]));
    }
    return new Promise((resolve) => {
      recorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: recorder.mimeType || "audio/webm" });
        this.release();
        resolve(blob);
      };
      recorder.stop();
    });
  }

  /** Drops the take: the audio never leaves memory. */
  cancel(): void {
    if (this.recorder && this.recorder.state !== "inactive") {
      this.recorder.onstop = null;
      this.recorder.stop();
    }
    this.release();
  }

  private release(): void {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    void this.context?.close().catch(() => undefined);
    this.context = null;
    this.analyser = null;
    this.recorder = null;
    this.chunks = [];
  }
}
