// =====================================================================
// Racing Engine — wraps the legacy Three.js (~r48) car renderer.
// Globals THREE, Detector, Stats, requestAnimationFrame are loaded
// via the script tags in index.html.
// =====================================================================
import { createEngineSound } from './engineSound.js';
import { createCrowdSound } from './crowdSound.js';

const DEG2RAD = Math.PI / 180;
const DEG90 = Math.PI / 2;

const cameraConfigs = [
    // 0: BROADCAST — F1 configurator framing: front wing visible, rear wing not cropped
    {
        type: 'broadcast',
        height: 15.5,
        distance: -1.2,
        offsetX: 0,
        offsetZ: 1.8,
        lookAhead: 0,
        lookHeight: -0.8,
        fov: 30,
        smoothing: 0.08,
        pitch: -89.5,
        yaw: 0,
        roll: 0,
    },
    // 1: CINEMATIC — far high follow, slow & dramatic
    { type: 'chase', distance: 16, height: 6, lookAhead: 4, lookHeight: 0.6, fov: 42, smoothing: 0.04 },
    // 2: COCKPIT — driver POV, low and forward, wide FOV
    { type: 'cockpit', height: 0.85, forwardOffset: 0.15, lookForward: 30, lookHeight: 0.5, fov: 70, smoothing: 0.22 },
    // 3: TOP DOWN — directly above looking straight down
    { type: 'topdown', height: 18, fov: 45, smoothing: 0.12 },
    // 4: SIDE — behind-right 3/4 angle, tracking shot feel
    { type: 'side', distance: 4, sideOffset: 6, height: 2.4, lookAhead: 1.5, lookHeight: 0.5, fov: 40, smoothing: 0.09 },
];
const cameraModeNames = ['BROADCAST', 'CINEMATIC', 'COCKPIT', 'TOP DOWN', 'SIDE'];

export function createRacingEngine({ container, bindingsRef, teamRef, onHudUpdate }) {
    // ---------- State ----------
    let camera, scene, renderer, loader, stats;
    let ambientLight, directionalLight;
    let car, body, lfw, rfw, lrw, rrw, bm;
    let dt, ta;

    let sa = 0, s1 = 0;
    let fs = false, rs = false;
    let ur = false, ul = false, uu = false, ud = false;

    const cvel = new THREE.Vector3();
    const vel = new THREE.Vector3();
    const a2d = new THREE.Vector3();
    const force = new THREE.Vector3();
    const res = new THREE.Vector3();
    const acc = new THREE.Vector3();
    const ft = new THREE.Vector3();
    const flf = new THREE.Vector3();
    const flr = new THREE.Vector3();
    let av = 0, aa = 0;

    let cameraMode = 0;

    // Orbit (when stopped)
    let orbitAngleX = 0;
    let orbitAngleY = 30 * DEG2RAD;
    let orbitRadius = 10;
    const orbitMinRadius = 4;
    const orbitMaxRadius = 20;
    let mouseDown = false;
    let lastMouseX = 0, lastMouseY = 0;

    let carSpeed = 0;
    let carStopped = true;
    const stoppedThreshold = 0.3;

    let rafId = null;
    let disposed = false;

    // ---- Tire smoke particle pool ----
    const SMOKE_POOL_SIZE = 80;
    const smokeParticles = [];          // { mesh, mat, life, maxLife, vx, vy, vz, scale }
    let smokeReady = false;
    let smokeTexture = null;

    // Procedural engine sound (lazy-init on first user interaction)
    const engineSound = createEngineSound();
    const crowdSound = createCrowdSound();
    let audioStarted = false;

    // ---------- Init ----------
    if (!Detector.webgl) {
        Detector.addGetWebGLMessage();
        return { dispose: () => {} };
    }

    initScene();
    createCar();
    loadCar();

    // Listeners
    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);
    renderer.domElement.addEventListener('mousedown', onMouseDown, false);
    document.addEventListener('mouseup', onMouseUp, false);
    document.addEventListener('mousemove', onMouseMove, false);
    renderer.domElement.addEventListener('wheel', onMouseWheel, { passive: false });
    window.addEventListener('resize', onResize);

    ta = Date.now();
    animate();

    // =====================================================================
    // Functions
    // =====================================================================

    function initScene() {
        scene = new THREE.Scene();
        const w = container.clientWidth || window.innerWidth;
        const h = container.clientHeight || window.innerHeight;

        camera = new THREE.Camera(35, w / h, 0.01, 200000);
        camera.position.y = 4;
        camera.position.z = 8;

        ambientLight = new THREE.AmbientLight(0x808080);
        scene.addLight(ambientLight);

        directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
        directionalLight.position.x = 0;
        directionalLight.position.y = 1;
        directionalLight.position.z = 0;
        directionalLight.position.normalize();
        scene.addLight(directionalLight);

        renderer = new THREE.WebGLRenderer();
        renderer.setSize(w, h);
        renderer.setClearColorHex(0xffffff, 1);
        container.appendChild(renderer.domElement);

        loader = new THREE.Loader(true);
        if (loader.statusDomElement) {
            loader.statusDomElement.style.position = 'absolute';
            loader.statusDomElement.style.bottom = '80px';
            loader.statusDomElement.style.left = '50%';
            loader.statusDomElement.style.transform = 'translateX(-50%)';
            loader.statusDomElement.style.zIndex = '100';
            loader.statusDomElement.style.color = '#888';
            loader.statusDomElement.style.fontSize = '0.75rem';
            loader.statusDomElement.style.fontFamily = 'monospace';
            container.appendChild(loader.statusDomElement);
        }

        stats = new Stats();
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.top = '0px';
        stats.domElement.style.zIndex = '100';
        stats.domElement.style.display = 'none'; // hidden — replaced by React HUD
        container.appendChild(stats.domElement);
    }

    function onResize() {
        const w = container.clientWidth || window.innerWidth;
        const h = container.clientHeight || window.innerHeight;
        camera.aspect = w / h;
        if (camera.updateProjectionMatrix) camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    }

    function createCar() {
        car = new THREE.Object3D();
        scene.addObject(car);
        body = new THREE.Object3D();
        body.rotation.y = DEG90;
        car.addChild(body);
        lfw = new THREE.Object3D();
        lfw.position.x = 1.3928; lfw.position.y = 0.34; lfw.position.z = -0.69;
        car.addChild(lfw);
        rfw = new THREE.Object3D();
        rfw.position.x = 1.4; rfw.position.y = 0.34; rfw.position.z = 0.69;
        car.addChild(rfw);
        lrw = new THREE.Object3D();
        lrw.position.x = -2; lrw.position.y = 0.34; lrw.position.z = -0.69;
        car.addChild(lrw);
        rrw = new THREE.Object3D();
        rrw.position.x = -2; rrw.position.y = 0.34; rrw.position.z = 0.69;
        car.addChild(rrw);
    }

    function loadCar() {
        const envPath = '/obj/textures/envmap/';
        const envUrls = [envPath + 'envmap_right.jpg', envPath + 'envmap_left.jpg',
            envPath + 'envmap_top.jpg', envPath + 'envmap_bottom.jpg',
            envPath + 'envmap_front.jpg', envPath + 'envmap_back.jpg'];
        const envMap = ImageUtils.loadTextureCube(envUrls);

        // Resolve team-specific texture paths (fallback to defaults)
        const teamTex = (teamRef && teamRef.current && teamRef.current.textures) || {
            bodyPaint: '/obj/textures/BodyPaint.jpg',
            driver:    '/obj/textures/Driver.jpg',
            helmet:    '/obj/textures/Helmet.jpg',
        };

        const bodyPaintDef = { x: 0, y: 0.5859, z: 0, material: new THREE.MeshLambertMaterial({
            color: 0xffffff, map: ImageUtils.loadTexture(teamTex.bodyPaint),
            envMap: envMap, combine: THREE.MultiplyOperation, reflectivity: 1 }) };
        const suspensionDef = { x: 0, y: 0.4044, z: -0.3071,
            material: new THREE.MeshPhongMaterial({ color: 0x0a0a0a }) };
        const insideBlackDef = { x: 0, y: 0.5773, z: 0.729,
            material: new THREE.MeshBasicMaterial({ color: 0x000000 }) };
        const glossyBlackDef = { x: 0, y: 0.4115, z: -0.7112,
            material: new THREE.MeshPhongMaterial({ color: 0x0a0a0a, specular: 0x606060 }) };
        const chromeDef = { x: 0, y: 0.5867, z: 0.3202,
            material: new THREE.MeshPhongMaterial({ color: 0xffffff, envMap: envMap,
            combine: THREE.MultiplyOperation }) };
        const boltsDef = { x: 0, y: 0.5694, z: 0.8672,
            material: new THREE.MeshPhongMaterial({ color: 0x848350, specular: 0x808080,
            shininess: 0.5, ambient: 0x808080 }) };
        const windshieldDef = { x: 0, y: 0.6777, z: 0.5647,
            material: new THREE.MeshPhongMaterial({ color: 0xffffff, envMap: envMap,
            combine: THREE.MixOperation, opacity: 0.5 }) };
        const rearLightDef = { x: 0, y: 0.4652, z: -2.34,
            material: new THREE.MeshBasicMaterial({ color: 0x800000,
            map: ImageUtils.loadTexture('/obj/textures/RearLights.jpg') }) };
        const rearLightGlassDef = { x: 0, y: 0.4652, z: -2.34,
            material: new THREE.MeshBasicMaterial({ color: 0xff0000, envMap: envMap,
            combine: THREE.MixOperation, opacity: 0.5 }) };
        const steeringWheelDef = { x: 0, y: 0.5933, z: 0.5054,
            material: new THREE.MeshPhongMaterial({ color: 0xffffff,
            map: ImageUtils.loadTexture('/obj/textures/SteeringWheel.jpg') }) };
        const driverBodyDef = { x: -0.0113, y: 0.4063, z: 0.5277,
            material: new THREE.MeshPhongMaterial({ color: 0xffffff,
            map: ImageUtils.loadTexture(teamTex.driver) }) };
        const helmetDef = { x: 0.0016, y: 0.7287, z: -0.0175,
            material: new THREE.MeshBasicMaterial({ color: 0xffffff,
            map: ImageUtils.loadTexture(teamTex.helmet),
            envMap: envMap, combine: THREE.MultiplyOperation }) };
        const visorDef = { x: 0.0016, y: 0.6993, z: 0.052,
            material: new THREE.MeshBasicMaterial({ color: 0xffffff,
            map: ImageUtils.loadTexture('/obj/textures/Visor.jpg'),
            envMap: envMap, combine: THREE.MultiplyOperation }) };
        const tyreDef = { x: 0, y: 0, z: 0,
            material: new THREE.MeshPhongMaterial({ color: 0xffffff,
            map: ImageUtils.loadTexture('/obj/textures/Tyre.jpg'),
            specular: 0x808080, shininess: 0.5, ambient: 0x808080 }) };
        const rimDef = { x: 0, y: 0, z: 0,
            material: new THREE.MeshPhongMaterial({ color: 0xffffff,
            map: ImageUtils.loadTexture('/obj/textures/Rim.jpg'), ambient: 0x404040 }) };
        const wheelBaseDef = { x: 0, y: 0, z: 0,
            material: new THREE.MeshBasicMaterial({ color: 0x000000 }) };

        helmetDef.material.map.wrap_s = THREE.RepeatWrapping;
        bm = rearLightDef.material;

        const body_url = '/obj/js/';
        loader.loadBinary({ model: body_url + 'BodyPaint.js',     callback: (d) => addBodyPart(d, bodyPaintDef) });
        loader.loadBinary({ model: body_url + 'Suspension.js',    callback: (d) => addBodyPart(d, suspensionDef) });
        loader.loadBinary({ model: body_url + 'InsideBlack.js',   callback: (d) => addBodyPart(d, insideBlackDef) });
        loader.loadBinary({ model: body_url + 'GlossyBlack.js',   callback: (d) => addBodyPart(d, glossyBlackDef) });
        loader.loadBinary({ model: body_url + 'Chrome.js',        callback: (d) => addBodyPart(d, chromeDef) });
        loader.loadBinary({ model: body_url + 'Bolts.js',         callback: (d) => addBodyPart(d, boltsDef) });
        loader.loadBinary({ model: body_url + 'Windshield.js',    callback: (d) => addBodyPart(d, windshieldDef) });
        loader.loadBinary({ model: body_url + 'RearLight.js',     callback: (d) => addBodyPart(d, rearLightDef) });
        loader.loadBinary({ model: body_url + 'RearLightGlass.js',callback: (d) => addBodyPart(d, rearLightGlassDef) });
        loader.loadBinary({ model: body_url + 'SteeringWheel.js', callback: (d) => addBodyPart(d, steeringWheelDef) });
        loader.loadBinary({ model: body_url + 'DriverBody.js',    callback: (d) => addBodyPart(d, driverBodyDef) });
        loader.loadBinary({ model: body_url + 'Helmet.js',        callback: (d) => addBodyPart(d, helmetDef) });
        loader.loadBinary({ model: body_url + 'Visor.js',         callback: (d) => addBodyPart(d, visorDef) });
        loader.loadBinary({ model: body_url + 'Tyre.js',          callback: (d) => addWheelPart(d, tyreDef) });
        loader.loadBinary({ model: body_url + 'Rim.js',           callback: (d) => addWheelPart(d, rimDef) });
        loader.loadBinary({ model: body_url + 'WheelBase.js',     callback: (d) => addWheelPart(d, wheelBaseDef) });
        // Render branding text under the car using real fonts on a canvas
        addBrandingText();

        // Shadow under car
        const shadow = new THREE.Mesh(new Plane(7.5, 7.5),
            new THREE.MeshBasicMaterial({ color: 0xffffff,
            map: ImageUtils.loadTexture('/obj/textures/Shadow.jpg') }));
        shadow.position.x = -0.4;
        shadow.position.y = -0.0010;
        shadow.rotation.x = -DEG90;
        shadow.rotation.z = -DEG90;
        car.addChild(shadow);
    }

    function addBrandingText() {
        // Create the plane immediately with a placeholder, then update the
        // texture once the logo + fonts are loaded.
        const canvas = document.createElement('canvas');
        canvas.width = 2048;
        canvas.height = 1280; // taller — logo above + 2 text lines below
        const ctx = canvas.getContext('2d');
        // Transparent background — no fillRect

        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;

        // Plane laid flat on the ground (rotated -90° on X)
        // Aspect ratio 2048:1280 ≈ 1.6 → width 6 × depth 3.75 keeps proportions
        const plane = new Plane(6, 3.75);
        const mat = new THREE.MeshBasicMaterial({
            map: texture,
            color: 0xffffff,
            opacity: 0.999, // < 1 forces legacy renderer to use the transparent pass (alpha blending)
        });
        const mesh = new THREE.Mesh(plane, mat);
        mesh.position.y = 0.01;
        mesh.rotation.x = -DEG90;
        // Same orientation as the original HelloEnjoy logo so the content
        // reads along the car's length.
        mesh.rotation.z = -DEG90;
        scene.addObject(mesh);

        // Load logo + fonts in parallel, then draw onto the canvas
        const fontAerial = new FontFace('AerialFaster', "url('/fonts/Aerial Faster - Regular.otf')");
        const fontDrift = new FontFace('Driftline', "url('/fonts/Driftline.ttf')");

        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        const logoLoaded = new Promise((resolve) => {
            logoImg.onload = () => resolve(logoImg);
            logoImg.onerror = () => {
                console.warn('[engine] CCFBS LOGO.png not found — branding will render text only');
                resolve(null);
            };
        });
        logoImg.src = '/obj/textures/CCFBS%20LOGO.png';

        Promise.all([
            fontAerial.load().catch(() => null),
            fontDrift.load().catch(() => null),
            logoLoaded,
        ]).then((results) => {
            const [aerial, drift, logo] = results;
            if (aerial) document.fonts.add(aerial);
            if (drift)  document.fonts.add(drift);

            const fallback = !aerial || !drift;
            drawBrandingCanvas(ctx, canvas, logo, fallback);
            texture.needsUpdate = true;
        });
    }

    function drawBrandingCanvas(ctx, canvas, logo, fallback = false) {
        // Clear to fully transparent — only logo + glyphs will be opaque
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const padding = 80;
        const maxWidth = canvas.width - padding * 2;

        // ---- Logo (top section) ----
        // Reserve the top ~40% of the canvas for the logo
        if (logo && logo.width && logo.height) {
            const logoAreaH = canvas.height * 0.40;
            const aspect = logo.width / logo.height;
            // Fit the logo into a centered box, preserving aspect ratio
            let drawH = logoAreaH * 0.85;
            let drawW = drawH * aspect;
            if (drawW > maxWidth) {
                drawW = maxWidth;
                drawH = drawW / aspect;
            }
            const drawX = (canvas.width - drawW) / 2;
            const drawY = (logoAreaH - drawH) / 2 + 20; // small top inset
            ctx.drawImage(logo, drawX, drawY, drawW, drawH);
        }

        // ---- Text below the logo ----
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // PITLANE CCFBS — middle section
        const topFamily = fallback ? '"Arial Black", sans-serif' : '"AerialFaster", "Arial Black", sans-serif';
        const topText = 'PITLANE CCFBS';
        const topSize = fitFontSize(ctx, topText, topFamily, 360, maxWidth);
        ctx.font = `${topSize}px ${topFamily}`;
        ctx.fillText(topText, canvas.width / 2, canvas.height * 0.62);

        // Othmane Slaimani — bottom section
        const bottomFamily = fallback ? 'italic "Georgia", serif' : '"Driftline", "Georgia", serif';
        const bottomText = 'Othmane Slaimani';
        const bottomSize = fitFontSize(ctx, bottomText, bottomFamily, 270, maxWidth);
        ctx.font = `${bottomSize}px ${bottomFamily}`;
        ctx.fillText(bottomText, canvas.width / 2, canvas.height * 0.85);
    }

    function fitFontSize(ctx, text, fontFamily, desiredSize, maxWidth) {
        // Reduce font size until the text fits within maxWidth.
        let size = desiredSize;
        for (let i = 0; i < 30; i++) {
            ctx.font = `${size}px ${fontFamily}`;
            if (ctx.measureText(text).width <= maxWidth) return size;
            size = Math.max(40, Math.floor(size * 0.93));
        }
        return size;
    }

    function addBodyPart(geom, def) {
        if (loader.statusDomElement) loader.statusDomElement.innerHTML = 'Loading car...';
        const m = new THREE.Mesh(geom, def.material);
        m.position.x = def.x; m.position.y = def.y; m.position.z = def.z;
        body.addChild(m);
        if (loader.statusDomElement) loader.statusDomElement.style.display = 'none';
    }

    function addWheelPart(geom, def) {
        let c;
        c = new THREE.Mesh(geom, def.material);
        c.position.x = def.x; c.position.y = def.y; c.position.z = def.z;
        c.rotation.y = -DEG90; lfw.addChild(c);
        c = new THREE.Mesh(geom, def.material);
        c.position.x = def.x; c.position.y = def.y; c.position.z = def.z;
        c.rotation.y = DEG90; rfw.addChild(c);
        c = new THREE.Mesh(geom, def.material);
        c.position.x = def.x; c.position.y = def.y; c.position.z = def.z;
        c.rotation.y = -DEG90; lrw.addChild(c);
        c = new THREE.Mesh(geom, def.material);
        c.position.x = def.x; c.position.y = def.y; c.position.z = def.z;
        c.rotation.y = DEG90; rrw.addChild(c);
    }

    // -------- Tire smoke --------
    function setupSmoke() {
        if (smokeReady) return;

        // Build a soft circular gradient as the smoke texture on a canvas
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        const grd = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
        grd.addColorStop(0,    'rgba(255,255,255,0.85)');
        grd.addColorStop(0.4,  'rgba(220,220,220,0.55)');
        grd.addColorStop(0.75, 'rgba(180,180,180,0.18)');
        grd.addColorStop(1,    'rgba(180,180,180,0)');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, 128, 128);
        smokeTexture = new THREE.Texture(canvas);
        smokeTexture.needsUpdate = true;

        // Pre-create the particle pool (each = a small flat plane that we rotate)
        for (let i = 0; i < SMOKE_POOL_SIZE; i++) {
            const mat = new THREE.MeshBasicMaterial({
                map: smokeTexture,
                color: 0xffffff,
                opacity: 0,
                transparent: true,
            });
            const plane = new Plane(0.6, 0.6);
            const mesh = new THREE.Mesh(plane, mat);
            mesh.rotation.x = -DEG90;       // lay flat so it always faces up
            mesh.position.set(0, -1000, 0); // off-screen until used
            scene.addObject(mesh);
            smokeParticles.push({
                mesh,
                mat,
                life: 0,
                maxLife: 1,
                vx: 0, vy: 0, vz: 0,
                scale: 1,
                active: false,
            });
        }
        smokeReady = true;
    }

    function emitSmokeBurst() {
        if (!smokeReady) return;
        // Compute world positions of the 4 wheels and emit small bursts
        const wheels = [lfw, rfw, lrw, rrw];
        for (const wheel of wheels) {
            // World position of this wheel = car position + rotated local offset
            const cy = Math.cos(car.rotation.y);
            const sy = Math.sin(car.rotation.y);
            const lx = wheel.position.x;
            const lz = wheel.position.z;
            const wx = car.position.x + (cy * lx + sy * lz);
            const wz = car.position.z + (-sy * lx + cy * lz);

            // Spawn 1 particle per wheel per frame while burnout-active
            const p = pickFreeSmokeParticle();
            if (!p) continue;
            p.mesh.position.x = wx + (Math.random() - 0.5) * 0.2;
            p.mesh.position.y = 0.05 + Math.random() * 0.05;
            p.mesh.position.z = wz + (Math.random() - 0.5) * 0.2;
            p.life = 0;
            p.maxLife = 1.0 + Math.random() * 0.6;
            p.vx = (Math.random() - 0.5) * 0.6;
            p.vy = 0.15 + Math.random() * 0.25;
            p.vz = (Math.random() - 0.5) * 0.6;
            p.scale = 0.6 + Math.random() * 0.3;
            p.mesh.scale.x = p.scale;
            p.mesh.scale.z = p.scale;
            p.mat.opacity = 0.85;
            p.active = true;
        }
    }

    function pickFreeSmokeParticle() {
        for (let i = 0; i < smokeParticles.length; i++) {
            if (!smokeParticles[i].active) return smokeParticles[i];
        }
        // Pool exhausted — recycle the oldest particle
        let oldest = smokeParticles[0];
        for (let i = 1; i < smokeParticles.length; i++) {
            if (smokeParticles[i].life > oldest.life) oldest = smokeParticles[i];
        }
        return oldest;
    }

    function updateSmoke(deltaSec) {
        if (!smokeReady) return;
        for (let i = 0; i < smokeParticles.length; i++) {
            const p = smokeParticles[i];
            if (!p.active) continue;
            p.life += deltaSec;
            if (p.life >= p.maxLife) {
                p.active = false;
                p.mesh.position.y = -1000; // hide
                p.mat.opacity = 0;
                continue;
            }
            const t = p.life / p.maxLife;
            // Drift outward and rise; fade out
            p.mesh.position.x += p.vx * deltaSec;
            p.mesh.position.y += p.vy * deltaSec;
            p.mesh.position.z += p.vz * deltaSec;
            // Slow upward motion as it rises
            p.vy *= (1 - 0.4 * deltaSec);
            // Expand scale
            const s = p.scale * (1 + t * 1.5);
            p.mesh.scale.x = s;
            p.mesh.scale.z = s;
            // Fade
            p.mat.opacity = 0.85 * (1 - t);
        }
    }

    // -------- Game loop --------
    function animate() {
        if (disposed) return;
        rafId = requestAnimationFrame(animate);
        const now = Date.now();
        dt = (now - ta) * 0.001;
        if (dt > 0.1) dt = 0.1;
        ta = now;
        updateCar();
        steerWheels();
        updateCamera();
        renderer.render(scene, camera);
        stats.update();
        emitHud();
    }

    function emitHud() {
        const speedKmh = Math.abs(Math.round(carSpeed * 3.6));
        const cameraName = carStopped
            ? 'ORBIT CAM'
            : `${cameraModeNames[cameraMode]}`;

        // Drive the procedural engine sound + crowd ambience from current car state
        engineSound.update(speedKmh, uu, ud);
        crowdSound.update(speedKmh);

        if (!onHudUpdate) return;
        onHudUpdate({
            speedKmh,
            cameraName,
            cameraIndex: cameraMode,
            cameraTotal: cameraConfigs.length,
            throttle: uu,
            brake: ud,
            handbrake: rs,
            steerLeft: ur,
            steerRight: ul,
            stopped: carStopped,
        });
    }

    function steerWheels() {
        let a = 2.5 * dt;
        const b = (ul ? -1 : 0) + (ur ? 1 : 0);
        if (b === 0) a = Math.min(a, Math.abs(s1));
        if (b > s1) s1 += a;
        else if (b < s1) s1 -= a;
        s1 = Math.min(1, Math.max(s1, -1));
        sa = s1 * 20 * DEG2RAD;
    }

    function updateCar() {
        const dragCoeff = 5, rr = 30;
        const cornerStiffF = -5, cornerStiffR = -5.2;
        const maxGrip = 2;
        const wheelbaseF = 1, wheelbaseR = 1;
        const totalWheelbase = wheelbaseF + wheelbaseR;
        const carYaw = car.rotation.y;
        const sinYaw = Math.sin(carYaw), cosYaw = Math.cos(carYaw);

        vel.x = cosYaw * cvel.y + sinYaw * cvel.x;
        vel.y = -sinYaw * cvel.y + cosYaw * cvel.x;

        const steerAngle = vel.x > 0 ? sa : -sa;
        const yawRate = totalWheelbase * 0.5 * av;
        let slipAngleFront, slipAngleSide, slipAngleRear;

        if (Math.abs(vel.x) < 0.2) {
            vel.x = vel.y = slipAngleFront = slipAngleSide = slipAngleRear = 0;
        } else {
            slipAngleFront = Math.atan2(yawRate, Math.abs(vel.x));
            slipAngleSide = Math.atan2(vel.y, Math.abs(vel.x));
            slipAngleRear = slipAngleSide - slipAngleFront;
            slipAngleFront = slipAngleSide + slipAngleFront - steerAngle;
        }

        const mass = 1500;
        const weightPerAxle = mass * 9.8 * 0.5;

        flf.x = 0;
        flf.y = cornerStiffF * (slipAngleFront || 0);
        flf.y = Math.min(maxGrip, flf.y);
        flf.y = Math.max(-maxGrip, flf.y);
        flf.y *= weightPerAxle;
        if (fs) flf.y *= 0.5;

        flr.x = 0;
        flr.y = cornerStiffR * (slipAngleRear || 0);
        flr.y = Math.min(maxGrip, flr.y);
        flr.y = Math.max(-maxGrip, flr.y);
        flr.y *= weightPerAxle;

        // HARD BRAKE (Space): aggressive locking — kills rear grip for slight
        // drift feel, but the dominant effect is a very strong stopping force.
        if (rs) flr.y *= 0.25;

        const throttle = uu ? 100 : 0;
        const brake = ud ? -100 : 0;
        ft.x = 100 * (throttle + brake);
        ft.y = 0;
        if (bm) bm.color.setHex((brake < 0 || rs) ? 0xff0000 : 0x800000);

        // Hard brake cuts drive force — even if the user holds throttle
        if (rs) ft.x *= 0.05;

        res.x = -(rr * vel.x + dragCoeff * vel.x * Math.abs(vel.x));
        res.y = -(rr * vel.y + dragCoeff * vel.y * Math.abs(vel.y));

        // HARD BRAKE: apply a very strong opposing longitudinal force.
        // This brings the car to a halt much faster than the previous
        // mild "handbrake" that mostly induced drifting.
        if (rs && Math.abs(vel.x) > 0.05) {
            const speedFactor = Math.min(1, Math.abs(vel.x) / 5);
            res.x -= 1500 * speedFactor * (vel.x > 0 ? 1 : -1);
        }

        force.x = ft.x + Math.sin(steerAngle) * flf.x + flr.x + res.x;
        force.y = ft.y + Math.cos(steerAngle) * flf.y + flr.y + res.y;

        if (force.x === 0 && vel.x === 0) {
            flf.y = flr.y = force.y = 0;
            acc.x = acc.y = aa = a2d.x = a2d.y = cvel.x = cvel.y = av = 0;
        } else {
            const torque = wheelbaseF * flf.y - wheelbaseR * flr.y;
            acc.x = force.x / mass;
            acc.y = force.y / mass;
            const inertia = 1500;
            aa = torque / inertia;
            a2d.x = cosYaw * acc.y + sinYaw * acc.x;
            a2d.y = -sinYaw * acc.y + cosYaw * acc.x;
            cvel.x += dt * a2d.x;
            cvel.y += dt * a2d.y;
            av += dt * aa;
        }

        car.position.z -= dt * cvel.x;
        car.position.x += dt * cvel.y;

        // Car drives forever — no position reset boundary

        car.rotation.y = carYaw + dt * av;
        lfw.rotation.y = sa;
        rfw.rotation.y = sa;

        const wheelRadius = 0.334;
        const wheelSpin = 0.012 * vel.x / wheelRadius;
        lfw.rotation.z -= wheelSpin;
        rfw.rotation.z -= wheelSpin;
        lrw.rotation.z -= wheelSpin;
        rrw.rotation.z -= wheelSpin;

        carSpeed = Math.sqrt(cvel.x * cvel.x + cvel.y * cvel.y);
        carStopped = carSpeed < stoppedThreshold;
    }

    function updateCamera() {
        const carYaw = car.rotation.y;
        const fwdX = -Math.sin(carYaw);
        const fwdZ = -Math.cos(carYaw);
        const rightX = Math.cos(carYaw);
        const rightZ = -Math.sin(carYaw);

        if (carStopped) {
            const ox = car.position.x + orbitRadius * Math.sin(orbitAngleX) * Math.cos(orbitAngleY);
            const oy = car.position.y + orbitRadius * Math.sin(orbitAngleY);
            const oz = car.position.z + orbitRadius * Math.cos(orbitAngleX) * Math.cos(orbitAngleY);
            camera.position.x += (ox - camera.position.x) * 0.1;
            camera.position.y += (oy - camera.position.y) * 0.1;
            camera.position.z += (oz - camera.position.z) * 0.1;
            camera.target.position.x = car.position.x;
            camera.target.position.y = car.position.y + 0.5;
            camera.target.position.z = car.position.z;
            return;
        }

        const cfg = cameraConfigs[cameraMode];
        const smooth = cfg.smoothing;

        // Smoothly interpolate FOV per camera config
        if (cfg.fov) {
            const targetFov = cfg.fov;
            if (Math.abs(camera.fov - targetFov) > 0.02) {
                camera.fov += (targetFov - camera.fov) * 0.12;
                if (camera.updateProjectionMatrix) camera.updateProjectionMatrix();
            }
        }

        let goalX, goalY, goalZ, lookX, lookY, lookZ;
        const lookH = cfg.lookHeight !== undefined ? cfg.lookHeight : 0.4;

        if (cfg.type === 'broadcast') {
            // ====== Top-down F1 configurator camera ======
            //   target = car + (offsetX, height, offsetZ + distance)
            //   look   = car + (lookAhead, lookHeight, 0)
            const ox = cfg.offsetX || 0;
            const oz = cfg.offsetZ || 0;
            const dz = cfg.distance || 0;

            const targetX = car.position.x + ox;
            const targetY = car.position.y + cfg.height;
            const targetZ = car.position.z + oz + dz;

            camera.position.x += (targetX - camera.position.x) * cfg.smoothing;
            camera.position.y += (targetY - camera.position.y) * cfg.smoothing;
            camera.position.z += (targetZ - camera.position.z) * cfg.smoothing;

            // Legacy THREE.Camera (~r48) uses camera.target.position instead
            // of camera.lookAt(), but the result is identical.
            camera.target.position.x = car.position.x + cfg.lookAhead;
            camera.target.position.y = car.position.y + cfg.lookHeight;
            camera.target.position.z = car.position.z;

            // FOV applied directly (no easing) for stable framing
            if (camera.fov !== cfg.fov) {
                camera.fov = cfg.fov;
                if (camera.updateProjectionMatrix) camera.updateProjectionMatrix();
            }

            orbitAngleX = carYaw + Math.PI;
            return;

        } else if (cfg.type === 'chase') {
            // Standard chase, looks ahead to give a sense of forward motion
            goalX = car.position.x - fwdX * cfg.distance;
            goalY = car.position.y + cfg.height;
            goalZ = car.position.z - fwdZ * cfg.distance;
            lookX = car.position.x + fwdX * cfg.lookAhead;
            lookY = car.position.y + lookH;
            lookZ = car.position.z + fwdZ * cfg.lookAhead;

        } else if (cfg.type === 'topdown') {
            goalX = car.position.x;
            goalY = car.position.y + cfg.height;
            goalZ = car.position.z;
            lookX = car.position.x;
            lookY = car.position.y;
            lookZ = car.position.z;

        } else if (cfg.type === 'cockpit') {
            // Driver-eye POV, looking far ahead
            goalX = car.position.x + fwdX * cfg.forwardOffset;
            goalY = car.position.y + cfg.height;
            goalZ = car.position.z + fwdZ * cfg.forwardOffset;
            lookX = car.position.x + fwdX * cfg.lookForward;
            lookY = car.position.y + lookH;
            lookZ = car.position.z + fwdZ * cfg.lookForward;

        } else if (cfg.type === 'side') {
            // Behind-right 3/4 tracking shot
            goalX = car.position.x - fwdX * cfg.distance + rightX * cfg.sideOffset;
            goalY = car.position.y + cfg.height;
            goalZ = car.position.z - fwdZ * cfg.distance + rightZ * cfg.sideOffset;
            lookX = car.position.x + fwdX * cfg.lookAhead;
            lookY = car.position.y + lookH;
            lookZ = car.position.z + fwdZ * cfg.lookAhead;
        }

        camera.position.x += (goalX - camera.position.x) * smooth;
        camera.position.y += (goalY - camera.position.y) * smooth;
        camera.position.z += (goalZ - camera.position.z) * smooth;

        camera.target.position.x += (lookX - camera.target.position.x) * 0.12;
        camera.target.position.y += (lookY - camera.target.position.y) * 0.12;
        camera.target.position.z += (lookZ - camera.target.position.z) * 0.12;

        orbitAngleX = carYaw + Math.PI;
    }

    // -------- Input --------
    function onKeyDown(e) {
        const code = e.keyCode;
        const b = bindingsRef.current;

        // Browsers require a user gesture before audio plays — start on first input
        if (!audioStarted) {
            engineSound.start();
            crowdSound.start();
            audioStarted = true;
        }

        if (code === b.accelerate) uu = true;
        else if (code === b.brake) ud = true;
        else if (code === b.left) ur = true;
        else if (code === b.right) ul = true;
        else if (code === b.handbrake) { rs = true; e.preventDefault(); }
        else if (code === 82) cameraMode = (cameraMode + 1) % cameraConfigs.length;
    }

    function onKeyUp(e) {
        const code = e.keyCode;
        const b = bindingsRef.current;
        if (code === b.accelerate) uu = false;
        else if (code === b.brake) ud = false;
        else if (code === b.left) ur = false;
        else if (code === b.right) ul = false;
        else if (code === b.handbrake) rs = false;
    }

    function onMouseDown(e) {
        mouseDown = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
    }

    function onMouseUp() { mouseDown = false; }

    function onMouseMove(e) {
        if (!mouseDown || !carStopped) return;
        const dx = e.clientX - lastMouseX;
        const dy = e.clientY - lastMouseY;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        orbitAngleX += dx * 0.005;
        orbitAngleY += dy * 0.005;
        orbitAngleY = Math.max(0.1, Math.min(Math.PI * 0.45, orbitAngleY));
    }

    function onMouseWheel(e) {
        if (!carStopped) return;
        orbitRadius += e.deltaY * 0.01;
        orbitRadius = Math.max(orbitMinRadius, Math.min(orbitMaxRadius, orbitRadius));
        e.preventDefault();
    }

    // -------- Cleanup --------
    function dispose() {
        disposed = true;
        if (rafId) cancelAnimationFrame(rafId);
        document.removeEventListener('keydown', onKeyDown);
        document.removeEventListener('keyup', onKeyUp);
        document.removeEventListener('mouseup', onMouseUp);
        document.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('resize', onResize);
        if (renderer && renderer.domElement) {
            renderer.domElement.removeEventListener('mousedown', onMouseDown);
            renderer.domElement.removeEventListener('wheel', onMouseWheel);
            try { container.removeChild(renderer.domElement); } catch (e) {}
        }
        if (stats && stats.domElement && stats.domElement.parentNode) {
            try { stats.domElement.parentNode.removeChild(stats.domElement); } catch (e) {}
        }
        if (loader && loader.statusDomElement && loader.statusDomElement.parentNode) {
            try { loader.statusDomElement.parentNode.removeChild(loader.statusDomElement); } catch (e) {}
        }
        engineSound.dispose();
        crowdSound.dispose();
    }

    function setMuted(muted) {
        engineSound.setMuted(muted);
        crowdSound.setMuted(muted);
    }

    function setEngineVolume(v) { engineSound.setVolume(v); }
    function setCrowdVolume(v)  { crowdSound.setVolume(v); }

    function setCameraMode(mode) {
        cameraMode = ((mode % cameraConfigs.length) + cameraConfigs.length) % cameraConfigs.length;
    }
    function getCameraNames() { return cameraModeNames.slice(); }

    return { dispose, setMuted, setEngineVolume, setCrowdVolume, setCameraMode, getCameraNames };
}
