// three.js r71 doesn't have addScaledVector for THREE.Vector3
// This polyfill is safe: only defines it if missing.
(() => {
    // Avoid strict typing issues against APS-bundled THREE
    const V3 = (THREE as any).Vector3 as { prototype: THREE.Vector3 };

    if (typeof V3?.prototype?.addScaledVector !== "function") {
        V3.prototype.addScaledVector = function (
            this: THREE.Vector3,
            v: THREE.Vector3,
            s: number
        ): THREE.Vector3 {
            this.x += v.x * s;
            this.y += v.y * s;
            this.z += v.z * s;
            return this;
        };
    }
})();
