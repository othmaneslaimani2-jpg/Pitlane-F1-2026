// ============================================================
// KEY BINDINGS SYSTEM
// ============================================================
var KEY_NAMES = {
    8: 'Backspace', 9: 'Tab', 13: 'Enter', 16: 'Shift', 17: 'Ctrl', 18: 'Alt',
    20: 'CapsLock', 27: 'Esc', 32: 'Space', 33: 'PgUp', 34: 'PgDn',
    35: 'End', 36: 'Home', 37: '←', 38: '↑', 39: '→', 40: '↓',
    45: 'Ins', 46: 'Del', 186: ';', 187: '=', 188: ',', 189: '-',
    190: '.', 191: '/', 192: '`', 219: '[', 220: '\\', 221: ']', 222: "'"
};

function getKeyName(code) {
    if (KEY_NAMES[code]) return KEY_NAMES[code];
    if (code >= 65 && code <= 90) return String.fromCharCode(code);
    if (code >= 48 && code <= 57) return String.fromCharCode(code);
    if (code >= 96 && code <= 105) return 'Num' + (code - 96);
    if (code >= 112 && code <= 123) return 'F' + (code - 111);
    return 'Key' + code;
}

var defaultKeyBindings = {
    accelerate: 38,
    brake: 40,
    left: 37,
    right: 39,
    handbrake: 32
};

var keyBindings = {};
var listeningFor = null;

function loadKeyBindings() {
    try {
        var saved = localStorage.getItem('helloracer_keys');
        if (saved) {
            keyBindings = JSON.parse(saved);
        } else {
            keyBindings = JSON.parse(JSON.stringify(defaultKeyBindings));
        }
    } catch(e) {
        keyBindings = JSON.parse(JSON.stringify(defaultKeyBindings));
    }
    updateKeyButtons();
}

function saveKeyBindings() {
    try {
        localStorage.setItem('helloracer_keys', JSON.stringify(keyBindings));
    } catch(e) {}
}

function updateKeyButtons() {
    var actions = ['accelerate', 'brake', 'left', 'right', 'handbrake'];
    for (var i = 0; i < actions.length; i++) {
        var btn = document.getElementById('key-' + actions[i]);
        if (btn) btn.textContent = getKeyName(keyBindings[actions[i]]);
    }
}

function listenKey(action) {
    if (listeningFor) {
        var prevBtn = document.getElementById('key-' + listeningFor);
        if (prevBtn) prevBtn.classList.remove('listening');
    }
    listeningFor = action;
    var btn = document.getElementById('key-' + action);
    if (btn) {
        btn.classList.add('listening');
        btn.textContent = '...';
    }
}

function resetKeys() {
    keyBindings = JSON.parse(JSON.stringify(defaultKeyBindings));
    saveKeyBindings();
    updateKeyButtons();
}

function openSettings() {
    document.getElementById('settings-panel').classList.add('open');
}

function closeSettings() {
    document.getElementById('settings-panel').classList.remove('open');
    if (listeningFor) {
        var btn = document.getElementById('key-' + listeningFor);
        if (btn) btn.classList.remove('listening');
        listeningFor = null;
    }
}

// Global key listener for settings
document.addEventListener('keydown', function(e) {
    if (listeningFor) {
        e.preventDefault();
        keyBindings[listeningFor] = e.keyCode;
        saveKeyBindings();
        var btn = document.getElementById('key-' + listeningFor);
        if (btn) {
            btn.classList.remove('listening');
            btn.textContent = getKeyName(e.keyCode);
        }
        listeningFor = null;
    }
});

// ============================================================
// GAME STATE
// ============================================================
var gameStarted = false;

function startGame() {
    document.getElementById('home-page').style.display = 'none';
    document.getElementById('settings-panel').classList.remove('open');
    document.getElementById('game-page').style.display = 'block';
    if (!gameStarted) {
        gameStarted = true;
        if (Detector.webgl) {
            initGame();
        } else {
            Detector.addGetWebGLMessage();
        }
    }
}

function backToHome() {
    document.getElementById('game-page').style.display = 'none';
    document.getElementById('home-page').style.display = 'block';
}

// ============================================================
// RACING ENGINE VARIABLES
// ============================================================
var camera, scene, renderer, loader, stats;
var ambientLight, directionalLight;
var car, body, lfw, rfw, lrw, rrw, bm, dt, ta;
var DEG2RAD = Math.PI / 180, DEG90 = Math.PI / 2;
var sa = 0, s1 = 0;
var fs = false, rs = false;
var ur = false, ul = false, uu = false, ud = false;
var cvel = new THREE.Vector3, vel = new THREE.Vector3;
var a2d = new THREE.Vector3, force = new THREE.Vector3;
var res = new THREE.Vector3, acc = new THREE.Vector3;
var ft = new THREE.Vector3, flf = new THREE.Vector3, flr = new THREE.Vector3;
var av = 0, aa = 0;

// Camera views (cycle with R key while driving)
var cameraMode = 0;
var cameraModeNames = ['BROADCAST', 'TOP DOWN', 'COCKPIT', 'CINEMATIC', 'SIDE'];
// Note on coordinate system:
// Car forward = negative Z. car.rotation.y = yaw.
// "distance" = horizontal distance behind the car
// "height" = Y offset above car
// "lookAhead" = how far in front of the car to aim the look target
// "fov" = field of view in degrees (overrides default 35)
// "smoothing" = lerp factor (0 = static, 1 = instant)
var cameraConfigs = [
    // 0: BROADCAST — F1-style narrow-FOV chase: directly behind, slightly above,
    //    18° downward angle, ~15° FOV (telephoto). Full car centered with balanced spacing.
    //    distance ≈ 22m back, height ≈ 7m up gives tan(7/22) ≈ 17.7° downward angle.
    //    Look target is at the car's center so the car sits centered in frame.
    { type: 'broadcast', distance: 22, height: 7.1, fov: 15, smoothing: 0.06 },
    // 1: TOP DOWN — directly above, looking straight down
    { type: 'topdown', height: 14, fov: 40, smoothing: 0.1 },
    // 2: COCKPIT — driver POV
    { type: 'cockpit', height: 0.75, forwardOffset: 0.3, fov: 60, smoothing: 0.18 },
    // 3: CINEMATIC — far behind, slow follow
    { type: 'chase', distance: 12, height: 4.5, lookAhead: 5, fov: 45, smoothing: 0.03 },
    // 4: SIDE — tracks from the right side
    { type: 'side', height: 1.8, sideOffset: 7, fov: 35, smoothing: 0.07 }
];

// Orbit camera (when stopped)
var orbitAngleX = 0;
var orbitAngleY = 30 * DEG2RAD;
var orbitRadius = 10;
var orbitMinRadius = 4;
var orbitMaxRadius = 20;
var isOrbiting = false;
var mouseDown = false;
var lastMouseX = 0, lastMouseY = 0;

// Car speed tracking
var carSpeed = 0;
var carStopped = true;
var stoppedThreshold = 0.3;

// Skidmarks
var enableSkidMarks = false;
var maxMarks = 1024, markWidth = 0.275, numMarks = 0, lastMark = -1;
var skidmarks = [], updated = false, skm, skg;

// ============================================================
// INIT
// ============================================================
function initGame() {
    var container = document.getElementById("container");
    scene = new THREE.Scene;
    camera = new THREE.Camera(35, window.innerWidth / window.innerHeight, 0.01, 200000);
    camera.position.y = 4;
    camera.position.z = 8;

    ambientLight = new THREE.AmbientLight(8421504);
    scene.addLight(ambientLight);
    directionalLight = new THREE.DirectionalLight(16777215, 1.5);
    directionalLight.position.x = 0;
    directionalLight.position.y = 1;
    directionalLight.position.z = 0;
    directionalLight.position.normalize();
    scene.addLight(directionalLight);

    renderer = new THREE.WebGLRenderer;
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    loader = new THREE.Loader(true);
    document.body.appendChild(loader.statusDomElement);

    CreateCar();
    LoadCar();
    if (enableSkidMarks) SetupSkidMarks();

    document.addEventListener("keydown", onKeyDown, false);
    document.addEventListener("keyup", onKeyUp, false);

    // Mouse events for orbit camera
    renderer.domElement.addEventListener("mousedown", onMouseDown, false);
    document.addEventListener("mouseup", onMouseUp, false);
    document.addEventListener("mousemove", onMouseMove, false);
    renderer.domElement.addEventListener("wheel", onMouseWheel, false);

    stats = new Stats;
    stats.domElement.style.position = "absolute";
    stats.domElement.style.top = "0px";
    stats.domElement.style.zIndex = 100;
    container.appendChild(stats.domElement);

    ta = (new Date).getTime();
    animate();
}

// ============================================================
// MOUSE HANDLERS (orbit when stopped)
// ============================================================
function onMouseDown(e) {
    mouseDown = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
}

function onMouseUp(e) {
    mouseDown = false;
}

function onMouseMove(e) {
    if (!mouseDown || !carStopped) return;
    var dx = e.clientX - lastMouseX;
    var dy = e.clientY - lastMouseY;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    orbitAngleX += dx * 0.005;
    orbitAngleY += dy * 0.005;
    // Clamp vertical angle
    orbitAngleY = Math.max(0.1, Math.min(Math.PI * 0.45, orbitAngleY));
}

function onMouseWheel(e) {
    if (!carStopped) return;
    orbitRadius += e.deltaY * 0.01;
    orbitRadius = Math.max(orbitMinRadius, Math.min(orbitMaxRadius, orbitRadius));
    e.preventDefault();
}

// ============================================================
// CAR CREATION & LOADING
// ============================================================
function CreateCar() {
    car = new THREE.Object3D;
    scene.addObject(car);
    body = new THREE.Object3D;
    body.rotation.y = DEG90;
    car.addChild(body);
    lfw = new THREE.Object3D;
    lfw.position.x = 1.3928; lfw.position.y = 0.34; lfw.position.z = -0.69;
    car.addChild(lfw);
    rfw = new THREE.Object3D;
    rfw.position.x = 1.4; rfw.position.y = 0.34; rfw.position.z = 0.69;
    car.addChild(rfw);
    lrw = new THREE.Object3D;
    lrw.position.x = -2; lrw.position.y = 0.34; lrw.position.z = -0.69;
    car.addChild(lrw);
    rrw = new THREE.Object3D;
    rrw.position.x = -2; rrw.position.y = 0.34; rrw.position.z = 0.69;
    car.addChild(rrw);
}

function LoadCar() {
    var envPath = "obj/textures/envmap/";
    var envUrls = [envPath + "envmap_right.jpg", envPath + "envmap_left.jpg",
        envPath + "envmap_top.jpg", envPath + "envmap_bottom.jpg",
        envPath + "envmap_front.jpg", envPath + "envmap_back.jpg"];
    var envMap = ImageUtils.loadTextureCube(envUrls);

    var bodyPaintDef = { x: 0, y: 0.5859, z: 0, material: new THREE.MeshLambertMaterial({
        color: 16777215, map: ImageUtils.loadTexture("obj/textures/BodyPaint.jpg"),
        envMap: envMap, combine: THREE.MultiplyOperation, reflectivity: 1 }) };
    var suspensionDef = { x: 0, y: 0.4044, z: -0.3071,
        material: new THREE.MeshPhongMaterial({ color: 657930 }) };
    var insideBlackDef = { x: 0, y: 0.5773, z: 0.729,
        material: new THREE.MeshBasicMaterial({ color: 0 }) };
    var glossyBlackDef = { x: 0, y: 0.4115, z: -0.7112,
        material: new THREE.MeshPhongMaterial({ color: 657930, specular: 6316128 }) };
    var chromeDef = { x: 0, y: 0.5867, z: 0.3202,
        material: new THREE.MeshPhongMaterial({ color: 16777215, envMap: envMap,
        combine: THREE.MultiplyOperation }) };
    var boltsDef = { x: 0, y: 0.5694, z: 0.8672,
        material: new THREE.MeshPhongMaterial({ color: 8668176, specular: 8421504,
        shininess: 0.5, ambient: 8421504 }) };
    var windshieldDef = { x: 0, y: 0.6777, z: 0.5647,
        material: new THREE.MeshPhongMaterial({ color: 16777215, envMap: envMap,
        combine: THREE.MixOperation, opacity: 0.5 }) };
    var rearLightDef = { x: 0, y: 0.4652, z: -2.34,
        material: new THREE.MeshBasicMaterial({ color: 8388608,
        map: ImageUtils.loadTexture("obj/textures/RearLights.jpg") }) };
    var rearLightGlassDef = { x: 0, y: 0.4652, z: -2.34,
        material: new THREE.MeshBasicMaterial({ color: 16711680, envMap: envMap,
        combine: THREE.MixOperation, opacity: 0.5 }) };

    var steeringWheelDef = { x: 0, y: 0.5933, z: 0.5054,
        material: new THREE.MeshPhongMaterial({ color: 16777215,
        map: ImageUtils.loadTexture("obj/textures/SteeringWheel.jpg") }) };
    var driverBodyDef = { x: -0.0113, y: 0.4063, z: 0.5277,
        material: new THREE.MeshPhongMaterial({ color: 16777215,
        map: ImageUtils.loadTexture("obj/textures/Driver.jpg") }) };
    var helmetDef = { x: 0.0016, y: 0.7287, z: -0.0175,
        material: new THREE.MeshBasicMaterial({ color: 16777215,
        map: ImageUtils.loadTexture("obj/textures/Helmet.jpg"),
        envMap: envMap, combine: THREE.MultiplyOperation }) };
    var visorDef = { x: 0.0016, y: 0.6993, z: 0.052,
        material: new THREE.MeshBasicMaterial({ color: 16777215,
        map: ImageUtils.loadTexture("obj/textures/Visor.jpg"),
        envMap: envMap, combine: THREE.MultiplyOperation }) };
    var tyreDef = { x: 0, y: 0, z: 0,
        material: new THREE.MeshPhongMaterial({ color: 16777215,
        map: ImageUtils.loadTexture("obj/textures/Tyre.jpg"),
        specular: 8421504, shininess: 0.5, ambient: 8421504 }) };
    var rimDef = { x: 0, y: 0, z: 0,
        material: new THREE.MeshPhongMaterial({ color: 16777215,
        map: ImageUtils.loadTexture("obj/textures/Rim.jpg"), ambient: 4210752 }) };
    var wheelBaseDef = { x: 0, y: 0, z: 0,
        material: new THREE.MeshBasicMaterial({ color: 0 }) };

    helmetDef.material.map.wrap_s = THREE.RepeatWrapping;
    bm = rearLightDef.material;

    loader.loadBinary({ model: "obj/js/BodyPaint.js", callback: function(d) { AddBodyPart(d, bodyPaintDef) } });
    loader.loadBinary({ model: "obj/js/Suspension.js", callback: function(d) { AddBodyPart(d, suspensionDef) } });
    loader.loadBinary({ model: "obj/js/InsideBlack.js", callback: function(d) { AddBodyPart(d, insideBlackDef) } });
    loader.loadBinary({ model: "obj/js/GlossyBlack.js", callback: function(d) { AddBodyPart(d, glossyBlackDef) } });
    loader.loadBinary({ model: "obj/js/Chrome.js", callback: function(d) { AddBodyPart(d, chromeDef) } });
    loader.loadBinary({ model: "obj/js/Bolts.js", callback: function(d) { AddBodyPart(d, boltsDef) } });
    loader.loadBinary({ model: "obj/js/Windshield.js", callback: function(d) { AddBodyPart(d, windshieldDef) } });
    loader.loadBinary({ model: "obj/js/RearLight.js", callback: function(d) { AddBodyPart(d, rearLightDef) } });
    loader.loadBinary({ model: "obj/js/RearLightGlass.js", callback: function(d) { AddBodyPart(d, rearLightGlassDef) } });
    loader.loadBinary({ model: "obj/js/SteeringWheel.js", callback: function(d) { AddBodyPart(d, steeringWheelDef) } });
    loader.loadBinary({ model: "obj/js/DriverBody.js", callback: function(d) { AddBodyPart(d, driverBodyDef) } });
    loader.loadBinary({ model: "obj/js/Helmet.js", callback: function(d) { AddBodyPart(d, helmetDef) } });
    loader.loadBinary({ model: "obj/js/Visor.js", callback: function(d) { AddBodyPart(d, visorDef) } });
    loader.loadBinary({ model: "obj/js/Tyre.js", callback: function(d) { AddWheelPart(d, tyreDef) } });
    loader.loadBinary({ model: "obj/js/Rim.js", callback: function(d) { AddWheelPart(d, rimDef) } });
    loader.loadBinary({ model: "obj/js/WheelBase.js", callback: function(d) { AddWheelPart(d, wheelBaseDef) } });
    loader.loadBinary({ model: "obj/js/HelloEnjoy.js", callback: function(d) { AddHelloEnjoy(d) } });

    // Shadow under car
    var shadow = new THREE.Mesh(new Plane(7.5, 7.5),
        new THREE.MeshBasicMaterial({ color: 16777215,
        map: ImageUtils.loadTexture("obj/textures/Shadow.jpg") }));
    shadow.position.x = -0.4;
    shadow.position.y = -0.0010;
    shadow.rotation.x = -DEG90;
    shadow.rotation.z = -DEG90;
    car.addChild(shadow);
}

function AddHelloEnjoy(a) {
    a = new THREE.Mesh(a, new THREE.MeshBasicMaterial({ color: 0 }));
    a.position.y = 0.01;
    a.rotation.x = -DEG90;
    scene.addObject(a);
}

function AddBodyPart(a, b) {
    loader.statusDomElement.innerHTML = "Creating model ...";
    a = new THREE.Mesh(a, b.material);
    a.position.x = b.x; a.position.y = b.y; a.position.z = b.z;
    body.addChild(a);
    loader.statusDomElement.style.display = "none";
    loader.statusDomElement.innerHTML = "Loading model ...";
}

function AddWheelPart(a, b) {
    var c;
    c = new THREE.Mesh(a, b.material);
    c.position.x = b.x; c.position.y = b.y; c.position.z = b.z;
    c.rotation.y = -DEG90; lfw.addChild(c);
    c = new THREE.Mesh(a, b.material);
    c.position.x = b.x; c.position.y = b.y; c.position.z = b.z;
    c.rotation.y = DEG90; rfw.addChild(c);
    c = new THREE.Mesh(a, b.material);
    c.position.x = b.x; c.position.y = b.y; c.position.z = b.z;
    c.rotation.y = -DEG90; lrw.addChild(c);
    c = new THREE.Mesh(a, b.material);
    c.position.x = b.x; c.position.y = b.y; c.position.z = b.z;
    c.rotation.y = DEG90; rrw.addChild(c);
}

// ============================================================
// GAME LOOP
// ============================================================
function animate() {
    requestAnimationFrame(animate);
    loop();
}

function loop() {
    var now = (new Date).getTime();
    dt = (now - ta) * 0.001;
    if (dt > 0.1) dt = 0.1; // cap delta time
    ta = now;
    UpdateCar();
    SteerWheels();
    UpdateCamera();
    if (enableSkidMarks) UpdateSkidMarks();
    renderer.render(scene, camera);
    stats.update();
    updateHUD();
}

function updateHUD() {
    var speedEl = document.querySelector('#hud .speed');
    if (speedEl) {
        var kmh = Math.abs(Math.round(carSpeed * 3.6));
        speedEl.textContent = kmh;
    }
    var modeEl = document.getElementById('camera-mode-indicator');
    if (modeEl) {
        if (carStopped) {
            modeEl.textContent = 'ORBIT CAM';
        } else {
            modeEl.textContent = cameraModeNames[cameraMode] + '  [R]';
        }
    }
}

// ============================================================
// STEERING
// ============================================================
function SteerWheels() {
    var a = 2.5 * dt;
    var b = ul ? -1 : 0;
    var c = ur ? 1 : 0;
    b = b + c;
    if (b == 0) a = Math.min(a, Math.abs(s1));
    if (b > s1) s1 += a;
    else if (b < s1) s1 -= a;
    s1 = Math.min(1, Math.max(s1, -1));
    sa = s1 * 20 * DEG2RAD;
}

// ============================================================
// CAR PHYSICS (with working handbrake)
// ============================================================
function UpdateCar() {
    var dragCoeff = 5, rr = 30;
    var cornerStiffF = -5, cornerStiffR = -5.2;
    var maxGrip = 2;
    var wheelbaseF = 1, wheelbaseR = 1;
    var totalWheelbase = wheelbaseF + wheelbaseR;
    var carYaw = car.rotation.y;
    var sinYaw = Math.sin(carYaw), cosYaw = Math.cos(carYaw);

    vel.x = cosYaw * cvel.y + sinYaw * cvel.x;
    vel.y = -sinYaw * cvel.y + cosYaw * cvel.x;

    var steerAngle = vel.x > 0 ? sa : -sa;
    var yawRate = totalWheelbase * 0.5 * av;
    var slipAngleFront, slipAngleSide, slipAngleRear;

    if (Math.abs(vel.x) < 0.2) {
        vel.x = vel.y = slipAngleFront = slipAngleSide = slipAngleRear = yawRate = 0;
    } else {
        slipAngleFront = Math.atan2(yawRate, Math.abs(vel.x));
        slipAngleSide = Math.atan2(vel.y, Math.abs(vel.x));
        slipAngleRear = slipAngleSide - slipAngleFront;
        slipAngleFront = slipAngleSide + slipAngleFront - steerAngle;
    }

    var mass = 1500;
    var weightPerAxle = mass * 9.8 * 0.5;

    // Front lateral force
    flf.x = 0;
    flf.y = cornerStiffF * slipAngleFront;
    flf.y = Math.min(maxGrip, flf.y);
    flf.y = Math.max(-maxGrip, flf.y);
    flf.y *= weightPerAxle;
    if (fs) flf.y *= 0.5;

    // Rear lateral force
    flr.x = 0;
    flr.y = cornerStiffR * slipAngleRear;
    flr.y = Math.min(maxGrip, flr.y);
    flr.y = Math.max(-maxGrip, flr.y);
    flr.y *= weightPerAxle;

    // HANDBRAKE: reduce rear grip significantly
    if (rs) flr.y *= 0.4;

    // Throttle / brake
    var throttle = uu ? 100 : 0;
    var brake = ud ? -100 : 0;
    ft.x = 100 * (throttle + brake);
    ft.y = 0;
    bm.color.setHex(brake < 0 ? 16711680 : 8388608);

    // Handbrake also reduces drive force
    if (rs) ft.x *= 0.3;

    // Drag and rolling resistance
    res.x = -(rr * vel.x + dragCoeff * vel.x * Math.abs(vel.x));
    res.y = -(rr * vel.y + dragCoeff * vel.y * Math.abs(vel.y));

    // Handbrake adds extra braking force when moving
    if (rs && Math.abs(vel.x) > 0.1) {
        res.x -= 200 * (vel.x > 0 ? 1 : -1);
    }

    // Total force
    force.x = ft.x + Math.sin(steerAngle) * flf.x + flr.x + res.x;
    force.y = ft.y + Math.cos(steerAngle) * flf.y + flr.y + res.y;

    if (force.x == 0 && vel.x == 0) {
        flf.y = flr.y = force.y = 0;
        acc.x = acc.y = aa = a2d.x = a2d.y = cvel.x = cvel.y = av = 0;
    } else {
        var torque = wheelbaseF * flf.y - wheelbaseR * flr.y;
        acc.x = force.x / mass;
        acc.y = force.y / mass;
        var inertia = 1500;
        aa = torque / inertia;
        a2d.x = cosYaw * acc.y + sinYaw * acc.x;
        a2d.y = -sinYaw * acc.y + cosYaw * acc.x;
        cvel.x += dt * a2d.x;
        cvel.y += dt * a2d.y;
        av += dt * aa;
    }

    car.position.z -= dt * cvel.x;
    car.position.x += dt * cvel.y;

    // Clamp position to prevent flying off
    if (car.position.length() > 200) {
        car.position.x = 0; car.position.z = 0;
        cvel.x = cvel.y = av = 0;
    }

    carYaw += dt * av;
    car.rotation.y = carYaw;
    lfw.rotation.y = sa;
    rfw.rotation.y = sa;

    // Wheel spin
    var wheelRadius = 0.334;
    var wheelSpin = 0.012 * vel.x / wheelRadius;
    lfw.rotation.z -= wheelSpin;
    rfw.rotation.z -= wheelSpin;
    lrw.rotation.z -= wheelSpin;
    rrw.rotation.z -= wheelSpin;

    // Track speed for camera mode switching
    carSpeed = Math.sqrt(cvel.x * cvel.x + cvel.y * cvel.y);
    carStopped = carSpeed < stoppedThreshold;
}

// ============================================================
// CAMERA SYSTEM
// ============================================================
function UpdateCamera() {
    var carYaw = car.rotation.y;
    // Forward direction of the car (the direction it drives toward)
    var fwdX = -Math.sin(carYaw);
    var fwdZ = -Math.cos(carYaw);
    // Right direction of the car
    var rightX = Math.cos(carYaw);
    var rightZ = -Math.sin(carYaw);

    if (carStopped) {
        // ORBIT MODE: user can rotate around the car with mouse
        var ox = car.position.x + orbitRadius * Math.sin(orbitAngleX) * Math.cos(orbitAngleY);
        var oy = car.position.y + orbitRadius * Math.sin(orbitAngleY);
        var oz = car.position.z + orbitRadius * Math.cos(orbitAngleX) * Math.cos(orbitAngleY);

        camera.position.x += (ox - camera.position.x) * 0.1;
        camera.position.y += (oy - camera.position.y) * 0.1;
        camera.position.z += (oz - camera.position.z) * 0.1;

        camera.target.position.x = car.position.x;
        camera.target.position.y = car.position.y + 0.5;
        camera.target.position.z = car.position.z;
    } else {
        var cfg = cameraConfigs[cameraMode];
        var smooth = cfg.smoothing;
        var goalX, goalY, goalZ;
        var lookX, lookY, lookZ;

        // Apply per-camera FOV (smoothly transitions between modes)
        if (cfg.fov) {
            var targetFov = cfg.fov;
            if (Math.abs(camera.fov - targetFov) > 0.05) {
                camera.fov += (targetFov - camera.fov) * 0.1;
                camera.updateProjectionMatrix();
            }
        }

        if (cfg.type === 'broadcast') {
            // F1 BROADCAST CAM: narrow-FOV telephoto, directly behind, ~18° down angle
            // Camera is centered on the car's midline (no left/right offset)
            // Look target is the car center → car sits perfectly centered in frame
            goalX = car.position.x - fwdX * cfg.distance;
            goalY = car.position.y + cfg.height;
            goalZ = car.position.z - fwdZ * cfg.distance;
            // Aim at the car center for balanced framing
            lookX = car.position.x;
            lookY = car.position.y + 0.4;
            lookZ = car.position.z;

        } else if (cfg.type === 'chase') {
            // Position: behind the car (opposite of forward) and above
            goalX = car.position.x - fwdX * cfg.distance;
            goalY = car.position.y + cfg.height;
            goalZ = car.position.z - fwdZ * cfg.distance;
            // Look at: ahead of the car
            lookX = car.position.x + fwdX * cfg.lookAhead;
            lookY = car.position.y + 0.4;
            lookZ = car.position.z + fwdZ * cfg.lookAhead;

        } else if (cfg.type === 'topdown') {
            // Directly above the car, looking straight down
            goalX = car.position.x;
            goalY = car.position.y + cfg.height;
            goalZ = car.position.z;
            lookX = car.position.x;
            lookY = car.position.y;
            lookZ = car.position.z;

        } else if (cfg.type === 'cockpit') {
            // Inside the car, at driver head position, looking forward
            goalX = car.position.x + fwdX * cfg.forwardOffset;
            goalY = car.position.y + cfg.height;
            goalZ = car.position.z + fwdZ * cfg.forwardOffset;
            lookX = car.position.x + fwdX * 20;
            lookY = car.position.y + 0.5;
            lookZ = car.position.z + fwdZ * 20;

        } else if (cfg.type === 'side') {
            // To the right side of the car
            goalX = car.position.x + rightX * cfg.sideOffset;
            goalY = car.position.y + cfg.height;
            goalZ = car.position.z + rightZ * cfg.sideOffset;
            lookX = car.position.x;
            lookY = car.position.y + 0.4;
            lookZ = car.position.z;
        }

        // Smooth camera position
        camera.position.x += (goalX - camera.position.x) * smooth;
        camera.position.y += (goalY - camera.position.y) * smooth;
        camera.position.z += (goalZ - camera.position.z) * smooth;

        // Smooth look target
        camera.target.position.x += (lookX - camera.target.position.x) * 0.1;
        camera.target.position.y += (lookY - camera.target.position.y) * 0.1;
        camera.target.position.z += (lookZ - camera.target.position.z) * 0.1;

        // Keep orbit angle synced for smooth transition when car stops
        orbitAngleX = carYaw + Math.PI;
    }
}

// ============================================================
// INPUT HANDLING (uses configurable key bindings)
// ============================================================
function onKeyDown(e) {
    var code = e.keyCode;
    if (code == keyBindings.accelerate) uu = true;
    else if (code == keyBindings.brake) ud = true;
    else if (code == keyBindings.left) ur = true;
    else if (code == keyBindings.right) ul = true;
    else if (code == keyBindings.handbrake) { rs = true; e.preventDefault(); }
    else if (code == 82) { // R key - cycle camera
        cameraMode = (cameraMode + 1) % cameraConfigs.length;
    }
}

function onKeyUp(e) {
    var code = e.keyCode;
    if (code == keyBindings.accelerate) uu = false;
    else if (code == keyBindings.brake) ud = false;
    else if (code == keyBindings.left) ur = false;
    else if (code == keyBindings.right) ul = false;
    else if (code == keyBindings.handbrake) rs = false;
}

// ============================================================
// SKIDMARKS (optional)
// ============================================================
function SetupSkidMarks() {
    for (var a = 0; a < maxMarks; a++)
        skidmarks[a] = { pos: new THREE.Vector3, normal: new THREE.Vector3,
            posl: new THREE.Vector3, posr: new THREE.Vector3, intensity: 0, lastIndex: 0 };
    skg = new THREE.Geometry;
    skm = new THREE.Mesh(skg, new THREE.MeshBasicMaterial({ color: 65280 }));
    skm.position.y = 0.1;
    scene.addObject(skm);
}

function AddSkidMark(a, b, c, e) {
    if (c > 1) c = 1;
    if (c < 0) return -1;
    var curr = skidmarks[numMarks % maxMarks];
    curr.pos.copy(a); curr.normal.copy(b);
    curr.intensity = c; curr.lastIndex = e;
    if (e != -1) {
        var width2 = markWidth * 0.5;
        var last = skidmarks[e % maxMarks];
        var dir = new THREE.Vector3;
        dir = dir.sub(curr.pos, last.pos);
        var xDir = new THREE.Vector3;
        xDir.cross(dir, b); xDir.normalize();
        var offset = new THREE.Vector3;
        offset.copy(xDir); offset.multiplyScalar(width2);
        curr.posl.add(curr.pos, offset);
        curr.posr.sub(curr.pos, offset);
        if (last.lastIndex == -1) {
            last.posl.add(curr.pos, offset);
            last.posr.sub(curr.pos, offset);
        }
    }
    numMarks++; updated = true;
    return numMarks - 1;
}

function UpdateSkidMarks() {
    if (!updated) return;
    updated = false;
    var idx = 0, verts = skg.vertices;
    for (var i = 0; i < numMarks && i < maxMarks; i++) {
        if (skidmarks[i].lastIndex != -1 && skidmarks[i].lastIndex > numMarks - maxMarks) {
            var curr = skidmarks[i];
            var last = skidmarks[curr.lastIndex % maxMarks];
            verts[idx*4+1] = new THREE.Vertex(new THREE.Vector3(last.posl.x, last.posl.y, last.posl.z));
            verts[idx*4+0] = new THREE.Vertex(new THREE.Vector3(last.posr.x, last.posr.y, last.posr.z));
            verts[idx*4+2] = new THREE.Vertex(new THREE.Vector3(curr.posl.x, curr.posl.y, curr.posl.z));
            verts[idx*4+3] = new THREE.Vertex(new THREE.Vector3(curr.posr.x, curr.posr.y, curr.posr.z));
            skg.uvs[idx] = [new THREE.UV(0,0), new THREE.UV(1,0), new THREE.UV(0,1), new THREE.UV(1,1)];
            var face = new THREE.Face4(idx*4+0, idx*4+1, idx*4+2, idx*4+3);
            face.normal = new THREE.Vector3(0,1,0);
            skg.faces[idx] = face;
            idx++;
        }
        skg.computeCentroids();
        skg.computeFaceNormals();
        skg.computeBoundingBox();
        skg.computeBoundingSphere();
    }
}

// ============================================================
// INIT KEY BINDINGS ON PAGE LOAD
// ============================================================
loadKeyBindings();
