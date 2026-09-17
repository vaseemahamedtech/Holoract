import { useThree, useFrame } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';

const CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
];

interface HolographicHandProps {
  landmarks: any[] | null;
}

export function HolographicHand({ landmarks }: HolographicHandProps) {
  const { viewport } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const linesRef = useRef<THREE.LineSegments>(null);

  // Smooth the global Z a bit to prevent jittery depth movement
  const smoothGlobalZ = useRef(0);

  const points = useMemo(() => {
    return new Array(21).fill(0).map(() => new THREE.Vector3());
  }, []);

  const lineGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(CONNECTIONS.length * 2 * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  useFrame(() => {
    if (!landmarks) return;

    // Estimate global Z from wrist and middle MCP, same as we did for the pointer, to shift the whole hand back/forth
    const wrist = landmarks[0];
    const middleMCP = landmarks[9];
    const handScale = Math.hypot(wrist.x - middleMCP.x, wrist.y - middleMCP.y);

    // Calculate the target Z
    const targetZ = (handScale - 0.15) * 30;
    smoothGlobalZ.current += (targetZ - smoothGlobalZ.current) * 0.2;

    for (let i = 0; i < 21; i++) {
      const lm = landmarks[i];

      // MediaPipe coords: X, Y in [0, 1]. Z is relative depth to wrist.
      // Because camera is mirrored (scaleX(-1) on video), we also invert X to match visually.
      const ndcX = -(lm.x * 2 - 1);
      const ndcY = -(lm.y * 2 - 1);

      // For orthographic, NDC translates to world simply by multiplying by viewport size / 2.
      const worldX = ndcX * (viewport.width / 2);
      const worldY = ndcY * (viewport.height / 2);

      // lm.z is relative to wrist, scaling it proportionally to make the 3D depth noticeable.
      // We negate it if needed depending on MediaPipe's exact axis direction (usually -z is towards camera).
      const relativeZ = -lm.z * 20;

      points[i].set(worldX, worldY, smoothGlobalZ.current + relativeZ);

      // Update sphere positions
      if (groupRef.current && groupRef.current.children[i]) {
        groupRef.current.children[i].position.copy(points[i]);
      }
    }

    // Update lines
    if (linesRef.current) {
      const positions = linesRef.current.geometry.attributes.position.array as Float32Array;
      let pIndex = 0;
      for (const [a, b] of CONNECTIONS) {
        positions[pIndex++] = points[a].x;
        positions[pIndex++] = points[a].y;
        positions[pIndex++] = points[a].z;

        positions[pIndex++] = points[b].x;
        positions[pIndex++] = points[b].y;
        positions[pIndex++] = points[b].z;
      }
      linesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  if (!landmarks) return null;

  return (
    <group>
      <group ref={groupRef}>
        {points.map((_, i) => (
          <mesh key={i}>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={0.8} transparent opacity={0.6} />
          </mesh>
        ))}
      </group>
      <lineSegments ref={linesRef} geometry={lineGeometry}>
        <lineBasicMaterial color="#00ffff" transparent opacity={0.4} />
      </lineSegments>
    </group>
  );
}
