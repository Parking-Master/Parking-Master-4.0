THREE.TouchControls = function(camera, element) {
  this.isLocked = true;
  this.action = null;
  this.speed = 1;
  let previousTouch = null;
  let shownUseButton = false;
  this.showUseButton = function() {
    if (!mobile) return;
    if (intersections[0]) {
      if (!shownUseButton) {
        shownUseButton = true;
        const control = intersections.map(x => x.object.name);
        if (control.includes("Shifter")) {
          document.querySelector(".mobile-ui .shifter-box").style.display = "block";
        } else {
          document.querySelector(".mobile-ui .use").style.display = "block";
        }
      } else {
        shownUseButton = false;
      }
    } else {
      document.querySelector(".mobile-ui .shifter-box").style.display = "";
      document.querySelector(".mobile-ui .use").style.display = "";
    }
  }
  element.addEventListener("touchmove", (event) => {
    if (!this.isLocked) return;

    let touch = event.touches[0];
    Object.values(event.touches).forEach(x => x.target == element && (console.log(x), touch = x));
    camera.rotation.order = "YXZ";
    if (previousTouch && (Math.PI / 2).toFixed(12) - 0 != Math.abs(camera.rotation.x.toFixed(12) - 0)) {
      camera.rotation.y -= (touch.pageX - previousTouch.pageX) / (500 / this.speed);
      camera.rotation.x -= (touch.pageY - previousTouch.pageY) / (500 / this.speed);
    }
    previousTouch = touch;

    this.showUseButton();
  });
  element.addEventListener("touchstart", (event) => {
    event.preventDefault();

    if (mobile) {
      useMobileUI = true;
      document.querySelector(".mobile-ui").style.display = "block";
    }
  });
  element.addEventListener("touchend", (event) => {
    event.preventDefault();
    previousTouch = null;
  });
  element.addEventListener("touchcancel", (event) => {
    event.preventDefault();
  });
};