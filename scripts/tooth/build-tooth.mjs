/**
 * Builds public/models/tooth.glb from the molar SDF in ./sdf.mjs.
 *
 *   npm run model:tooth
 *
 * Pipeline: sample SDF → surface nets → analytic SDF normals → baked ambient occlusion + enamel/cementum colour → PBR material
 * (clearcoat, IOR 1.62, roughness/clearcoat zone map) → normal-aware simplify → meshopt + quantize.
 */
import { mkdirSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";
import { Document, NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS, KHRMaterialsClearcoat, KHRMaterialsIOR, KHRMaterialsSpecular, KHRMaterialsUnlit } from "@gltf-transform/extensions";
import { dedup, meshopt, prune } from "@gltf-transform/functions";
import { MeshoptEncoder, MeshoptSimplifier } from "meshoptimizer";
import { ambientOcclusion, BOUNDS, cejHeight, gradient, PULP_BOUNDS, pulpSDF, toothSDF } from "./sdf.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = resolve(ROOT, process.env.TOOTH_OUT ?? "public/models/tooth.glb");

const CELL = Number(process.env.TOOTH_CELL ?? 0.085); // mm — grid resolution
const TARGET_RATIO = Number(process.env.TOOTH_RATIO ?? 0.16); // simplification target
// "medium" keeps 12-bit normals (no banding in glossy enamel highlights); "high" = 8-bit octahedral, smaller.
const MESHOPT_LEVEL = process.env.TOOTH_MESHOPT ?? "medium";
const MM_TO_UNITS = 0.1; // 1 scene unit = 1 cm → tooth ≈ 2.3 units tall

const clamp = (x, a, b) => Math.min(Math.max(x, a), b);
const mix = (a, b, t) => a + (b - a) * t;
const smoothstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const srgbToLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const hex = (h) => [1, 3, 5].map((i) => srgbToLinear(parseInt(h.slice(i, i + 2), 16) / 255));
const mix3 = (a, b, t) => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];

// ------------------------------------------------------------------ 1–2. sample field + surface nets
/** Samples `sdf` on a regular grid and extracts its zero level set with naive surface nets. */
function surfaceNets(sdf, bounds, cell) {
  const [x0, y0, z0] = bounds.min;
  const nx = Math.ceil((bounds.max[0] - x0) / cell) + 1;
  const ny = Math.ceil((bounds.max[1] - y0) / cell) + 1;
  const nz = Math.ceil((bounds.max[2] - z0) / cell) + 1;
  const field = new Float32Array(nx * ny * nz);
  const idx = (i, j, k) => i + nx * (j + ny * k);
  for (let k = 0; k < nz; k++)
    for (let j = 0; j < ny; j++)
      for (let i = 0; i < nx; i++) field[idx(i, j, k)] = sdf(x0 + i * cell, y0 + j * cell, z0 + k * cell);


  // ------------------------------------------------------------------ 2. surface nets
  const cellVert = new Int32Array((nx - 1) * (ny - 1) * (nz - 1)).fill(-1);
  const cidx = (i, j, k) => i + (nx - 1) * (j + (ny - 1) * k);
  const pos = [];
  const CORNERS = [];
  for (let c = 0; c < 8; c++) CORNERS.push([c & 1, (c >> 1) & 1, (c >> 2) & 1]);
  const EDGES = [];
  for (let a = 0; a < 8; a++) for (const b of [1, 2, 4]) if (!(a & b)) EDGES.push([a, a | b]);

  for (let k = 0; k < nz - 1; k++)
    for (let j = 0; j < ny - 1; j++)
      for (let i = 0; i < nx - 1; i++) {
        let mask = 0;
        const v = new Array(8);
        for (let c = 0; c < 8; c++) {
          const [di, dj, dk] = CORNERS[c];
          v[c] = field[idx(i + di, j + dj, k + dk)];
          if (v[c] < 0) mask |= 1 << c;
        }
        if (mask === 0 || mask === 255) continue;
        let sx = 0, sy = 0, sz = 0, n = 0;
        for (const [a, b] of EDGES) {
          if (v[a] < 0 === v[b] < 0) continue;
          const t = v[a] / (v[a] - v[b]);
          const A = CORNERS[a], B = CORNERS[b];
          sx += A[0] + (B[0] - A[0]) * t;
          sy += A[1] + (B[1] - A[1]) * t;
          sz += A[2] + (B[2] - A[2]) * t;
          n++;
        }
        cellVert[cidx(i, j, k)] = pos.length / 3;
        pos.push(x0 + (i + sx / n) * cell, y0 + (j + sy / n) * cell, z0 + (k + sz / n) * cell);
      }

  const tris = [];
  const P = (a) => [pos[a * 3], pos[a * 3 + 1], pos[a * 3 + 2]];
  const d2 = (a, b) => {
    const p = P(a), q = P(b);
    return (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2;
  };
  function quad(a, b, c, d, flip) {
    if (flip) [b, d] = [d, b];
    if (d2(a, c) < d2(b, d)) tris.push(a, b, c, a, c, d);
    else tris.push(a, b, d, b, c, d);
  }
  for (let k = 1; k < nz - 1; k++)
    for (let j = 1; j < ny - 1; j++)
      for (let i = 1; i < nx - 1; i++) {
        const inside = field[idx(i, j, k)] < 0;
        // x-edge
        if (inside !== field[idx(i + 1, j, k)] < 0)
          quad(cellVert[cidx(i, j - 1, k - 1)], cellVert[cidx(i, j, k - 1)], cellVert[cidx(i, j, k)], cellVert[cidx(i, j - 1, k)], inside);
        // y-edge
        if (inside !== field[idx(i, j + 1, k)] < 0)
          quad(cellVert[cidx(i - 1, j, k - 1)], cellVert[cidx(i - 1, j, k)], cellVert[cidx(i, j, k)], cellVert[cidx(i, j, k - 1)], inside);
        // z-edge
        if (inside !== field[idx(i, j, k + 1)] < 0)
          quad(cellVert[cidx(i - 1, j - 1, k)], cellVert[cidx(i, j - 1, k)], cellVert[cidx(i, j, k)], cellVert[cidx(i - 1, j, k)], inside);
      }
  return { pos, tris, dims: [nx, ny, nz] };

}

const t0 = performance.now();
const { pos, tris, dims } = surfaceNets(toothSDF, BOUNDS, CELL);
console.log(`tooth: field ${dims.join("×")}, ${pos.length / 3} verts, ${tris.length / 3} tris (${((performance.now() - t0) / 1000).toFixed(1)}s)`);
const P = (a) => [pos[a * 3], pos[a * 3 + 1], pos[a * 3 + 2]];

// ------------------------------------------------------------------ 3. project, shade, bake
const vCount = pos.length / 3;
const normals = new Float32Array(vCount * 3);
const colors = new Float32Array(vCount * 3);
const uvs = new Float32Array(vCount * 2);

const ROOT_COL = hex("#e6d6ba");
const APEX_COL = hex("#d8c19c");
const CERVICAL_ENAMEL = hex("#f3ebdc");
const MID_ENAMEL = hex("#faf8f3");
const TIP_ENAMEL = hex("#eaf0f5"); // thin, translucent enamel at the cusp tips reads cool
const CROWN_TOP = 8.1;
const DEBUG_MOVES = [];

for (let v = 0; v < vCount; v++) {
  // Positions stay where surface nets put them (within ~CELL/4 of the surface; moving them along the
  // gradient folds vertices in concave areas). Shading attributes are evaluated at the vertex's projection
  // onto the true surface: where the field isn't an exact distance (taper, blends, flattened roots) its
  // gradient drifts with distance from the surface, and sampling off-surface prints the grid into the normals.
  const ox = pos[v * 3], oy = pos[v * 3 + 1], oz = pos[v * 3 + 2];
  let x = ox, y = oy, z = oz;
  for (let it = 0; it < 6; it++) {
    const d = toothSDF(x, y, z);
    if (Math.abs(d) < 1e-5) break;
    const [nx, ny, nz, mag] = gradient(x, y, z);
    const s = d / Math.max(mag, 0.25);
    x -= nx * s; y -= ny * s; z -= nz * s;
  }
  const moved = Math.hypot(x - ox, y - oy, z - oz);
  if (process.env.TOOTH_DEBUG) DEBUG_MOVES.push(moved);
  if (!(moved < CELL)) { x = ox; y = oy; z = oz; } // never jump to a neighbouring surface (e.g. across the furcation)
  const [gx, gy, gz, gmag] = gradient(x, y, z);
  normals.set([gx, gy, gz], v * 3);

  const ao = ambientOcclusion(x, y, z, gx, gy, gz, gmag);
  const cej = cejHeight(x, z);
  const h = y - cej;
  const enamelT = smoothstep(-0.6, 0.6, h);
  const crownT = clamp(h / (CROWN_TOP - cej), 0, 1);
  const enamel =
    crownT < 0.55 ? mix3(CERVICAL_ENAMEL, MID_ENAMEL, smoothstep(0, 0.55, crownT)) : mix3(MID_ENAMEL, TIP_ENAMEL, smoothstep(0.7, 1, crownT));
  const root = mix3(ROOT_COL, APEX_COL, smoothstep(-2, -13, h));
  const base = mix3(root, enamel, enamelT);
  // AO darkens fissures slightly warm (natural staining), never crushes to black.
  const occ = mix(0.42, 1, ao);
  colors.set([base[0] * occ, base[1] * occ * 0.985, base[2] * occ * 0.95 + base[2] * 0.05 * ao], v * 3);

  // v: 0 = apex … 0.5 = CEJ … 1 = cusp tips (drives the roughness / clearcoat zone map)
  const tv = h < 0 ? 0.5 * (1 - Math.min(1, -h / 14)) : 0.5 + 0.5 * Math.min(1, h / (CROWN_TOP - cej));
  uvs.set([0.5, tv], v * 2);
}

if (process.env.TOOTH_DEBUG) {
  const m = DEBUG_MOVES.sort((a, b) => a - b);
  const q = (f) => m[Math.floor(f * (m.length - 1))].toFixed(4);
  console.log(`projection distance mm: p50 ${q(0.5)} p99 ${q(0.99)} p99.9 ${q(0.999)} max ${q(1)}; > CELL: ${m.filter((d) => !(d < CELL)).length}`);
}

// Fix winding to agree with outward SDF normals.
{
  let agree = 0;
  for (let t = 0; t < tris.length; t += 3 * 97) {
    const a = P(tris[t]), b = P(tris[t + 1]), c = P(tris[t + 2]);
    const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], e2 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const fn = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
    const n = tris[t] * 3;
    agree += Math.sign(fn[0] * normals[n] + fn[1] * normals[n + 1] + fn[2] * normals[n + 2]);
  }
  if (agree < 0) for (let t = 0; t < tris.length; t += 3) [tris[t + 1], tris[t + 2]] = [tris[t + 2], tris[t + 1]];
}

// ------------------------------------------------------------------ 3b. simplify (normal-aware, regularised)
// Position-only simplification leaves long slivers across curvature changes (trunk → roots), and normals
// interpolated across slivers read as dashes in glossy reflections. Weighting normals + Regularize avoids it.
await MeshoptSimplifier.ready;
const fullTris = tris.length / 3;
let simplified;
{
  const [out, err] = MeshoptSimplifier.simplifyWithAttributes(
    new Uint32Array(tris),
    new Float32Array(pos),
    3,
    normals,
    3,
    [0.5, 0.5, 0.5],
    null,
    Math.floor(tris.length * TARGET_RATIO / 3) * 3,
    0.01,
    ["Regularize"]
  );
  simplified = out;
  console.log(`simplified ${fullTris} → ${out.length / 3} tris (relative error ${err.toExponential(2)})`);
}
// Compact: keep only referenced vertices.
const remap = new Int32Array(vCount).fill(-1);
let kept = 0;
for (const i of simplified) if (remap[i] < 0) remap[i] = kept++;
const pick = (src, n) => {
  const dst = new Float32Array(kept * n);
  for (let v = 0; v < vCount; v++) if (remap[v] >= 0) for (let c = 0; c < n; c++) dst[remap[v] * n + c] = src[v * n + c];
  return dst;
};
const keptPos = pick(pos, 3), keptNormals = pick(normals, 3), keptColors = pick(colors, 3), keptUvs = pick(uvs, 2);
const keptIndices = simplified.map((i) => remap[i]);

// Centre on the bounding box and convert to scene units.
const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
for (let v = 0; v < kept; v++)
  for (let a = 0; a < 3; a++) {
    mn[a] = Math.min(mn[a], keptPos[v * 3 + a]);
    mx[a] = Math.max(mx[a], keptPos[v * 3 + a]);
  }
const centre = mn.map((m, a) => (m + mx[a]) / 2);
const positions = new Float32Array(kept * 3);
for (let v = 0; v < kept; v++)
  for (let a = 0; a < 3; a++) positions[v * 3 + a] = (keptPos[v * 3 + a] - centre[a]) * MM_TO_UNITS;
console.log(`tooth size (mm): ${mx.map((m, a) => (m - mn[a]).toFixed(1)).join(" × ")}`);

// ------------------------------------------------------------------ 3c. pulp (revealed by the hero scan)
const pulp = surfaceNets(pulpSDF, PULP_BOUNDS, 0.11);
const pulpCount = pulp.pos.length / 3;
const pulpNormals = new Float32Array(pulpCount * 3);
for (let v = 0; v < pulpCount; v++) {
  const [x, y, z] = [pulp.pos[v * 3], pulp.pos[v * 3 + 1], pulp.pos[v * 3 + 2]];
  const e = 1e-3;
  const g = [
    pulpSDF(x + e, y, z) - pulpSDF(x - e, y, z),
    pulpSDF(x, y + e, z) - pulpSDF(x, y - e, z),
    pulpSDF(x, y, z + e) - pulpSDF(x, y, z - e),
  ];
  const l = Math.hypot(...g) || 1;
  pulpNormals.set([g[0] / l, g[1] / l, g[2] / l], v * 3);
}
{
  // winding vs outward normals
  let agree = 0;
  for (let t = 0; t < pulp.tris.length; t += 3 * 13) {
    const q = (i) => [pulp.pos[i * 3], pulp.pos[i * 3 + 1], pulp.pos[i * 3 + 2]];
    const a = q(pulp.tris[t]), b = q(pulp.tris[t + 1]), c = q(pulp.tris[t + 2]);
    const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], e2 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const n = pulp.tris[t] * 3;
    agree += Math.sign((e1[1] * e2[2] - e1[2] * e2[1]) * pulpNormals[n] + (e1[2] * e2[0] - e1[0] * e2[2]) * pulpNormals[n + 1] + (e1[0] * e2[1] - e1[1] * e2[0]) * pulpNormals[n + 2]);
  }
  if (agree < 0) for (let t = 0; t < pulp.tris.length; t += 3) [pulp.tris[t + 1], pulp.tris[t + 2]] = [pulp.tris[t + 2], pulp.tris[t + 1]];
}
const [pulpIdx] = MeshoptSimplifier.simplifyWithAttributes(
  new Uint32Array(pulp.tris), new Float32Array(pulp.pos), 3, pulpNormals, 3, [0.5, 0.5, 0.5], null,
  Math.floor((pulp.tris.length * 0.25) / 3) * 3, 0.01, ["Regularize"]
);
const pulpRemap = new Int32Array(pulpCount).fill(-1);
let pulpKept = 0;
for (const i of pulpIdx) if (pulpRemap[i] < 0) pulpRemap[i] = pulpKept++;
const pulpPositions = new Float32Array(pulpKept * 3), pulpNormalsKept = new Float32Array(pulpKept * 3);
for (let v = 0; v < pulpCount; v++) {
  const r = pulpRemap[v];
  if (r < 0) continue;
  for (let a = 0; a < 3; a++) {
    pulpPositions[r * 3 + a] = (pulp.pos[v * 3 + a] - centre[a]) * MM_TO_UNITS; // same frame as the tooth
    pulpNormalsKept[r * 3 + a] = pulpNormals[v * 3 + a];
  }
}
const pulpIndices = pulpIdx.map((i) => pulpRemap[i]);
console.log(`pulp: ${pulp.tris.length / 3} → ${pulpIndices.length / 3} tris`);

// ------------------------------------------------------------------ 4. surface zone map (R = clearcoat, G = roughness)
function encodePNG(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(zlib.crc32(body));
    return Buffer.concat([len, body, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr.set([8, 6, 0, 0, 0], 8);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
const MAP_W = 4, MAP_H = 128;
const zone = Buffer.alloc(MAP_W * MAP_H * 4);
for (let r = 0; r < MAP_H; r++) {
  const tv = (r + 0.5) / MAP_H;
  const e = smoothstep(0.47, 0.54, tv); // cementum → enamel
  const tip = smoothstep(0.75, 1, tv);
  // Clearcoat only on the crown, fading in above the cervical third (cementum has no mirror layer).
  const clearcoat = smoothstep(0.52, 0.74, tv);
  // matte cementum → satin cervical enamel → glossy crown → slightly glossier cusp tips
  const roughness = mix(0.62, mix(mix(0.34, 0.2, smoothstep(0.52, 0.72, tv)), 0.16, tip), e);
  for (let c = 0; c < MAP_W; c++) zone.set([Math.round(clearcoat * 255), Math.round(roughness * 255), 0, 255], (r * MAP_W + c) * 4);
}

// ------------------------------------------------------------------ 5. glTF document
const doc = new Document();
doc.getRoot().getAsset().generator = "RR Dental tooth builder (SDF)";
const buffer = doc.createBuffer();
const acc = (type, array) => doc.createAccessor().setType(type).setArray(array).setBuffer(buffer);

const zoneTex = doc.createTexture("surface-zones").setImage(encodePNG(MAP_W, MAP_H, zone)).setMimeType("image/png");
const material = doc
  .createMaterial("Enamel")
  .setBaseColorFactor([1, 1, 1, 1])
  .setMetallicFactor(0)
  .setRoughnessFactor(1)
  .setMetallicRoughnessTexture(zoneTex);
const clearcoat = doc
  .createExtension(KHRMaterialsClearcoat)
  .createClearcoat()
  .setClearcoatFactor(1)
  .setClearcoatTexture(zoneTex)
  .setClearcoatRoughnessFactor(0.07);
material.setExtension("KHR_materials_clearcoat", clearcoat);
material.setExtension("KHR_materials_ior", doc.createExtension(KHRMaterialsIOR).createIOR().setIOR(1.62)); // dental enamel
material.setExtension("KHR_materials_specular", doc.createExtension(KHRMaterialsSpecular).createSpecular().setSpecularFactor(1).setSpecularColorFactor([1, 1, 1]));

const prim = doc
  .createPrimitive()
  .setAttribute("POSITION", acc("VEC3", positions))
  .setAttribute("NORMAL", acc("VEC3", keptNormals))
  .setAttribute("COLOR_0", acc("VEC3", keptColors))
  .setAttribute("TEXCOORD_0", acc("VEC2", keptUvs))
  .setIndices(acc("SCALAR", keptIndices))
  .setMaterial(material);
const mesh = doc.createMesh("Tooth").addPrimitive(prim);
const scene = doc.createScene("Scene").addChild(doc.createNode("Tooth").setMesh(mesh));

// Pulp: unlit signal-cyan — only ever seen through the scan's cut.
const pulpMaterial = doc.createMaterial("Pulp").setBaseColorFactor([...hex("#38bdf8"), 1]).setMetallicFactor(0).setRoughnessFactor(1);
pulpMaterial.setExtension("KHR_materials_unlit", doc.createExtension(KHRMaterialsUnlit).createUnlit());
const pulpPrim = doc
  .createPrimitive()
  .setAttribute("POSITION", acc("VEC3", pulpPositions))
  .setAttribute("NORMAL", acc("VEC3", pulpNormalsKept))
  .setIndices(acc("SCALAR", pulpIndices))
  .setMaterial(pulpMaterial);
scene.addChild(doc.createNode("Pulp").setMesh(doc.createMesh("Pulp").addPrimitive(pulpPrim)));

// ------------------------------------------------------------------ 6. optimise + write
await MeshoptEncoder.ready;
await doc.transform(
  dedup(),
  prune(),
  meshopt({ encoder: MeshoptEncoder, level: MESHOPT_LEVEL, quantizePosition: 14, quantizeNormal: 12, quantizeColor: 8, quantizeTexcoord: 10 })
);
const finalPrim = doc.getRoot().listMeshes().find((m) => m.getName() === "Tooth").listPrimitives()[0];
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.encoder": MeshoptEncoder });
mkdirSync(dirname(OUT), { recursive: true });
await io.write(OUT, doc);
console.log(
  `wrote ${OUT}: ${finalPrim.getAttribute("POSITION").getCount()} verts, ${finalPrim.getIndices().getCount() / 3} tris, ` +
    `${(statSync(OUT).size / 1024).toFixed(1)} KB (total ${((performance.now() - t0) / 1000).toFixed(1)}s)`
);
