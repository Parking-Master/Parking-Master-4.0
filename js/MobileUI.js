let mobile;

function MobileUI() {
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || ('ontouchstart' in document.documentElement)) {
    mobile = true;
  } else {
    mobile = false;
  }

  this.reset = function() {
    if (mobile) {
      currentRotation = 0;
      document.querySelector(".mobile-ui .steering-wheel").style.transform = "";
      document.querySelector(".mobile-ui .use").style.display = "";
      document.querySelector(".mobile-ui .shifter-box").style.display = "";
      document.querySelector(".mobile-ui .shifter-box-option.selected").classList.remove("selected");
      document.querySelector(".mobile-ui .shifter-box-option[data-gear='drive']").classList.add("selected");
    }
  };

  this.startBannerUp = function() {
    document.querySelector(".start-banner").style.pointerEvents = "auto";
  };

  this.startBannerDown = function() {
    document.querySelector(".start-banner").style.pointerEvents = "none";
  };

  if (!mobile) return;

  document.querySelector(".ui").innerHTML += `
  <div class="mobile-ui">
    <div class="context-menu">
      <button class="toggle-view" onclick="togglePerspective()"><i class="fa fa-camera"></i></button>
    </div>
    <div class="pedal-area left-pedal-area"></div>
    <button class="pedal left-pedal"></button>
    <button class="pedal right-pedal"></button>
    <div class="steering-wheel"></div>
    <button class="use">Use</button>
    <div class="shifter-box">
      <div class="shifter-box-option" data-gear="park" onclick="touchShift(this)">P</div>
      <div class="shifter-box-option" data-gear="reverse" onclick="touchShift(this)">R</div>
      <div class="shifter-box-option" data-gear="neutral" onclick="touchShift(this)">N</div>
      <div class="shifter-box-option selected" data-gear="drive" onclick="touchShift(this)">D</div>
    </div>
  </div>
  `;

  document.querySelector("head").innerHTML += `
  <style>
    @media (min-width:800px) {
      .mobile-ui .steering-wheel {
        width: 125px !important;
        height: 125px !important;
      }
    }
    @media only screen and (max-width:800px) {
      .mobile-ui .context-menu {
        left: 340px;
      }
      .infobox {
        position: absolute;
        width: 320px;
        left: 5px;
        top: 5px;
        font-size: 8px;
        transform: scale(0.7);
        transform-origin: top left;
      }
      .infobox-description {
        margin-top: 0;
      }
      .ui .speed {
        transform: scale(0.8);
        transform-origin: bottom left;
      }
      .ui .settings {
        transform: scale(0.8);
        transform-origin: bottom left;
        left: 110px;
      }
      .ui .points {
        transform: scale(0.8);
        transform-origin: bottom right;
      }
      .ui .pointer {
        transform: scale(0.7);
      }
      .swal-modal {
        transform: scale(0.7);
        margin-top: 0;
        overflow-y: hidden !important;
      }
      @keyframes implode {
        0% {
          transform: scale(0.7);
        }
        30% {
          transform: scale(0.7);
        }
        40% {
          transform: scale(0.84);
        }
        100% {
          transform: scale(0.35);
        }
      }
      @keyframes explode {
        0% {
          transform: scale(0.35);
        }
        80% {
          transform: scale(0.77);
        }
        100% {
          transform: scale(0.7);
        }
      }
    }
    @media only screen and (max-width:350px) {
      .ui .pause-menu .heading-box {
        transform: scale(0.8);
        transform-origin: top left;
      }
    }
    @media only screen and (max-height:320px) {
      .ui .pause-menu .heading-box {
        top: 10px;
        transform: scale(0.8);
        transform-origin: top left;
      }
    }
    .mobile-ui {
      position: absolute;
      z-index: 9998;
      width: 100%;
      height: 100%;
      pointer-events: none;
      display: none;
    }
    .mobile-ui * {
      pointer-events: auto;
      user-select: none !important;
    }
    .mobile-ui .context-menu {
      position: absolute;
      left: 240px;
      top: 10px;
    }
    .mobile-ui button.toggle-view {
      color: #007AFF;
      border-radius: 100%;
      padding: 10px;
      background: #ddd;
      border: 1px solid #fff;
      width: 20px;
      height: 20px;
      display: flex;
      justify-content: center;
      align-items: center;
      text-align: center;
    }
    .mobile-ui .pedal {
      position: absolute;
      width: 35px;
      height: 100px;
      background: #fff;
      bottom: 60px;
      -webkit-tap-highlight-color: transparent;
      transition: transform .5s ease-out;
      background-image: url(/images/pedal.png);
      background-repeat: no-repeat;
      background-size: cover;
      border-radius: 6px;
      border: 1px solid #fff;
      box-shadow: 0 1px 6px rgba(0, 0, 0, 0.1), 0 1px 4px rgba(0, 0, 0, 0.24);
    }
    .mobile-ui .pedal-area.left-pedal-area {
      position: absolute;
      width: 65px;
      height: 130px;
      background: transparent;
      bottom: 45px;
      right: 55px;
      -webkit-tap-highlight-color: transparent;
    }
    .mobile-ui .pedal.left-pedal {
      right: 70px;
      pointer-events: none !important;
    }
    .mobile-ui .pedal.right-pedal {
      right: 10px;
    }
    .mobile-ui .steering-wheel {
      position: absolute;
      bottom: 50px;
      width: 100px;
      height: 100px;
      left: 20px;
      background-image: url(/images/steering_wheel.png);
      background-repeat: no-repeat;
      background-size: cover;
      filter: drop-shadow(1px 0 0 white) drop-shadow(-1px 0 0 white) drop-shadow(0 1px 0 white) drop-shadow(0 -1px 0 white);
      transition: transform .1s;
    }
    .mobile-ui .use {
      position: absolute;
      left: 50%;
      top: 50%;
      width: 90px;
      margin-left: -45px;
      margin-top: 10px;
      padding: 4px;
      background: #ddd;
      color: #007AFF;
      border: 1px solid #fff;
      border-radius: 6px;
      font-size: 20px;
      display: none;
    }
    .mobile-ui .shifter-box {
      position: absolute;
      left: 50%;
      top: 50%;
      width: 90px;
      margin-left: -45px;
      margin-top: 10px;
      background: #ddd;
      color: #007AFF;
      border-radius: 6px;
      font-size: 20px;
      text-align: left;
      overflow-x: hidden;
      display: none;
    }
    .mobile-ui .shifter-box .shifter-box-option {
      width: 100%;
      margin: 0;
      padding: 4px;
    }
    .mobile-ui .shifter-box .shifter-box-option.selected {
      background: #bbb;
    }
  </style>
  `;
  let currentRotation = 0;

  if (mobile) {
    document.body.style.background = "#000";

    document.querySelector(".mobile-ui .pedal-area.left-pedal-area").addEventListener("touchstart", function(event) {
      event.preventDefault();
      brakeStart();
      document.querySelector(".mobile-ui .left-pedal").style.transform = "scale(0.8)";
    });
    document.querySelector(".mobile-ui .pedal-area.left-pedal-area").addEventListener("touchend", function(event) {
      event.preventDefault();
      brakeStop();
      document.querySelector(".mobile-ui .left-pedal").style.transform = "";
    });
    document.querySelector(".mobile-ui .pedal-area.left-pedal-area").addEventListener("touchcancel", function(event) {
      event.preventDefault();
      brakeStop();
      document.querySelector(".mobile-ui .left-pedal").style.transform = "";
    });
    document.querySelector(".mobile-ui .right-pedal").addEventListener("touchstart", function(event) {
      event.preventDefault();
      driveStart();
      this.style.transform = "scale(0.8)";
    });
    document.querySelector(".mobile-ui .right-pedal").addEventListener("touchend", function(event) {
      event.preventDefault();
      driveStop();
      this.style.transform = "";
    });
    document.querySelector(".mobile-ui .right-pedal").addEventListener("touchcancel", function(event) {
      event.preventDefault();
      driveStop();
      this.style.transform = "";
    });

    let wheel = document.querySelector(".mobile-ui .steering-wheel");
    let currentRotation = 0;
    let lastAngle = null;

    function getTouchAngle(touch, element) {
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = touch.clientX - centerX;
      const dy = touch.clientY - centerY;
      return Math.atan2(dy, dx) * (180 / Math.PI) - 90;
    }

    wheel.addEventListener("touchstart", function(event) {
      for (const touch of event.changedTouches) {
        if (wheel.contains(touch.target)) {
          event.preventDefault();
          manualSteering = true;
          lastAngle = getTouchAngle(touch, this);
        }
      }
    });

    wheel.addEventListener("touchmove", function(event) {
      for (const touch of event.changedTouches) {
        if (wheel.contains(touch.target)) {
          event.preventDefault();

          const curAngle = getTouchAngle(touch, this);
          let deltaAngle = curAngle - lastAngle;

          if (deltaAngle > 180) deltaAngle -= 360;
          if (deltaAngle < -180) deltaAngle += 360;

          currentRotation += deltaAngle;

          if (currentRotation > 120) currentRotation = 120;
          if (currentRotation < -120) currentRotation = -120;

          this.style.transform = `rotate(${currentRotation}deg)`;
          physics.env.heading = -(currentRotation * (100 / 360));

          lastAngle = curAngle;
        }
      }
    });

    document.querySelector(".mobile-ui").style.display = "block";
  }

  document.addEventListener("touchstart", function(event) {
    if (event.target.classList.contains("swal-button")) {
      audio.tap();
    }
  });

  if (document.querySelector(".start-banner")) {
    this.startBannerUp();
  }
}