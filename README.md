# Gesture-Particles-3D ✨
> **Real-Time 3D Particle Simulation Engine** driven by browser-native webcam hand tracking using Google MediaPipe Tasks Vision and Three.js / React Three Fiber.

<div align="center">

  [![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Three.js](https://img.shields.io/badge/Three.js-0.160-black?style=for-the-badge&logo=threedotjs&logoColor=white)](https://threejs.org/)
  [![React Three Fiber](https://img.shields.io/badge/R3F-8.15-2563eb?style=for-the-badge&logo=react&logoColor=white)](https://docs.pmnd.rs/react-three-fiber/)
  [![MediaPipe](https://img.shields.io/badge/Computer_Vision-MediaPipe-0ea5e9?style=for-the-badge&logo=google&logoColor=white)](https://developers.google.com/mediapipe)
  [![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

</div>

---

## 1. Overview
**Gesture-Particles-3D** is an interactive spatial computing web experiment that allows users to manipulate thousands of dynamic 3D particles in real time using natural hand gestures captured via their standard webcam. Powered by **Google MediaPipe Tasks Vision** running in WebAssembly and **Three.js / React Three Fiber** executing custom GLSL shaders, it translates 21 3D hand landmarks into fluid kinematic forces—such as gravitational attraction, pinch compression, and rotational torque—at a steady 60 FPS.

- **Source Code**: [https://github.com/rajdeepbhattacharyya25-pixel/Gesture-Particles-3D](https://github.com/rajdeepbhattacharyya25-pixel/Gesture-Particles-3D)
- **Primary Domain**: Creative WebGL Engineering & Computer Vision

---

## 2. Problem
Standard browser-based computer vision and 3D graphics applications commonly suffer from architectural bottlenecks:
1. **React Re-Render Thrashing**: Continuously updating state at 60 FPS from camera feeds causes the entire React component tree to re-render, leading to garbage collection spikes and severe frame drops.
2. **CPU-Bound Physics Bottlenecks**: Computing physics for thousands of discrete particles on the JavaScript main thread quickly causes thermal throttling and latency.
3. **Hardware Accessibility Barriers**: Spatial interaction traditionally requires expensive, specialized hardware (VR headsets, Leap Motion controllers, depth cameras).

**Gesture-Particles-3D solves this** by utilizing a zero-re-render mutable ref architecture that streams landmark telemetry directly into GPU shader uniforms (`uHandPos`, `uPinch`, `uTime`), enabling standard laptop and desktop webcams to execute fluid 8,000-particle simulations with minimal latency.

---

## 3. Features

### 🖐️ Real-Time Computer Vision Tracking
- **21 3D Landmarks**: High-fidelity detection of wrist, MCP, PIP, and finger tips.
- **GPU Delegate with CPU Fallback**: Automatically tries WebGL/GPU acceleration first via `FilesetResolver`, falling back to CPU mode if hardware acceleration is unavailable.
- **Pinch Strength Kinematics**: Computes real-time Euclidean distance between index tip and thumb tip to modulate particle implosions.

### ⚡ Custom GLSL Particle Shaders
- **8,000 Concurrent GPU Particles**: Particle dynamics (Brownian noise, shockwaves, expansion, turbulence) calculated entirely in parallel vertex and fragment shaders.
- **Dynamic Geometric Templates**: Real-time shape interpolation between Spheres, Spiral Galaxies, Toruses, and Wave Planes.
- **Color Palettes**: Instant switching between chromatic themes (*Neon Nights*, *Golden Hour*, *Matrix*, *Amethyst*).

### 🚀 High-Frequency Architecture
- **Zero-Re-Render Animation Loop**: Video frames and landmark data bypass React Virtual DOM diffing via mutable `useRef` pipes, keeping CPU consumption low and frame pacing smooth.

---

## 4. Interaction & Controls

| Gesture | Physical Action | Particle Response |
| :--- | :--- | :--- |
| **Open Palm Tracking** | Move open hand across camera view | Particles dynamically attract toward hand centroid |
| **Pinch (Thumb + Index)** | Bring thumb and index fingertips together | Particles compress into high-density singularity |
| **Hand Rotation** | Twist or rotate wrist | Introduces vortex rotational velocity into particle field |
| **Theme Toggle** | Tap UI palette buttons | Instantly interpolates GLSL uniform color vectors |
| **Shape Switcher** | Select geometric template | Morphing algorithm re-projects particle targets |

---

## 5. Architecture

```mermaid
flowchart TD
    subgraph Input ["Webcam & Vision Pipeline"]
        Cam["HTML5 Video Stream"]
        MP["MediaPipe Tasks-Vision (WASM / GPU)"]
        Landmarks["21 3D Hand Landmarks"]
    end

    subgraph StateBridge ["Zero-Re-render Bridge"]
        Ref["Mutable React Ref (handDataRef)"]
        Throttle["UI State Throttle (Tracking Badges only)"]
    end

    subgraph Renderer ["GPU Shader Pipeline (R3F / Three.js)"]
        Canvas["WebGL Canvas (Scene.tsx)"]
        Loop["useFrame RequestAnimationFrame (60 FPS)"]
        Uniforms["Shader Uniforms (uHandPos, uPinch, uTime)"]
        GLSL["Vertex & Fragment Shaders (8,000 Particles)"]
    end

    Cam --> MP
    MP --> Landmarks
    Landmarks -->|Every Frame (60 Hz)| Ref
    Landmarks -.->|Significant State Changes| Throttle
    Throttle -.->|Status Pill| Canvas
    Ref --> Loop
    Loop --> Uniforms
    Uniforms --> GLSL
```

---

## 6. Tech Stack

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Computer Vision** | `@mediapipe/tasks-vision` (0.10.14) | Hand landmark detection via WASM/GPU |
| **3D Rendering** | Three.js (0.160), `@react-three/fiber` (8.15) | WebGL scene graph and frame orchestration |
| **Language & Engine** | TypeScript 5.8, React 18.2 | Type-safe application logic |
| **Styling & Icons** | Tailwind CSS, Lucide React (0.344) | Sleek dark UI overlay controls |
| **Build Tooling** | Vite 6.2 | Fast ES module bundling and dev server |

---

## 7. Installation & Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Webcam**: Standard built-in or USB webcam
- **Browser**: Modern Chromium, Firefox, or Safari with WebGL enabled

### Setup Instructions

1. **Clone the repository**:
   ```bash
   git clone https://github.com/rajdeepbhattacharyya25-pixel/Gesture-Particles-3D.git
   cd Gesture-Particles-3D
   ```

2. **Install project dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Launch in browser**:
   Navigate to `http://localhost:5173`. Grant camera permissions when prompted to initiate the hand tracking service.

---

## 8. Performance & Testing

### Performance Benchmarks
- **Target Framerate**: 60 FPS on modern integrated GPUs (Intel Iris Xe, Apple Silicon, Nvidia GTX/RTX).
- **Inference Latency**: MediaPipe HandLandmarker processes video frames in ~12–18ms on GPU delegate.
- **Memory Footprint**: ~65MB total browser heap footprint during active simulation.

### Verification Checklist
- ✅ **Camera Permission Graceful Fallback**: UI displays clear status indicator when awaiting webcam access.
- ✅ **GPU to CPU Automatic Fallback**: If WebGL delegate fails, service catches exception and falls back to CPU cleanly.
- ✅ **Pinch Trigger Threshold**: Pinch state reliably triggers when Euclidean landmark distance between tip 4 and 8 drops below normalized threshold.

---

## 9. Roadmap
- [ ] **Dual-Hand Mechanics**: Support two hands for dual attractor/repulsor interactions.
- [ ] **Custom 3D Mesh Particle Clouds**: Import custom `.obj` or `.gltf` models to disintegrate and reform as particle fields.
- [ ] **Web Audio Synthesizer**: Modulate ambient synthesizer pitch and frequency using particle velocity and pinch dynamics.
- [ ] **WebXR Integration**: Immersive passthrough and hand tracking for Apple Vision Pro and Meta Quest.

---

## 10. Credits & Acknowledgements
- [Google MediaPipe Team](https://developers.google.com/mediapipe) for the open-source HandLandmarker vision models.
- [Poimandres](https://github.com/pmndrs) for React Three Fiber and the Drei ecosystem.
- [Three.js](https://threejs.org/) community for WebGL shader patterns.
- Engineered by [Rajdeep Bhattacharyya](https://github.com/rajdeepbhattacharyya25-pixel).
