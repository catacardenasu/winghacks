export class TimerEngine {
  constructor(durationSeconds, onTick, onComplete) {
    this.durationSeconds = durationSeconds;
    this.remainingSeconds = durationSeconds;
    this.onTick = onTick;
    this.onComplete = onComplete;
    this.intervalId = null;
  }

  start() {
    this.stop();
    this.remainingSeconds = this.durationSeconds;
    this.onTick(this.remainingSeconds);

    this.intervalId = setInterval(() => {
      this.remainingSeconds -= 1;
      this.onTick(this.remainingSeconds);

      if (this.remainingSeconds <= 0) {
        this.stop();
        this.onComplete();
      }
    }, 1000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
