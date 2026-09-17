import { useState, useRef, Suspense } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useHoloractRaycaster } from '../../hooks/useHoloractRaycaster';
import { Text, useGLTF } from '@react-three/drei';

function HologramMonkey() {
    const { nodes } = useGLTF('/Monkey.glb') as any;
    // Find the first mesh in the GLB (typically works well for Suzanne)
    const monkeyMesh = Object.values(nodes).find((n: any) => n.isMesh) as THREE.Mesh | undefined;
    
    if (!monkeyMesh) return null;

    return (
        <group scale={[1.4, 1.4, 1.4]} rotation={[0, Math.PI, 0]}>
            <mesh geometry={monkeyMesh.geometry}>
                <meshStandardMaterial color="#00ffff" wireframe emissive="#00ffff" emissiveIntensity={0.6} />
            </mesh>
            <mesh geometry={monkeyMesh.geometry} scale={0.95}>
                <meshStandardMaterial color="#00ffff" transparent opacity={0.15} />
            </mesh>
        </group>
    );
}


export function ModelViewerModule({ pointerX, pointerY, pointerZ, isPinching, isAtDepth, onBack }: any) {
    const [rotX, setRotX] = useState(0);
    const [rotY, setRotY] = useState(0);
    const [modelIndex, setModelIndex] = useState(0);

    const wasPinching = useRef(false);
    const lastPointer = useRef({ x: 0, y: 0 });

    const { hoveredObject } = useHoloractRaycaster({ pointerX, pointerY, pointerZ, isPinching });

    useFrame((_state, delta) => {
        // Handle UI clicks
        if (isPinching && !wasPinching.current) {
            const action = hoveredObject.current?.userData?.action;
            if (action === 'back') { if (onBack) onBack(); wasPinching.current = true; return; }
            if (action === 'reset') { setRotX(0); setRotY(0); wasPinching.current = true; return; }
            if (action === 'next') { setModelIndex(i => (i + 1) % 3); wasPinching.current = true; return; }
            
            // Start drag
            lastPointer.current = { x: pointerX, y: pointerY };
        } else if (isPinching && wasPinching.current) {
            // Drag interaction -> rotate model
            const dx = pointerX - lastPointer.current.x;
            const dy = pointerY - lastPointer.current.y;
            setRotY(prev => prev + dx * 6);
            setRotX(prev => prev - dy * 6);
            lastPointer.current = { x: pointerX, y: pointerY };
        } else if (!isPinching) {
            // Idle auto-rotation
            setRotY(prev => prev + delta * 0.4);
            setRotX(prev => prev + delta * 0.15);
        }

        wasPinching.current = isPinching;
    });

    const hoverAction = hoveredObject.current?.userData?.action;

    return (
        <group>
            {/* ═══════════ TOP BAR ═════════════════════════════════ */}
            <mesh position={[-2.5, 3.5, 0]} userData={{ interactable: true, action: 'back' }}>
                <boxGeometry args={[2, 0.7, 0.15]} />
                <meshStandardMaterial
                    color={hoverAction === 'back' && isAtDepth ? '#006688' : '#002233'}
                    emissive="#00ccff"
                    emissiveIntensity={hoverAction === 'back' && isAtDepth ? 1.4 : 0.15}
                />
                <Text position={[0, 0, 0.12]} fontSize={0.26} color="white" anchorX="center" anchorY="middle" font={undefined}>
                    ← Back
                </Text>
            </mesh>

            <mesh position={[0, 3.5, 0]} userData={{ interactable: true, action: 'next' }}>
                <boxGeometry args={[2, 0.7, 0.15]} />
                <meshStandardMaterial
                    color={hoverAction === 'next' && isAtDepth ? '#008800' : '#003300'}
                    emissive="#00ff00"
                    emissiveIntensity={hoverAction === 'next' && isAtDepth ? 1.4 : 0.15}
                />
                <Text position={[0, 0, 0.12]} fontSize={0.26} color="white" anchorX="center" anchorY="middle" font={undefined}>
                    ↻ Next Model
                </Text>
            </mesh>

            <mesh position={[2.5, 3.5, 0]} userData={{ interactable: true, action: 'reset' }}>
                <boxGeometry args={[2, 0.7, 0.15]} />
                <meshStandardMaterial
                    color={hoverAction === 'reset' && isAtDepth ? '#550000' : '#330000'}
                    emissive="#ff2200"
                    emissiveIntensity={hoverAction === 'reset' && isAtDepth ? 1.2 : 0.2}
                />
                <Text position={[0, 0, 0.12]} fontSize={0.26} color="white" anchorX="center" anchorY="middle" font={undefined}>
                    ✕ Reset Rot
                </Text>
            </mesh>

            <Text position={[0, 2.5, -1]} fontSize={0.5} color="#00ffff" anchorX="center" anchorY="middle" font={undefined}>
                3D VIEWER
            </Text>

            {/* ═══════════ HOLOGRAPHIC MODEL ════════════════════════ */}
            <group position={[0, -0.5, 0]} rotation={[rotX, rotY, 0]}>
                {modelIndex === 0 && (
                    <Suspense fallback={<Text color="#00ffff" fontSize={0.3}>Loading...</Text>}>
                        <HologramMonkey />
                    </Suspense>
                )}
                {modelIndex === 1 && (
                    <>
                        <mesh>
                            <dodecahedronGeometry args={[2, 0]} />
                            <meshStandardMaterial color="#ff00ff" wireframe emissive="#ff00ff" emissiveIntensity={0.6} />
                        </mesh>
                        <mesh>
                            <dodecahedronGeometry args={[1.9, 0]} />
                            <meshStandardMaterial color="#ff00ff" transparent opacity={0.15} />
                        </mesh>
                    </>
                )}
                {modelIndex === 2 && (
                    <>
                        <mesh>
                            <icosahedronGeometry args={[2, 1]} />
                            <meshStandardMaterial color="#ffff00" wireframe emissive="#ffff00" emissiveIntensity={0.6} />
                        </mesh>
                        <mesh>
                            <icosahedronGeometry args={[1.9, 1]} />
                            <meshStandardMaterial color="#ffff00" transparent opacity={0.15} />
                        </mesh>
                    </>
                )}
            </group>
        </group>
    );
}

