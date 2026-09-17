import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { useHoloractRaycaster } from '../../hooks/useHoloractRaycaster';
import { Text } from '@react-three/drei';

export function MainMenu({ pointerX, pointerY, pointerZ, isPinching, isAtDepth, onSelect }: any) {
    const { hoveredObject } = useHoloractRaycaster({ pointerX, pointerY, pointerZ, isPinching });
    const wasPinching = useRef(false);
    const groupRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
        }

        if (isPinching && !wasPinching.current) {
            if (hoveredObject.current?.userData?.module) {
                onSelect(hoveredObject.current.userData.module);
            }
        }
        wasPinching.current = isPinching;
    });

    const isHovered = (module: string) => hoveredObject.current?.userData?.module === module;

    return (
        <group ref={groupRef}>
            <Text position={[0, 3.0, 0]} fontSize={0.65} color="cyan" anchorX="center" anchorY="middle">
                HOLORACT STEM
            </Text>
            <Text position={[0, 2.2, 0]} fontSize={0.25} color="white" anchorX="center" anchorY="middle">
                Pinch a sphere to select
            </Text>

            {/* Top Row: Math, Viewer, Chemistry */}
            <mesh position={[-2, 1, 0]} userData={{ interactable: true, module: 'math' }}>
                <sphereGeometry args={[0.7, 32, 32]} />
                <meshStandardMaterial color={isHovered('math') ? "#00ffff" : "#1a5b82"} wireframe {...(isHovered('math') && isAtDepth ? { emissive: "#00ffff", emissiveIntensity: 0.5 } : {})} />
                <Text position={[0, -1.1, 0]} fontSize={0.32} color="cyan">Math</Text>
            </mesh>

            {/* Viewer module strictly at top-center of the "box" */}
            <mesh position={[0, 1, 0]} userData={{ interactable: true, module: 'viewer' }}>
                <sphereGeometry args={[0.7, 32, 32]} />
                <meshStandardMaterial color={isHovered('viewer') ? "#00ffff" : "#4b1a82"} wireframe {...(isHovered('viewer') && isAtDepth ? { emissive: "#00ffff", emissiveIntensity: 0.5 } : {})} />
                <Text position={[0, -1.1, 0]} fontSize={0.32} color="cyan">3D Viewer</Text>
            </mesh>

            <mesh position={[2, 1, 0]} userData={{ interactable: true, module: 'chem' }}>
                <sphereGeometry args={[0.7, 32, 32]} />
                <meshStandardMaterial color={isHovered('chem') ? "#00ffff" : "#1a8264"} wireframe {...(isHovered('chem') && isAtDepth ? { emissive: "#00ffff", emissiveIntensity: 0.5 } : {})} />
                <Text position={[0, -1.1, 0]} fontSize={0.32} color="cyan">Chemistry</Text>
            </mesh>

            {/* Bottom Row: Solar, Paint */}
            <mesh position={[-1.2, -1.5, 0]} userData={{ interactable: true, module: 'solar' }}>
                <sphereGeometry args={[0.7, 32, 32]} />
                <meshStandardMaterial color={isHovered('solar') ? "#00ffff" : "#824b1a"} wireframe {...(isHovered('solar') && isAtDepth ? { emissive: "#00ffff", emissiveIntensity: 0.5 } : {})} />
                <Text position={[0, -1.1, 0]} fontSize={0.32} color="cyan">Solar</Text>
            </mesh>

            <mesh position={[1.2, -1.5, 0]} userData={{ interactable: true, module: 'paint' }}>
                <sphereGeometry args={[0.7, 32, 32]} />
                <meshStandardMaterial color={isHovered('paint') ? "#00ffff" : "#821a4b"} wireframe {...(isHovered('paint') && isAtDepth ? { emissive: "#00ffff", emissiveIntensity: 0.5 } : {})} />
                <Text position={[0, -1.1, 0]} fontSize={0.32} color="cyan">Paint</Text>
            </mesh>
        </group>
    );
}
