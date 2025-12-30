// --- extend your existing global.d.ts (no imports/exports here) ---

declare namespace THREE {
    // You likely already have Vector3 with x/y/z & addScaledVector; ensure these too:
    interface Vector3 {
        x: number; y: number; z: number;
        set(x: number, y: number, z: number): this;
        clone(): Vector3;
        normalize(): this;
        negate(): this;
        add(v: Vector3): this;
        sub(v: Vector3): this;
        subVectors(a: Vector3, b: Vector3): this;
        multiplyScalar(s: number): this;
        dot(v: Vector3): number;
        cross(v: Vector3): Vector3;

        // your polyfilled method:
        addScaledVector(v: Vector3, s: number): this;

        [k: string]: any; // keep loose to avoid chasing full r71 surface
    }

    class Vector4 {
        constructor(x?: number, y?: number, z?: number, w?: number);
        x: number; y: number; z: number; w: number;
        set(x: number, y: number, z: number, w: number): this;
    }

    class Line3 {
        constructor(start?: Vector3, end?: Vector3);
        start: Vector3;
        end: Vector3;
        // (not used by your code, but handy)
        set(start: Vector3, end: Vector3): this;
        clone(): Line3;
    }

    class Plane {
        constructor(normal?: Vector3, constant?: number);
        x: number; y: number; z: number; w: number;
        normal: Vector3;
        constant: number;

        // r71-style API
        setComponents(x: number, y: number, z: number, w: number): this;
        projectPoint(point: Vector3, target: Vector3): Vector3;          // writes into target, returns target
        intersectLine(line: Line3, target: Vector3): Vector3 | null;     // null/undefined if no intersection
        normalize(): this;
        negate(): this;
    }

    class Frustum {
        constructor(p0?: Plane, p1?: Plane, p2?: Plane, p3?: Plane, p4?: Plane, p5?: Plane);
        planes: Plane[]; // length 6
        set(p0: Plane, p1: Plane, p2: Plane, p3: Plane, p4: Plane, p5: Plane): this;
    }

    class Box3 {
        constructor(min?: Vector3, max?: Vector3);
        min: Vector3;
        max: Vector3;
        set(min: Vector3, max: Vector3): this;
        setFromPoints(points: Vector3[]): this;
        containsPoint(point: Vector3): boolean
        makeEmpty(): this;
        union(box: Box3): this;
        isEmpty(): boolean;
    }

    // Minimal BufferGeometry used in code
    class BufferGeometry {
        setAttribute(name: string, attribute: BufferAttribute): this;
        dispose(): void;
    }

    // Minimal BufferAttribute + Float32BufferAttribute
    class BufferAttribute {
        constructor(array: ArrayLike<number>, itemSize: number);
        array: ArrayLike<number>;
        itemSize: number;
        count: number;
    }

    class Float32BufferAttribute extends BufferAttribute {
        constructor(array: ArrayLike<number>, itemSize: number);
    }

    // Line materials / objects
    class Material { dispose(): void; }

    class LineBasicMaterial extends Material {
        constructor(parameters?: { linewidth?: number });
    }

    class Object3D {
        parent: Object3D | null;
        children: Object3D[];
        visible: boolean;
    }

    class LineSegments extends Object3D {
        constructor(geometry: BufferGeometry, material: Material);
    }
}


// (Optional) if you also declare a global const THREE, ensure it exposes constructors you use:
declare const THREE: {
    Vector3: { new(x?: number, y?: number, z?: number): THREE.Vector3; prototype: THREE.Vector3 };
    Vector4: { new(x?: number, y?: number, z?: number, w?: number): THREE.Vector4; prototype: THREE.Vector4 };
    Line3: { new(start?: THREE.Vector3, end?: THREE.Vector3): THREE.Line3; prototype: THREE.Line3 };
    Plane: { new(normal?: THREE.Vector3, constant?: number): THREE.Plane; prototype: THREE.Plane };
    Frustum: { new(p0?: THREE.Plane, p1?: THREE.Plane, p2?: THREE.Plane, p3?: THREE.Plane, p4?: THREE.Plane, p5?: THREE.Plane): THREE.Frustum; prototype: THREE.Frustum };
    Box3: { new(min?: THREE.Vector3, max?: THREE.Vector3): THREE.Box3; prototype: THREE.Box3 };

    BufferGeometry: { new(): THREE.BufferGeometry; prototype: THREE.BufferGeometry };
    BufferAttribute: { new(array: ArrayLike<number>, itemSize: number): THREE.BufferAttribute; prototype: THREE.BufferAttribute };
    Float32BufferAttribute: { new(array: ArrayLike<number>, itemSize: number): THREE.Float32BufferAttribute; prototype: THREE.Float32BufferAttribute };
    LineBasicMaterial: { new(parameters?: { linewidth?: number }): THREE.LineBasicMaterial; prototype: THREE.LineBasicMaterial };
    LineSegments: { new(geometry: THREE.BufferGeometry, material: THREE.Material): THREE.LineSegments; prototype: THREE.LineSegments };
};
