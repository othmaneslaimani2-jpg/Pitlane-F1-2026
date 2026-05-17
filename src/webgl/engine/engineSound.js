// =====================================================================
// F1 ENGINE SOUND — procedural Web Audio (V6 turbo)
// =====================================================================
// Stacked harmonic oscillators + turbo whine + exhaust noise.
// Crowd ambience lives in a separate module (crowdSound.js).
// =====================================================================

export function createEngineSound() {
    let ctx = null;
    let masterOut = null;
    let engineGain = null;

    // Engine layer
    let mainOsc = null, harm2Osc = null, harm3Osc = null, subOsc = null;
    let mainGain = null, harm2Gain = null, harm3Gain = null, subGain = null;
    let engineFilter = null;

    // Turbo whine
    let turboOsc = null;
    let turboGain = null;

    // Exhaust noise
    let exhaustSource = null;
    let exhaustGain = null;
    let exhaustFilter = null;

    let started = false;
    let muted = false;
    let userVolume = 1.0; // 0..1 multiplier set by the user

    function ensureContext() {
        if (ctx) return;
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) {
            console.warn('[engineSound] Web Audio not supported');
            return;
        }
        ctx = new Ctx();

        masterOut = ctx.createGain();
        masterOut.gain.value = 0;
        masterOut.connect(ctx.destination);

        buildEngineGraph();
    }

    function buildEngineGraph() {
        engineGain = ctx.createGain();
        engineGain.gain.value = 0;
        engineGain.connect(masterOut);

        engineFilter = ctx.createBiquadFilter();
        engineFilter.type = 'lowpass';
        engineFilter.frequency.value = 800;
        engineFilter.Q.value = 1.4;
        engineFilter.connect(engineGain);

        // Sub octave for body / weight
        subOsc = ctx.createOscillator();
        subOsc.type = 'sawtooth';
        subOsc.frequency.value = 60;
        subGain = ctx.createGain();
        subGain.gain.value = 0.55;
        subOsc.connect(subGain);
        subGain.connect(engineFilter);

        // Main intake tone
        mainOsc = ctx.createOscillator();
        mainOsc.type = 'sawtooth';
        mainOsc.frequency.value = 120;
        mainGain = ctx.createGain();
        mainGain.gain.value = 0.7;
        mainOsc.connect(mainGain);
        mainGain.connect(engineFilter);

        // 2× harmonic (square for bite)
        harm2Osc = ctx.createOscillator();
        harm2Osc.type = 'square';
        harm2Osc.frequency.value = 240;
        harm2Gain = ctx.createGain();
        harm2Gain.gain.value = 0.3;
        harm2Osc.connect(harm2Gain);
        harm2Gain.connect(engineFilter);

        // 3× harmonic (the F1 "scream" overtone)
        harm3Osc = ctx.createOscillator();
        harm3Osc.type = 'sawtooth';
        harm3Osc.frequency.value = 360;
        harm3Gain = ctx.createGain();
        harm3Gain.gain.value = 0.18;
        harm3Osc.connect(harm3Gain);
        harm3Gain.connect(engineFilter);

        // Turbo whine
        turboOsc = ctx.createOscillator();
        turboOsc.type = 'sine';
        turboOsc.frequency.value = 900;
        turboGain = ctx.createGain();
        turboGain.gain.value = 0;
        turboOsc.connect(turboGain);
        turboGain.connect(engineGain);

        // Exhaust noise (white noise → bandpass → engineGain)
        exhaustSource = ctx.createBufferSource();
        exhaustSource.buffer = makeNoiseBuffer(ctx, 2.0);
        exhaustSource.loop = true;
        exhaustFilter = ctx.createBiquadFilter();
        exhaustFilter.type = 'bandpass';
        exhaustFilter.frequency.value = 1800;
        exhaustFilter.Q.value = 0.9;
        exhaustGain = ctx.createGain();
        exhaustGain.gain.value = 0;
        exhaustSource.connect(exhaustFilter);
        exhaustFilter.connect(exhaustGain);
        exhaustGain.connect(engineGain);
    }

    function start() {
        ensureContext();
        if (!ctx || started) return;
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});
        try {
            mainOsc.start();
            harm2Osc.start();
            harm3Osc.start();
            subOsc.start();
            turboOsc.start();
            exhaustSource.start();
        } catch (e) { /* already started */ }
        started = true;

        const now = ctx.currentTime;
        masterOut.gain.cancelScheduledValues(now);
        masterOut.gain.setValueAtTime(masterOut.gain.value, now);
        masterOut.gain.linearRampToValueAtTime(muted ? 0 : userVolume, now + 0.4);
    }

    function update(speedKmh, throttle, brake) {
        if (!ctx || !started || muted) return;

        const now = ctx.currentTime;
        const speed = Math.abs(speedKmh);
        const stopped = speed < 1 && !throttle;

        if (stopped) {
            engineGain.gain.setTargetAtTime(0, now, 0.08);
            turboGain.gain.setTargetAtTime(0, now, 0.08);
            exhaustGain.gain.setTargetAtTime(0, now, 0.08);
            return;
        }

        const rpmNorm = Math.min(speed / 340, 1);

        // Modern F1 hybrid V6 firing frequency
        const base = 95 + rpmNorm * 420;

        // Slight instability for realism
        const flutter = Math.sin(now * 27) * 2.5;
        const loadBoost = throttle ? 25 : 0;
        const freq = base + flutter + loadBoost;

        mainOsc.frequency.setTargetAtTime(freq, now, 0.018);
        harm2Osc.frequency.setTargetAtTime(freq * 2.01, now, 0.018);
        harm3Osc.frequency.setTargetAtTime(freq * 3.03, now, 0.018);
        subOsc.frequency.setTargetAtTime(freq * 0.51, now, 0.018);

        // F1 turbo whistle
        turboOsc.frequency.setTargetAtTime(
            1600 + rpmNorm * 4200 + (throttle ? 700 : 0), now, 0.025
        );
        turboGain.gain.setTargetAtTime(
            0.05 + rpmNorm * 0.22 + (throttle ? 0.08 : 0), now, 0.03
        );

        // Sharper exhaust hiss
        exhaustFilter.frequency.setTargetAtTime(
            2600 + rpmNorm * 5200, now, 0.02
        );
        exhaustGain.gain.setTargetAtTime(
            0.08 + rpmNorm * 0.22 + (throttle ? 0.14 : 0), now, 0.02
        );

        // Aggressive brightness
        engineFilter.frequency.setTargetAtTime(
            1400 + rpmNorm * 7000 + (throttle ? 1200 : 0), now, 0.018
        );
        engineFilter.Q.setTargetAtTime(2.4 + rpmNorm * 6, now, 0.03);

        let vol =
            0.18 + rpmNorm * 0.62 + (throttle ? 0.24 : 0) - (brake ? 0.08 : 0);

        engineGain.gain.setTargetAtTime(Math.min(1, vol), now, 0.02);

        // Ignition-cut crackle on braking at high RPM
        if (brake && rpmNorm > 0.25) {
            exhaustGain.gain.setValueAtTime(0.55 * Math.random(), now);
        }
    }

    function setMuted(m) {
        muted = m;
        if (!ctx) return;
        const now = ctx.currentTime;
        masterOut.gain.cancelScheduledValues(now);
        masterOut.gain.linearRampToValueAtTime(m ? 0 : userVolume, now + 0.15);
    }

    function setVolume(v) {
        userVolume = Math.max(0, Math.min(1, v));
        if (!ctx || muted) return;
        const now = ctx.currentTime;
        masterOut.gain.cancelScheduledValues(now);
        masterOut.gain.linearRampToValueAtTime(userVolume, now + 0.1);
    }

    function dispose() {
        try {
            if (mainOsc) mainOsc.stop();
            if (harm2Osc) harm2Osc.stop();
            if (harm3Osc) harm3Osc.stop();
            if (subOsc) subOsc.stop();
            if (turboOsc) turboOsc.stop();
            if (exhaustSource) exhaustSource.stop();
        } catch (e) {}
        if (ctx) ctx.close().catch(() => {});
        ctx = null;
        started = false;
    }

    return { start, update, setMuted, setVolume, dispose };
}

// ---------------------------------------------------------------------
function makeNoiseBuffer(ctx, durationSec) {
    const sampleRate = ctx.sampleRate;
    const length = Math.floor(sampleRate * durationSec);
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
}
