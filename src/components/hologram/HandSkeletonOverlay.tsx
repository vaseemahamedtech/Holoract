import { useEffect, useRef } from 'react';

const CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
];

interface HandSkeletonOverlayProps {
  landmarks: any[] | null;
  video: HTMLVideoElement | null;
  className?: string;
}

export function HandSkeletonOverlay({
  landmarks,
  video,
  className
}: HandSkeletonOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const landmarksRef = useRef<any[] | null>(null);
  const rafRef = useRef<number>();

  landmarksRef.current = landmarks;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext('2d')!;

    const draw = () => {
      if (!video.videoWidth || !video.videoHeight) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const lm = landmarksRef.current;
      if (lm) {
        const w = canvas.width;
        const h = canvas.height;
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;

        CONNECTIONS.forEach(([a, b]) => {
          const p1 = lm[a];
          const p2 = lm[b];
          ctx.beginPath();
          ctx.moveTo(p1.x * w, p1.y * h);
          ctx.lineTo(p2.x * w, p2.y * h);
          ctx.stroke();
        });

        ctx.fillStyle = '#00ffff';
        lm.forEach(p => {
          ctx.beginPath();
          ctx.arc(p.x * w, p.y * h, 3, 0, Math.PI * 2);
          ctx.fill();
        });
      }
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [video]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none z-40 ${className || ''}`}
      style={{ width: '100%', height: '100%', transform: 'scaleX(-1)' }}
    />
  );
}