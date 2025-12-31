// three.js r71 doesn't have addScaledVector for THREE.Vector3
// and lacks CatmullRomCurve3; provide minimal polyfills.
(() => {
    const V3 = (THREE as any).Vector3 as { prototype: THREE.Vector3 };
    const SplineCurve3 = (THREE as any).SplineCurve3;

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

    if (typeof (THREE as any).CatmullRomCurve3 !== "function" && typeof SplineCurve3 === "function") {
        const CatmullRomCurve3 = function (
            this: any,
            points: THREE.Vector3[],
            closed = false,
            _curveType: string = "centripetal",
            tension: number = 0.5
        ) {
            SplineCurve3.call(this, points);
            this.type = "catmullrom";
            this.closed = !!closed;
            this.tension = tension;
        };
        CatmullRomCurve3.prototype = Object.create(SplineCurve3.prototype);
        CatmullRomCurve3.prototype.constructor = CatmullRomCurve3;
        (THREE as any).CatmullRomCurve3 = CatmullRomCurve3;
    }
})();
