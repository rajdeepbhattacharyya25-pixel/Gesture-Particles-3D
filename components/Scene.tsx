import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Particles } from './Particles';
import { HandData, ParticleTemplate } from '../types';
import { Group } from 'three';

interface SceneProps {
  handDataRef: React.MutableRefObject<HandData>;
  template: ParticleTemplate;
  themeIndex: number;
}

const SceneRig: React.FC<{ children: React.ReactNode; handDataRef: React.MutableRefObject<HandData> }> = ({ children, handDataRef }) => {
  const groupRef = useRef<Group>(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      if (!handDataRef.current.present) {
        // Auto-rotate when no hand is present
        groupRef.current.rotation.y += delta * 0.1;
      } else {
        // Apply manual rotation from gesture
        // handData.rotationVelocity is approx radians per frame
        // Multiply by a factor to make it responsive but controllable
        // Negative sign aligns finger direction with object rotation intuitively
        groupRef.current.rotation.y -= handDataRef.current.rotationVelocity * 15.0;
      }
    }
  });

  return <group ref={groupRef}>{children}</group>;
};

export const Scene: React.FC<SceneProps> = ({ handDataRef, template, themeIndex }) => {
  return (
    <Canvas
      camera={{ position: [0, 0, 12], fov: 60 }}
      dpr={[1, 2]} // Support high DPI
      gl={{ antialias: false, alpha: false }} // Optimization
    >
      <color attach="background" args={['#050505']} />
      
      <Suspense fallback={null}>
        <SceneRig handDataRef={handDataRef}>
            <Particles 
            handDataRef={handDataRef} 
            template={template} 
            themeIndex={themeIndex}
            />
        </SceneRig>
      </Suspense>

      <ambientLight intensity={0.5} />
    </Canvas>
  );
};