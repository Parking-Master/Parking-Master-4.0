(() => {
  let serverURL = "https://working-bedbug-luckily.ngrok-free.app";

  user = {
    preferences: {
      points: 0
    },
    set: function(key, value) {
      let currentObject = user.preferences;
  
      key.split(".").forEach((objectName, index) => {
        if (index >= key.split(".").length - 1) return currentObject[objectName] = value;
        currentObject = currentObject[objectName];
      });
  
      user.save();
    },
    save: function() {
      localStorage.setItem("user-preferences", JSON.stringify(user.preferences));
    },
    logIn: function(userData) {
      let oldData = user;
      user = userData;
      user.oldData = oldData;
      if (oldData.logInCallback) user.logInCallback = oldData.logInCallback;
  
      let loginToken = localStorage["loginToken"];
      user.set = function(key, value) {
        fetch(`${serverURL}/account/modify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            token: loginToken,
            key: key,
            value: value
          })
        });
  
        if (key === "root:username") {
          user.username = value;
        } else {
          let currentObject = user.preferences;
  
          key.split(".").forEach((objectName, index) => {
            if (index >= key.split(".").length - 1) return currentObject[objectName] = value;
            currentObject = currentObject[objectName];
          });
        }
      };
      user.save = () => {};
      user.logOut = function() {
        if (user.oldData) user = user.oldData;
        localStorage.removeItem("loginToken");
        localStorage.removeItem("user-login-cache");
      }
  
      localStorage.setItem("user-login-cache", JSON.stringify({
        username: user.username,
        points: user.preferences.points,
        cars: user.preferences.cars,
        currentCar: user.preferences.currentCar
      }));
    }
  };
  
  if (localStorage["user-preferences"]) {
    let savedPreferences = JSON.parse(localStorage["user-preferences"]);
    user.preferences = savedPreferences;
  } else {
    user.save();
  }
  
  function fetchUserData() {
    if (localStorage["loginToken"]) {
      user.loggedIn = true;
  
      let loginToken = localStorage["loginToken"];
      let userCache = localStorage["user-login-cache"];
      if (userCache) {
        userCache = JSON.parse(userCache);
        user.username = userCache.username;
        user.preferences.points = userCache.points;
        user.preferences.cars = userCache.cars;
        user.preferences.currentCar = userCache.currentCar;
      }
    
      fetch(`${serverURL}/account/data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "69420"
        },
        body: JSON.stringify({
          token: loginToken
        })
      }).then(async response => {
        if (response.status !== 200) return;
  
        let userData = await response.json();
  
        user.logIn(userData);
        user.loggedIn = true;
  
        if (typeof user.logInCallback === "function") user.logInCallback();
      });
    } else {
      user.loggedIn = false;
    }
  }
  
  fetchUserData();
})();