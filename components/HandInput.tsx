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
  const [status, setStatus] = useState<string>("Initializing AI...");
  
  // Gesture Tracking Refs
  const historyRef = useRef<{x: number, y: number}[]>([]);
  const lastVelocityRef = useRef(0);

  useEffect(() => {
    let active = true;

    const initAI = async () => {
      try {
        await handTrackingService.initialize();
      } catch (err) {
        console.error("AI Init Failed:", err);
        if (active) setError("AI Model Failed. Try refreshing.");
        if (onCameraReady) onCameraReady(false);
      }
    };

    const startCamera = async () => {
      if (!active) return;
      
      try {
        setStatus("Starting Camera...");
        // Request camera with minimal constraints to ensure it works on all devices
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true,
          audio: false 
        });
        
        if (!active) {
            stream.getTracks().forEach(t => t.stop());
            return;
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Trigger play immediately
          videoRef.current.play().catch(e => console.error("Play error:", e));
        }
      } catch (err) {
        console.error("Camera init failed:", err);
        if (active) setError("Camera access denied or unavailable.");
        if (onCameraReady) onCameraReady(false);
      }
    };

    initAI().then(() => startCamera());

    return () => {
      active = false;
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [onHandUpdate, onCameraReady]);

  // Handler called when video actually has data to show
  const handleCanPlay = () => {
    setStatus(""); 
    if (onCameraReady) onCameraReady(true);
    
    if (videoRef.current) {
        handTrackingService.start(videoRef.current, (result) => {
            const data = processResults(result);
            onHandUpdate(data);
        });
    }
  };

  const processResults = (results: HandLandmarkerResult): HandData => {
    if (!results.landmarks || results.landmarks.length === 0) {
        historyRef.current = [];
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
    const indexTip = landmarks[8];
    const thumbTip = landmarks[4];
    
    // Invert X for mirror effect
    const position = {
        x: 1.0 - indexTip.x, 
        y: 1.0 - indexTip.y,
        z: indexTip.z
    };

    // Circular Gesture
    let rawRotationVelocity = 0;
    const history = historyRef.current;
    history.push({x: position.x, y: position.y});
    if (history.length > 20) history.shift();

    if (history.length >= 5) {
        let cx = 0, cy = 0;
        for (const p of history) { cx += p.x; cy += p.y; }
        cx /= history.length;
        cy /= history.length;

        const dx = position.x - cx;
        const dy = position.y - cy;
        const radius = Math.sqrt(dx*dx + dy*dy);

        if (radius > 0.05) {
            const prev = history[history.length - 2];
            const angle = Math.atan2(dy, dx);
            const prevAngle = Math.atan2(prev.y - cy, prev.x - cx);
            let dAngle = angle - prevAngle;
            if (dAngle > Math.PI) dAngle -= 2 * Math.PI;
            if (dAngle < -Math.PI) dAngle += 2 * Math.PI;
            rawRotationVelocity = dAngle;
        }
    }

    const alpha = 0.15;
    const smoothedVelocity = lastVelocityRef.current * (1 - alpha) + rawRotationVelocity * alpha;
    lastVelocityRef.current = smoothedVelocity;

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
        onCanPlay={handleCanPlay}
        style={{ 
            position: 'absolute', 
            bottom: '20px',
            right: '20px',
            width: '160px',
            height: '120px',
            borderRadius: '12px',
            opacity: 1.0, 
            zIndex: 50,
            transform: 'scaleX(-1)',
            border: '2px solid rgba(255,255,255,0.3)',
            objectFit: 'cover',
            background: '#222' 
        }}
      />
      {status && !error && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-300 bg-black/80 p-4 rounded border border-blue-500/50 font-mono text-sm z-50 animate-pulse">
            {status}
        </div>
      )}
      {error && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-red-500 bg-black/80 p-4 rounded border border-red-500 font-mono text-sm z-50">
            {error}
        </div>
      )}
    </>
  );
};