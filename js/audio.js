const AudioWrapper = function(src) {
  const ctx = audio.ctx;
  const wrapper = {
    buffer: null,
    source: null,
    sources: [],
    loop: false,
    startTime: 0,
    offset: 0,
    playing: false,
    loadPromise: fetch(src).then(res => res.arrayBuffer()).then(buf => ctx.decodeAudioData(buf)).then(decoded => wrapper.buffer = decoded),
    play: function() {
      if (!wrapper.buffer) {
        wrapper.loadPromise.then(() => wrapper.play());
        return;
      }
      if (wrapper.playing) return;
      const source = ctx.createBufferSource();
      source.buffer = wrapper.buffer;
      source.loop = wrapper.loop;
      source.connect(ctx.destination);
      source.start(0, wrapper.offset);
      wrapper.startTime = ctx.currentTime - wrapper.offset;
      wrapper.source = source;
      wrapper.sources.push(source);
      wrapper.playing = true;
      source.onended = () => {
        if (!source.loop) wrapper.playing = false;
      };
    },
    pause: function() {
      if (wrapper.source) {
        try { wrapper.source.stop(); } catch {}
        wrapper.offset = ctx.currentTime - wrapper.startTime;
        wrapper.playing = false;
        wrapper.source.disconnect();
        wrapper.source = null;
      }
      wrapper.sources.forEach(x => x.disconnect());
      wrapper.sources = [];
    },
    get currentTime() {
      return wrapper.playing ? ctx.currentTime - wrapper.startTime : wrapper.offset;
    },
    set currentTime(t) {
      wrapper.offset = t;
      if (wrapper.playing) {
        wrapper.pause();
        wrapper.play();
      }
    }
  };
  return wrapper;
};

audio = {
  playIdleAndDecelerate: false,
  acceleratePauseTimeout: 0,
  deceleratePauseTimeout: 0,
  idlePauseTimeout: 0,
  idlePlayTimeout: 0,
  ctx: new (window.AudioContext || window.webkitAudioContext)(),
  accelerate: function() {
    clearTimeout(audio.acceleratePauseTimeout);
    clearTimeout(audio.idlePlayTimeout);
    audio.deceleratePauseTimeout = setTimeout(() => audio.sounds.decelerate.pause(), 100);
    audio.sounds.accelerate.currentTime = physics.env.speedMPH / 10;
    audio.sounds.accelerate.play();
    audio.idlePauseTimeout = setTimeout(() => {
      audio.sounds.idle.pause();
      audio.sounds.idle.currentTime = 0;
    }, 500);
  },
  decelerate: function() {
    clearTimeout(audio.deceleratePauseTimeout);
    clearTimeout(audio.idlePauseTimeout);
    audio.acceleratePauseTimeout = setTimeout(() => audio.sounds.accelerate.pause(), 500);
    audio.sounds.decelerate.currentTime = Math.max(5 - audio.sounds.accelerate.currentTime, 0);
    audio.sounds.decelerate.play();
    audio.idlePlayTimeout = setTimeout(() => {
      audio.sounds.idle.currentTime = 0;
      audio.sounds.idle.play();
    }, audio.playIdleAndDecelerate ? 0 : 4000);
  },
  on: function() {
    audio.sounds.on.currentTime = 0;
    audio.sounds.on.play();
    audio.idlePlayTimeout = setTimeout(() => {
      audio.sounds.idle.currentTime = 0;
      audio.sounds.idle.play();
    }, 500);
  },
  off: function() {
    clearTimeout(audio.idlePlayTimeout);
    audio.sounds.off.play();
    audio.idlePauseTimeout = setTimeout(() => {
      audio.sounds.idle.pause();
      audio.sounds.idle.currentTime = 0;
    }, 100);
  },
  warning: function() {
    audio.sounds.warning.pause();
    audio.sounds.warning.currentTime = 0;
    audio.sounds.warning.play();
  },
  click: function() {
    audio.sounds.click.pause();
    audio.sounds.click.currentTime = 0;
    audio.sounds.click.play();
  },
  end: function() {
    Object.values(audio.sounds).forEach(sound => (sound.pause(), sound.currentTime = 0));
    clearTimeout(audio.acceleratePauseTimeout);
    clearTimeout(audio.deceleratePauseTimeout);
    clearTimeout(audio.idlePauseTimeout);
    clearTimeout(audio.idlePlayTimeout);
  },
  tap: function() {
    audio.sounds.tap.currentTime = 0;
    audio.sounds.tap.play();
  },
  start: function() {
    audio.sounds.idle.loop = true;
    audio.sounds.idle.play();
  }
};

audio.sounds = {
  "accelerate": AudioWrapper("/sounds/engine_accelerate.mp3"),
  "decelerate": AudioWrapper("/sounds/engine_decelerate.mp3"),
  "idle": AudioWrapper("/sounds/engine_idle.mp3"),
  "warning": AudioWrapper("/sounds/car_warning.mp3"),
  "crash": AudioWrapper("/sounds/crash.mp3"),
  "click": AudioWrapper("/sounds/click.mp3"),
  "on": AudioWrapper("/sounds/engine_on.mp3"),
  "off": AudioWrapper("/sounds/engine_off.mp3"),
  "horn": AudioWrapper("/sounds/horn.mp3"),
  "drumroll": AudioWrapper("/sounds/drum_roll.mp3"),
  "tap": AudioWrapper("/sounds/mobile_tap.mp3")
};

document.addEventListener("touchstart", () => { if (audio.ctx.state === "suspended") audio.ctx.resume() }, { once: true });