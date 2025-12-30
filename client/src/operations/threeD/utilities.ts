import './three-polyfills'

export function makeVector3(xyz: THREE.Vector3) {
    return new THREE.Vector3(xyz.x, xyz.y, xyz.z)
}

export function makeVector4(plane: THREE.Vector4) {
    return new THREE.Vector4(plane.x, plane.y, plane.z, plane.w)
}

/**
 * Takes two planes and returns a Line3 which represents their intersection
 * use len to specify how long the line should be
 * @param {THREE.Plane} pl1 
 * @param {THREE.Plane} pl2 
 * @param {*} len How long the line should be
 * @returns {THREE.Line3} Intersection Line
 * // ref: https://discourse.threejs.org/t/is-it-possible-to-create-a-three-box3-from-a-three-fustum/6568/4
 */
function intersectPlanes(pl1: THREE.Plane, pl2: THREE.Plane, len = 100000) {
    let EXTENSION = 2000000;

    let cp1 = pl1.normal.clone();
    cp1.normalize();
    cp1.negate();
    cp1.multiplyScalar(pl1.constant);

    let cp2 = pl2.normal.clone();
    cp2.normalize();
    cp2.negate();
    cp2.multiplyScalar(pl2.constant);

    // calculate cross product to derive direction of intersection line
    let crPl1 = pl1.normal.clone();
    let crPl2 = pl2.normal.clone();
    let cr = crPl1.cross(crPl2);
    cr.normalize();

    let dtPl1 = pl1.normal.clone();
    let dtPl2 = pl2.normal.clone();
    let dot = dtPl1.dot(dtPl2);
    let ang = Math.acos(dot) * (180 / Math.PI);
    // return null if planes are identical or parallel
    if (ang == 0 || ang == 180) return null;
    // project point directly if planes are perpendicular
    if (ang == 90 || ang == 270) {
        let intPt = new THREE.Vector3();
        pl2.projectPoint(cp1, intPt);
        let intA = intPt.clone();
        let intB = intPt.clone();
        intA.addScaledVector(cr, len / 2);
        intB.addScaledVector(cr, -len / 2);

        let intLn = new THREE.Line3(intA, intB);
        return intLn;
    }

    // project origin of first plane on to second plane
    let projLnAStart = new THREE.Vector3(cp1.x, cp1.y, cp1.z).normalize();
    projLnAStart.multiplyScalar(EXTENSION);
    let projLnAEnd = new THREE.Vector3(-projLnAStart.x, -projLnAStart.y, -projLnAStart.z);
    let int1 = new THREE.Vector3();
    let projLnA = new THREE.Line3(projLnAStart, projLnAEnd);
    pl2.intersectLine(projLnA, int1);

    // project the intersection point back to first plane along the second plane
    let projVcB = new THREE.Vector3();
    projVcB.subVectors(int1, cp2).normalize();
    projVcB.multiplyScalar(EXTENSION);
    let projLnBStart = cp2.clone();
    projLnBStart.add(projVcB);
    let projLnBEnd = cp2.clone();
    projLnBEnd.add(projVcB.negate());
    let int2 = new THREE.Vector3();
    let projLnB = new THREE.Line3(projLnBStart, projLnBEnd);
    pl1.intersectLine(projLnB, int2);

    // use cross vector and intersecttion point to create line
    let intA = int2.clone();
    let intB = int2.clone();
    intA.addScaledVector(cr, len / 2);
    intB.addScaledVector(cr, -len / 2);

    let intLn = new THREE.Line3(intA, intB);
    return intLn;

}

/**
 * Get intersected points of section box planes
 * @param {THREE.Frustum} frustum 
 * @returns {THREE.Vector3[]} Intersected points of section box planes
 * // ref: https://discourse.threejs.org/t/is-it-possible-to-create-a-three-box3-from-a-three-fustum/6568/4
 */
function getCorners(frustum: THREE.Frustum) {
    let lnLT = intersectPlanes(frustum.planes[0], frustum.planes[1]);
    let lnRT = intersectPlanes(frustum.planes[1], frustum.planes[2]);
    let lnRB = intersectPlanes(frustum.planes[2], frustum.planes[3]);
    let lnLB = intersectPlanes(frustum.planes[3], frustum.planes[0]);

    let int;

    int = new THREE.Vector3();
    frustum.planes[4].intersectLine(lnLT!, int);
    let ptLTN = int.clone();
    int = new THREE.Vector3();
    frustum.planes[5].intersectLine(lnLT!, int);
    let ptLTF = int.clone();

    int = new THREE.Vector3();
    frustum.planes[4].intersectLine(lnRT!, int);
    let ptRTN = int.clone();
    int = new THREE.Vector3();
    frustum.planes[5].intersectLine(lnRT!, int);
    let ptRTF = int.clone();

    int = new THREE.Vector3();
    frustum.planes[4].intersectLine(lnLB!, int);
    let ptLBN = int.clone();
    int = new THREE.Vector3();
    frustum.planes[5].intersectLine(lnLB!, int);
    let ptLBF = int.clone();

    int = new THREE.Vector3();
    frustum.planes[4].intersectLine(lnRB!, int);
    let ptRBN = int.clone();
    int = new THREE.Vector3();
    frustum.planes[5].intersectLine(lnRB!, int);
    let ptRBF = int.clone();

    let pts = [ptLTN, ptLTF, ptRTN, ptRTF, ptLBN, ptLBF, ptRBN, ptRBF];

    return pts;
}

export function boundsFromCutplanes(cutPlanes: THREE.Vector4[]): THREE.Box3 | null {
    if (cutPlanes.length < 6) return null

    try {
        let planes = cutPlanes.map(p => new THREE.Plane().setComponents(p.x, p.y, p.z, p.w))
        let frustum = new THREE.Frustum(
            planes[3],
            planes[1],
            planes[0],
            planes[4],
            planes[5],
            planes[2]
        );

        let pts = getCorners(frustum);
        const box = new THREE.Box3().setFromPoints(pts)
        return box
    } catch (e) { return null }
}

function toAxisAlignedSix(planes: THREE.Plane[], eps = 1e-4) {
    const groups: { px: number[], nx: number[], py: number[], ny: number[], pz: number[], nz: number[] } = { px: [], nx: [], py: [], ny: [], pz: [], nz: [] };
    for (const p of planes) {
        // normalize normal just in case
        const len = Math.hypot(p.x, p.y, p.z) || 1;
        const nx = p.x / len, ny = p.y / len, nz = p.z / len, d = p.w / len;
        const ax = Math.abs(nx), ay = Math.abs(ny), az = Math.abs(nz);
        if (ax > 1 - eps && ay < eps && az < eps) {
            if (nx > 0) groups.px.push(-d); else groups.nx.push(+d);
        } else if (ay > 1 - eps && ax < eps && az < eps) {
            if (ny > 0) groups.py.push(-d); else groups.ny.push(+d);
        } else if (az > 1 - eps && ax < eps && ay < eps) {
            if (nz > 0) groups.pz.push(-d); else groups.nz.push(+d);
        }
    }
    // Must have at least one plane per direction
    if (!groups.px.length || !groups.nx.length ||
        !groups.py.length || !groups.ny.length ||
        !groups.pz.length || !groups.nz.length) return null;

    // For a tight box: +axis choose the **max** position, -axis choose the **min**.
    const max = (a: number[]) => a.reduce((m, v) => v > m ? v : m, -Infinity);
    const min = (a: number[]) => a.reduce((m, v) => v < m ? v : m, +Infinity);

    const maxX = max(groups.px), minX = min(groups.nx);
    const maxY = max(groups.py), minY = min(groups.ny);
    const maxZ = max(groups.pz), minZ = min(groups.nz);

    return [
        new THREE.Vector4(1, 0, 0, -maxX), // +X
        new THREE.Vector4(-1, 0, 0, +minX), // -X
        new THREE.Vector4(0, 1, 0, -maxY),  // +Y
        new THREE.Vector4(0, -1, 0, +minY), // -Y
        new THREE.Vector4(0, 0, 1, -maxZ),  // +Z
        new THREE.Vector4(0, 0, -1, +minZ)  // -Z
    ];
}

function planesToBox3(six: THREE.Vector4[]) {
    const box = new THREE.Box3();
    box.min.set(six[1].w, six[3].w, six[5].w); // (-X,-Y,-Z) carry +min
    box.max.set(-six[0].w, -six[2].w, -six[4].w); // (+X,+Y,+Z) carry -max
    return box;
}

function boxToPlanes(box: THREE.Box3) {
    return [
        new THREE.Vector4(1, 0, 0, -box.max.x),
        new THREE.Vector4(-1, 0, 0, box.min.x),
        new THREE.Vector4(0, 1, 0, -box.max.y),
        new THREE.Vector4(0, -1, 0, box.min.y),
        new THREE.Vector4(0, 0, 1, -box.max.z),
        new THREE.Vector4(0, 0, -1, box.min.z),
    ];
}

export function makeCutplanesForBox(planes: THREE.Plane[]) {
    const six = toAxisAlignedSix(planes)
    let box = planesToBox3(six!)
    // ensureNonDegenerate(box, viewer)        // expands any zero-thickness axis by epsilon
    const healed = boxToPlanes(box)
    return healed
}

export async function logElementProperties(model: Autodesk.Viewing.Model, dbId: number) {
    const props = await new Promise<any[]>((resolve, reject) =>
        model.getBulkProperties([dbId], {}, resolve, reject)
    );

    // Log initial dbId and its properties (if any)
    console.log(`Properties for dbId: ${dbId}`, props);
}

export function box3FromObject(o: { min: { x: number, y: number, z: number }, max: { x: number, y: number, z: number } }): THREE.Box3 {
    // normalize in case min/max are swapped
    const min = new THREE.Vector3(
        Math.min(o.min.x, o.max.x),
        Math.min(o.min.y, o.max.y),
        Math.min(o.min.z, o.max.z)
    );
    const max = new THREE.Vector3(
        Math.max(o.min.x, o.max.x),
        Math.max(o.min.y, o.max.y),
        Math.max(o.min.z, o.max.z)
    );
    return new THREE.Box3(min, max);
}

export function makeBoxCutPlanes(box: THREE.Box3): THREE.Plane[] {
    const { min, max } = box;
    return [
        // x >= min.x , x <= max.x
        new THREE.Plane(new THREE.Vector3(1, 0, 0), -min.x),
        new THREE.Plane(new THREE.Vector3(-1, 0, 0), max.x),
        // y >= min.y , y <= max.y
        new THREE.Plane(new THREE.Vector3(0, 1, 0), -min.y),
        new THREE.Plane(new THREE.Vector3(0, -1, 0), max.y),
        // z >= min.z , z <= max.z
        new THREE.Plane(new THREE.Vector3(0, 0, 1), -min.z),
        new THREE.Plane(new THREE.Vector3(0, 0, -1), max.z),
    ];
}