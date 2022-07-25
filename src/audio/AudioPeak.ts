export class AudioPeak {
  private readonly FFT_SIZE = 32;
  private readonly HalfUint8Size = 128;

  private audioCtx: AudioContext;
  private analyzer: AnalyserNode;
  private timeDomainByteArray: Uint8Array;
  private inputNode: MediaStreamAudioSourceNode;

  constructor(stream: MediaStream) {
    this.audioCtx = new ((window as any).AudioContext ||
      (window as any).webkitAudioContext)();
    const input = (this.inputNode =
      this.audioCtx.createMediaStreamSource(stream));
    this.analyzer = this.audioCtx.createAnalyser();
    this.analyzer.fftSize = this.FFT_SIZE;
    input.connect(this.analyzer);
    this.timeDomainByteArray = new Uint8Array(this.analyzer.fftSize);
  }

  getCurrentPeak() {
    this.analyzer.getByteTimeDomainData(this.timeDomainByteArray);
    let peak = 0;
    for (let i = 0; i < this.timeDomainByteArray.length / 4; i++) {
      const index = i * 4;
      const value = this.timeDomainByteArray[index];
      if (peak < Math.abs(value)) {
        peak = Math.abs(value);
      }
    }
    return (peak - this.HalfUint8Size) / this.HalfUint8Size;
  }

  getTimeDomainByteArray() {
    return this.timeDomainByteArray;
  }

  close() {
    this.inputNode.disconnect();
    this.analyzer.disconnect();
    this.audioCtx.close();
  }
}
