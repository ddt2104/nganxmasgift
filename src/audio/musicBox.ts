/**
 * Bộ tổng hợp âm thanh Hộp nhạc (Music Box / Celesta) bằng Web Audio API
 * Không phụ thuộc file MP3 bên ngoài, chạy mượt 100% offline.
 * Chơi giai điệu ấm áp bài "We Wish You A Merry Christmas" kết hợp hợp âm rải hộp nhạc.
 */

interface NoteEvent {
  /** Tần số nốt nhạc (Hz), 0 là dấu lặng */
  freq: number;
  /** Độ dài theo nhịp (beats) */
  beats: number;
  /** Nốt bè trầm (tuỳ chọn) */
  bassFreq?: number;
}

// Bảng tần số nốt nhạc chuẩn (Hz)
const NOTE = {
  REST: 0,
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  Fs4: 369.99,
  G4: 392.0,
  A4: 440.0,
  As4: 466.16,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  F5: 698.46,
  Fs5: 739.99,
  G5: 783.99,
  A5: 880.0,
  G3: 196.0,
  A3: 220.0,
  B3: 246.94,
} as const;

// Giai điệu "We Wish You A Merry Christmas" (nhịp 3/4, phong cách hộp nhạc cổ điển)
const MELODY_SEQUENCE: NoteEvent[] = [
  // Ô nhịp lấy đà: We wish you a...
  { freq: NOTE.D4, beats: 1, bassFreq: NOTE.G3 },
  // Merry Christmas
  { freq: NOTE.G4, beats: 1, bassFreq: NOTE.B3 },
  { freq: NOTE.G4, beats: 0.5 },
  { freq: NOTE.A4, beats: 0.5 },
  { freq: NOTE.G4, beats: 0.5 },
  { freq: NOTE.Fs4, beats: 0.5 },
  { freq: NOTE.E4, beats: 1, bassFreq: NOTE.C4 },
  { freq: NOTE.E4, beats: 1 },
  // We wish you a...
  { freq: NOTE.E4, beats: 1 },
  // Merry Christmas
  { freq: NOTE.A4, beats: 1, bassFreq: NOTE.A3 },
  { freq: NOTE.A4, beats: 0.5 },
  { freq: NOTE.B4, beats: 0.5 },
  { freq: NOTE.A4, beats: 0.5 },
  { freq: NOTE.G4, beats: 0.5 },
  { freq: NOTE.Fs4, beats: 1, bassFreq: NOTE.D4 },
  { freq: NOTE.D4, beats: 1 },
  // We wish you a...
  { freq: NOTE.D4, beats: 1 },
  // Merry Christmas
  { freq: NOTE.B4, beats: 1, bassFreq: NOTE.G3 },
  { freq: NOTE.B4, beats: 0.5 },
  { freq: NOTE.C5, beats: 0.5 },
  { freq: NOTE.B4, beats: 0.5 },
  { freq: NOTE.A4, beats: 0.5 },
  { freq: NOTE.G4, beats: 1, bassFreq: NOTE.E4 },
  { freq: NOTE.E4, beats: 1 },
  // And a Happy New Year
  { freq: NOTE.D4, beats: 0.5, bassFreq: NOTE.C4 },
  { freq: NOTE.D4, beats: 0.5 },
  { freq: NOTE.E4, beats: 1 },
  { freq: NOTE.A4, beats: 1, bassFreq: NOTE.D4 },
  { freq: NOTE.Fs4, beats: 1 },
  { freq: NOTE.G4, beats: 2, bassFreq: NOTE.G3 },

  // Điệp khúc: Good tidings we bring...
  { freq: NOTE.D4, beats: 1 },
  { freq: NOTE.G4, beats: 1, bassFreq: NOTE.G3 },
  { freq: NOTE.G4, beats: 1 },
  { freq: NOTE.G4, beats: 1 },
  { freq: NOTE.Fs4, beats: 2, bassFreq: NOTE.D4 },
  { freq: NOTE.Fs4, beats: 1 },
  { freq: NOTE.G4, beats: 1, bassFreq: NOTE.E4 },
  { freq: NOTE.Fs4, beats: 1 },
  { freq: NOTE.E4, beats: 1 },
  { freq: NOTE.D4, beats: 2, bassFreq: NOTE.B3 },
  // Good tidings for Christmas...
  { freq: NOTE.A4, beats: 1, bassFreq: NOTE.C4 },
  { freq: NOTE.B4, beats: 1 },
  { freq: NOTE.A4, beats: 0.5 },
  { freq: NOTE.G4, beats: 0.5 },
  { freq: NOTE.D5, beats: 1, bassFreq: NOTE.G3 },
  { freq: NOTE.D4, beats: 1 },
  { freq: NOTE.D4, beats: 0.5 },
  { freq: NOTE.D4, beats: 0.5 },
  // And a Happy New Year!
  { freq: NOTE.E4, beats: 1, bassFreq: NOTE.C4 },
  { freq: NOTE.A4, beats: 1, bassFreq: NOTE.D4 },
  { freq: NOTE.Fs4, beats: 1 },
  { freq: NOTE.G4, beats: 2.5, bassFreq: NOTE.G3 },
  { freq: NOTE.REST, beats: 0.5 },
];

export class MusicBoxSynth {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private timerId: number | null = null;
  private stepIndex = 0;
  private nextNoteTime = 0;
  private playing = false;
  private readonly tempoBpm = 112;

  private ensureContext() {
    if (this.ctx) return;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioCtx();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.0001;
    this.masterGain.connect(this.ctx.destination);

    // Tạo hiệu ứng vang phòng ấm áp (Procedural Impulse Response)
    const sampleRate = this.ctx.sampleRate;
    const length = Math.floor(sampleRate * 1.9);
    const impulse = this.ctx.createBuffer(2, length, sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        const decay = Math.pow(1 - i / length, 2.6);
        data[i] = (Math.random() * 2 - 1) * decay * 0.35;
      }
    }
    this.reverbNode = this.ctx.createConvolver();
    this.reverbNode.buffer = impulse;

    const wetGain = this.ctx.createGain();
    wetGain.gain.value = 0.42;
    this.reverbNode.connect(wetGain);
    wetGain.connect(this.masterGain);
  }

  /** Phát một nốt hộp nhạc kim loại trong trẻo */
  private triggerBellNote(freq: number, time: number, gainAmount: number, durationSec: number) {
    if (!this.ctx || !this.masterGain || !this.reverbNode || freq <= 0) return;

    const oscFundamental = this.ctx.createOscillator();
    const oscOvertone = this.ctx.createOscillator();
    const noteGain = this.ctx.createGain();
    const overtoneGain = this.ctx.createGain();

    // Sóng sin cho âm sắc hộp nhạc dịu + sóng tam giác nhẹ cho độ ngân lấp lánh
    oscFundamental.type = 'sine';
    oscFundamental.frequency.setValueAtTime(freq, time);

    oscOvertone.type = 'triangle';
    oscOvertone.frequency.setValueAtTime(freq * 2.0, time);

    overtoneGain.gain.setValueAtTime(0.14, time);
    overtoneGain.gain.exponentialRampToValueAtTime(0.001, time + durationSec * 0.45);

    noteGain.gain.setValueAtTime(0.0001, time);
    noteGain.gain.linearRampToValueAtTime(gainAmount, time + 0.009);
    noteGain.gain.exponentialRampToValueAtTime(0.0008, time + durationSec);

    oscFundamental.connect(noteGain);
    oscOvertone.connect(overtoneGain);
    overtoneGain.connect(noteGain);

    noteGain.connect(this.masterGain);
    noteGain.connect(this.reverbNode);

    oscFundamental.start(time);
    oscOvertone.start(time);
    oscFundamental.stop(time + durationSec + 0.05);
    oscOvertone.stop(time + durationSec + 0.05);
  }

  /** Phát tiếng leng keng nhẹ khi lắc quả cầu tuyết hoặc mở voucher */
  public playSparkleChime() {
    this.ensureContext();
    if (!this.ctx || !this.masterGain) return;
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    const now = this.ctx.currentTime;
    if (!this.playing) {
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(0.45, now);
    }
    const chimeNotes = [NOTE.G5, NOTE.B4, NOTE.D5, NOTE.G5 * 1.5];
    chimeNotes.forEach((f, idx) => {
      this.triggerBellNote(f, now + idx * 0.065, 0.14, 1.1);
    });
  }

  private scheduleLoop = () => {
    if (!this.playing || !this.ctx) return;
    const secondsPerBeat = 60 / this.tempoBpm;

    while (this.nextNoteTime < this.ctx.currentTime + 0.25) {
      const event = MELODY_SEQUENCE[this.stepIndex];
      const dur = event.beats * secondsPerBeat;

      if (event.freq > 0) {
        // Nâng cao 1 quãng tám để nghe thanh thoát như hộp nhạc pha lê
        this.triggerBellNote(event.freq * 2, this.nextNoteTime, 0.22, Math.max(0.85, dur * 1.65));
      }
      if (event.bassFreq && event.bassFreq > 0) {
        this.triggerBellNote(event.bassFreq * 2, this.nextNoteTime, 0.1, 1.4);
      }

      this.nextNoteTime += dur;
      this.stepIndex = (this.stepIndex + 1) % MELODY_SEQUENCE.length;
    }

    this.timerId = window.setTimeout(this.scheduleLoop, 60);
  };

  public async start(): Promise<boolean> {
    this.ensureContext();
    if (!this.ctx || !this.masterGain) return false;

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    if (this.playing) return true;
    this.playing = true;
    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(Math.max(this.masterGain.gain.value, 0.001), now);
    this.masterGain.gain.linearRampToValueAtTime(0.55, now + 0.35);

    this.nextNoteTime = now + 0.05;
    this.scheduleLoop();
    return true;
  }

  public stop() {
    this.playing = false;
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
    }
  }

  public isPlaying(): boolean {
    return this.playing;
  }

  public dispose() {
    this.stop();
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
  }
}
