import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface VirtualScreenOverlayProps {
    touchThreshold: number;
    width?: number;
    height?: number;
}

export function VirtualScreenOverlay({ touchThreshold, width = 20, height = 20 }: VirtualScreenOverlayProps) {
    const meshRef = useRef<THREE.Mesh>(null);
    const gridHelperRef = useRef<THREE.GridHelper>(null);

    useFrame(() => {
        if (meshRef.current) {
            // Smoothly animate the plane to the target threshold
            meshRef.current.position.z += (touchThreshold - meshRef.current.position.z) * 0.1;
        }

        // Also animate the grid helper to match
        if (gridHelperRef.current) {
            gridHelperRef.current.position.z += (touchThreshold - gridHelperRef.current.position.z) * 0.1;
        }
    });

    return (
        <group>
            {/* Semi-transparent "glass" plane */}
            <mesh ref={meshRef} position={[0, 0, touchThreshold]}>
                <planeGeometry args={[width, height]} />
                <meshBasicMaterial
                    color="#22d3ee"
                    transparent={true}
                    opacity={0.05}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                />
            </mesh>

            {/* Cyan wireframe grid overlay onto the plane */}
            <mesh position={[0, 0, touchThreshold]}>
                <planeGeometry args={[width, height, 20, 20]} />
                <meshBasicMaterial
                    color="#22d3ee"
                    wireframe={true}
                    transparent={true}
                    opacity={0.15}
                    depthWrite={false}
                />
            </mesh>
        </group>
    );
}
