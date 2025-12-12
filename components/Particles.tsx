import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Points, ShaderMaterial, Vector3, BufferGeometry, Float32BufferAttribute } from 'three';
import { PARTICLE_COUNT, VERTEX_SHADER, FRAGMENT_SHADER, THEMES } from '../constants';
import { ParticleTemplate, HandData } from '../types';

interface ParticlesProps {
  handDataRef: React.MutableRefObject<HandData>;
  template: ParticleTemplate;
  themeIndex: number;
}

export const Particles: React.FC<ParticlesProps> = ({ handDataRef, template, themeIndex }) => {
  const pointsRef = useRef<Points>(null);
  const materialRef = useRef<ShaderMaterial>(null);
  const { viewport } = useThree();

  // Store transition state
  const transitionRef = useRef({
    startTime: 0,
    duration: 1.2, // Slightly faster transition
    active: false,
    fromTemplate: 'sphere' as ParticleTemplate,
    toTemplate: 'sphere' as ParticleTemplate
  });

  // Generate geometry data
  const { positionsMap, randoms, sizes } = useMemo(() => {
    const randoms = new Float32Array(PARTICLE_COUNT);
    const sizes = new Float32Array(PARTICLE_COUNT);
    const map: Record<string, Float32Array> = {
      sphere: new Float32Array(PARTICLE_COUNT * 3),
      heart: new Float32Array(PARTICLE_COUNT * 3),
      ring: new Float32Array(PARTICLE_COUNT * 3),
      cube: new Float32Array(PARTICLE_COUNT * 3),
    };

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      randoms[i] = Math.random();
      sizes[i] = Math.random() * 0.5 + 0.5;

      // Sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const r = 4 + Math.random() * 0.5;
      map.sphere[i3] = r * Math.sin(phi) * Math.cos(theta);
      map.sphere[i3+1] = r * Math.sin(phi) * Math.sin(theta);
      map.sphere[i3+2] = r * Math.cos(phi);

      // Heart
      // parametric equations: x=16sin^3t, y=13cost-5cos2t-2cos3t-cos4t
      // spread in 3D thickness
      const t = Math.random() * Math.PI * 2;
      const hScale = 0.25;
      map.heart[i3] = (16 * Math.pow(Math.sin(t), 3)) * hScale;
      map.heart[i3+1] = (13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t)) * hScale;
      map.heart[i3+2] = (Math.random() - 0.5) * 2; // Thickness

      // Ring (Saturn)
      const rRing = 5 + Math.random() * 2;
      const angle = Math.random() * Math.PI * 2;
      map.ring[i3] = rRing * Math.cos(angle);
      map.ring[i3+1] = (Math.random() - 0.5) * 0.5; // Flat y
      map.ring[i3+2] = rRing * Math.sin(angle);

      // Cube
      const cSize = 6;
      map.cube[i3] = (Math.random() - 0.5) * cSize;
      map.cube[i3+1] = (Math.random() - 0.5) * cSize;
      map.cube[i3+2] = (Math.random() - 0.5) * cSize;
    }

    return { positionsMap: map, randoms, sizes };
  }, []);

  // Update Attributes when template changes
  useEffect(() => {
    if (!pointsRef.current) return;
    
    // Start transition
    transitionRef.current.active = true;
    transitionRef.current.startTime = Date.now();
    transitionRef.current.fromTemplate = transitionRef.current.toTemplate; // old 'to' is now 'from'
    transitionRef.current.toTemplate = template;

    // Update 'B' attribute to new target
    const geometry = pointsRef.current.geometry;
    if (geometry && geometry.attributes.aPositionB) {
        (geometry.attributes.aPositionB as any).array.set(positionsMap[template]);
        geometry.attributes.aPositionB.needsUpdate = true;
    }
  }, [template, positionsMap]);

  // Uniforms Ref
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uHandPos: { value: new Vector3(0, 0, 0) },
    uPinch: { value: 0 },
    uColorA: { value: THEMES[0].colorA.clone() },
    uColorB: { value: THEMES[0].colorB.clone() },
    uMix: { value: 0 },
    uPixelRatio: { value: 1 } // Will update in useFrame
  }), []);

  // Update Theme colors
  useEffect(() => {
    uniforms.uColorA.value.lerp(THEMES[themeIndex].colorA, 0.1);
    uniforms.uColorB.value.lerp(THEMES[themeIndex].colorB, 0.1);
  }, [themeIndex, uniforms]);

  useFrame((state) => {
    if (!materialRef.current || !pointsRef.current) return;

    const time = state.clock.getElapsedTime();
    const hand = handDataRef.current;
    
    // Update Uniforms
    materialRef.current.uniforms.uTime.value = time;
    materialRef.current.uniforms.uPixelRatio.value = viewport.dpr;

    // Map Hand Coordinates (0..1) to World Coordinates
    // Viewport width/height at z=0 is approximate usage here
    const wx = (hand.position.x - 0.5) * viewport.width;
    const wy = (hand.position.y - 0.5) * viewport.height;
    // Map Z (depth) roughly. MediaPipe Z is relative.
    const wz = hand.position.z * 5; 

    // Smooth hand position
    const targetHandPos = new Vector3(wx, wy, wz);
    // If hand not present, move attractor far away
    if (!hand.present) {
      targetHandPos.set(1000, 1000, 1000);
    }
    
    // Lerp current uniform value to target (smooth movement)
    materialRef.current.uniforms.uHandPos.value.lerp(targetHandPos, 0.1);

    // Pinch strength
    const targetPinch = hand.present ? hand.pinchStrength : 0;
    materialRef.current.uniforms.uPinch.value += (targetPinch - materialRef.current.uniforms.uPinch.value) * 0.1;

    // Handle Transition
    if (transitionRef.current.active) {
      const elapsed = (Date.now() - transitionRef.current.startTime) / 1000;
      const progress = Math.min(elapsed / transitionRef.current.duration, 1.0);
      
      // Pass linear progress to shader for custom easing effects
      materialRef.current.uniforms.uMix.value = progress;

      if (progress >= 1.0) {
        transitionRef.current.active = false;
        // Commit change: B becomes A
        const geometry = pointsRef.current.geometry;
        if (geometry && geometry.attributes.aPositionA) {
             (geometry.attributes.aPositionA as any).array.set(positionsMap[transitionRef.current.toTemplate]);
             geometry.attributes.aPositionA.needsUpdate = true;
             materialRef.current.uniforms.uMix.value = 0;
        }
      }
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-aPositionA"
          count={PARTICLE_COUNT}
          array={positionsMap['sphere']} // Initial state
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aPositionB"
          count={PARTICLE_COUNT}
          array={positionsMap['sphere']} // Initial target
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aRandom"
          count={PARTICLE_COUNT}
          array={randoms}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aSize"
          count={PARTICLE_COUNT}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={VERTEX_SHADER}
        fragmentShader={FRAGMENT_SHADER}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={2}
      />
    </points>
  );
};