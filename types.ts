import { Vector3 } from 'three';

export type ParticleTemplate = 'sphere' | 'heart' | 'ring' | 'cube';

export interface HandData {
  present: boolean;
  position: { x: number; y: number; z: number }; // Normalized 0-1
  pinchStrength: number; // 0 (open) to 1 (closed)
  isPinching: boolean;
  rotationVelocity: number; // Angular velocity from circle gesture
}

export interface AppState {
  template: ParticleTemplate;
  particleCount: number;
  sensitivity: number;
  colorTheme: number;
  debugMode: boolean;
}

export interface ParticleUniforms {
  uTime: { value: number };
  uHandPos: { value: Vector3 };
  uPinch: { value: number };
  uColorA: { value: Vector3 };
  uColorB: { value: Vector3 };
  uMix: { value: number }; // For template transition
  uPixelRatio: { value: number };
  uShockwaveTime: { value: number }; // Time since snap (0 = inactive)
  uShockwavePos: { value: Vector3 }; // World position of snap
}