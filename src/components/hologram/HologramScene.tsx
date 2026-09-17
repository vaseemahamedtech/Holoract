import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface HologramSceneProps {
  targetRotation: { x: number; y: number; z: number };
  targetScale: number;
  autoRotate: boolean;
  autoRotateSpeed: number;
  modelType: number;
}

/* ================= SHADERS ================= */

const hologramVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vViewPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const hologramFragmentShader = `
  uniform float time;
  uniform vec3 glowColor;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vViewPosition;
  void main() {
    vec3 viewDir = normalize(vViewPosition);
    float fresnel = 1.0 - abs(dot(viewDir, vNormal));
    fresnel = pow(fresnel, 1.3);

    float scanline = sin(vPosition.y * 40.0 + time * 4.0) * 0.5 + 0.5;
    scanline = smoothstep(0.35, 0.7, scanline);

    float edgeGlow = fresnel * 1.4;
    float alpha = 0.45 + edgeGlow * 0.6 + scanline * 0.15;

    vec3 finalColor = glowColor * (1.0 + edgeGlow * 0.4);
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

const DAMPING = 0.08;
const SCALE_DAMPING = 0.1;

/* ================= MODEL 2 ================= */
/* ENERGY SPINDLE (Procedural Sci-Fi Object) */

function EnergySpindle({ material }: { material: THREE.ShaderMaterial }) {
  const ring = useMemo(
    () => new THREE.TorusGeometry(0.7, 0.04, 16, 64),
    []
  );

  return (
    <group>
      <mesh
        geometry={new THREE.CapsuleGeometry(0.35, 1.4, 8, 16)}
        material={material}
      />
      {[-0.6, 0, 0.6].map((y, i) => (
        <mesh
          key={i}
          geometry={ring}
          material={material}
          rotation={[Math.PI / 2, 0, 0]}
          position={[0, y, 0]}
        />
      ))}
    </group>
  );
}

/* ================= MODEL 3 ================= */
/* HOLOGRAM-CORRECT PROCEDURAL FISH */

function BioFish({ material }: { material: THREE.ShaderMaterial }) {
  const fishRef = useRef<THREE.Group>(null);

  // Long horizontal body (good hologram silhouette)
  const bodyGeometry = useMemo(
    () => new THREE.CapsuleGeometry(0.18, 1.2, 6, 12),
    []
  );

  // Flat tail fin
  const tailGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(0.45, 0.25);
    shape.lineTo(0.45, -0.25);
    shape.closePath();
    return new THREE.ShapeGeometry(shape);
  }, []);

  useFrame(({ clock }) => {
    if (!fishRef.current) return;
    const t = clock.elapsedTime;

    // Natural swim motion (bend, not spin)
    fishRef.current.rotation.y = Math.sin(t * 1.5) * 0.25;
    fishRef.current.position.x = Math.sin(t * 0.8) * 0.05;
  });

  return (
    <group ref={fishRef} rotation={[0, Math.PI / 2, 0]}>
      {/* Body */}
      <mesh geometry={bodyGeometry} material={material} />

      {/* Tail */}
      <mesh
        geometry={tailGeometry}
        material={material}
        position={[-0.75, 0, 0]}
        rotation={[0, Math.PI / 2, 0]}
      />
    </group>
  );
}

/* ================= MAIN SCENE ================= */

export function HologramScene({
  targetRotation,
  targetScale,
  autoRotate,
  autoRotateSpeed,
  modelType,
}: HologramSceneProps) {
  const groupRef = useRef<THREE.Group>(null);

  const currentRotation = useRef({ x: 0.4, y: 0.3, z: 0 });
  const currentScale = useRef(targetScale);
  const autoRotOffset = useRef(0);

  const glowColor = useMemo(() => new THREE.Color(0x00ffff), []);

  const cubeGeometry = useMemo(
    () => new THREE.BoxGeometry(1.4, 1.4, 1.4, 2, 2, 2),
    []
  );

  const shaderMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          glowColor: { value: glowColor },
        },
        vertexShader: hologramVertexShader,
        fragmentShader: hologramFragmentShader,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [glowColor]
  );

  useFrame((state, delta) => {
    shaderMaterial.uniforms.time.value = state.clock.elapsedTime;

    if (!groupRef.current) return;

    if (autoRotate) autoRotOffset.current += autoRotateSpeed * delta;

    const gx = targetRotation.x + 0.4;
    const gy = targetRotation.y + 0.3 + autoRotOffset.current;
    const gz = targetRotation.z;

    currentRotation.current.x += (gx - currentRotation.current.x) * DAMPING;
    currentRotation.current.y += (gy - currentRotation.current.y) * DAMPING;
    currentRotation.current.z += (gz - currentRotation.current.z) * DAMPING;

    currentScale.current +=
      (targetScale - currentScale.current) * SCALE_DAMPING;

    groupRef.current.rotation.set(
      currentRotation.current.x,
      currentRotation.current.y,
      currentRotation.current.z
    );
    groupRef.current.scale.setScalar(currentScale.current);
  });

  return (
    <group ref={groupRef}>
      {modelType === 1 && (
        <mesh geometry={cubeGeometry} material={shaderMaterial} />
      )}

      {modelType === 2 && (
        <EnergySpindle material={shaderMaterial} />
      )}

      {modelType === 3 && (
        <BioFish material={shaderMaterial} />
      )}
    </group>
  );
}
