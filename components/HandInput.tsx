import React, { useEffect, useRef, useState } from 'react';
import { handTrackingService } from '../services/handTracking';
import { HandData } from '../types';
import { HandLandmarkerResult } from '@mediapipe/tasks-vision';

interface HandInputProps {
  onHandUpdate: (data: HandData) => void;
  onCameraReady?: (ready: boolean) => void;
}

export const HandInput: React.FC<HandInputProps> = ({ onHandUpdate, onCameraReady }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Gesture Tracking Refs
  const historyRef = useRef<{x: number, y: number}[]>([]);
  const lastVelocityRef = useRef(0);

  useEffect(() => {
    let active = true;

    const init = async () => {
      try {
        await handTrackingService.initialize();
        
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: 640, 
            height: 480,
            facingMode: 'user'
          } 
        });
        
        if (!active) {
            stream.getTracks().forEach(t => t.stop());
            return;
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Wait for data to load to avoid "black frame" analysis
          videoRef.current.onloadeddata = () => {
            if (!active) return;
            
            if (onCameraReady) onCameraReady(true);
            videoRef.current?.play();

            // Start the detection loop
            handTrackingService.start(videoRef.current!, (result) => {
                if (!active) return;
                const data = processResults(result);
                onHandUpdate(data);
            });
          };
        }
      } catch (err) {
        console.error("Camera init failed:", err);
        setError("Camera access denied or unavailable");
        if (onCameraReady) onCameraReady(false);
      }
    };

    init();

    return () => {
      active = false;
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [onHandUpdate, onCameraReady]);

  const processResults = (results: HandLandmarkerResult): HandData => {
    // If no hands detected
    if (!results.landmarks || results.landmarks.length === 0) {
        historyRef.current = []; // Reset gesture history
        lastVelocityRef.current = 0;
        return {
            present: false,
            position: { x: 0, y: 0, z: 0 },
            pinchStrength: 0,
            isPinching: false,
            rotationVelocity: 0
        };
    }

    const landmarks = results.landmarks[0];
    
    // Landmark 8 is Index Finger Tip
    // Landmark 4 is Thumb Tip
    const indexTip = landmarks[8];
    const thumbTip = landmarks[4];
    
    // Position: Invert X for mirror effect
    const position = {
        x: 1.0 - indexTip.x, 
        y: 1.0 - indexTip.y,
        z: indexTip.z
    };

    // --- Circular Gesture Detection ---
    let rawRotationVelocity = 0;
    const history = historyRef.current;
    
    // Add current position to history
    history.push({x: position.x, y: position.y});
    if (history.length > 20) history.shift(); // Keep last 20 frames

    if (history.length >= 5) {
        // Calculate centroid of the gesture path
        let cx = 0, cy = 0;
        for (const p of history) { cx += p.x; cy += p.y; }
        cx /= history.length;
        cy /= history.length;

        // Calculate radius from centroid
        const dx = position.x - cx;
        const dy = position.y - cy;
        const radius = Math.sqrt(dx*dx + dy*dy);

        // Only detect rotation if the gesture radius is large enough (> 5% of screen)
        if (radius > 0.05) {
            const prev = history[history.length - 2];
            // Calculate angle change
            const angle = Math.atan2(dy, dx);
            const prevAngle = Math.atan2(prev.y - cy, prev.x - cx);
            
            let dAngle = angle - prevAngle;
            // Fix wrapping (e.g. going from PI to -PI)
            if (dAngle > Math.PI) dAngle -= 2 * Math.PI;
            if (dAngle < -Math.PI) dAngle += 2 * Math.PI;

            // Invert logic: Clockwise finger motion (negative dAngle in screen space) 
            // should usually rotate object Clockwise (negative Y rotation).
            // Screen coordinates: Y is up? 
            // In Three.js: +Y is up.
            // Screen Y: 0 is top (in raw HTML), but we inverted Y in `position` calc above (1.0 - y).
            // So position.y: 0=bottom, 1=top.
            // atan2(y,x): standard math.
            rawRotationVelocity = dAngle;
        }
    }

    // Smooth the velocity
    const alpha = 0.15;
    const smoothedVelocity = lastVelocityRef.current * (1 - alpha) + rawRotationVelocity * alpha;
    lastVelocityRef.current = smoothedVelocity;

    // --- Pinch Detection ---
    const pdx = indexTip.x - thumbTip.x;
    const pdy = indexTip.y - thumbTip.y;
    const pdz = indexTip.z - thumbTip.z;
    const distance = Math.sqrt(pdx*pdx + pdy*pdy + pdz*pdz);
    
    const pinchStrength = Math.max(0, Math.min(1, (0.1 - distance) / 0.08));
    const isPinching = pinchStrength > 0.8;

    return {
        present: true,
        position,
        pinchStrength,
        isPinching,
        rotationVelocity: smoothedVelocity
    };
  };

  return (
    <>
      <video 
        ref={videoRef}
        playsInline
        muted
        autoPlay
        style={{ 
            position: 'absolute', 
            opacity: 0, 
            pointerEvents: 'none',
            zIndex: -1,
            width: '1px',
            height: '1px'
        }}
      />
      {error && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-red-500 bg-black/80 p-4 rounded border border-red-500 font-mono text-sm z-50">
            {error}
        </div>
      )}
    </>
  );
};