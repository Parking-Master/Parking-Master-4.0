physics = {
  env: {
    airDensity: 1.225,
    dragCoefficient: 0.33,
    tireFrictionCoefficient: 0.9,
    rollingResistanceCoefficient: 0.01,
    frontalArea: 2.84,
    vehicleMass: 2000,
    speedMS: 0,
    speedMPH: 0,
    wheelRPM: 0,
    wheelAngularVelocity: 0,
    enginePower: 0,
    maxEnginePower: 220000,
    brakePower: 0,
    maxBrakePower: 18000,
    braking: false,
    engine: {
      gearRatios: [3.5, 2.1, 1.4, 1.0, 0.8],
      finalDrive: 3,
      wheelRadius: 0.254,
      maxRPM: 6000,
      gear: 0
    },
    heading: 0,
    currentHeading: 0,
    axleDistance: 2.701
  },
  timestamp: performance.now(),
  calculateDrag: function(v) {
    return 0.5 * physics.env.airDensity * physics.env.dragCoefficient * physics.env.frontalArea * v * v;
  },
  calculateRollingResistance: function() {
    return physics.env.rollingResistanceCoefficient * (physics.env.vehicleMass * 9.81);
  },
  calculateTurningResistance: function(v, k, a) {
    return (0.5 * physics.env.airDensity * physics.env.dragCoefficient * physics.env.frontalArea * v * v) * (1 + k * Math.abs(Math.sin(a)));
  },
  calculateEngineForce: function(speed) {
    function getEngineRPM(speed, gear) {
      return (speed * physics.env.engine.gearRatios[gear] * physics.env.engine.finalDrive * 60) / (2 * Math.PI * physics.env.engine.wheelRadius);
    }
    if (getEngineRPM(speed, physics.env.engine.gear) > physics.env.engine.maxRPM && physics.env.engine.gear < physics.env.engine.gearRatios.length - 1) physics.env.engine.gear++;
    if (getEngineRPM(speed, physics.env.engine.gear) < 1500 && physics.env.engine.gear > 0) physics.env.engine.gear--;
    let rpm = getEngineRPM(speed, physics.env.engine.gear);
    let availablePower = physics.env.enginePower;
    if (rpm > physics.env.engine.maxRPM) availablePower = 0;
    return availablePower / Math.max(speed, 1);
  },
  calculateTurningAngle: function(v, d, a) {
    return (v / d) * Math.tan(a * (Math.PI / 180));
  },
  calculateWheelRPM: function(vMPH, wdIn) {
    return (vMPH * 63360) / (wdIn * Math.PI * 60);
  },
  calculateTurnRadius: function() {
    return Math.abs(physics.env.axleDistance / Math.tan(physics.env.heading));
  },
  calculateDriftSpeed: function(turnRadius, frictionCoefficient) {
    return Math.sqrt(frictionCoefficient * 9.81 * turnRadius);
  },
  update: function() {
    const now = performance.now();
    const dt = (now - physics.timestamp) / 1000;
    physics.timestamp = now;
  
    const v = Math.max(physics.env.speedMS, 0.1);
  
    const engineF = physics.calculateEngineForce(v);
    const dragF = physics.calculateDrag(v);
    const turningF = physics.calculateTurningResistance(v, 1.0, physics.env.currentHeading);
    const rollingF = physics.calculateRollingResistance(v);
    let netF = engineF - dragF - turningF;
  
    if (physics.env.speedMS > 0) {
      if (physics.env.braking) {
        const maxFrictionForce = physics.env.tireFrictionCoefficient * physics.env.vehicleMass * 9.81;
        const speedFactor = Math.min(1, physics.env.speedMS / 3); // Taper below 5 m/s
        const effectiveBrake = Math.min(physics.env.brakePower, maxFrictionForce) * speedFactor;
        netF -= effectiveBrake;
      }
      netF -= rollingF;
    }

    const trueAcceleration = netF / physics.env.vehicleMass;

    physics.env.speedMS += trueAcceleration * dt;
    if (physics.env.speedMS < 0) physics.env.speedMS = 0;
    physics.env.speedMPH = physics.env.speedMS * 2.237;

    const turningAngle = physics.calculateTurningAngle(physics.env.speedMS, physics.env.axleDistance, physics.env.heading);
    physics.env.currentHeading = turningAngle;

    const wheelRPM = physics.calculateWheelRPM(physics.env.speedMPH, physics.env.engine.wheelRadius * 39.3701 * 2);
    physics.env.wheelRPM = wheelRPM;

    const wheelAngularVelocity = physics.env.speedMS / physics.env.engine.wheelRadius;
    physics.env.wheelAngularVelocity = wheelAngularVelocity;

    // const driftSpeed = physics.calculateDriftSpeed(physics.calculateTurnRadius(), physics.env.tireFrictionCoefficient);

    if (typeof physics.onUpdate === "function") physics.onUpdate(dt);
  },
  onUpdate: null
};