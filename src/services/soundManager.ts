/**
 * sound-manager.ts
 * Manages game audio using the Web Audio API.
 * Includes background ambient loop and sound effects.
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private backgroundOsc: OscillatorNode | null = null;
  private backgroundGain: GainNode | null = null;

  private init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);
    this.masterGain.gain.value = 0.5;
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.5, this.ctx!.currentTime, 0.1);
    }
  }

  public toggleMute() {
    this.setMute(!this.isMuted);
    return this.isMuted;
  }

  private createOscillator(freq: number, type: OscillatorType = 'sine'): OscillatorNode {
    this.init();
    const osc = this.ctx!.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx!.currentTime);
    return osc;
  }

  public playClick() {
    this.init();
    if (this.isMuted) return;
    const osc = this.createOscillator(800, 'square');
    const env = this.ctx!.createGain();
    
    osc.connect(env);
    env.connect(this.masterGain!);
    
    env.gain.setValueAtTime(0.2, this.ctx!.currentTime);
    env.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + 0.1);
    
    osc.start();
    osc.stop(this.ctx!.currentTime + 0.1);
  }

  public playStart() {
    this.init();
    if (this.isMuted) return;
    const osc = this.createOscillator(200, 'sawtooth');
    const env = this.ctx!.createGain();
    
    osc.connect(env);
    env.connect(this.masterGain!);
    
    osc.frequency.exponentialRampToValueAtTime(800, this.ctx!.currentTime + 0.3);
    env.gain.setValueAtTime(0.15, this.ctx!.currentTime);
    env.gain.linearRampToValueAtTime(0, this.ctx!.currentTime + 0.3);
    
    osc.start();
    osc.stop(this.ctx!.currentTime + 0.3);
  }

  public playTrigger() {
    this.init();
    if (this.isMuted) return;
    const osc = this.createOscillator(1200, 'sine');
    const env = this.ctx!.createGain();
    
    osc.connect(env);
    env.connect(this.masterGain!);
    
    env.gain.setValueAtTime(0.3, this.ctx!.currentTime);
    env.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + 0.5);
    
    osc.start();
    osc.stop(this.ctx!.currentTime + 0.5);
  }

  public playSuccess() {
    this.init();
    if (this.isMuted) return;
    const now = this.ctx!.currentTime;
    const freqs = [440, 554.37, 659.25, 880]; // A major arpeggio
    
    freqs.forEach((f, i) => {
      const osc = this.createOscillator(f, 'sine');
      const env = this.ctx!.createGain();
      osc.connect(env);
      env.connect(this.masterGain!);
      
      const startTime = now + i * 0.05;
      env.gain.setValueAtTime(0, startTime);
      env.gain.linearRampToValueAtTime(0.1, startTime + 0.02);
      env.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);
      
      osc.start(startTime);
      osc.stop(startTime + 0.4);
    });
  }

  public playFail() {
    this.init();
    if (this.isMuted) return;
    const osc = this.createOscillator(100, 'sawtooth');
    const env = this.ctx!.createGain();
    
    osc.connect(env);
    env.connect(this.masterGain!);
    
    osc.frequency.linearRampToValueAtTime(50, this.ctx!.currentTime + 0.4);
    env.gain.setValueAtTime(0.3, this.ctx!.currentTime);
    env.gain.linearRampToValueAtTime(0, this.ctx!.currentTime + 0.4);
    
    osc.start();
    osc.stop(this.ctx!.currentTime + 0.4);
  }

  public startMusic() {
    this.init();
    if (this.backgroundOsc) return;

    const osc = this.ctx!.createOscillator();
    const filter = this.ctx!.createBiquadFilter();
    const gain = this.ctx!.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(55, this.ctx!.currentTime); // A1
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, this.ctx!.currentTime);
    filter.Q.setValueAtTime(5, this.ctx!.currentTime);

    gain.gain.setValueAtTime(0, this.ctx!.currentTime);
    gain.gain.linearRampToValueAtTime(0.05, this.ctx!.currentTime + 2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);

    osc.start();
    this.backgroundOsc = osc;
    this.backgroundGain = gain;

    // Subtle LFO for filter
    const lfo = this.ctx!.createOscillator();
    const lfoGain = this.ctx!.createGain();
    lfo.frequency.setValueAtTime(0.1, this.ctx!.currentTime);
    lfoGain.gain.setValueAtTime(100, this.ctx!.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();
  }

  public stopMusic() {
    if (this.backgroundGain) {
      this.backgroundGain.gain.linearRampToValueAtTime(0, this.ctx!.currentTime + 1);
      setTimeout(() => {
        this.backgroundOsc?.stop();
        this.backgroundOsc = null;
        this.backgroundGain = null;
      }, 1000);
    }
  }

  public resumeContext() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
}

export const soundManager = new SoundManager();
