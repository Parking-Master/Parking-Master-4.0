const Easing = {
  in: function(t) { return t * t; },
  out: function(t) { return t * (2 - t); },
  inout: function(t) {
    return t < 0.5
      ? 2 * t * t
      : -1 + (4 - 2 * t) * t;
  }
};

let TweenCache = null;

class Tween {
  constructor(from, to, duration, easing, onUpdate, onComplete) {
    this.from = from;
    this.to = to;
    this.duration = duration;
    this.easing = Easing[easing] || Easing.inout;
    this.onUpdate = onUpdate;
    this.onComplete = onComplete;
    this.startTime = null;
    this.running = false;
  }

  start() {
    if (TweenCache) TweenCache.stop();
    this.stop();
    TweenCache = this;
    this.running = true;
    this.startTime = performance.now();
    requestAnimationFrame(this.animate.bind(this));
  }

  animate(now) {
    if (!this.running) return;
    let elapsed = now - this.startTime;
    let t = Math.min(elapsed / this.duration, 1);
    let value = this.from + (this.to - this.from) * this.easing(t);
    if (this.onUpdate) this.onUpdate(value);

    if (t < 1) {
      requestAnimationFrame(this.animate.bind(this));
    } else {
      this.running = false;
      if (this.onUpdate) this.onUpdate(this.to); // Ensure final value
      if (this.onComplete) this.onComplete();
    }
  }

  stop() {
    this.running = false;
  }
}