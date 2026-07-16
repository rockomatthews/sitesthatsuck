"use client";

/* The real R3F scene — code-split, client-only via ChappieHero.tsx.

   Chappie idles at a FIXED identity transform (centered, grounded, side-on
   camera). A glTF SkinnedMesh can't be translated/rotated at runtime without
   the skinning shader shattering the verts, so he never moves in 3D — the
   run-across is a CSS translate of the canvas (ChappieHero). Here we just
   crossfade between the idle / run / thriller clips. */

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  useGLTF,
  useAnimations,
  ContactShadows,
  Environment,
  Lightformer,
  Html,
  useProgress,
  AdaptiveDpr,
} from "@react-three/drei";
import * as THREE from "three";

export const RUN_MS = 2000; // must match the CSS slide in ChappieHero

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="mono whitespace-nowrap text-xs uppercase tracking-[0.3em] text-[var(--color-gold)]">
        loading chappie · {Math.round(progress)}%
      </div>
    </Html>
  );
}

function ChappieRunner() {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF("/models/chappie-anim.glb");
  // Extra clips ship as tiny animation-only GLBs (same mixamorig skeleton, so
  // the tracks bind straight onto the main model's bones).
  const laugh = useGLTF("/models/chappie-laugh.glb");
  const allClips = useMemo(
    () => [...animations, ...laugh.animations],
    [animations, laugh.animations],
  );
  const { actions } = useAnimations(allClips, group);
  const backTimer = useRef<number | undefined>(undefined);

  const { scale, offset } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const s = 2.6 / (size.y || 1);
    return {
      scale: s,
      offset: new THREE.Vector3(-center.x * s, -box.min.y * s, -center.z * s),
    };
  }, [scene]);

  useEffect(() => {
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.frustumCulled = false;
      }
    });
    scene.scale.setScalar(scale);
    scene.position.copy(offset);
  }, [scene, scale, offset]);

  // idle by default
  useEffect(() => {
    actions.idle?.reset().fadeIn(0.4).play();
  }, [actions]);

  useEffect(() => {
    function fadeTo(name: string, once = false) {
      const next = actions[name];
      if (!next) return;
      window.clearTimeout(backTimer.current);
      Object.values(actions).forEach((a) => {
        if (a && a !== next && a.isRunning()) a.fadeOut(0.25);
      });
      next.reset();
      next.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, Infinity);
      next.clampWhenFinished = once;
      next.fadeIn(0.25).play();
    }
    function onRun() {
      fadeTo("run");
      backTimer.current = window.setTimeout(() => fadeTo("idle"), RUN_MS - 150);
    }
    function onDance() {
      const dur = actions.thriller?.getClip().duration ?? 3;
      fadeTo("thriller", true);
      backTimer.current = window.setTimeout(
        () => fadeTo("idle"),
        dur * 1000 - 250,
      );
    }
    function onLaugh() {
      const dur = actions.laugh?.getClip().duration ?? 3;
      fadeTo("laugh", true);
      backTimer.current = window.setTimeout(
        () => fadeTo("idle"),
        dur * 1000 - 250,
      );
    }
    window.addEventListener("chappie-run", onRun);
    window.addEventListener("chappie-dance", onDance);
    window.addEventListener("chappie-laugh", onLaugh);
    return () => {
      window.removeEventListener("chappie-run", onRun);
      window.removeEventListener("chappie-dance", onDance);
      window.removeEventListener("chappie-laugh", onLaugh);
      window.clearTimeout(backTimer.current);
    };
  }, [actions]);

  return (
    <group ref={group}>
      <primitive object={scene} />
    </group>
  );
}

/* Camera swings to a front view for idle/dance (Chappie faces you) and to a
   side view only while he's running, so the run reads as a profile sprint.
   The model never rotates — moving the camera is the only safe way to reframe
   a glTF skinned mesh. */
function CameraRig() {
  const mode = useRef<"front" | "side">("front");
  const timer = useRef<number | undefined>(undefined);
  const front = useMemo(() => new THREE.Vector3(0, 1.5, 7.4), []);
  const side = useMemo(() => new THREE.Vector3(7.8, 1.5, 0.7), []);
  const target = useMemo(() => new THREE.Vector3(0, 1.1, 0), []);

  useEffect(() => {
    const onRun = () => {
      mode.current = "side";
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        mode.current = "front";
      }, RUN_MS);
    };
    const onDance = () => {
      window.clearTimeout(timer.current);
      mode.current = "front";
    };
    window.addEventListener("chappie-run", onRun);
    window.addEventListener("chappie-dance", onDance);
    // laugh reads best face-on, same as dance
    window.addEventListener("chappie-laugh", onDance);
    return () => {
      window.removeEventListener("chappie-run", onRun);
      window.removeEventListener("chappie-dance", onDance);
      window.removeEventListener("chappie-laugh", onDance);
      window.clearTimeout(timer.current);
    };
  }, []);

  useFrame((state, dt) => {
    const dest = mode.current === "side" ? side : front;
    const cam = state.camera;
    cam.position.x = THREE.MathUtils.damp(cam.position.x, dest.x, 6, dt);
    cam.position.y = THREE.MathUtils.damp(cam.position.y, dest.y, 6, dt);
    cam.position.z = THREE.MathUtils.damp(cam.position.z, dest.z, 6, dt);
    cam.lookAt(target);
  });
  return null;
}

export default function ChappieScene() {
  const dpr = useMemo<[number, number]>(() => [1, 2], []);
  return (
    <Canvas
      shadows
      dpr={dpr}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 1.5, 7.4], fov: 32 }}
      style={{ background: "transparent" }}
      onCreated={({ camera, gl }) => {
        camera.lookAt(0, 1.1, 0); // starts front-on (idle faces the viewer)
        gl.setClearColor(0x000000, 0);
      }}
    >
      <CameraRig />
      <AdaptiveDpr pixelated />
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[4, 6, 4]}
        intensity={2.4}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-5, 3, -4]} intensity={0.8} color="#8b4a2b" />

      <Suspense fallback={<Loader />}>
        <ChappieRunner />
        <Environment resolution={256}>
          <Lightformer
            intensity={2.6}
            position={[0, 4, 4]}
            scale={[8, 4, 1]}
            color="#faf7ee"
          />
          <Lightformer
            intensity={1.6}
            position={[-4, 1, 2]}
            scale={[4, 6, 1]}
            color="#c9a437"
          />
          <Lightformer
            intensity={1.2}
            position={[4, 2, -3]}
            scale={[4, 6, 1]}
            color="#8b4a2b"
          />
        </Environment>
      </Suspense>

      <ContactShadows
        position={[0, 0, 0]}
        opacity={0.5}
        scale={10}
        blur={2.6}
        far={4}
        color="#000000"
      />
    </Canvas>
  );
}

useGLTF.preload("/models/chappie-anim.glb");
useGLTF.preload("/models/chappie-laugh.glb");
