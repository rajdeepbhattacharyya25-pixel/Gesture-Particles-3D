import { FilesetResolver, HandLandmarker, HandLandmarkerResult } from "@mediapipe/tasks-vision";

export class HandTrackingService {
  handLandmarker: HandLandmarker | null = null;
  video: HTMLVideoElement | null = null;
  runningMode: "IMAGE" | "VIDEO" = "VIDEO";
  lastVideoTime = -1;
  resultsCallback: ((result: HandLandmarkerResult) => void) | null = null;
  isInitializing = false;

  async initialize() {
    if (this.handLandmarker) return; // Already initialized
    if (this.isInitializing) {
        // Wait for existing initialization
        while(this.isInitializing) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        if (this.handLandmarker) return;
    }

    this.isInitializing = true;
    
    try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
        );
        
        // Try GPU first
        try {
            this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
                    delegate: "GPU"
                },
                runningMode: this.runningMode,
                numHands: 1
            });
            console.log("HandLandmarker initialized on GPU");
        } catch (gpuError) {
            console.warn("GPU initialization failed, falling back to CPU...", gpuError);
            // Fallback to CPU
            this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
                    delegate: "CPU"
                },
                runningMode: this.runningMode,
                numHands: 1
            });
            console.log("HandLandmarker initialized on CPU");
        }

    } catch (e) {
        console.error("HandTrackingService init failed completely", e);
        throw e;
    } finally {
        this.isInitializing = false;
    }
  }

  start(videoElement: HTMLVideoElement, onResults: (result: HandLandmarkerResult) => void) {
    this.video = videoElement;
    this.resultsCallback = onResults;
    if (this.handLandmarker) {
        this.detectLoop();
    } else {
        console.warn("HandLandmarker not initialized yet");
    }
  }

  detectLoop = () => {
    if (this.video && this.handLandmarker) {
      const nowInMs = Date.now();
      if (this.video.currentTime !== this.lastVideoTime && !this.video.paused && !this.video.ended && this.video.readyState >= 2) {
        this.lastVideoTime = this.video.currentTime;
        try {
            const results = this.handLandmarker.detectForVideo(this.video, nowInMs);
            if (this.resultsCallback) {
              this.resultsCallback(results);
            }
        } catch (e) {
            console.error("Detection error:", e);
        }
      }
    }
    requestAnimationFrame(this.detectLoop);
  };
}

export const handTrackingService = new HandTrackingService();