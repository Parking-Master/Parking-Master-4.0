audio = {
  acceleratePauseTimeout: 0,
  deceleratePauseTimeout: 0,
  idlePauseTimeout: 0,
  idlePlayTimeout: 0,
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
    }, 4000);
  },
  on: function() {
    audio.sounds.on.play();
    audio.idlePlayTimeout = setTimeout(() => {
      audio.sounds.idle.currentTime = 0;
      audio.sounds.idle.play();
    }, 500);
  },
  off: function() {
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
  sounds: {
    "accelerate": new Audio("/sounds/engine_accelerate.mp3"),
    "decelerate": new Audio("/sounds/engine_decelerate.mp3"),
    "idle": new Audio("/sounds/engine_idle.mp3"),
    "warning": new Audio("/sounds/car_warning.mp3"),
    "crash": new Audio("/sounds/crash.mp3"),
    "click": new Audio("/sounds/click.mp3"),
    "on": new Audio("/sounds/engine_on.mp3"),
    "off": new Audio("/sounds/engine_off.mp3"),
    "horn": new Audio("/sounds/horn.mp3"),
    "drumroll": new Audio("/sounds/drum_roll.mp3"),
  }
};

audio.sounds.idle.loop = true;
audio.sounds.idle.play();