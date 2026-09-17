import { useState, useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useHoloractRaycaster } from '../../hooks/useHoloractRaycaster';
import { Text } from '@react-three/drei';

type PlanetState = {
    id: string;
    name: string;
    color: string;
    size: number;
    distance: number;
    angle: number;
    speed: number;
    hasRing?: boolean;
    ringColor?: string;
    pos: THREE.Vector3;
    rotationY: number;
};

const SUN_POS = new THREE.Vector3(0, 0, 0);
const SUN_SIZE = 4;

const INITIAL_PLANETS: PlanetState[] = [
    { id: 'mercury', name: 'Mercury', color: '#aaaaaa', size: 0.8, distance: 5.5, angle: Math.random() * Math.PI * 2, speed: 1.5, pos: new THREE.Vector3(), rotationY: 0 },
    { id: 'venus', name: 'Venus', color: '#eebb88', size: 1.2, distance: 7.0, angle: Math.random() * Math.PI * 2, speed: 1.2, pos: new THREE.Vector3(), rotationY: 0 },
    { id: 'earth', name: 'Earth', color: '#3399ff', size: 1.5, distance: 8.5, angle: Math.random() * Math.PI * 2, speed: 0.9, pos: new THREE.Vector3(), rotationY: 0 },
    { id: 'mars', name: 'Mars', color: '#ff4422', size: 1.0, distance: 10.0, angle: Math.random() * Math.PI * 2, speed: 0.7, pos: new THREE.Vector3(), rotationY: 0 },
    { id: 'jupiter', name: 'Jupiter', color: '#ccaa88', size: 3.2, distance: 13.5, angle: Math.random() * Math.PI * 2, speed: 0.4, pos: new THREE.Vector3(), rotationY: 0 },
    { id: 'saturn', name: 'Saturn', color: '#eedd88', size: 2.6, distance: 17.5, angle: Math.random() * Math.PI * 2, speed: 0.3, hasRing: true, ringColor: '#ccbb77', pos: new THREE.Vector3(), rotationY: 0 },
    { id: 'uranus', name: 'Uranus', color: '#66ccff', size: 2.0, distance: 20.5, angle: Math.random() * Math.PI * 2, speed: 0.2, pos: new THREE.Vector3(), rotationY: 0 },
    { id: 'neptune', name: 'Neptune', color: '#3366cc', size: 1.9, distance: 23.0, angle: Math.random() * Math.PI * 2, speed: 0.15, pos: new THREE.Vector3(), rotationY: 0 },
];

export function SolarSystemModule({ pointerX, pointerY, pointerZ, isPinching, isAtDepth, onBack }: any) {
    const [planets, setPlanets] = useState<PlanetState[]>(INITIAL_PLANETS);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const rootGroupRef = useRef<THREE.Group>(null);

    // Calculate orbit paths purely for drawing lines
    const orbitRings = useMemo(() => {
        return INITIAL_PLANETS.map(p => {
            return (
                <mesh key={`orbit-${p.id}`} position={SUN_POS}>
                    <ringGeometry args={[p.distance - 0.03, p.distance + 0.03, 64]} />
                    <meshBasicMaterial color="#ffffff" transparent opacity={0.15} side={THREE.DoubleSide} />
                </mesh>
            );
        });
    }, []);

    const { hoveredObject } = useHoloractRaycaster({
        pointerX, pointerY, pointerZ, isPinching,
        onPinchStart: (obj) => {
            if (obj?.userData?.id === 'reset') {
                setSelectedId(null);
            } else if (obj?.userData?.id === 'back') {
                if (onBack) onBack();
            } else if (obj?.userData?.id) {
                if (selectedId === obj.userData.id) {
                    setSelectedId(null);
                } else {
                    setSelectedId(obj.userData.id);
                }
            }
        }
    });

    const isHoveredId = (id: string) => hoveredObject.current?.userData?.id === id && isAtDepth;

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 'r') {
                setSelectedId(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useFrame((state, delta) => {
        // Update planetary orbits
        setPlanets(prev => prev.map(p => {
            // only orbit if not selected
            const newAngle = selectedId ? p.angle : p.angle - p.speed * delta * 0.2;
            // constant rotation on its own axis
            const newRotationY = p.rotationY + delta * 1.0;

            return {
                ...p,
                angle: newAngle,
                rotationY: newRotationY,
                pos: new THREE.Vector3(SUN_POS.x + Math.cos(newAngle) * p.distance, SUN_POS.y + Math.sin(newAngle) * p.distance, 0)
            };
        }));

        // Handle zooming/panning
        if (rootGroupRef.current) {
            let targetScale = 0.20; // Global view scale
            let targetPos = new THREE.Vector3(0, -0.5, 0); // pan slightly right to center the orbits since sun is left

            if (selectedId) {
                if (selectedId === 'sun') {
                    targetScale = 0.8;
                    targetPos.set(-SUN_POS.x * targetScale, 0, 0);
                } else {
                    const targetPlanet = planets.find(p => p.id === selectedId);
                    if (targetPlanet) {
                        // Dynamically scale based on planet size to consistently fill the view perfectly!
                        targetScale = 2.0 / targetPlanet.size;

                        // Set bounds so tiny planets aren't massively pixelated and giant planets aren't too small
                        if (targetScale > 6) targetScale = 6;
                        if (targetScale < 0.8) targetScale = 0.8;

                        targetPos.set(-targetPlanet.pos.x * targetScale, -targetPlanet.pos.y * targetScale, -targetPlanet.pos.z * targetScale);
                    }
                }
            }

            // Lerp scale
            const currentScale = rootGroupRef.current.scale.x;
            const newScale = currentScale + (targetScale - currentScale) * delta * 4;
            rootGroupRef.current.scale.set(newScale, newScale, newScale);

            // Lerp position
            rootGroupRef.current.position.lerp(targetPos, delta * 4);

            // If global view, tilt slightly down for better 3d look, straight on if inspected
            const targetRotX = selectedId ? 0 : 0.6;
            rootGroupRef.current.rotation.x += (targetRotX - rootGroupRef.current.rotation.x) * delta * 4;
        }
    });

    return (
        <group>
            {/* ═══════════ TOP BAR — centered ═════════════════════════════════ */}

            {/* Back button — center-left of top */}
            <mesh position={[-1.5, 3.5, 0]} userData={{ interactable: true, id: 'back' }}>
                <boxGeometry args={[2, 0.7, 0.2]} />
                <meshStandardMaterial
                    color={isHoveredId('back') ? '#006688' : '#002233'}
                    emissive="#00ccff"
                    emissiveIntensity={isHoveredId('back') ? 1.4 : 0.15}
                />
                <Text position={[0, 0, 0.15]} fontSize={0.26} color="white" anchorX="center" anchorY="middle" font={undefined}>
                    ← Back
                </Text>
            </mesh>

            {/* Reset button — center-right of top */}
            <mesh position={[1.5, 3.5, 0]} onClick={() => setSelectedId(null)} userData={{ interactable: true, id: 'reset' }} onPointerDown={() => setSelectedId(null)}>
                <boxGeometry args={[2, 0.7, 0.2]} />
                <meshStandardMaterial
                    color={isHoveredId('reset') ? '#550000' : '#330000'}
                    emissive="#ff2200"
                    emissiveIntensity={isHoveredId('reset') ? 1.2 : 0.2}
                />
                <Text position={[0, 0, 0.15]} fontSize={0.26} color="white" anchorX="center" anchorY="middle" font={undefined}>
                    ✕ Reset
                </Text>
            </mesh>

            {/* Title — centered below buttons */}
            <Text position={[0, 2.5, 0]} fontSize={0.6} color="cyan" anchorX="center" anchorY="middle" fontWeight="bold">
                {selectedId ? planets.find(p => p.id === selectedId)?.name?.toUpperCase() || (selectedId === 'sun' ? 'SUN' : '') : 'OBSERVE PLANETS'}
            </Text>

            {/* Panning / Scaling Solar System Root */}
            <group ref={rootGroupRef}>
                {/* Orbits */}
                {!selectedId && orbitRings}

                {/* Sun */}
                {(!selectedId || selectedId === 'sun') && (
                    <mesh position={SUN_POS} userData={{ interactable: true, id: 'sun' }}>
                        <sphereGeometry args={[SUN_SIZE, 64, 64]} />
                        <meshStandardMaterial color="#ffcc00" emissive="#ff8800" emissiveIntensity={(isAtDepth && hoveredObject.current?.userData?.id === 'sun') ? 0.9 : 0.6} />
                        {selectedId === 'sun' && <Text position={[0, -SUN_SIZE - 0.8, 0]} fontSize={1.2} color="white" anchorX="center" anchorY="middle">Sun</Text>}
                    </mesh>
                )}

                {/* Planets */}
                {planets.map(p => {
                    // Hide unselected planets when something is selected
                    if (selectedId && selectedId !== p.id) return null;

                    const isHovered = hoveredObject.current?.userData?.id === p.id;
                    const isSelected = selectedId === p.id;
                    const emissiveProps = (isAtDepth && isHovered) || isSelected
                        ? { emissive: p.color, emissiveIntensity: 0.5 }
                        : {};

                    // Add some detail to texture by using wireframe or displacement later if needed
                    return (
                        <group key={p.id} position={p.pos} userData={{ interactable: true, id: p.id }} rotation={[0, p.rotationY, 0]}>
                            <mesh>
                                <sphereGeometry args={[p.size, 32, 32]} />
                                <meshStandardMaterial
                                    color={p.color}
                                    roughness={0.7}
                                    {...emissiveProps}
                                />
                            </mesh>
                            {p.hasRing && (
                                <mesh rotation={[-Math.PI / 2 + 0.3, 0, 0]}>
                                    <ringGeometry args={[p.size * 1.5, p.size * 2.5, 64]} />
                                    <meshStandardMaterial color={p.ringColor || p.color} side={THREE.DoubleSide} transparent opacity={0.6} />
                                </mesh>
                            )}

                            {selectedId && (
                                // undo Y rotation for text so it faces camera mostly
                                // position z = p.size + 0.1 brings text just in front of the sphere surface
                                <group rotation={[0, -p.rotationY, 0]}>
                                    <Text position={[0, 0, p.size + 0.5]} fontSize={1.2} color="white" anchorX="center" anchorY="middle" fontWeight="bold">
                                        {p.name}
                                    </Text>
                                </group>
                            )}
                        </group>
                    );
                })}
            </group>
        </group>
    );
}
