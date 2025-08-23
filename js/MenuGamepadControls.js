document.head.innerHTML += `
<style>
.gamepad-cursor {
  position: fixed;
  top: 0;
  left: 0;
  background: #000;
  width: 10px;
  height: 10px;
  margin-left: -5px;
  margin-top: -5px;
  border-radius: 100%;
  transition: left .1s, top .1s;
  display: none;
  z-index: 9999999999;
  box-shadow: 0 0 20px 3px #fff;
}
.gamepad-keyboard {
  position: fixed;
  background: #f7f7f7;
  border: .5px solid #000;
  border-radius: 10px;
  padding: 6px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999999999;
  top: 30px;
  display: none;
  box-shadow: 0 11px 34px 0 rgba(120, 120, 128, 0.1);
}
.gamepad-keyboard::after {
  content: "Use [X] to delete, [B] to exit keyboard.";
  position: absolute;
  bottom: 0;
  margin-bottom: -20px;
  font-size: 12px;
  color: #eee;
  left: 0;
  text-align: left;
  text-shadow: 1px 1px #333;
  opacity: .5;
}
.gamepad-keyboard-key {
  position: relative;
  padding: 3px;
  width: 20px;
  height: 20px;
  font-size: 12px;
  background: #fff;
  text-align: center;
  border-radius: 4px;
  box-shadow: 0 4px 10px 0 rgba(120, 120, 128, 0.1);
  display: inline-block;
  margin: 2px 0;
  line-height: 20px;
}
.gamepad-keyboard-key#enter {
  font-size: 18px;
}
.gamepad-keyboard-key#space {
  width: 50px;
}
.gamepad-keyboard-key.selected {
  background: #ddd;
}
</style>
`;
document.body.innerHTML += `
<div class="gamepad-cursor"></div>
<div class="gamepad-keyboard" data-special="0">
  <div class="gamepad-keyboard-row">
    <div class="gamepad-keyboard-key">q</div>
    <div class="gamepad-keyboard-key">w</div>
    <div class="gamepad-keyboard-key">e</div>
    <div class="gamepad-keyboard-key">r</div>
    <div class="gamepad-keyboard-key">t</div>
    <div class="gamepad-keyboard-key">y</div>
    <div class="gamepad-keyboard-key">u</div>
    <div class="gamepad-keyboard-key">i</div>
    <div class="gamepad-keyboard-key">o</div>
    <div class="gamepad-keyboard-key">p</div>
  </div>
  <div class="gamepad-keyboard-row">
    <div class="gamepad-keyboard-key">a</div>
    <div class="gamepad-keyboard-key">s</div>
    <div class="gamepad-keyboard-key">d</div>
    <div class="gamepad-keyboard-key">f</div>
    <div class="gamepad-keyboard-key">g</div>
    <div class="gamepad-keyboard-key">h</div>
    <div class="gamepad-keyboard-key">j</div>
    <div class="gamepad-keyboard-key">k</div>
    <div class="gamepad-keyboard-key">l</div>
    <div class="gamepad-keyboard-key" id="enter">↵</div>
  </div>
  <div class="gamepad-keyboard-row">
    <div class="gamepad-keyboard-key">z</div>
    <div class="gamepad-keyboard-key">x</div>
    <div class="gamepad-keyboard-key">c</div>
    <div class="gamepad-keyboard-key" id="space">&nbsp;</div>
    <div class="gamepad-keyboard-key">v</div>
    <div class="gamepad-keyboard-key">b</div>
    <div class="gamepad-keyboard-key">n</div>
    <div class="gamepad-keyboard-key">m</div>
    <div class="gamepad-keyboard-key" id="caps-lock" data-value="1">&uparrow;</div>
  </div>
</div>
`;

GamepadControls = {
  isConnected: false,
  cursor: document.querySelector(".gamepad-cursor"),
  cursorX: 0,
  cursorY: 0,
  speed: 1,
  hoveringElements: [],
  hoveringElement: null,
  buttonEvent: () => {},
  keyboardLock: false,
  currentKey: [0, 0]
};

function triggerAllHoverEvents(element) {
  const hoverEvents = ["mouseover", "mouseenter", "mousemove"];
  
  hoverEvents.forEach(eventType => {
    const event = new MouseEvent(eventType, {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: GamepadControls.cursorX,
      clientY: GamepadControls.cursorY
    });
    element.dispatchEvent(event);
  });
}

function cancelAllHoverEvents(element) {
  const unhoverEvents = ["mouseout", "mouseleave"];

  unhoverEvents.forEach(eventType => {
    const event = new MouseEvent(eventType, {
      bubbles: true,
      cancelable: true,
      view: window
    });
    element.dispatchEvent(event);
  });
}

function triggerAllClickEvents(element) {
  const events = ["click", "mousedown"];
  
  events.forEach(eventType => {
    const event = new MouseEvent(eventType, {
      view: window,
      bubbles: true,
      cancelable: true,
      clientX: GamepadControls.cursorX,
      clientY: GamepadControls.cursorY
    });
    element.dispatchEvent(event);
    element.focus();
  });
}

function cancelAllClickEvents(element) {
  const events = ["mouseup"];
  
  events.forEach(eventType => {
    const event = new MouseEvent(eventType, {
      view: window,
      bubbles: true,
      cancelable: true
    });
    element.dispatchEvent(event);
  });
}

function keyPress(code) {
  keyStates[code] = true;
  document.dispatchEvent(new Event("keydown", { code: code }));
}
function keyStop(code) {
  keyStates[code] = false;
  keyRepeats[code] = false;
  document.dispatchEvent(new Event("keyup", { code: code }));
}

let pointerSpeed = 3;
let scrollSpeed = 8;
let gamepad;
let previousButtonStates = {};

window.addEventListener('gamepadconnected', (e) => {
  console.log("Gamepad connected:", e.gamepad.id);
  GamepadControls.isConnected = true;
  gamepad = e.gamepad;
  initButtonStates();
  poll();

  if (typeof swal !== "undefined") {
    let oldSwal = swal;
    swal = function() {
      let output = oldSwal.apply(null, arguments);
      if (document.querySelector(".swal-button")) {
        document.querySelector(".swal-button").textContent += " [B]";

        if (document.querySelector(".swal-button--confirm")) {
          if (!document.querySelector(".swal-button--confirm").textContent.includes("[B]")) document.querySelector(".swal-button--confirm").textContent += " [X]";
        }
      }
      return output;
    };
  }

  document.querySelectorAll("*").forEach(element => element.style.cursor = "none");
  GamepadControls.cursor.style.display = "block";

  document.querySelectorAll("input").forEach(x => x.setAttribute("readonly", "readonly"));
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
    handleKeyboard();
  }
}

let cursorX = window.innerWidth / 2;
let cursorY = window.innerHeight / 2;
let acceleration = 0;

function handleLookMovement() {
  const scrollX = gamepad.axes[2];
  const scrollY = gamepad.axes[3];

  if (Math.abs(scrollX) < 0.1 && Math.abs(scrollY) < 0.1) {
    return;
  }

  if (GamepadControls.hoveringElement) {
    GamepadControls.hoveringElements.forEach(x => x.scrollTop += scrollY * scrollSpeed);
  }
}

let moved = false;
let spam = false;
let spamTimeout = 0;
let timestamp = Date.now();

function handleDirectionalMovement() {
  const axisX = gamepad.axes[0];
  const axisY = gamepad.axes[1];

  if (GamepadControls.keyboardLock) {
    if (Math.abs(axisY) > 0.2 || Math.abs(axisX) > 0.2) {
      if (moved && !spam) return;
      if (!spam) spamTimeout = setTimeout(() => spam = true, 500);
      moved = true;
      if (spam) {
        if (Date.now() - timestamp < 100) return;
        timestamp = Date.now();
      }

      let rowLengths = [9, 9, 8];

      function move(direction) {
        if (direction == "right") {
          GamepadControls.currentKey[1]++;
          if (GamepadControls.currentKey[1] > 9) {
            GamepadControls.currentKey[1] = 9;
          }
        }
        if (direction == "left") {
          GamepadControls.currentKey[1]--;
          if (GamepadControls.currentKey[1] < 0) {
            GamepadControls.currentKey[1] = 0;
          }
        }
        if (direction == "down") {
          let oldKey = GamepadControls.currentKey[0];
          GamepadControls.currentKey[0]++;
          if (GamepadControls.currentKey[0] > 2) {
            GamepadControls.currentKey[0] = 2;
          }

          if (GamepadControls.currentKey[0] == 2 && GamepadControls.currentKey[1] > 3 && oldKey != GamepadControls.currentKey[0]) {
            GamepadControls.currentKey[1]--;
          }
        }
        if (direction == "up") {
          GamepadControls.currentKey[0]--;
          if (GamepadControls.currentKey[0] < 0) {
            GamepadControls.currentKey[0] = 0;
          }

          if (GamepadControls.currentKey[0] == 1 && GamepadControls.currentKey[1] > 3) {
            GamepadControls.currentKey[1]++;
          }
          if (GamepadControls.currentKey[0] == 2 && GamepadControls.currentKey[1] > 3) {
            GamepadControls.currentKey[1]--;
          }
        }
          console.log(GamepadControls.currentKey, direction)

        let key = document.querySelectorAll(".gamepad-keyboard-row")[GamepadControls.currentKey[0]].querySelectorAll(".gamepad-keyboard-key")[GamepadControls.currentKey[1]];

        if (key) {
          if (document.querySelector(".gamepad-keyboard-key.selected")) document.querySelectorAll(".gamepad-keyboard-key.selected").forEach(x => x.classList.remove("selected"));
          key.classList.add("selected");
        }
      }

      if (axisX > 0.2) {
        move("right");
      } else if (axisX < -0.2) {
        move("left");
      } else if (axisY > 0.2) {
        move("down");
      } else if (axisY < -0.2) {
        move("up");
      }
    } else {
      clearTimeout(spamTimeout);
      moved = false;
      spam = false;
    }

    return;
  }

  if (Math.abs(axisY) < 0.1 && Math.abs(axisX) < 0.1) {
    acceleration = 0;
    return;
  }

  acceleration += 0.015;
  if (acceleration > 1) acceleration = 1;

  cursorX += axisX * pointerSpeed * wrapperScale * acceleration * 10;
  cursorY += axisY * pointerSpeed * wrapperScale * acceleration * 10;

  cursorX = Math.max(0, Math.min(window.innerWidth, cursorX));
  cursorY = Math.max(0, Math.min(window.innerHeight, cursorY));

  GamepadControls.cursorX = cursorX;
  GamepadControls.cursorY = cursorY;

  GamepadControls.cursor.style.visibility = "visible";
  GamepadControls.cursor.style.left = `${cursorX}px`;
  GamepadControls.cursor.style.top = `${cursorY}px`;

  let hoveringElements = document.elementsFromPoint(cursorX, cursorY).filter(element => element !== GamepadControls.cursor);
  let hoveringElement = hoveringElements[0];

  document.querySelectorAll(".hover").forEach(hoveringElement => {
    hoveringElement.classList.remove("hover");
    cancelAllHoverEvents(hoveringElement);
  });

  if (hoveringElement) {
    hoveringElements.forEach(x => (x.classList.add("hover"), triggerAllHoverEvents(x)));
  }

  GamepadControls.hoveringElements = hoveringElements;
  GamepadControls.hoveringElement = hoveringElement;
}

function handleButtonEvents() {
  for (let i = 0; i < gamepad.buttons.length; i++) {
    const buttonPressed = gamepad.buttons[i].value > 0.1;
    if (buttonPressed && (i == 2 ? true : !previousButtonStates[i])) {
      onButtonPressed(i);
    } else if (!buttonPressed && previousButtonStates[i]) {
      onButtonReleased(i);
    }
    previousButtonStates[i] = buttonPressed;
  }
}

function onButtonPressed(buttonIndex) {
  console.log(`Button ${buttonIndex} pressed`);
  switch(buttonIndex) {
    case 0: aButtonPressed(); break;
    case 1: bButtonPressed(); break;
    case 2: xButtonPressed(); break;
    case 3: yButtonPressed(); break;
    case 4: lbButtonPressed(); break;
    case 5: rbButtonPressed(); break;
    case 6: ltButtonPressed(); break;
    case 7: rtButtonPressed(); break;
    case 8: backButtonPressed(); break;
    case 9: startButtonPressed(); break;
    case 10: lsButtonPressed(); break;
    case 11: rsButtonPressed(); break;
    case 12: dpadUpPressed(); break;
    case 13: dpadDownPressed(); break;
    case 14: dpadLeftPressed(); break;
    case 15: dpadRightPressed(); break;
  }
}

function onButtonReleased(buttonIndex) {
  console.log(`Button ${buttonIndex} released`);
  switch(buttonIndex) {
    case 0: (aButtonReleased(), GamepadControls.buttonEvent("a")); break;
    case 1: (bButtonReleased(), GamepadControls.buttonEvent("b")); break;
    case 2: (xButtonReleased(), GamepadControls.buttonEvent("x")); break;
    case 3: (yButtonReleased(), GamepadControls.buttonEvent("y")); break;
    case 4: (lbButtonReleased(), GamepadControls.buttonEvent("lb")); break;
    case 5: (rbButtonReleased(), GamepadControls.buttonEvent("rb")); break;
    case 6: (ltButtonReleased(), GamepadControls.buttonEvent("lt")); break;
    case 7: (rtButtonReleased(), GamepadControls.buttonEvent("rt")); break;
    case 8: (backButtonReleased(), GamepadControls.buttonEvent("back")); break;
    case 9: (startButtonReleased(), GamepadControls.buttonEvent("start")); break;
    case 10: (lsButtonReleased(), GamepadControls.buttonEvent("l")); break;
    case 11: (rsButtonReleased(), GamepadControls.buttonEvent("r")); break;
    case 12: (dpadUpReleased(), GamepadControls.buttonEvent("up")); break;
    case 13: (dpadDownReleased(), GamepadControls.buttonEvent("down")); break;
    case 14: (dpadLeftReleased(), GamepadControls.buttonEvent("left")); break;
    case 15: (dpadRightReleased(), GamepadControls.buttonEvent("right")); break;
  }
}

function insertCharacter(character) {
  if (!document.activeElement) return;

  if (character == "delete") {
    let caret = document.activeElement.selectionStart;
    if (typeof document.activeElement.selectionStart === "undefined") caret = document.activeElement.value.length;

    if (!caret || caret < 1) return;
    let toCaret = document.activeElement.value.slice(0, caret - 1);
    let fromCaret = document.activeElement.value.slice(caret, document.activeElement.value.length);
    document.activeElement.value = toCaret + fromCaret;
    document.activeElement.setSelectionRange(caret - 1, caret - 1);
  } else {
    let caret = document.activeElement.selectionStart;
    if (typeof document.activeElement.selectionStart === "undefined") caret = document.activeElement.value.length;

    let toCaret = document.activeElement.value.slice(0, caret);
    let fromCaret = document.activeElement.value.slice(caret, document.activeElement.value.length);
    document.activeElement.value = toCaret + character + fromCaret;
    document.activeElement.setSelectionRange(caret + 1, caret + 1);
  }
}

function toggleSpecialKeyboard() {
  if (document.querySelector(".gamepad-keyboard").dataset.special == "1") {
    document.querySelector(".gamepad-keyboard").dataset.special = "0";
    document.querySelector(".gamepad-keyboard").innerHTML = `
    <div class="gamepad-keyboard-row">
      <div class="gamepad-keyboard-key">q</div>
      <div class="gamepad-keyboard-key">w</div>
      <div class="gamepad-keyboard-key">e</div>
      <div class="gamepad-keyboard-key">r</div>
      <div class="gamepad-keyboard-key">t</div>
      <div class="gamepad-keyboard-key">y</div>
      <div class="gamepad-keyboard-key">u</div>
      <div class="gamepad-keyboard-key">i</div>
      <div class="gamepad-keyboard-key">o</div>
      <div class="gamepad-keyboard-key">p</div>
    </div>
    <div class="gamepad-keyboard-row">
      <div class="gamepad-keyboard-key">a</div>
      <div class="gamepad-keyboard-key">s</div>
      <div class="gamepad-keyboard-key">d</div>
      <div class="gamepad-keyboard-key">f</div>
      <div class="gamepad-keyboard-key">g</div>
      <div class="gamepad-keyboard-key">h</div>
      <div class="gamepad-keyboard-key">j</div>
      <div class="gamepad-keyboard-key">k</div>
      <div class="gamepad-keyboard-key">l</div>
      <div class="gamepad-keyboard-key" id="enter">↵</div>
    </div>
    <div class="gamepad-keyboard-row">
      <div class="gamepad-keyboard-key">z</div>
      <div class="gamepad-keyboard-key">x</div>
      <div class="gamepad-keyboard-key">c</div>
      <div class="gamepad-keyboard-key" id="space">&nbsp;</div>
      <div class="gamepad-keyboard-key">v</div>
      <div class="gamepad-keyboard-key">b</div>
      <div class="gamepad-keyboard-key">n</div>
      <div class="gamepad-keyboard-key">m</div>
      <div class="gamepad-keyboard-key" id="caps-lock" data-value="1">&uparrow;</div>
    </div>
    `;
  } else {
    document.querySelector(".gamepad-keyboard").dataset.special = "1";
    document.querySelector(".gamepad-keyboard").innerHTML = `
    <div class="gamepad-keyboard-row">
      <div class="gamepad-keyboard-key">1</div>
      <div class="gamepad-keyboard-key">2</div>
      <div class="gamepad-keyboard-key">3</div>
      <div class="gamepad-keyboard-key">4</div>
      <div class="gamepad-keyboard-key">5</div>
      <div class="gamepad-keyboard-key">6</div>
      <div class="gamepad-keyboard-key">7</div>
      <div class="gamepad-keyboard-key">8</div>
      <div class="gamepad-keyboard-key">9</div>
      <div class="gamepad-keyboard-key">0</div>
    </div>
    <div class="gamepad-keyboard-row">
      <div class="gamepad-keyboard-key">!</div>
      <div class="gamepad-keyboard-key">@</div>
      <div class="gamepad-keyboard-key">#</div>
      <div class="gamepad-keyboard-key">$</div>
      <div class="gamepad-keyboard-key">%</div>
      <div class="gamepad-keyboard-key">^</div>
      <div class="gamepad-keyboard-key">&</div>
      <div class="gamepad-keyboard-key">*</div>
      <div class="gamepad-keyboard-key">-</div>
      <div class="gamepad-keyboard-key" id="enter">↵</div>
    </div>
    <div class="gamepad-keyboard-row">
      <div class="gamepad-keyboard-key">+</div>
      <div class="gamepad-keyboard-key">=</div>
      <div class="gamepad-keyboard-key">;</div>
      <div class="gamepad-keyboard-key" id="space">&nbsp;</div>
      <div class="gamepad-keyboard-key">,</div>
      <div class="gamepad-keyboard-key">.</div>
      <div class="gamepad-keyboard-key">_</div>
      <div class="gamepad-keyboard-key">/</div>
      <div class="gamepad-keyboard-key" id="caps-lock" data-value="1">&uparrow;</div>
    </div>
    `;
  }

  let key = document.querySelectorAll(".gamepad-keyboard-row")[GamepadControls.currentKey[0]].querySelectorAll(".gamepad-keyboard-key")[GamepadControls.currentKey[1]];
  document.querySelector(".gamepad-keyboard").style.display = "block";
  key.classList.add("selected");
}

function enterKey() {
  document.activeElement.blur();
}

function aButtonPressed() {
  if (GamepadControls.keyboardLock) {
    let key = null;

    let keyElement = document.querySelector(".gamepad-keyboard-key.selected");
    key = keyElement.textContent;

    if (keyElement.id) {
      if (keyElement.id == "space") {
        key = " ";
      } else if (keyElement.id == "caps-lock") {
        if (keyElement.dataset.value == "0") {
          keyElement.dataset.value = "1";
          document.querySelectorAll(".gamepad-keyboard-key").forEach(x => x.textContent = x.textContent.toLowerCase());
        } else {
          keyElement.dataset.value = "0";
          document.querySelectorAll(".gamepad-keyboard-key").forEach(x => x.textContent = x.textContent.toUpperCase());
        }
        return;
      } else if (keyElement.id == "enter") {
        enterKey();
      }
    }

    insertCharacter(key);
  } else if (GamepadControls.hoveringElement) {
    GamepadControls.hoveringElement.classList.add("active");
    triggerAllClickEvents(GamepadControls.hoveringElement);
  }
}
function aButtonReleased() {
  GamepadControls.hoveringElement.classList.remove("active");
  cancelAllClickEvents(GamepadControls.hoveringElement);
}

function bButtonPressed() {
  if (GamepadControls.keyboardLock) {
    enterKey();
  } else {
    if (document.querySelector(".swal-button")) {
      triggerAllClickEvents(document.querySelector(".swal-button"));
    }
  }
}
function bButtonReleased() {}

let deleted = false;
let spamx = false;
let spamxTimeout = 0;
let timestampx = Date.now();

function xButtonPressed() {
  if (GamepadControls.keyboardLock) {
    if (deleted && !spamx) return;
    if (!spamx) spamxTimeout = setTimeout(() => spamx = true, 400);
    deleted = true;
    if (spamx) {
      if (Date.now() - timestampx < 75) return;
      timestampx = Date.now();
    }

    insertCharacter("delete");
  } else {
    if (document.querySelector(".swal-button--confirm")) {
      triggerAllClickEvents(document.querySelector(".swal-button--confirm"));
    }
  }
}
function xButtonReleased() {
  deleted = false;
  spamx = false;
}

function yButtonPressed() {
  if (GamepadControls.keyboardLock) {
    insertCharacter(" ");
  }
}
function yButtonReleased() {}

function lbButtonPressed() {
  if (GamepadControls.keyboardLock) {
    let caret = document.activeElement.selectionStart;
    document.activeElement.setSelectionRange(caret - 1, caret - 1);
    document.activeElement.focus();
  }
}
function lbButtonReleased() {}

function rbButtonPressed() {
  if (GamepadControls.keyboardLock) {
    let caret = document.activeElement.selectionStart;
    document.activeElement.setSelectionRange(caret + 1, caret + 1);
    document.activeElement.focus();
  }
}
function rbButtonReleased() {}

function ltButtonPressed() {
  if (GamepadControls.keyboardLock) {
    toggleSpecialKeyboard();
  }
}
function ltButtonReleased() {}

function rtButtonPressed() {
  if (GamepadControls.keyboardLock) {
    toggleSpecialKeyboard();
  }
}
function rtButtonReleased() {}

function backButtonPressed() {}
function backButtonReleased() {}

function startButtonPressed() {
  if (GamepadControls.keyboardLock) {
    enterKey();
  }
}
function startButtonReleased() {}

function lsButtonPressed() {
  if (GamepadControls.keyboardLock) {
    let keyElement = document.querySelector("#caps-lock");
    if (keyElement.dataset.value == "0") {
      keyElement.dataset.value = "1";
      document.querySelectorAll(".gamepad-keyboard-key").forEach(x => x.textContent = x.textContent.toLowerCase());
    } else {
      keyElement.dataset.value = "0";
      document.querySelectorAll(".gamepad-keyboard-key").forEach(x => x.textContent = x.textContent.toUpperCase());
    }
  }
}
function lsButtonReleased() { console.log("Left Stick button released - Stop sprinting"); }

function rsButtonPressed() {}
function rsButtonReleased() {}

function dpadUpPressed() {}
function dpadUpReleased() {}
function dpadDownPressed() {}
function dpadDownReleased() {}
function dpadLeftPressed() {}
function dpadLeftReleased() {}
function dpadRightPressed() {}
function dpadRightReleased() {}

function handleKeyboard() {
  if (document.activeElement && document.activeElement.tagName == "INPUT") {
    if (!GamepadControls.keyboardLock) {
      if (document.querySelector(".gamepad-keyboard-key.selected")) document.querySelectorAll(".gamepad-keyboard-key.selected").forEach(x => x.classList.remove("selected"));

      let key = document.querySelectorAll(".gamepad-keyboard-row")[GamepadControls.currentKey[0]].querySelectorAll(".gamepad-keyboard-key")[GamepadControls.currentKey[1]];
      document.querySelector(".gamepad-keyboard").style.display = "block";
      key.classList.add("selected");
    }

    GamepadControls.keyboardLock = true;
  } else {
    document.querySelector(".gamepad-keyboard").style.display = "";
    GamepadControls.keyboardLock = false;
  }
}