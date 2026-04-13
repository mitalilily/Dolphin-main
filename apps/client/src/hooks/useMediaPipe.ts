import { useEffect, useRef, useState } from "react";
import { FaceDetection } from "@mediapipe/face_detection";
import { Camera } from "@mediapipe/camera_utils";

type Box = { xCenter: number; yCenter: number; width: number; height: number };

interface State {
  detected: boolean;
  lowLight: boolean;
  offCenter: boolean;
  faceCovered: boolean;
  boundingBox: Box | null;
  brightness: number;
}

const INITIAL_STATE: State = {
  detected: false,
  lowLight: false,
  offCenter: false,
  faceCovered: false,
  boundingBox: null,
  brightness: 0,
};

export const useMediaPipeFace = () => {
  const webcamRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [state, setState] = useState<State>(INITIAL_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = webcamRef.current;
    if (!video) return;

    // ---------- MediaPipe FaceDetection -----------------
    const detector = new FaceDetection({
      locateFile: (f) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${f}`,
    });
    detector.setOptions({ model: "short", minDetectionConfidence: 0.6 });

    // ---------- Re‑usable off‑screen canvas -------------
    canvasRef.current = document.createElement("canvas");
    canvasRef.current.width = 64;
    canvasRef.current.height = 64;
    const ctx = canvasRef.current.getContext("2d")!;

    // ---------- Debounce helpers -----------------------
    const HIT_TARGET = 4;
    let hit = 0;

    detector.onResults((res) => {
      // ---------- Face & bbox ---------------
      const face = res.detections?.[0];
      const hasFace = !!face;

      if (hasFace) hit++;
      else hit = 0;

      const detected = hit >= HIT_TARGET;
      const box = face?.boundingBox as Box | undefined;

      // ---------- Off‑center & cover checks -------------
      const offCenter =
        !box ||
        box.xCenter < 0.3 ||
        box.xCenter > 0.7 ||
        box.yCenter < 0.3 ||
        box.yCenter > 0.7;
      const faceCovered = !box || box.width < 0.18 || box.height < 0.18;

      // ---------- Brightness sampling -------------------
      ctx.drawImage(video, 0, 0, 64, 64);
      const data = ctx.getImageData(0, 0, 64, 64).data;
      let sum = 0;
      for (let i = 0; i < data.length; i += 4) {
        sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      }
      const brightness = sum / (data.length / 4) / 255;
      const lowLight = brightness < 0.2;

      // ---------- Commit batched state ------------------
      setState({
        detected,
        lowLight,
        offCenter,
        faceCovered,
        boundingBox: box ?? null,
        brightness,
      });
    });

    // ---------- Camera setup ---------------------------
    const cam = new Camera(video, {
      width: 640,
      height: 480,
      onFrame: async () => {
        await detector.send({ image: video });
      },
    });

    cam
      .start()
      .then(() => setIsLoading(false))
      .catch((err) => {
        setError("Camera access error: " + err.message);
        setIsLoading(false);
      });

    return () => {
      cam.stop();
      detector.close();
    };
  }, []);

  return {
    webcamRef,
    ...state,
    setError,
    isLoading,
    error,
  };
};
