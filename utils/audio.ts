
let audioCtx: AudioContext | null = null;
let isMuted = false;
let musicInterval: ReturnType<typeof setInterval> | null = null;
let nextNoteTime = 0;
let beatCount = 0;

export const setMuted = (muted: boolean) => {
    isMuted = muted;
    if (isMuted) {
        stopMusic();
    } else {
        // Resume logic is handled by components
    }
};

export const getMuted = () => isMuted;

export const initAudio = () => {
  if (!audioCtx) {
    // Support standard and webkit prefix for broader compatibility
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
};

// Ensure audio context is running (Critical for Mobile iOS)
export const resumeAudio = () => {
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    } else if (!audioCtx) {
        initAudio();
    }
};

// --- MUSIC ENGINE ---
// Procedural Synthwave Generator

const playKick = (time: number, ctx: AudioContext) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
    
    gain.gain.setValueAtTime(0.8, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);
    
    osc.start(time);
    osc.stop(time + 0.5);
};

const playSnare = (time: number, ctx: AudioContext) => {
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < output.length; i++) {
        output[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    
    const gain = ctx.createGain();
    noise.connect(gain);
    gain.connect(ctx.destination);
    
    // Bandpass filter for "snare" tone
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1000;
    noise.disconnect();
    noise.connect(filter);
    filter.connect(gain);

    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
    
    noise.start(time);
};

const playBass = (time: number, freq: number, ctx: AudioContext) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    // Lowpass filter for that muffled synthwave bass
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, time);
    filter.Q.value = 5;
    osc.disconnect();
    osc.connect(filter);
    filter.connect(gain);

    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime(0.2, time);
    gain.gain.linearRampToValueAtTime(0, time + 0.2);
    
    osc.start(time);
    osc.stop(time + 0.25);
};

const playArp = (time: number, freq: number, ctx: AudioContext) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime(0.05, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    
    osc.start(time);
    osc.stop(time + 0.1);
};

export const startMusic = (mode: 'MENU' | 'GAME') => {
    if (isMuted || musicInterval) return;
    
    const ctx = initAudio();
    if (!ctx) return;
    
    if (ctx.state === 'suspended') ctx.resume();

    const tempo = mode === 'GAME' ? 130 : 90; // BPM
    const lookahead = 25.0; // ms
    const scheduleAheadTime = 0.1; // s
    
    beatCount = 0;
    nextNoteTime = ctx.currentTime;

    musicInterval = setInterval(() => {
        while (nextNoteTime < ctx.currentTime + scheduleAheadTime) {
            const beat = beatCount % 16;
            
            if (mode === 'GAME') {
                // DRUMS: Kick on 0, 4, 8, 12. Snare on 4, 12
                if (beat % 4 === 0) playKick(nextNoteTime, ctx);
                if (beat % 8 === 4) playSnare(nextNoteTime, ctx);
                
                // BASS: Driving 16th notes
                // Root notes: A (55), F (43.65), G (49), E (41.2)
                let bassFreq = 55; 
                if (beatCount % 64 >= 16) bassFreq = 43.65;
                if (beatCount % 64 >= 32) bassFreq = 49;
                if (beatCount % 64 >= 48) bassFreq = 41.2;
                
                // Offbeat bass pump
                if (beat % 2 !== 0) playBass(nextNoteTime, bassFreq, ctx);
                
                // ARP
                if (beat % 2 === 0) {
                    playArp(nextNoteTime, bassFreq * 8, ctx); // High octaves
                }
            } else {
                // MENU MODE: Ambient
                if (beat % 16 === 0) playBass(nextNoteTime, 55, ctx); // Long drone
                if (beat % 4 === 0) playArp(nextNoteTime, 440, ctx); // Simple ping
            }

            const secondsPerBeat = 60.0 / tempo;
            nextNoteTime += 0.25 * secondsPerBeat; // 16th notes
            beatCount++;
        }
    }, lookahead);
};

export const stopMusic = () => {
    if (musicInterval) {
        clearInterval(musicInterval);
        musicInterval = null;
    }
};

// --- SFX ---

export const playSound = (
    type: 'hit' | 'miss' | 'gameover' | 'start' | 'ui' | 'bomb' | 'bonus' | 'freeze' | 'nuke' | 'jackpot' | 'heart',
    comboIntensity: number = 0
) => {
  if (isMuted) return;

  try {
    const ctx = initAudio();
    // Ensure Resume for SFX too
    if (ctx.state === 'suspended') ctx.resume();
    
    const now = ctx.currentTime;
    
    // Main oscillator
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    switch (type) {
      case 'hit':
        // Satisfying high-pitch pop, pitch increases with combo
        osc.type = 'sine';
        // Base pitch + combo bonus (capped at +400Hz)
        const pitchBonus = Math.min(comboIntensity * 20, 400);
        const basePitch = 500 + Math.random() * 50;
        
        osc.frequency.setValueAtTime(basePitch + pitchBonus, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);
        
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        
        osc.start(now);
        osc.stop(now + 0.15);
        break;
      
      case 'heart':
        // Healing "Up" sound
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.linearRampToValueAtTime(600, now + 0.1);
        osc.frequency.linearRampToValueAtTime(800, now + 0.3);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
        break;

      case 'bonus':
        // Magical sparkle sound
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.3);
        
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.4);
        
        // Second harmonic
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(1200, now);
        gain2.gain.setValueAtTime(0.05, now);
        gain2.gain.linearRampToValueAtTime(0, now + 0.4);
        
        osc.start(now);
        osc.stop(now + 0.4);
        osc2.start(now);
        osc2.stop(now + 0.4);
        break;

      case 'jackpot':
        // Casino coin rain sound
        osc.type = 'triangle';
        // Rapid arpeggio
        for(let i=0; i<5; i++) {
            osc.frequency.setValueAtTime(880 + (i*200), now + (i*0.05));
        }
        
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        
        osc.start(now);
        osc.stop(now + 0.6);
        break;

      case 'freeze':
        // Icy crystalline sound
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1500, now);
        osc.frequency.linearRampToValueAtTime(2000, now + 0.5);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
        break;

      case 'nuke':
        // Low powerful boom
        osc.type = 'square';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(10, now + 0.8);
        
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        
        const noise = ctx.createBufferSource();
        const bufferSize = ctx.sampleRate * 0.8;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        noise.buffer = buffer;
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.2, now);
        noiseGain.gain.linearRampToValueAtTime(0, now + 0.8);
        noise.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        
        noise.start(now);
        osc.start(now);
        osc.stop(now + 0.8);
        break;

      case 'bomb':
        // Explosion noise
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(10, now + 0.4);
        
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        
        osc.start(now);
        osc.stop(now + 0.4);
        break;

      case 'miss':
        // Low buzz/zap
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(80, now + 0.3);
        
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        
        osc.start(now);
        osc.stop(now + 0.3);
        break;
        
      case 'start':
        // Ascending power-up sound
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(880, now + 0.4);
        
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.4);
        
        osc.start(now);
        osc.stop(now + 0.4);
        break;

      case 'gameover':
        // Descending sad slide
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 1);
        
        // Add a vibrato effect for sadness
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 5;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 20;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start(now);
        lfo.stop(now + 1);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0, now + 1);
        
        osc.start(now);
        osc.stop(now + 1);
        break;

      case 'ui':
        // Quick tick
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
        break;
    }
  } catch (e) {
    console.warn('Audio playback failed', e);
  }
};
