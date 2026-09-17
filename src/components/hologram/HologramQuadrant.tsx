import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrthographicCamera } from '@react-three/drei';
import { HologramScene } from './HologramScene';
import * as THREE from 'three';

interface HologramQuadrantProps {
  position: 'top' | 'bottom' | 'left' | 'right';
  targetRotation: { x: number; y: number; z: number };
  targetScale: number;
  autoRotate: boolean;
  autoRotateSpeed: number;
  modelType: number;
}

/* ------------------------------------------------ */
/* QUADRANT OPTICAL CONFIG                          */
/* ------------------------------------------------ */

function getQuadrantConfig(position: 'top' | 'bottom' | 'left' | 'right') {
  switch (position) {
    case 'top':
      return {
        cameraPosition: [0, 0, 5] as [number, number, number],
        scaleX: 1,
        scaleY: -1,
        rotationOffset: Math.PI,
      };

    case 'bottom':
      return {
        cameraPosition: [0, 0, 5] as [number, number, number],
        scaleX: 1,
        scaleY: 1,
        rotationOffset: 0,
      };

    case 'left':
      return {
        cameraPosition: [0, 0, 5] as [number, number, number],
        scaleX: 0.85,
        scaleY: -1,
        rotationOffset: Math.PI / 2,
      };

    case 'right':
      return {
        cameraPosition: [0, 0, 5] as [number, number, number],
        scaleX: 0.85,
        scaleY: -1,
        rotationOffset: -Math.PI / 2,
      };

    default:
      return {
        cameraPosition: [0, 0, 5] as [number, number, number],
        scaleX: 1,
        scaleY: 1,
        rotationOffset: 0,
      };
  }
}

/* ------------------------------------------------ */

function LoadingFallback() {
  return (
    <mesh>
      <sphereGeometry args={[0.5, 16, 16]} />
      <meshBasicMaterial
        color={0x00ffff}
        wireframe
        transparent
        opacity={0.5}
      />
    </mesh>
  );
}

export function HologramQuadrant({
  position,
  targetRotation,
  targetScale,
  autoRotate,
  autoRotateSpeed,
  modelType,
}: HologramQuadrantProps) {
  const config = getQuadrantConfig(position);

  const adjustedRotation = {
    x: targetRotation.x,
    y: targetRotation.y + config.rotationOffset,
    z: targetRotation.z,
  };

  return (
    <div
      className="w-full h-full"
      style={{
        transform: `scale(${config.scaleX}, ${config.scaleY})`,
      }}
    >
      <Canvas
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.NoToneMapping,
        }}
        style={{ background: 'transparent' }}
      >
        <OrthographicCamera
          makeDefault
          position={config.cameraPosition}
          zoom={80}
          near={0.1}
          far={1000}
        />

        {/* Minimal hologram lighting */}
        <ambientLight intensity={0.05} />

        <Suspense fallback={<LoadingFallback />}>
          <HologramScene
            targetRotation={adjustedRotation}
            targetScale={targetScale}
            autoRotate={autoRotate}
            autoRotateSpeed={autoRotateSpeed}
            modelType={modelType}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
