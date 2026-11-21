"use client";

import { Environment, Lightformer, PerformanceMonitor, useGLTF } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  MathUtils,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  NeutralToneMapping,
  Plane,
  ShaderMaterial,
  Vector3,
  type Group,
  type Mesh,
  type PerspectiveCamera,
} from "three";
import { TOOTH_MODEL_URL } from "@/config/models";
import { oravieState } from "@/components/oravie/oravie-state";

/*
 * The Oravie hero: a glossy glass-white molar floating over a holographic pedestal, a comet ring in
 * orbit, rising light motes — and the Dental Care Journey played on the tooth itself as you scroll:
 * decay appears on the crown, the tooth is sliced open to show enamel / dentin / pulp, a cleansing
 * light runs down the canals, the slice closes and the restored tooth sparkles.
 *
 * World units: the tooth is 2.26 tall (crown up). Everything sits in a content box CONTENT_H tall,
 * centred on CONTENT_CY, which the camera rig fits to a box the page lays out in CSS.
 */

const CYAN = new Color("#3ecbff");
const TOOTH_Y = 0.72;
const PEDESTAL_TOP = -0.6;
const CONTENT_CY = 0.4;
const CONTENT_H = 3.1;
const PITCH = 0.035; // camera looks slightly down on the pedestal
// The hero tooth is drawn a little stockier than the anatomical model, like the reference's tooth.
const CHUB: [number, number, number] = [1.4, 0.97, 1.15];

// One scene instance at a time: shared uniforms and the slicing plane live at module scope and are
// written from the frame loop (never during render).
const U = {
  uTime: { value: 0 },
  uIntro: { value: 0 },
  uDecay: { value: 0 },
  uClipC: { value: 5 },
  uSection: { value: 0 },
  uClean: { value: 0 },
  uGleam: { value: 0 },
  uRestore: { value: 0 },
  uRim: { value: CYAN.clone() },
};
const slice = new Plane(new Vector3(0, 0, -1), 5);

const ss = (a: number, b: number, x: number) => {
  const t = MathUtils.clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

const NOISE = /* glsl */ `
  float h3(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float vn(vec3 x){ vec3 i = floor(x); vec3 f = fract(x); f = f*f*(3.0-2.0*f);
    return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x), mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),
               mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x), mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y), f.z); }
  float fbm(vec3 p){ return vn(p)*0.55 + vn(p*2.1)*0.3 + vn(p*4.3)*0.15; }
`;

/** Enamel: glossy blue-white porcelain with a cyan fresnel rim, decay, slice-edge glow and gleam. */
function makeEnamel() {
  const m = new MeshPhysicalMaterial({
    color: "#f3f8ff",
    roughness: 0.1,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    envMapIntensity: 1.45,
    clippingPlanes: [slice],
  });
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vObj;\nvarying vec3 vWorld;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvObj = position;\nvWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    sh.fragmentShader = sh.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        varying vec3 vObj; varying vec3 vWorld;
        uniform float uTime; uniform float uDecay; uniform float uClipC; uniform float uSection; uniform float uGleam; uniform float uRestore;
        uniform vec3 uRim;
        ${NOISE}`
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        diffuseColor.rgb *= mix(vec3(0.8, 0.9, 1.0), vec3(1.0), smoothstep(-0.95, 0.35, vObj.y));
        if (uDecay > 0.001) {   // the noise only runs while decay is on screen
          float crown = smoothstep(0.3, 0.62, vObj.y);
          float spots = smoothstep(0.4, 0.54, fbm(vObj * 3.0 + vec3(1.7, 0.0, 3.1)));
          float dk = clamp(uDecay * crown * spots, 0.0, 1.0);
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.09, 0.075, 0.07), dk * 0.96);
        }`
      )
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
        float fr = pow(1.0 - clamp(dot(normalize(vNormal), normalize(vViewPosition)), 0.0, 1.0), 2.6);
        totalEmissiveRadiance += uRim * fr * (0.6 + 0.5 * uRestore);
        if (uSection > 0.001) {
          float cut = exp(-pow((vWorld.z - uClipC) * 24.0, 2.0)) * uSection;
          totalEmissiveRadiance += vec3(0.45, 0.92, 1.0) * cut * 2.2;
        }
        if (uGleam > 0.001 && uGleam < 0.999) {
          float gp = dot(vObj, normalize(vec3(1.0, 0.8, 0.2)));
          totalEmissiveRadiance += vec3(1.0) * exp(-pow((gp - mix(-1.6, 1.6, uGleam)) * 5.0, 2.0)) * 0.9;
        }`
      );
  };
  m.customProgramCacheKey = () => "oravie-enamel-v2";
  return m;
}

/** Pulp: infected red that pulses, turned to cleansing cyan by a band running down the canals. */
function makePulp() {
  const m = new MeshStandardMaterial({ color: "#d9262b", roughness: 0.5, side: BackSide, clippingPlanes: [slice] });
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vObj;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvObj = position;");
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vObj;\nuniform float uTime;\nuniform float uClean;")
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        float bandY = mix(1.15, -1.15, uClean);
        float dd = vObj.y - bandY;
        float cleaned = smoothstep(-0.02, 0.06, dd) * step(0.001, uClean);
        vec3 infected = vec3(0.86, 0.09, 0.12) * (0.82 + 0.18 * sin(uTime * 5.0));
        vec3 healed = vec3(0.3, 0.88, 1.0);
        diffuseColor.rgb = mix(infected, healed, cleaned);`
      )
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
        float band = exp(-dd * dd / 0.004) * step(0.001, uClean) * step(uClean, 0.999);
        totalEmissiveRadiance += mix(infected * 0.55, healed * 0.8, cleaned) + vec3(0.7, 1.0, 1.0) * band * 2.5;`
      );
  };
  m.customProgramCacheKey = () => "oravie-pulp-v2";
  return m;
}

function Tooth({ pointer }: { pointer: RefObject<{ x: number; y: number }> }) {
  const { nodes } = useGLTF(TOOTH_MODEL_URL, false, true);
  const tooth = nodes.Tooth as Mesh;
  const pulpNode = nodes.Pulp as Mesh;
  const sc: [number, number, number] = [tooth.scale.x * CHUB[0], tooth.scale.y * CHUB[1], tooth.scale.z * CHUB[2]];

  const lift = useRef<Group>(null);
  const spin = useRef<Group>(null);
  const inside = useRef<Group>(null);
  const tilt = useRef({ x: 0, y: 0 });

  const mats = useMemo(
    () => ({
      enamel: makeEnamel(),
      back: new MeshStandardMaterial({ color: "#f4faff", emissive: "#cfe6ff", emissiveIntensity: 0.4, roughness: 0.6, side: BackSide, clippingPlanes: [slice] }),
      dentin: new MeshStandardMaterial({ color: "#f1c867", emissive: "#e9a93a", emissiveIntensity: 0.45, roughness: 0.7, side: BackSide, clippingPlanes: [slice] }),
      pulp: makePulp(),
    }),
    []
  );
  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    const reduced = oravieState.reduced;
    const intro = reduced ? 1 : oravieState.intro;
    const ie = 1 - Math.pow(1 - intro, 3);
    const j = reduced ? 0 : oravieState.journey;

    // ----- journey → shader state
    const decayK = ss(0.18, 0.34, j) * (1 - ss(0.72, 0.84, j));
    const sectionK = ss(0.42, 0.52, j) * (1 - ss(0.68, 0.78, j));
    const restoreK = ss(0.8, 0.93, j);
    U.uTime.value = t;
    U.uIntro.value = intro;
    U.uDecay.value = decayK;
    U.uSection.value = sectionK;
    U.uClipC.value = sectionK > 0.001 ? MathUtils.lerp(1.4, 0.0, sectionK) : 5;
    U.uClean.value = ss(0.52, 0.66, j);
    U.uGleam.value = MathUtils.clamp((j - 0.82) / 0.14, 0, 1);
    U.uRestore.value = restoreK;
    slice.constant = U.uClipC.value;
    if (inside.current) inside.current.visible = sectionK > 0.001;

    // ----- pose: drop in, float, sway, face front for the slice, tip forward to show the decay
    if (lift.current) {
      const bob = reduced ? 0 : Math.sin(t * 1.1) * 0.045;
      lift.current.position.y = TOOTH_Y + bob + (1 - ie) * 1.7;
      lift.current.scale.setScalar(0.86 + 0.14 * ie);
    }
    if (spin.current) {
      const p = pointer.current ?? { x: 0, y: 0 };
      tilt.current.x += ((reduced ? 0 : p.y * 0.12) - tilt.current.x) * Math.min(1, dt * 2.5);
      tilt.current.y += ((reduced ? 0 : p.x * 0.25) - tilt.current.y) * Math.min(1, dt * 2.5);
      const sway = reduced ? 0.12 : 0.08 + Math.sin(t * 0.32) * 0.3 - (1 - ie) * 1.2;
      const focus = Math.max(sectionK, decayK * 0.6);
      spin.current.rotation.set(
        0.05 + decayK * 0.38 * (1 - sectionK) + tilt.current.x,
        MathUtils.lerp(sway, sectionK > 0 ? 0.0 : -0.3, focus) + tilt.current.y,
        -0.03
      );
    }
  });

  return (
    <group ref={lift} position={[0, TOOTH_Y, 0]}>
      <group ref={spin}>
        <mesh geometry={tooth.geometry} material={mats.enamel} scale={sc} />
        <group ref={inside} visible={false}>
          <mesh geometry={tooth.geometry} material={mats.back} scale={sc} />
          <mesh geometry={tooth.geometry} material={mats.dentin} scale={[sc[0] * 0.87, sc[1] * 0.87, sc[2] * 0.87]} position-y={-0.02} />
          <mesh geometry={pulpNode.geometry} material={mats.pulp} position={[pulpNode.position.x * CHUB[0], pulpNode.position.y * CHUB[1], pulpNode.position.z * CHUB[2]]} scale={[pulpNode.scale.x * CHUB[0], pulpNode.scale.y * CHUB[1], pulpNode.scale.z * CHUB[2]]} />
        </group>
        <Sparkles geometry={tooth.geometry} scale={tooth.scale.x} />
      </group>
    </group>
  );
}

/** Four-point stars scattered over the enamel — they burst and twinkle once the smile is restored. */
function Sparkles({ geometry, scale }: { geometry: BufferGeometry; scale: number }) {
  const geo = useMemo(() => {
    const src = geometry.getAttribute("position");
    const n = 46;
    const pos = new Float32Array(n * 3);
    const seed = new Float32Array(n);
    const v = new Vector3();
    for (let i = 0; i < n; i++) {
      const k = Math.floor(((i * 7919) % 9973) / 9973 * src.count);
      v.fromBufferAttribute(src, k).multiplyScalar(scale * 1.12);
      v.z += 0.08;
      pos.set([v.x, v.y, v.z], i * 3);
      seed[i] = ((i * 37) % 101) / 101;
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new BufferAttribute(seed, 1));
    return g;
  }, [geometry, scale]);

  const mat = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: U,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        vertexShader: /* glsl */ `
          attribute float aSeed; uniform float uTime; uniform float uRestore; varying float vA;
          void main() {
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            float tw = 0.5 + 0.5 * sin(uTime * (2.0 + aSeed * 3.0) + aSeed * 40.0);
            float burst = smoothstep(0.0, 0.25, uRestore) * (1.0 - smoothstep(0.25, 1.0, uRestore));
            vA = uRestore * (0.35 + 0.65 * tw) + burst * 0.8;
            gl_Position = projectionMatrix * mv;
            gl_PointSize = (10.0 + 22.0 * aSeed + burst * 26.0) * vA * (6.0 / -mv.z);
          }`,
        fragmentShader: /* glsl */ `
          varying float vA;
          void main() {
            vec2 c = gl_PointCoord - 0.5;
            float star = max(0.0, 1.0 - abs(c.x) * 14.0 - abs(c.y) * 2.0) + max(0.0, 1.0 - abs(c.y) * 14.0 - abs(c.x) * 2.0);
            float core = max(0.0, 1.0 - length(c) * 5.0);
            float a = clamp(star + core, 0.0, 1.0) * vA;
            if (a < 0.01) discard;
            gl_FragColor = vec4(vec3(0.85, 0.97, 1.0) * a, a);
          }`,
      }),
    []
  );
  useEffect(() => () => {
    geo.dispose();
    mat.dispose();
  }, [geo, mat]);

  return <points geometry={geo} material={mat} renderOrder={3} />;
}

/** The holographic pedestal: two dark metal tiers with glowing rims, a ringed hologram top, a soft
 *  light beam up to the tooth, and a glow pooled on the floor. */
function Pedestal() {
  const mats = useMemo(() => {
    const additive = { transparent: true, depthWrite: false, blending: AdditiveBlending } as const;
    return {
      body: new MeshPhysicalMaterial({ color: "#0b2a4d", metalness: 0.65, roughness: 0.28, clearcoat: 1, envMapIntensity: 1.2 }),
      base: new MeshPhysicalMaterial({ color: "#082039", metalness: 0.7, roughness: 0.32, clearcoat: 0.8, envMapIntensity: 1.1 }),
      rim: new ShaderMaterial({
        uniforms: U,
        ...additive,
        vertexShader: `void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `uniform float uIntro; void main(){ gl_FragColor = vec4(vec3(0.45, 0.9, 1.0) * 1.4 * uIntro, 1.0); }`,
      }),
      halo: new ShaderMaterial({
        uniforms: U,
        ...additive,
        vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalMatrix * normal; vV = -mv.xyz; gl_Position = projectionMatrix * mv; }`,
        fragmentShader: `uniform float uIntro; varying vec3 vN; varying vec3 vV; void main(){ float f = abs(dot(normalize(vN), normalize(vV))); float a = pow(f, 3.0) * 0.9 * uIntro; gl_FragColor = vec4(vec3(0.2, 0.75, 1.0) * a, a); }`,
      }),
      holo: new ShaderMaterial({
        uniforms: U,
        ...additive,
        vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: /* glsl */ `
          uniform float uTime; uniform float uIntro; varying vec2 vUv;
          float ring(float r, float at, float w){ return smoothstep(w, 0.0, abs(r - at)); }
          void main(){
            vec2 p = vUv - 0.5; float r = length(p) * 2.0; float ang = atan(p.y, p.x);
            float open = smoothstep(uIntro * 1.08, uIntro * 1.08 - 0.06, r);
            float a = ring(r, 0.93, 0.02) * 1.1
              + ring(r, 0.74, 0.012) * (0.45 + 0.55 * step(0.0, sin(ang * 28.0 + uTime * 1.2)))
              + ring(r, 0.55, 0.01) * 0.6
              + ring(r, 0.32, 0.012) * (0.5 + 0.5 * step(0.2, sin(ang * 6.0 - uTime * 2.0)))
              + ring(r, fract(uTime * 0.3) * 0.95, 0.04) * (1.0 - fract(uTime * 0.3)) * 0.9
              + (1.0 - smoothstep(0.0, 0.95, r)) * 0.75
              + exp(-r * r * 22.0) * 1.8;
            a *= open * uIntro;
            gl_FragColor = vec4(vec3(0.35, 0.85, 1.0) * a, a);
          }`,
      }),
      beam: new ShaderMaterial({
        uniforms: U,
        ...additive,
        side: DoubleSide,
        vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `uniform float uTime; uniform float uIntro; varying vec2 vUv;
          void main(){ float a = pow(1.0 - vUv.y, 2.0) * 0.42 * (0.7 + 0.3 * sin(vUv.x * 70.0 + uTime * 0.8)) * uIntro;
            gl_FragColor = vec4(vec3(0.3, 0.8, 1.0) * a, a); }`,
      }),
      floor: new ShaderMaterial({
        uniforms: U,
        ...additive,
        vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `uniform float uIntro; varying vec2 vUv;
          void main(){ vec2 p = (vUv - 0.5) * vec2(1.0, 1.7); float d = length(p) * 2.0; float a = pow(max(0.0, 1.0 - d), 2.2) * 0.5 * uIntro;
            gl_FragColor = vec4(vec3(0.15, 0.6, 1.0) * a, a); }`,
      }),
    };
  }, []);
  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats]);

  const y = PEDESTAL_TOP;
  return (
    <group>
      {/* top tier */}
      <mesh position-y={y - 0.07} material={mats.body}>
        <cylinderGeometry args={[1.04, 1.1, 0.13, 96]} />
      </mesh>
      <mesh position-y={y + 0.002} rotation-x={-Math.PI / 2} material={mats.holo}>
        <circleGeometry args={[1.04, 96]} />
      </mesh>
      <mesh position-y={y} rotation-x={Math.PI / 2} material={mats.rim}>
        <torusGeometry args={[1.04, 0.016, 8, 128]} />
      </mesh>
      <mesh position-y={y - 0.14} rotation-x={Math.PI / 2} material={mats.rim}>
        <torusGeometry args={[1.1, 0.01, 8, 128]} />
      </mesh>
      {/* lower tier */}
      <mesh position-y={y - 0.17} material={mats.base}>
        <cylinderGeometry args={[1.42, 1.5, 0.08, 96]} />
      </mesh>
      <mesh position-y={y - 0.13} rotation-x={Math.PI / 2} material={mats.rim}>
        <torusGeometry args={[1.42, 0.02, 8, 160]} />
      </mesh>
      <mesh position-y={y - 0.13} rotation-x={Math.PI / 2} material={mats.halo}>
        <torusGeometry args={[1.42, 0.11, 12, 160]} />
      </mesh>
      <mesh position-y={y - 0.21} rotation-x={Math.PI / 2} material={mats.rim}>
        <torusGeometry args={[1.5, 0.012, 8, 160]} />
      </mesh>
      {/* light beam and floor glow */}
      <mesh position-y={y + 0.75} material={mats.beam}>
        <cylinderGeometry args={[0.8, 0.98, 1.5, 96, 1, true]} />
      </mesh>
      <mesh position-y={y - 0.22} rotation-x={-Math.PI / 2} material={mats.floor}>
        <planeGeometry args={[4.8, 2.9]} />
      </mesh>
    </group>
  );
}

/** A comet of light circling the tooth on a tilted orbit, passing behind it at the top. */
function Orbit() {
  const group = useRef<Group>(null);
  const mats = useMemo(() => {
    const make = (core: boolean) =>
      new ShaderMaterial({
        uniforms: { ...U, uCore: { value: core ? 1 : 0 } },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: /* glsl */ `
          uniform float uTime; uniform float uIntro; uniform float uCore; varying vec2 vUv;
          void main(){
            float head = fract(uTime * 0.075);
            float behind = fract(head - vUv.x);              // 0 at the comet head, growing along the tail
            float tail = exp(-behind * 2.2) + 0.3;
            float a = tail * (uCore > 0.5 ? 1.6 : 0.95) * smoothstep(0.0, 1.0, uIntro);
            vec3 c = mix(vec3(0.25, 0.78, 1.0), vec3(0.85, 0.98, 1.0), exp(-behind * 14.0) * uCore);
            gl_FragColor = vec4(c * a, a);
          }`,
      });
    return { core: make(true), glow: make(false) };
  }, []);
  useEffect(() => () => {
    mats.core.dispose();
    mats.glow.dispose();
  }, [mats]);

  return (
    <group ref={group} position-y={TOOTH_Y + 0.05} rotation-z={0.34}>
      <group rotation-x={-(Math.PI / 2 - 0.42)}>
        <mesh material={mats.core} renderOrder={2}>
          <torusGeometry args={[1.26, 0.022, 8, 220]} />
        </mesh>
        <mesh material={mats.glow} renderOrder={2}>
          <torusGeometry args={[1.26, 0.09, 10, 220]} />
        </mesh>
      </group>
    </group>
  );
}

/** Light motes drifting up through the beam. */
function Motes() {
  const geo = useMemo(() => {
    const n = 140;
    const pos = new Float32Array(n * 3);
    const seed = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const a = (i * 2.399) % (Math.PI * 2);
      const r = 0.35 + ((i * 53) % 97) / 97 * 1.9;
      pos.set([Math.cos(a) * r, ((i * 71) % 89) / 89 * 3.0, Math.sin(a) * r * 0.7], i * 3);
      seed[i] = ((i * 29) % 83) / 83;
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new BufferAttribute(seed, 1));
    return g;
  }, []);
  const mat = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: U,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        vertexShader: /* glsl */ `
          attribute float aSeed; uniform float uTime; uniform float uIntro; varying float vA;
          void main(){
            vec3 p = position;
            p.y = mod(p.y + uTime * (0.08 + aSeed * 0.12), 3.0) - 0.75;
            p.x += sin(uTime * 0.6 + aSeed * 20.0) * 0.06;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            float life = sin(clamp((p.y + 0.75) / 3.0, 0.0, 1.0) * 3.14159);
            vA = life * (0.35 + 0.65 * (0.5 + 0.5 * sin(uTime * 3.0 + aSeed * 50.0))) * uIntro;
            gl_Position = projectionMatrix * mv;
            gl_PointSize = (2.0 + aSeed * 3.5) * (8.0 / -mv.z);
          }`,
        fragmentShader: `varying float vA; void main(){ vec2 c = gl_PointCoord - 0.5; float a = max(0.0, 1.0 - length(c) * 2.0); a = a * a * vA; if (a < 0.01) discard; gl_FragColor = vec4(vec3(0.55, 0.9, 1.0) * a, a); }`,
      }),
    []
  );
  useEffect(() => () => {
    geo.dispose();
    mat.dispose();
  }, [geo, mat]);
  return <points geometry={geo} material={mat} position-y={PEDESTAL_TOP} />;
}

/** Cool clinical studio: a big white soft-box, cyan rims and a cyan bounce from the pedestal. */
function Studio() {
  return (
    <>
      <Environment resolution={256} frames={1} background={false}>
        <color attach="background" args={["#0b2549"]} />
        <Lightformer form="rect" intensity={8} color="#ffffff" position={[-3, 3.5, 3.5]} scale={[5, 3, 1]} target={[0, 0, 0]} />
        <Lightformer form="circle" intensity={10} color="#ffffff" position={[2.2, 3.2, 3]} scale={1.2} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={3} color="#ffffff" position={[0, 1, 5]} scale={[6, 1.2, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={3} color="#e8f6ff" position={[2.5, 4.5, 2]} scale={[3, 1, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={4} color="#3ec8ff" position={[4, 0.5, -2.5]} scale={[1.5, 5, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={5} color="#2a7dff" position={[-4, 0, -2.5]} scale={[1.5, 5, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={1.5} color="#e6f4ff" position={[2, 2, 5]} scale={[3, 3, 1]} target={[0, 0, 0]} />
        <Lightformer form="ring" intensity={2.5} color="#46d0ff" position={[0, -2.5, 0.5]} rotation-x={Math.PI / 2} scale={3} />
      </Environment>
      {/* Two real lights only (each one costs every lit pixel); the environment does the rest. */}
      <ambientLight intensity={0.22} color="#9fc9ff" />
      <directionalLight position={[-4, 5, 4]} intensity={3.6} color="#ffffff" />
      <directionalLight position={[4, 1.5, -3]} intensity={4.4} color="#46c8ff" />
    </>
  );
}

/*
 * Framing. The canvas covers the whole hero; the page marks where the 3D content belongs with an
 * invisible anchor box. The camera moves so the anchor spans CONTENT_H world units and offsets its
 * view so the content centre lands on the anchor's centre — layout stays in CSS.
 */
const TAN_HALF_FOV = Math.tan((15 * Math.PI) / 180);

function Rig({ anchor }: { anchor?: RefObject<HTMLElement | null> }) {
  const get = useThree((s) => s.get);
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);

  useLayoutEffect(() => {
    const update = () => {
      const { camera, gl, invalidate } = get();
      const cam = camera as PerspectiveCamera;
      if (!width || !height) return;
      const box = gl.domElement.getBoundingClientRect();
      const a = anchor?.current?.getBoundingClientRect();
      const ok = a && a.height > 0;
      const aH = ok ? a.height : height;
      const cx = ok ? a.left + a.width / 2 - box.left : width / 2;
      const cy = ok ? a.top + a.height / 2 - box.top : height / 2;
      const d = (CONTENT_H * (height / aH)) / (2 * TAN_HALF_FOV);
      cam.position.set(0, CONTENT_CY + Math.sin(PITCH) * d, Math.cos(PITCH) * d);
      cam.lookAt(0, CONTENT_CY, 0);
      cam.setViewOffset(width, height, width / 2 - cx, height / 2 - cy, width, height);
      cam.updateProjectionMatrix();
      invalidate();
    };
    update();
    const ro = new ResizeObserver(update);
    if (anchor?.current) ro.observe(anchor.current);
    return () => ro.disconnect();
  }, [anchor, get, width, height]);

  return null;
}

function FirstFrame({ onReady }: { onReady?: () => void }) {
  const done = useRef(false);
  useFrame(() => {
    if (done.current) return;
    done.current = true;
    requestAnimationFrame(() => onReady?.());
  });
  return null;
}

export default function OravieToothScene({ onReady, anchor }: { onReady?: () => void; anchor?: RefObject<HTMLElement | null> }) {
  const wrapper = useRef<HTMLDivElement>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const [inView, setInView] = useState(true);
  const [reduced, setReduced] = useState(false);
  // Resolution adapts to the device: start sharp, step down while the frame rate can't keep up.
  const [maxDpr] = useState(() => (typeof window === "undefined" ? 1.5 : Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1.35 : 1.5)));
  const [dpr, setDpr] = useState(maxDpr);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      oravieState.reduced = mq.matches;
      setReduced(mq.matches);
    };
    sync();
    mq.addEventListener("change", sync);

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin: "120px" });
    if (wrapper.current) io.observe(wrapper.current);

    return () => {
      mq.removeEventListener("change", sync);
      window.removeEventListener("pointermove", onMove);
      io.disconnect();
    };
  }, []);

  return (
    <div ref={wrapper} className="absolute inset-0">
      <Canvas
        camera={{ position: [0, CONTENT_CY, 11], fov: 30, near: 0.1, far: 60 }}
        dpr={dpr}
        frameloop={!inView ? "never" : reduced ? "demand" : "always"}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance", toneMapping: NeutralToneMapping, toneMappingExposure: 1.12 }}
        onCreated={({ gl }) => {
          gl.localClippingEnabled = true;
        }}
      >
        <PerformanceMonitor
          factor={1}
          step={0.25}
          flipflops={4}
          onChange={({ factor }) => setDpr(Math.round(MathUtils.lerp(0.75, maxDpr, factor) * 20) / 20)}
          onFallback={() => setDpr(0.75)}
        />
        <Rig anchor={anchor} />
        <Studio />
        <Pedestal />
        <Orbit />
        <Motes />
        <Suspense fallback={null}>
          <Tooth pointer={pointer} />
          <FirstFrame onReady={onReady} />
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload(TOOTH_MODEL_URL, false, true);
