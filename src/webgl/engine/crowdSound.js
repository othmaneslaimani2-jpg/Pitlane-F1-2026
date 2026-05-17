// =====================================================================
// Crowd ambience — looped MP3 from /public/f1-crowd.mp3
// =====================================================================
// Volume formula combines a base level + speed-driven swell + a slow
// breathing LFO. The output is also scaled by a user volume slider.
// =====================================================================

export function createCrowdSound() {
    const crowd = new Audio('/f1-crowd.mp3');
    crowd.loop = true;
    crowd.volume = 0.22;
    crowd.preservesPitch = false;
    crowd.crossOrigin = 'anonymous';

    let started = false;
    let muted = false;
    let userVolume = 1.0; // 0..1 multiplier from the UI

    function start() {
        if (started) return;
        crowd.play().catch((err) => {
            console.warn('[crowdSound] Could not play /f1-crowd.mp3:', err.message || err);
        });
        started = true;
    }

    function update(speedKmh) {
        if (!started) return;
        const speedNorm = Math.min(Math.abs(speedKmh) / 340, 1);

        // Base swell formula
        const dynamicVol =
            0.08 +
            speedNorm * 0.18 +
            Math.sin(Date.now() * 0.00025) * 0.03;

        const clamped = Math.max(0.05, Math.min(0.35, dynamicVol));
        crowd.volume = muted ? 0 : clamped * userVolume;
    }

    function setMuted(v) {
        muted = v;
        if (muted) crowd.volume = 0;
    }

    function setVolume(v) {
        userVolume = Math.max(0, Math.min(1, v));
        // Apply immediately even if not currently driving (so the
        // change is audible right away when stopped).
        if (!muted) crowd.volume = Math.min(0.35, 0.22 * userVolume);
    }

    function dispose() {
        try {
            crowd.pause();
            crowd.currentTime = 0;
        } catch (e) {}
        started = false;
    }

    return { start, update, setMuted, setVolume, dispose };
}
