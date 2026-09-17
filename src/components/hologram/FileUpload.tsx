import { useCallback, useEffect, useRef, useState } from 'react';
import { Upload } from 'lucide-react';

interface FileUploadProps {
  onFileLoad: (url: string, fileName: string) => void;
}

export function FileUpload({ onFileLoad }: FileUploadProps) {
  const [visible, setVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastMouseRef = useRef<{ x: number; y: number } | null>(null);
  const lastDistanceRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);

  const clearHideTimer = () => {
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  const scheduleHide = (ms = 1200) => {
    clearHideTimer();
    hideTimerRef.current = window.setTimeout(() => setVisible(false), ms);
  };

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      const x = e.clientX;
      const y = e.clientY;

      const container = containerRef.current;
      if (!container) {
        lastMouseRef.current = { x, y };
        return;
      }

      const rect = container.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      const dx = x - (lastMouseRef.current?.x ?? x);
      const dy = y - (lastMouseRef.current?.y ?? y);
      const moveLen = Math.hypot(dx, dy);

      // Vector from mouse -> center of button
      const vx = cx - x;
      const vy = cy - y;
      const dist = Math.hypot(vx, vy);

      // dot product between movement vector and vector-to-center
      const dot = dx * vx + dy * vy;

      // Thresholds to avoid noise
      const MIN_MOVE = 4; // px
      const MAX_DISTANCE = 700; // px - only trigger when reasonably near

      const isMovingTowards = moveLen > MIN_MOVE && dot > 0 && dist < MAX_DISTANCE;

      // Also check distance is decreasing
      const lastDist = lastDistanceRef.current;
      const isGettingCloser = lastDist == null ? true : dist < lastDist;

      if (isMovingTowards && isGettingCloser) {
        setVisible(true);
        clearHideTimer();
        scheduleHide(1200);
      }

      lastDistanceRef.current = dist;
      lastMouseRef.current = { x, y };
    }

    window.addEventListener('mousemove', onMouseMove);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      clearHideTimer();
    };
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validExtensions = ['.glb', '.gltf'];
    const fileName = file.name.toLowerCase();
    const isValid = validExtensions.some(ext => fileName.endsWith(ext));

    if (!isValid) {
      alert('Please upload a .glb or .gltf file');
      return;
    }

    const url = URL.createObjectURL(file);
    onFileLoad(url, file.name);
  }, [onFileLoad]);

  return (
    <div
      ref={containerRef}
      className={`fixed top-4 right-4 z-20 transition-all duration-300 transform ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}
      onMouseEnter={() => { setVisible(true); clearHideTimer(); }}
      onMouseLeave={() => scheduleHide()}
      aria-hidden={!visible}
    >
      <label 
        className="flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer
                   hologram-border bg-background/80 backdrop-blur-sm
                   hover:bg-primary/10 transition-all duration-300
                   text-sm font-display uppercase tracking-wider text-primary"
      >
        <Upload size={16} className="animate-pulse-glow" />
        <span>Upload Model</span>
        <input
          type="file"
          accept=".glb,.gltf"
          onChange={handleFileChange}
          className="hidden"
          onFocus={() => { setVisible(true); clearHideTimer(); }}
          onBlur={() => scheduleHide()}
        />
      </label>
    </div>
  );
}
