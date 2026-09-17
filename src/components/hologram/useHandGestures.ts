import { useEffect, useRef, useState } from 'react';

export type GestureState = {
  x: number;
  y: number;
  z: number;
  isPinching: boolean;
  isIronMan: boolean;
  isAtDepth: boolean;
  landmarks: any[] | null;
};

// Base pinch threshold – tuned for typical hand at ~60cm
const PINCH_THRESHOLD = 0.06;

const loadScript = (src: string) =>
  new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject();
    document.head.appendChild(s);
  });

export function useHandGestures(
  video: HTMLVideoElement | null,
  enabled: boolean,
  touchThreshold: number = 0
) {
  const [state, setState] = useState<GestureState>({
    x: 0,
    y: 0,
    z: 0,
    isPinching: false,
    isIronMan: false,
    isAtDepth: false,
    landmarks: null,
  });

  const raf = useRef<number>();
  const handsRef = useRef<any>();

  // Smoothing refs – separate lerp factors per axis
  const smoothX = useRef(0);
  const smoothY = useRef(0);
  const smoothZ = useRef(0);

  // Hysteresis for pinch state to avoid jitter
  const pinchFrames = useRef(0);   // consecutive frames with pinch detected
  const noPinchFrames = useRef(0); // consecutive frames without pinch

  // IronMan hysteresis: require 20 consecutive open-palm frames so a brief
  // finger-spring after a pinch doesn't falsely trigger the gesture.
  const ironManFrames = useRef(0);

  useEffect(() => {
    if (!video || !enabled) return;

    let cancelled = false;

    (async () => {
      await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js');

      const Hands = (window as any).Hands;
      const hands = new Hands({
        locateFile: (f: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`,
      });

      handsRef.current = hands;

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.75,
        minTrackingConfidence: 0.75,
      });

      hands.onResults((res: any) => {
        const lm = res.multiHandLandmarks?.[0];

        setState(prev => {
          if (!lm) {
            pinchFrames.current = 0;
            noPinchFrames.current = 0;
            return { ...prev, isPinching: false, isAtDepth: false, landmarks: null };
          }

          const thumb     = lm[4];
          const index     = lm[8];
          const wrist     = lm[0];
          const middleMCP = lm[9];

          // ── Iron Man: all four fingers extended ───────────────────────
          const indexPIP  = lm[6];
          const middlePIP = lm[10];
          const ringPIP   = lm[14];
          const pinkyPIP  = lm[18];

          const isFingerExtended = (tip: any, pip: any) => {
            const distTip = Math.hypot(tip.x - wrist.x, tip.y - wrist.y);
            const distPip = Math.hypot(pip.x - wrist.x, pip.y - wrist.y);
            return distTip > distPip + 0.02;
          };

          const rawIronMan =
            isFingerExtended(lm[8],  indexPIP)  &&
            isFingerExtended(lm[12], middlePIP) &&
            isFingerExtended(lm[16], ringPIP)   &&
            isFingerExtended(lm[20], pinkyPIP);

          // Require 20 consecutive frames of open palm before flagging IronMan
          if (rawIronMan) ironManFrames.current = Math.min(ironManFrames.current + 1, 20);
          else ironManFrames.current = 0;
          const isIronMan = ironManFrames.current >= 20;

          // ── Hand scale → Z depth ──────────────────────────────────────
          // Use wrist→middleMCP distance as a proxy for hand size in frame.
          // Typical at arm's length ≈ 0.12–0.18; bigger = closer to camera.
          const handScale = Math.hypot(
            wrist.x - middleMCP.x,
            wrist.y - middleMCP.y
          );
          const targetZ = (handScale - 0.15) * 30;

          // Depth hysteresis: easier to stay in than to enter
          const isAtDepth = prev.isAtDepth
            ? targetZ > touchThreshold - 0.8
            : targetZ > touchThreshold;

          // ── Pinch detection ───────────────────────────────────────────
          // Scale threshold with hand size so distance pinch works at any range
          const relativePinchThreshold = PINCH_THRESHOLD * (handScale / 0.15);
          const pinchDistance = Math.hypot(thumb.x - index.x, thumb.y - index.y);
          const rawPinch = pinchDistance < relativePinchThreshold;

          // Require pinch to be active for 2 frames before trusting it,
          // and require it to be gone for 3 frames before releasing.
          // This prevents single-frame glitches from triggering actions.
          if (rawPinch && isAtDepth) {
            pinchFrames.current++;
            noPinchFrames.current = 0;
          } else if (prev.isPinching && rawPinch) {
            // Already pinching — keep counting pinch frames even if depth dropped
            // This prevents Z movement (hand front/back) from breaking an active pinch
            pinchFrames.current++;
            noPinchFrames.current = 0;
          } else {
            noPinchFrames.current++;
            pinchFrames.current = 0;
          }

          let isPinching: boolean;
          if (prev.isPinching) {
            // Already pinching – release only after 3 clear frames (finger actually opened)
            isPinching = noPinchFrames.current < 3;
          } else {
            // Not pinching – start only after 2 confirmed frames AND at depth
            isPinching = pinchFrames.current >= 2 && isAtDepth;
          }

          // ── Pointer position ──────────────────────────────────────────
          // Use index finger tip for pointing
          const rawPointerX = index.x;
          const rawPointerY = index.y;

          // MediaPipe gives [0..1] coords with (0,0) at top-left.
          // Canvas is mirrored (scaleX(-1)), so we flip X.
          // NDC: X in [-1,1] left-to-right, Y in [-1,1] bottom-to-top.
          const targetX = -(rawPointerX * 2 - 1); // flip X for mirror
          const targetY = -(rawPointerY * 2 - 1); // flip Y for screen→NDC

          // Smooth: X/Y use 0.25 lerp (smoother, reduces hand tremor jitter), Z uses 0.12 (slow, depth is noisy)
          smoothX.current += (targetX - smoothX.current) * 0.25;
          smoothY.current += (targetY - smoothY.current) * 0.25;
          smoothZ.current += (targetZ - smoothZ.current) * 0.12;

          return {
            x: smoothX.current,
            y: smoothY.current,
            z: smoothZ.current,
            isPinching,
            isIronMan,
            isAtDepth,
            landmarks: lm,
          };
        });
      });

      const loop = async () => {
        if (cancelled) return;
        try {
          await hands.send({ image: video });
        } catch (e) { /* ignore frame errors */ }
        raf.current = requestAnimationFrame(loop);
      };

      loop();
    })();

    return () => {
      cancelled = true;
      if (raf.current) cancelAnimationFrame(raf.current);
      handsRef.current?.close();
    };
  }, [video, enabled]);

  return state;
}