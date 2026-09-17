import { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrthographicCamera } from '@react-three/drei';
import { useHandGestures } from './useHandGestures';
import { HandSkeletonOverlay } from './HandSkeletonOverlay';
import { HolographicHand } from './HolographicHand';
import { VirtualScreenOverlay } from './VirtualScreenOverlay';

// Modules
import { MainMenu } from '../modules/MainMenu';
import { MathModule } from '../modules/MathModule';
import { ChemistryModule } from '../modules/ChemistryModule';
import { SolarSystemModule } from '../modules/SolarSystemModule';
import { PaintModule } from '../modules/PaintModule';
import { ModelViewerModule } from '../modules/ModelViewerModule';

type ModuleType = 'menu' | 'math' | 'chem' | 'solar' | 'paint' | 'viewer';

function PointerCursor({ x, y, isPinching, isAtDepth }: { x: number, y: number, isPinching: boolean, isAtDepth: boolean }) {
  // If no tracking, hide cursor
  if (x === 0 && y === 0) return null;

  // Transform NDC [-1, 1] to screen CSS coordinates [0, 100%]
  // The ThreeJS scene mapping depends on camera and NDC
  const left = `${(x + 1) / 2 * 100}%`;
  const top = `${(-y + 1) / 2 * 100}%`;

  return (
    <div
      className="absolute z-50 pointer-events-none rounded-full transition-transform duration-75"
      style={{
        left, top,
        width: 32, height: 32,
        marginLeft: -16, marginTop: -16,
        backgroundColor: isPinching ? 'rgba(255, 100, 0, 0.9)' : (isAtDepth ? 'rgba(34, 211, 238, 0.9)' : 'rgba(34, 211, 238, 0.3)'),
        border: isPinching ? '3px solid rgb(255, 100, 0)' : '3px solid rgb(34, 211, 238)',
        boxShadow: isPinching ? '0 0 20px rgb(255,100,0)' : (isAtDepth ? '0 0 20px rgb(34,211,238)' : '0 0 10px rgb(34,211,238)'),
        transform: isPinching ? 'scale(0.8)' : 'scale(1)'
      }}
    />
  );
}

export function HologramViewer() {
  const [activeModule, setActiveModule] = useState<ModuleType>('menu');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [handEnabled, setHandEnabled] = useState(false);
  const [cameraStatus, setCameraStatus] = useState<string>('idle');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [showLaptopPreview, setShowLaptopPreview] = useState(true);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [touchThreshold, setTouchThreshold] = useState<number>(0);
  // Space key toggles ALL overlays (controls, back button, pointer cursor)
  const [overlayVisible, setOverlayVisible] = useState(true);

  const toggleOverlay = useCallback(() => setOverlayVisible(v => !v), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        // Always prevent default so Space never accidentally clicks a focused button
        // (e.g. "Disable Tracking") regardless of which element has focus.
        e.preventDefault();
        e.stopPropagation();
        toggleOverlay();
      }
      // R key = safe reload (emergency recovery if any module goes blank/crashes)
      if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        window.location.reload();
      }
    };
    window.addEventListener('keydown', onKey, { capture: true });
    return () => window.removeEventListener('keydown', onKey, { capture: true });
  }, [toggleOverlay]);

  // Hand gesture state
  const { x: pointerX, y: pointerY, z: pointerZ, isPinching, isIronMan, isAtDepth, landmarks } = useHandGestures(videoRef.current, handEnabled, touchThreshold);

  const getDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setDevices(videoDevices);
      if (!selectedDeviceId && videoDevices.length > 0) {
        setSelectedDeviceId(videoDevices[0].deviceId);
      }
    } catch (err) {
      console.error("Error listing devices", err);
    }
  };

  useEffect(() => { getDevices(); }, []);

  const startCamera = async (deviceIdToUse?: string) => {
    setCameraStatus('loading');
    if (!videoRef.current) return;

    // Stop previous stream
    if (videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }

    const finalId = deviceIdToUse || selectedDeviceId;
    const constraints: MediaStreamConstraints = {
      video: finalId && finalId !== '' ? { deviceId: { exact: finalId } } : true
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoRef.current.srcObject = stream;
      videoRef.current.muted = true;
      videoRef.current.playsInline = true;
      await videoRef.current.play().catch(e => console.log(e));
      setHandEnabled(true);

      const devices = await navigator.mediaDevices.enumerateDevices();
      setDevices(devices.filter(d => d.kind === 'videoinput'));
    } catch (err) {
      console.error("Camera failed", err);
      setCameraStatus('error');
      setHandEnabled(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setHandEnabled(false);
    setCameraStatus('idle');
  };

  const handleDeviceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    setSelectedDeviceId(newId);
    if (handEnabled) startCamera(newId);
  };

  const getStatusMessage = () => {
    switch (cameraStatus) {
      case 'loading': return 'Connecting...';
      case 'error': return 'Camera Error';
      case 'idle': return 'Camera Off';
      default: return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black overflow-hidden flex items-center justify-center font-sans">
      <div className="absolute inset-0 z-50 pointer-events-none" style={{ transform: 'scaleX(-1)' }}>
        {handEnabled && (
          <PointerCursor x={pointerX} y={pointerY} isPinching={isPinching} isAtDepth={isAtDepth} />
        )}
      </div>

      {/* 3D Projection Layer */}
      <div className="w-full h-full relative z-0" style={{ transform: 'scaleX(-1)' }}>
        <Canvas gl={{ antialias: true, alpha: true }}>
          {/* Use fairly wide view so (-1, 1) pointer coords align nicely */}
          <OrthographicCamera makeDefault position={[0, 0, 10]} zoom={100} near={0.1} far={1000} />

          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 10]} intensity={1} />

          {handEnabled && overlayVisible && (
            <HolographicHand landmarks={landmarks} />
          )}

          {activeModule === 'menu' && (
            <MainMenu
              pointerX={pointerX}
              pointerY={pointerY}
              pointerZ={pointerZ}
              isPinching={isPinching}
              isAtDepth={isAtDepth}
              onSelect={(mod: ModuleType) => setActiveModule(mod)}
            />
          )}

          {activeModule === 'math' && (
            <MathModule
              pointerX={pointerX}
              pointerY={pointerY}
              pointerZ={pointerZ}
              isPinching={isPinching}
              isAtDepth={isAtDepth}
              onBack={() => setActiveModule('menu')}
            />
          )}

          {activeModule === 'chem' && (
            <ChemistryModule
              pointerX={pointerX}
              pointerY={pointerY}
              pointerZ={pointerZ}
              isPinching={isPinching}
              isAtDepth={isAtDepth}
              onBack={() => setActiveModule('menu')}
            />
          )}

          {activeModule === 'solar' && (
            <SolarSystemModule
              pointerX={pointerX}
              pointerY={pointerY}
              pointerZ={pointerZ}
              isPinching={isPinching}
              isAtDepth={isAtDepth}
              onBack={() => setActiveModule('menu')}
            />
          )}

          {activeModule === 'paint' && (
            <PaintModule
              pointerX={pointerX}
              pointerY={pointerY}
              pointerZ={pointerZ}
              isPinching={isPinching}
              isAtDepth={isAtDepth}
              onBack={() => setActiveModule('menu')}
            />
          )}

          {activeModule === 'viewer' && (
            <ModelViewerModule
              pointerX={pointerX}
              pointerY={pointerY}
              pointerZ={pointerZ}
              isPinching={isPinching}
              isAtDepth={isAtDepth}
              onBack={() => setActiveModule('menu')}
            />
          )}
        </Canvas>
      </div>

      {/* GUI Layer */}
      {/* Space key hint – always visible but subtle */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
        <span className="text-[10px] text-cyan-900 tracking-widest uppercase select-none">
          Press <kbd className="px-1 py-0.5 border border-cyan-900 rounded text-cyan-700">Space</kbd> to toggle UI
        </span>
      </div>

      <div
        className={`absolute top-4 right-4 z-30 flex flex-col items-end gap-3 transition-opacity duration-300
          ${overlayVisible ? (controlsVisible ? 'opacity-100' : 'opacity-0 hover:opacity-100') : 'opacity-0 pointer-events-none'}`}
      >
        {devices.length > 0 && (
          <div className="flex flex-col items-end gap-1 bg-black/50 p-2 rounded backdrop-blur">
            <label className="text-[10px] text-cyan-400 uppercase tracking-wider font-bold">Select Camera</label>
            <select
              value={selectedDeviceId}
              onChange={handleDeviceChange}
              className="px-2 py-1 bg-black border border-cyan-900 text-cyan-400 text-xs rounded w-48 focus:outline-none focus:border-cyan-400"
            >
              {devices.map(d => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Camera ${d.deviceId.slice(0, 5)}...`}
                </option>
              ))}
            </select>
          </div>
        )}

        {!handEnabled ? (
          <button
            onClick={() => startCamera(selectedDeviceId)}
            className="px-4 py-2 bg-cyan-400 text-black font-bold rounded shadow-[0_0_15px_rgba(34,211,238,0.4)] hover:bg-cyan-300 transition-all"
          >
            {cameraStatus === 'loading' ? 'Connecting...' : 'Enable Tracking'}
          </button>
        ) : (
          <button
            onClick={stopCamera}
            className="px-4 py-2 border border-cyan-400 text-cyan-400 rounded bg-black/50 backdrop-blur hover:bg-cyan-900/30 transition-all font-bold"
          >
            Disable Tracking
          </button>
        )}

        {handEnabled && (
          <label className="flex items-center gap-2 cursor-pointer text-xs text-cyan-400 bg-black/50 p-2 rounded backdrop-blur">
            <input
              type="checkbox"
              checked={showLaptopPreview}
              onChange={(e) => setShowLaptopPreview(e.target.checked)}
              className="accent-cyan-400"
            />
            Show Video Preview
          </label>
        )}

        {/* --- ADDED VIRTUAL SCREEN DEPTH CALIBRATION SLIDER --- */}
        {handEnabled && (
          <div className="flex flex-col gap-1 bg-black/50 p-3 rounded backdrop-blur w-48">
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] text-cyan-400 uppercase tracking-wider font-bold">Virtual Screen Depth</label>
              <span className="text-xs text-cyan-200">{touchThreshold.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="-10"
              max="10"
              step="0.5"
              value={touchThreshold}
              onChange={(e) => setTouchThreshold(parseFloat(e.target.value))}
              className="w-full accent-cyan-400"
            />
            <div className="text-[9px] text-cyan-700 flex justify-between mt-1">
              <span>Further Away</span>
              <span>Closer</span>
            </div>
          </div>
        )}

        <div
          className="relative mt-2 border border-cyan-400 rounded bg-black overflow-hidden shadow-lg shadow-cyan-900/20 transition-all duration-300"
          style={{
            width: 160,
            height: (showLaptopPreview && handEnabled) ? 120 : 0,
            opacity: (showLaptopPreview && handEnabled) ? 1 : 0,
            borderWidth: (showLaptopPreview && handEnabled) ? '1px' : '0px'
          }}
        >
          {cameraStatus !== 'active' && (
            <div className="absolute inset-0 flex items-center justify-center text-[10px] text-cyan-400 z-20 bg-black/80">
              {getStatusMessage()}
            </div>
          )}
          <video
            ref={videoRef}
            muted
            playsInline
            autoPlay
            onPlaying={() => setCameraStatus('active')}
            className="absolute inset-0 object-cover z-10"
            style={{ width: '100%', height: '100%', transform: 'scaleX(-1)' }}
          />

          {/* 2D Virtual Screen Depth Overlay */}
          {handEnabled && cameraStatus === 'active' && (
            <div
              className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center"
            >
              {/* Scale the box based on threshold: closer = bigger. 
                  Base scale (0 threshold) = 80% size. 
                  Threshold range -10 to +10 translates to roughly 50% to 110% size */}
              <div
                className="border-2 border-cyan-400 opacity-60 rounded bg-cyan-400/10 shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all duration-300"
                style={{
                  width: `${80 + (touchThreshold * 3)}%`,
                  height: `${80 + (touchThreshold * 3)}%`,
                  transform: 'scaleX(-1)' // Match camera flip
                }}
              />
            </div>
          )}

          {handEnabled && cameraStatus === 'active' && landmarks && (
            <HandSkeletonOverlay
              landmarks={landmarks}
              video={videoRef.current}
              className="absolute inset-0 z-30 pointer-events-none"
            />
          )}
        </div>
      </div>

      {activeModule !== 'menu' && overlayVisible && (
        <button
          onClick={() => setActiveModule('menu')}
          className="absolute top-4 left-4 z-30 px-4 py-2 bg-cyan-900/50 border border-cyan-400 text-cyan-400 font-bold rounded shadow-[0_0_15px_rgba(34,211,238,0.2)] hover:bg-cyan-800 transition-all backdrop-blur"
        >
          ← Back to Menu
        </button>
      )}
    </div>
  );
}