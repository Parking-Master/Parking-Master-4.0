let selectedCar = null;
let premium_cars = [
  "G_Wagon",
  "Ferrari_SF90_Stradale",
  "Ferrari_Roma"
];

function selectCar(car) {
  selectedCar = car;

  if (premium_cars.indexOf(car) > -1) {
    audio.sounds["accelerate"] = AudioWrapper(`/sounds/premium_cars/${car}/engine_accelerate.mp3`);
    audio.sounds["idle"] = AudioWrapper(`/sounds/premium_cars/${car}/engine_idle.mp3`);

    if (car === "Ferrari_SF90_Stradale" || car === "Ferrari_Roma") {
      audio.playIdleAndDecelerate = true;
    }
  }

  loadVehicle();
}

let preferredCar = "Honda_Civic_Sport_Touring";

function selectNext() {
  if (typeof test === "undefined") start();
}

if (user.loggedIn) {
  user.logInCallback = function() {
    preferredCar = user.preferences.currentCar;
    selectNext();
  };
} else {
  selectNext();
}

function start() {
  selectCar(preferredCar);
}