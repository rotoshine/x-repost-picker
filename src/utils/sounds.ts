// Sound effects using Web Audio API

class SoundGenerator {
  private audioContext: AudioContext | null = null;

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  // 추첨 시작 - 드럼롤 사운드
  playDrumRoll() {
    const ctx = this.getAudioContext();
    const duration = 0.1;
    const interval = 50;
    let count = 0;
    const maxCount = 80; // 4 seconds worth

    const playBeat = () => {
      if (count >= maxCount) return;

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Lower frequency for drum-like sound
      oscillator.frequency.value = 80 + Math.random() * 20;
      oscillator.type = 'triangle';

      gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);

      count++;
      if (count < maxCount) {
        setTimeout(playBeat, interval);
      }
    };

    playBeat();
  }

  // 카드 회전 소리 (빠르게 반복)
  playCardSpin() {
    const ctx = this.getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.setValueAtTime(400, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.05);
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.05);
  }

  // 당첨자 선정 - 반짝이는 사운드
  playWinnerSound() {
    const ctx = this.getAudioContext();

    // 화음 생성
    const frequencies = [523.25, 659.25, 783.99]; // C, E, G (major chord)

    frequencies.forEach((freq, index) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = freq;
      oscillator.type = 'sine';

      const startTime = ctx.currentTime + index * 0.05;
      gainNode.gain.setValueAtTime(0.2, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.5);
    });

    // 반짝이는 효과
    setTimeout(() => {
      const sparkle = ctx.createOscillator();
      const sparkleGain = ctx.createGain();

      sparkle.connect(sparkleGain);
      sparkleGain.connect(ctx.destination);

      sparkle.frequency.setValueAtTime(2000, ctx.currentTime);
      sparkle.frequency.exponentialRampToValueAtTime(3000, ctx.currentTime + 0.1);
      sparkle.type = 'sine';

      sparkleGain.gain.setValueAtTime(0.15, ctx.currentTime);
      sparkleGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

      sparkle.start(ctx.currentTime);
      sparkle.stop(ctx.currentTime + 0.2);
    }, 200);
  }

  // 최종 팡파르 - 화려한 승리 사운드
  playFanfare() {
    const ctx = this.getAudioContext();

    // 상승하는 아르페지오
    const melody = [
      { freq: 523.25, time: 0 },      // C
      { freq: 659.25, time: 0.15 },   // E
      { freq: 783.99, time: 0.3 },    // G
      { freq: 1046.5, time: 0.45 },   // C (octave)
    ];

    melody.forEach(note => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = note.freq;
      oscillator.type = 'triangle';

      const startTime = ctx.currentTime + note.time;
      gainNode.gain.setValueAtTime(0.3, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.3);
    });

    // 마지막 화음
    setTimeout(() => {
      const chord = [523.25, 659.25, 783.99, 1046.5];
      chord.forEach(freq => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.value = freq;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 1);
      });
    }, 600);
  }

  // 버튼 클릭 소리
  playClick() {
    const ctx = this.getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.05);
  }

  // 에러 소리
  playError() {
    const ctx = this.getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.setValueAtTime(300, ctx.currentTime);
    oscillator.frequency.linearRampToValueAtTime(200, ctx.currentTime + 0.1);
    oscillator.type = 'sawtooth';

    gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.15);
  }
}

// Singleton instance
export const soundGenerator = new SoundGenerator();
