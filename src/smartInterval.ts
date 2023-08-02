export class SmartInterval {
  private callback: () => void;
  private timeout: number = 0;
  private iId: number = null;
  private isPaused: boolean = false;
  private lastTick: number;
  constructor(
    callback: () => void,
    interval: number = 0 // default case -- means will not run
  ) {
    this.callback = callback;
    this.setInterval(interval);
  }
  
  setInterval(interval: number) {
    const oldInterval = this.timeout;
    this.timeout = interval;

    if (interval > 0 && oldInterval != this.timeout && !this.isPaused) { // new and valid interval
      this.createInterval();
    }
  }

  pause() {
    clearInterval(this.iId);
    this.iId = null;
    this.isPaused = true;
  }

  play() {
    this.createInterval();
    this.isPaused = false;
  }

  private createInterval() {
    if (this.iId != null) { // remove old interval, then replace it
      clearInterval(this.iId);
      const now = (new Date()).getTime();
      if (now - this.lastTick >= this.timeout) { // too long between calls, just phone one in
        this.callback();
        this.lastTick = now;
      }
    }
    // create brand new interval
    this.iId = setInterval(
      () => {
        this.lastTick = (new Date()).getTime();
        this.callback()
      },
      this.timeout
    );
  }

  get id() { return this.id; }
}