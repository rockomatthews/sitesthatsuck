"use client";

/* Minimal R3F scene for the roast page: Chappie from the chest up, idling
   until "chappie-talk-start", then LOOPING the laugh clip — the laugh is his
   talking animation — until "chappie-talk-stop". */

import { useEffect, useMemo, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import * as THREE from "three";

function Talker() {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF("/models/chappie-anim.glb");
  const laugh = useGLTF("/models/chappie-laugh.glb");
  const allClips = useMemo(
    () => [...animations, ...laugh.animations],
    [animations, laugh.animations],
  );
  const { actions } = useAnimations(allClips, group);

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
      if (mesh.isMesh) mesh.frustumCulled = false;
    });
    scene.scale.setScalar(scale);
    scene.position.copy(offset);
  }, [scene, scale, offset]);

  useEffect(() => {
    actions.idle?.reset().fadeIn(0.3).play();
    const start = () => {
      actions.idle?.fadeOut(0.2);
      actions.laugh?.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(0.2).play();
    };
    const stop = () => {
      actions.laugh?.fadeOut(0.3);
      actions.idle?.reset().fadeIn(0.3).play();
    };
    window.addEventListener("chappie-talk-start", start);
    window.addEventListener("chappie-talk-stop", stop);
    return () => {
      window.removeEventListener("chappie-talk-start", start);
      window.removeEventListener("chappie-talk-stop", stop);
    };
  }, [actions]);

  return (
    <group ref={group}>
      <primitive object={scene} />
    </group>
  );
}

export default function TalkingScene() {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ alpha: true, antialias: true }}
      // framed on the upper body — he talks with his shoulders
      camera={{ position: [0, 1.9, 3.2], fov: 30 }}
      style={{ background: "transparent" }}
      onCreated={({ camera, gl }) => {
        camera.lookAt(0, 1.7, 0);
        gl.setClearColor(0x000000, 0);
      }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 4, 3]} intensity={2.2} />
      <directionalLight position={[-4, 2, -3]} intensity={0.7} color="#c9a437" />
      <Talker />
    </Canvas>
  );
}

useGLTF.preload("/models/chappie-anim.glb");
useGLTF.preload("/models/chappie-laugh.glb");
