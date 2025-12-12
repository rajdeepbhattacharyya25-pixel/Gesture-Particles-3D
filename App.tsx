import React, { useRef, useState, useEffect } from 'react';
import { Scene } from './components/Scene';
import { HandInput } from './components/HandInput';
import { UI } from './components/UI';
import { HandData, ParticleTemplate } from './types';

function App() {
  const [template, setTemplate] = useState<ParticleTemplate>('sphere');
  const [themeIndex, setThemeIndex] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  
  // Use a ref for hand data to avoid re-rendering the React tree on every frame
  // The Particles component will read from this ref in its useFrame loop
  const handDataRef = useRef<HandData>({
    present: false,
    position: { x: 0, y: 0, z: 0 },
    pinchStrength: 0,
    isPinching: false,
    rotationVelocity: 0
  });

  // State to force UI updates only (not 3D updates)
  const [uiHandData, setUiHandData] = useState<HandData>(handDataRef.current);

  const handleHandUpdate = (data: HandData) => {
    // 1. Update the ref for the 3D loop (Fast, no re-render)
    handDataRef.current = data;
    
    // 2. Update UI state occasionally or on significant changes (Optional debounce could go here)
    // For now, we update react state to show "Tracking" badge, but maybe throttle it
    // if performance issues arise. React 18 batching handles this reasonably well.
    if (data.present !== uiHandData.present || data.isPinching !== uiHandData.isPinching) {
       setUiHandData(data);
    }
  };

  return (
    <div className="relative w-full h-full bg-black">
      
      {/* 3D Scene Layer */}
      <div className="absolute inset-0 z-0">
        <Scene 
          handDataRef={handDataRef} 
          template={template} 
          themeIndex={themeIndex}
        />
      </div>

      {/* Input Layer (Invisible Video) */}
      <HandInput 
        onHandUpdate={handleHandUpdate} 
        onCameraReady={setCameraReady}
      />

      {/* UI Overlay Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <UI 
          currentTemplate={template} 
          setTemplate={setTemplate}
          handData={uiHandData}
          themeIndex={themeIndex}
          setThemeIndex={setThemeIndex}
          cameraReady={cameraReady}
        />
      </div>
    </div>
  );
}

export default App;