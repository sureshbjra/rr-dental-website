/**
 * Signed distance field for a mandibular first molar.
 * Units: millimetres. Axes: x = mesio-distal (mesial −), y = occlusal up, z = bucco-lingual (buccal +).
 * Negative inside, positive outside.
 */

const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
const mix = (a, b, t) => a + (b - a) * t;
const smoothstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

/**
 * Cubic smooth minimum (union) — C2 continuous, so blends don't leave curvature lines in glossy
 * reflections (the common quadratic version is only C1). `k` = blend width; peak offset k/4.
 */
export function smin(a, b, k) {
  const kc = k * 0.25;
  const h = Math.max(6 * kc - Math.abs(a - b), 0) / (6 * kc);
  return Math.min(a, b) - (h * h * h * kc);
}
/** Smooth subtraction: carve b out of a (C2). */
function ssub(a, b, k) {
  return -smin(-a, b, k);
}

function sdEllipsoid(px, py, pz, rx, ry, rz) {
  const k0 = Math.hypot(px / rx, py / ry, pz / rz);
  const k1 = Math.hypot(px / (rx * rx), py / (ry * ry), pz / (rz * rz));
  return k1 === 0 ? -Math.min(rx, ry, rz) : (k0 * (k0 - 1)) / k1;
}

/**
 * Superellipsoid |x/a|^n + |y/b|^n + |z/c|^n = 1 — boxy but curvature-continuous (no reflection bands,
 * unlike a rounded box whose flat faces meet the fillets with a curvature jump).
 * Distance is the first-order estimate (q − 1) / |∇q|. Use n ≥ 3: below that, curvature diverges on the
 * mid-planes and shows up as a kink line in glossy reflections.
 */
function sdSuperEllipsoid(px, py, pz, a, b, c, n) {
  const ux = Math.abs(px / a) + 1e-9, uy = Math.abs(py / b) + 1e-9, uz = Math.abs(pz / c) + 1e-9;
  const sum = ux ** n + uy ** n + uz ** n;
  const q = sum ** (1 / n);
  const k = sum ** (1 / n - 1);
  const gx = (k * ux ** (n - 1)) / a, gy = (k * uy ** (n - 1)) / b, gz = (k * uz ** (n - 1)) / c;
  return (q - 1) / Math.hypot(gx, gy, gz);
}

/** Round cone between spheres (a, r1) and (b, r2) — Inigo Quilez. */
function roundCone(a, b, r1, r2) {
  const bax = b[0] - a[0], bay = b[1] - a[1], baz = b[2] - a[2];
  const l2 = bax * bax + bay * bay + baz * baz;
  const rr = r1 - r2;
  const a2 = l2 - rr * rr;
  const il2 = 1 / l2;
  return (px, py, pz) => {
    const pax = px - a[0], pay = py - a[1], paz = pz - a[2];
    const y = pax * bax + pay * bay + paz * baz;
    const z = y - l2;
    const qx = pax * l2 - bax * y, qy = pay * l2 - bay * y, qz = paz * l2 - baz * y;
    const x2 = qx * qx + qy * qy + qz * qz;
    const y2 = y * y * l2;
    const z2 = z * z * l2;
    const k = Math.sign(rr) * rr * rr * x2;
    if (Math.sign(z) * a2 * z2 > k) return Math.sqrt(x2 + z2) * il2 - r2;
    if (Math.sign(y) * a2 * y2 < k) return Math.sqrt(x2 + y2) * il2 - r1;
    return (Math.sqrt(x2 * a2 * il2) + y * rr) * il2 - r1;
  };
}

// ---------------------------------------------------------------- crown
// [x, y, z, rx, ry, rz]
const CUSPS = [
  [-3.15, 5.95, 2.4, 2.25, 1.95, 2.15], // mesiobuccal
  [0.45, 5.85, 2.7, 2.15, 1.9, 2.1], // distobuccal
  [3.6, 5.5, 1.5, 1.8, 1.65, 1.75], // distal
  [-2.5, 6.35, -2.5, 2.2, 2.05, 2.05], // mesiolingual (tallest)
  [2.3, 6.25, -2.5, 2.1, 2.0, 2.0], // distolingual
];

/** Fissures & developmental grooves as inward surface displacement (follows the surface). */
function grooves(x, y, z) {
  const g = (u, w) => Math.exp(-(u * u) / (w * w));
  const ax = Math.abs(x);
  // Central groove: slight zig-zag mesio-distally across the occlusal table.
  const zc = 0.1 + 0.05 * x + 0.22 * Math.sin(x * 1.15);
  let d = 0.42 * g(z - zc, 0.34) * smoothstep(5.0, 6.3, y) * (1 - smoothstep(4.0, 5.1, ax));
  // Buccal groove: across the occlusal edge and down the buccal face, fading out mid-crown.
  d += 0.3 * g(x + 1.35 - 0.03 * z, 0.27) * smoothstep(0.3, 1.8, z) * smoothstep(3.9, 5.4, y);
  // Distobuccal groove.
  d += 0.22 * g(x - 2.2 - 0.05 * z, 0.24) * smoothstep(0.3, 1.8, z) * smoothstep(4.4, 5.7, y);
  // Lingual groove.
  d += 0.28 * g(x + 0.1, 0.27) * smoothstep(-0.3, -1.8, z) * smoothstep(4.7, 5.9, y);
  return d;
}

function crown(x, y, z) {
  // Cervical taper: crown narrows towards the CEJ, widest at the height of contour.
  const t = mix(0.76, 1.0, smoothstep(-0.9, 4.2, y));
  let d = sdSuperEllipsoid(x / t, y - 3.05, z / t, 5.35, 3.0, 4.95, 3.2) * t;

  for (const c of CUSPS) d = smin(d, sdEllipsoid(x - c[0], y - c[1], z - c[2], c[3], c[4], c[5]), 1.45);

  // Central fossa between the buccal and lingual cusp rows.
  d = ssub(d, sdEllipsoid(x - 0.1, y - 8.45, z + 0.05, 3.7, 1.75, 1.3), 0.9);
  return d + grooves(x, y, z);
}

// ---------------------------------------------------------------- roots
const ROOT_FLATTEN = 1.55; // roots are broad bucco-lingually, narrow mesio-distally
// Each root is one continuous tapered cone, bent by a smooth domain warp (no joints / rings).
const MESIAL = roundCone([-2.35, -1.6, 0], [-3.35, -13.4, 0], 2.05, 0.8);
const DISTAL = roundCone([2.3, -1.6, 0], [3.45, -12.6, 0], 1.95, 0.76);
/** Lateral offset of a root at height y: mesial root bows mesially mid-length and hooks distally at the apex. */
// The bend fades in with a smootherstep onset (zero slope *and* curvature) so it leaves no kink line.
const ease = (t) => t * t * t * (t * (6 * t - 15) + 10);
const onset = (y) => ease(clamp((-2.5 - y) / 4, 0, 1));
function mesialBend(y) {
  const t = clamp((-3 - y) / 10.5, 0, 1);
  return (-0.35 * Math.sin(t * Math.PI) + 0.75 * t * t * t) * onset(y);
}
function distalBend(y) {
  const t = clamp((-3 - y) / 9.6, 0, 1);
  return (0.2 * Math.sin(t * Math.PI) - 0.15 * t * t) * onset(y);
}

function roots(x, y, z) {
  const zs = z / ROOT_FLATTEN;
  const trunkT = mix(0.84, 1.0, smoothstep(-3.8, 0.8, y));
  let d = sdSuperEllipsoid(x / trunkT, y + 1.2, z / trunkT, 3.85, 2.9, 3.75, 3.0) * trunkT; // n ≥ 3 keeps curvature finite on the mid-planes
  const m = MESIAL(x - mesialBend(y), y, zs);
  const di = DISTAL(x - distalBend(y), y, zs);
  d = smin(d, m, 2.0);
  d = smin(d, di, 2.0);
  return d;
}

/** Low-amplitude organic surface variation (keeps it from looking CG-perfect). */
function organic(x, y, z) {
  return (
    0.03 * Math.sin(1.31 * x + 0.53 * y + 2.1) * Math.sin(1.13 * z - 0.37 * y + 0.4) +
    0.012 * Math.sin(0.83 * y + 1.9 * x + 1.3 * z) * Math.sin(1.7 * z - 1.1 * x + 0.6)
  );
}

export function toothSDF(x, y, z) {
  const d = smin(crown(x, y, z), roots(x, y, z), 1.7);
  return d + organic(x, y, z);
}

/** Cemento-enamel junction height: scalloped — dips on buccal/lingual, rises on mesial/distal faces. */
export function cejHeight(x, z) {
  const a = Math.atan2(z, x * 0.9);
  return 0.35 - 0.45 * Math.abs(Math.sin(a)) + 0.75 * Math.cos(a) ** 2;
}

export const BOUNDS = { min: [-7.2, -15.2, -7.0], max: [7.2, 9.6, 7.0] };

export function gradient(x, y, z, e = 1e-3) {
  const gx = toothSDF(x + e, y, z) - toothSDF(x - e, y, z);
  const gy = toothSDF(x, y + e, z) - toothSDF(x, y - e, z);
  const gz = toothSDF(x, y, z + e) - toothSDF(x, y, z - e);
  const l = Math.hypot(gx, gy, gz) || 1;
  return [gx / l, gy / l, gz / l, l / (2 * e)];
}

/**
 * SDF ambient occlusion along the normal. Returns 0 (occluded) … 1 (open).
 * `scale` = |∇f| at the surface: the flattened / bent roots make f under-report distance, so samples are
 * renormalised to true distance — otherwise broad root faces read as falsely occluded.
 */
export function ambientOcclusion(x, y, z, nx, ny, nz, scale = 1) {
  const pass = (step, count, strength) => {
    let occ = 0, w = 1, wsum = 0;
    for (let i = 1; i <= count; i++) {
      const h = step * i;
      const d = toothSDF(x + nx * h, y + ny * h, z + nz * h) / scale;
      occ += (w * Math.max(0, h - d)) / h;
      wsum += w;
      w *= 0.8;
    }
    return clamp(1 - strength * (occ / wsum), 0, 1);
  };
  // fine: fissures & grooves · wide: furcation, cervical waist, between cusps
  return pass(0.12, 5, 1.3) * pass(0.4, 6, 1.6);
}

// ---------------------------------------------------------------- pulp (revealed by the hero's scan)
// Pulp chamber in the crown with horns under each cusp, and a ribbon-shaped canal in each root
// following the same bends as the roots. Kept ≥ ~1 mm inside the outer surface.
const PULP_CANALS = [
  [roundCone([-2.35, -0.6, 0], [-3.2, -12.6, 0], 0.62, 0.16), mesialBend],
  [roundCone([2.3, -0.6, 0], [3.3, -11.8, 0], 0.58, 0.16), distalBend],
];
export function pulpSDF(x, y, z) {
  let d = sdSuperEllipsoid(x * 1.0, y - 2.3, z, 2.75, 1.45, 2.35, 3);
  for (const c of CUSPS) d = smin(d, sdEllipsoid(x - c[0] * 0.58, y - 4.05, z - c[2] * 0.52, 0.55, 1.05, 0.55), 0.6);
  const zs = z / ROOT_FLATTEN;
  for (const [cone, bend] of PULP_CANALS) d = smin(d, cone(x - bend(y), y, zs), 0.9);
  return d;
}
export const PULP_BOUNDS = { min: [-5, -14, -4], max: [5, 6.5, 4] };
