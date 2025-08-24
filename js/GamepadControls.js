GamepadControls = {
  isConnected: false,
  speed: 1,
  buttonDownEvent: () => {},
  buttonUpvent: () => {},
  gamepadBindings: {
    "brake": "lt",
    "accelerate": "rt",
    "switchview": "y",
    "click": "a",
    "escape": "b",
    "pause": "start",
  },
  accelerateTimestamp: Date.now()
};

let keyCodeMaps = {
  "forward": "KeyW",
  "backward": "KeyS",
  "left": "KeyA",
  "right": "KeyD"
};

let moveRepeats = {};

function getAllIndexes(arr, val) {
  let indexes = [];
  let i = -1;

  while ((i = arr.indexOf(val, i+1)) != -1) {
    indexes.push(i);
  }

  return indexes;
}

function stopAllExcept(direction, secondDirection = null) {
  let formattedDirection = `${direction}${secondDirection ? "_" + secondDirection : ""}`;
  for (i in moveRepeats) {
    if (i !== formattedDirection) moveRepeats[i] = false;
  }
  for (key in keyCodeMaps) {
    let value = keyCodeMaps[key];
    if (key !== direction && key !== secondDirection) keyStop(value);
  }
}
function keyPress(code) {
  document.dispatchEvent(new Event("keydown", { code: code }));
}
function keyStop(code) {
  document.dispatchEvent(new Event("keyup", { code: code }));
}

let lookSensitivity = 0.6;
let lookAcceleration = 0.005;

let temporaryLookSensitivity = 0;
let gamepad;
let initialLookSpeed = 0.02;
let lookSpeed = initialLookSpeed;
let diagonalThreshold = 0.5;
let previousButtonStates = {};

window.addEventListener('gamepadconnected', (e) => {
  console.log("Gamepad connected:", e.gamepad.id);
  GamepadControls.isConnected = true;
  gamepad = e.gamepad;
  initButtonStates();
});

window.addEventListener('gamepaddisconnected', (e) => {
  console.log("Gamepad disconnected");
  GamepadControls.isConnected = false;
  gamepad = null;
  previousButtonStates = {};
});

function initButtonStates() {
  for (let i = 0; i < gamepad.buttons.length; i++) {
    previousButtonStates[i] = gamepad.buttons[i].pressed;
  }
}

let prevGamepads = navigator.getGamepads();
function poll() {
  requestAnimationFrame(poll);
  let gamepads = navigator.getGamepads();
  if (gamepads.length > prevGamepads) gamepad = navigator.getGamepads()[navigator.getGamepads().length - 1];
  prevGamepads = gamepads;

  if (gamepad) {
    handleLookMovement();
    handleDirectionalMovement();
    handleButtonEvents();
  }
}

let d = false;
function handleLookMovement() {
  if (pause) return;
  if (perspective != 0) return;

  const lookX = gamepad.axes[2];
  const lookY = gamepad.axes[3];

  let multiplier = 1.5;
  if (PointerControls.pointerSpeed < 1) {
    multiplier /= 2;
  }

  temporaryLookSensitivity = Math.abs(lookX) * (lookSensitivity * GamepadControls.speed);

  if (Math.abs(lookX) > 0.2) {
    camera.rotation.y -= lookX * lookSpeed * multiplier;
  }
  if (Math.abs(lookY) > 0.2) {
    camera.rotation.x -= lookY * lookSpeed * multiplier;
  }

  if (!(Math.abs(lookX) > 0.1) && !(Math.abs(lookY) > 0.1)) {
    lookSpeed = initialLookSpeed;
    looking = false;

    d = false;
  } else {
    if (lookSpeed < temporaryLookSensitivity / 10) lookSpeed += lookAcceleration;
    looking = true;

    if (!d) {
      d = true;
      disableMobileUI();
    }
  }

  camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
}

let stopped = false;
let looking = false;
let menuButton = 0;
let maxButtons = 4;
let repeatedButton = false;
function handleDirectionalMovement() {
  const moveX = gamepad.axes[0];
  const moveY = gamepad.axes[1];

  if (pause) {
    function move(direction) {
      if (repeatedButton) return;
      repeatedButton = true;

      if (direction == "down") {
        menuButton++;
        if (menuButton > maxButtons) menuButton = maxButtons;
      }
      if (direction == "up") {
        menuButton--;
        if (menuButton < 0) menuButton = 0;
      }

      document.querySelectorAll(".pause-menu .button").forEach(x => x.classList.remove("selected"));
      document.querySelectorAll(".pause-menu .button")[menuButton].classList.add("selected");
    }

    if (moveY > 0.2) {
      move("down");
    } else if (moveY < -0.2) {
      move("up");
    } else {
      repeatedButton = false;
    }

    return;
  }

  if (Math.abs(moveY) > 0.1 && controlLock === "Shifter") {
    if (!shifted) {
      shifted = true;
      if (moveY < 0) {
        if (controlLock === "Shifter") shift("up");
      } else {
        if (controlLock === "Shifter") shift("down");
      }
    }
    return;
  } else {
    shifted = false;
  }

  if (Math.abs(moveX) < 0.1) {
    if (!stopped) {
      stopped = true;
      new Tween(options.carHeadingIncrement, 0, 500, "out", (x) => { options.carHeadingIncrement = x }).start();
    }
  } else {
    stopped = false;
    if (TweenCache) TweenCache.stop();
    options.carHeadingIncrement = -moveX * 20;
  }
}

buttonRepeatExceptions = [6, 7];

function handleButtonEvents() {
  for (let i = 0; i < gamepad.buttons.length; i++) {
    const buttonPressed = gamepad.buttons[i].value > 0.01;
    if (buttonPressed && (buttonRepeatExceptions.includes(i) ? true : !previousButtonStates[i])) {
      onButtonPressed(i, gamepad.buttons[i].value);
    } else if (!buttonPressed && previousButtonStates[i]) {
      onButtonReleased(i);
    }
    previousButtonStates[i] = buttonPressed;
  }
}

function onButtonPressed(buttonIndex, value) {
  switch(buttonIndex) {
    case 0: GamepadControls.buttonDownEvent("a"); break;  // A button
    case 1: GamepadControls.buttonDownEvent("b"); break;  // B button
    case 2: GamepadControls.buttonDownEvent("x"); break;  // X button
    case 3: GamepadControls.buttonDownEvent("y"); break;  // Y button
    case 4: GamepadControls.buttonDownEvent("lb"); break; // Left Bumper
    case 5: GamepadControls.buttonDownEvent("rb"); break; // Right Bumper
    case 6: GamepadControls.buttonDownEvent("lt", value); break; // Left Trigger
    case 7: GamepadControls.buttonDownEvent("rt", value); break; // Right Trigger
    case 8: GamepadControls.buttonDownEvent("back"); break; // Back/View button
    case 9: GamepadControls.buttonDownEvent("start"); break; // Start/Menu button
    case 10: GamepadControls.buttonDownEvent("l"); break; // Left Stick button
    case 11: GamepadControls.buttonDownEvent("r"); break; // Right Stick button
    case 12: GamepadControls.buttonDownEvent("up"); break; // D-pad Up
    case 13: GamepadControls.buttonDownEvent("down"); break; // D-pad Down
    case 14: GamepadControls.buttonDownEvent("left"); break; // D-pad Left
    case 15: GamepadControls.buttonDownEvent("right"); break; // D-pad Right
  }
}

function onButtonReleased(buttonIndex) {
  switch(buttonIndex) {
    case 0: GamepadControls.buttonUpEvent("a"); break;
    case 1: GamepadControls.buttonUpEvent("b"); break;
    case 2: GamepadControls.buttonUpEvent("x"); break;
    case 3: GamepadControls.buttonUpEvent("y"); break;
    case 4: GamepadControls.buttonUpEvent("lb"); break;
    case 5: GamepadControls.buttonUpEvent("rb"); break;
    case 6: GamepadControls.buttonUpEvent("lt"); break;
    case 7: GamepadControls.buttonUpEvent("rt"); break;
    case 8: GamepadControls.buttonUpEvent("back"); break;
    case 9: GamepadControls.buttonUpEvent("start"); break;
    case 10: GamepadControls.buttonUpEvent("l"); break;
    case 11: GamepadControls.buttonUpEvent("r"); break;
    case 12: GamepadControls.buttonUpEvent("up"); break;
    case 13: GamepadControls.buttonUpEvent("down"); break;
    case 14: GamepadControls.buttonUpEvent("left"); break;
    case 15: GamepadControls.buttonUpEvent("right"); break;
  }
}

buttonRepeats = {
  "rt": false
};
buttonData = {};

buttonBindings = {
  click: function() {
    if (pause) {
      let button = document.querySelector(".pause-menu .button.selected");
      button.click();
    } else if (swal.getState().isOpen) {
      swal.close();
    } else {
      mousedown();
    }
  },
  stop_click: function() {
    mouseup();
  },
  escape: function() {
    if (!buttonRepeats["b"]) {
      buttonRepeats["b"] = true;
      if (pause) {
        togglePause();
      } else {
        if (controlLock) exitControlLock();
        swal.close();
      }
    }
  },
  stop_escape: function() {
    buttonRepeats["b"] = false;
  },
  switchview: function() {
    if (pause) return;
    if (!buttonRepeats["y"]) {
      buttonRepeats["y"] = true;
      togglePerspective();
    }
  },
  stop_switchview: function() {
    buttonRepeats["y"] = false;
  },
  brake: function(value) {
    if (pause) return;
    physics.env.brakePower = physics.env.maxBrakePower * value;
    braking = true;
    car.getObjectByName("Brake_Lights").material.emissive = new THREE.Color(0xff0000);

    if (hqgraphics) {
      setLightBloom(1);
    }
  },
  stop_brake: function() {
    if (pause) return;
    physics.env.brakePower = 0;
    braking = false;
    car.getObjectByName("Brake_Lights").material.emissive = new THREE.Color(0x000000);

    if (hqgraphics) {
      setLightBloom(0);
    }
  },
  accelerate: function(value) {
    if (pause) return;
    if (!buttonRepeats["rt"]) {
      GamepadControls.accelerateTimestamp = Date.now();
      if (engine && !crashed && (currentGear === "drive" || currentGear === "reverse")) audio.accelerate();
    }
    buttonRepeats["rt"] = true;

    if (engine && !crashed && (currentGear === "drive" || currentGear === "reverse")) {
      let multiplier = Math.min((Date.now() - GamepadControls.accelerateTimestamp) / 8000, 1);
      overrideEngineReset = true;
      physics.env.enginePower = physics.env.maxEnginePower * (value * multiplier);
    }
  },
  stop_accelerate: function() {
    if (pause) return;
    buttonRepeats["rt"] = false;

    if (engine && !crashed && (currentGear === "drive" || currentGear === "reverse")) {
      audio.decelerate();
      overrideEngineReset = false;
      physics.env.enginePower = 0;
    }
  },
  pause: function() {
    if (!buttonRepeats["start"]) {
      buttonRepeats["start"] = true;
      menuButton = 0;
      togglePause();
      document.querySelectorAll(".pause-menu .button").forEach(x => x.classList.remove("selected"));
      document.querySelector(".pause-menu .button").classList.add("selected");
    }
  },
  stop_pause: function() {
    buttonRepeats["start"] = false;
  }
};

poll();

GamepadControls.onsprintend = function() {
  if (GamepadControls.isConnected) buttonBindings.sprint(true);
};

GamepadControls.buttonDownEvent = function(key, value) {
  let allBindings = getAllIndexes(Object.values(GamepadControls.gamepadBindings), key);
  for (let i = 0; i < allBindings.length; i++) {
    let binding = Object.keys(GamepadControls.gamepadBindings)[allBindings[i]];
    buttonBindings[binding](value);
  }

  disableMobileUI();
};

GamepadControls.buttonUpEvent = function(key) {
  let allBindings = getAllIndexes(Object.values(GamepadControls.gamepadBindings), key);
  for (let i = 0; i < allBindings.length; i++) {
    let binding = Object.keys(GamepadControls.gamepadBindings)[allBindings[i]];
    buttonBindings["stop_" + binding]();
  }
};

function disableMobileUI() {
  if (mobile) {
    useMobileUI = false;
    manualSteering = true;
    document.querySelector(".mobile-ui").style.display = "none";
  }
}