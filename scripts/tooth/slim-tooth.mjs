/**
 * Writes public/models/tooth-hero.glb: the home page hero's copy of public/models/tooth.glb with only
 * what that scene draws — vertex positions and normals of the tooth, positions of the pulp, and the
 * index buffers. The hero paints the tooth with its own shader materials, so the baked colours, UVs,
 * the surface-zone texture and the glTF materials in tooth.glb are never used there.
 *
 *   npm run model:tooth-hero        (run it again after `npm run model:tooth`)
 *
 * The geometry itself is untouched: the already-quantised vertex data is re-packed with the same
 * meshopt mode (lossless for quantised data), so node transforms and every vertex stay bit-identical.
 */
import { statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS, EXTMeshoptCompression } from "@gltf-transform/extensions";
import { prune } from "@gltf-transform/functions";
import { MeshoptDecoder, MeshoptEncoder } from "meshoptimizer";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const SRC = resolve(ROOT, "public/models/tooth.glb");
const OUT = resolve(ROOT, "public/models/tooth-hero.glb");

await MeshoptDecoder.ready;
await MeshoptEncoder.ready;
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ "meshopt.decoder": MeshoptDecoder, "meshopt.encoder": MeshoptEncoder });

const doc = await io.read(SRC);
const root = doc.getRoot();

for (const mesh of root.listMeshes()) {
  for (const prim of mesh.listPrimitives()) {
    for (const semantic of prim.listSemantics()) {
      if (semantic !== "POSITION" && semantic !== "NORMAL") prim.setAttribute(semantic, null);
    }
    // The hero assigns its own materials; a primitive without one is valid glTF.
    prim.setMaterial(null);
  }
}
for (const material of root.listMaterials()) material.dispose();
// Material extensions (clearcoat, IOR, …) are no longer referenced by anything.
for (const ext of root.listExtensionsUsed()) {
  if (ext.extensionName.startsWith("KHR_materials_")) ext.dispose();
}
await doc.transform(prune());

doc
  .createExtension(EXTMeshoptCompression)
  .setRequired(true)
  .setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.QUANTIZE });

await io.write(OUT, doc);
const kb = (p) => (statSync(p).size / 1024).toFixed(1);
console.log(`tooth-hero.glb: ${kb(OUT)} KB (from tooth.glb ${kb(SRC)} KB)`);
