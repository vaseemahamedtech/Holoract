import { useState, useEffect } from 'react';
import * as THREE from 'three';
import { useHoloractRaycaster } from '../../hooks/useHoloractRaycaster';
import { Text } from '@react-three/drei';

type AtomType = 'H' | 'O' | 'C' | 'N' | 'Na' | 'Cl' | 'OH' | 'H2O' | 'CO' | 'CO2' | 'NaCl' | 'NH' | 'NH2' | 'NH3' | 'CH' | 'CH2' | 'CH3' | 'CH4';

type AtomNode = {
    id: string;
    type: AtomType;
    pos: THREE.Vector3;
};

type ChemLevel = {
    target: AtomType;
    atoms: AtomNode[];
};

const CHEMISTRY_LEVELS: ChemLevel[] = [
    {
        target: 'H2O',
        atoms: [
            { id: '1', type: 'H', pos: new THREE.Vector3(-3, 1.5, 0) },
            { id: '2', type: 'H', pos: new THREE.Vector3(-3, -1.5, 0) },
            { id: '3', type: 'O', pos: new THREE.Vector3(0, 2, 0) },
            { id: '4', type: 'O', pos: new THREE.Vector3(0, -2, 0) },
            { id: '5', type: 'C', pos: new THREE.Vector3(3, 0, 0) },
        ]
    },
    {
        target: 'CO2',
        atoms: [
            { id: '1', type: 'C', pos: new THREE.Vector3(-3, 0, 0) },
            { id: '2', type: 'O', pos: new THREE.Vector3(0, 2, 0) },
            { id: '3', type: 'O', pos: new THREE.Vector3(3, 0, 0) },
        ]
    },
    {
        target: 'NaCl',
        atoms: [
            { id: '1', type: 'Na', pos: new THREE.Vector3(-2, 0, 0) },
            { id: '2', type: 'Cl', pos: new THREE.Vector3(2, 0, 0) },
        ]
    },
    {
        target: 'NH3',
        atoms: [
            { id: '1', type: 'N', pos: new THREE.Vector3(0, 2, 0) },
            { id: '2', type: 'H', pos: new THREE.Vector3(-3, -1.5, 0) },
            { id: '3', type: 'H', pos: new THREE.Vector3(0, -2, 0) },
            { id: '4', type: 'H', pos: new THREE.Vector3(3, -1.5, 0) },
        ]
    },
    {
        target: 'CH4',
        atoms: [
            { id: '1', type: 'C', pos: new THREE.Vector3(0, 0, 0) },
            { id: '2', type: 'H', pos: new THREE.Vector3(-3, 3, 0) },
            { id: '3', type: 'H', pos: new THREE.Vector3(-3, -3, 0) },
            { id: '4', type: 'H', pos: new THREE.Vector3(3, 3, 0) },
            { id: '5', type: 'H', pos: new THREE.Vector3(3, -3, 0) },
        ]
    }
];

export function ChemistryModule({ pointerX, pointerY, pointerZ, isPinching, isAtDepth, onBack }: any) {
    const [levelIndex, setLevelIndex] = useState(0);
    const [atoms, setAtoms] = useState<AtomNode[]>(CHEMISTRY_LEVELS[0].atoms);
    const [isSuccess, setIsSuccess] = useState(false);

    const targetMolecule = CHEMISTRY_LEVELS[levelIndex].target;

    const handleReset = () => {
        setIsSuccess(false);
        setAtoms(CHEMISTRY_LEVELS[levelIndex].atoms);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 'r') {
                handleReset();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [levelIndex]);

    // Check for success condition
    useEffect(() => {
        if (!isSuccess && atoms.some(a => a.type === targetMolecule)) {
            setIsSuccess(true);
            // Center the successful molecule
            setAtoms(prev => prev.map(a =>
                a.type === targetMolecule ? { ...a, pos: new THREE.Vector3(0, 0, 0) } : a
            ));
        }
    }, [atoms, targetMolecule, isSuccess]);

    const handleNext = () => {
        const nextIndex = (levelIndex + 1) % CHEMISTRY_LEVELS.length;
        setLevelIndex(nextIndex);
        setAtoms(CHEMISTRY_LEVELS[nextIndex].atoms);
        setIsSuccess(false);
    };

    const { hoveredObject, draggedObject } = useHoloractRaycaster({
        pointerX, pointerY, pointerZ, isPinching,
        onPinchStart: (obj) => {
            if (obj?.userData?.id === 'reset') {
                handleReset();
            } else if (obj?.userData?.id === 'next') {
                handleNext();
            } else if (obj?.userData?.id === 'back') {
                if (onBack) onBack();
            }
        },
        onDrag: (pos) => {
            if (draggedObject.current && !isSuccess) {
                const id = draggedObject.current.userData.id;
                setAtoms(prev => prev.map(a =>
                    a.id === id ? { ...a, pos: pos.clone() } : a
                ));
            }
        },
        onPinchEnd: () => {
            if (draggedObject.current && !isSuccess) {
                const draggedId = draggedObject.current.userData.id;
                setAtoms(prev => {
                    const draggedAtom = prev.find(a => a.id === draggedId);
                    if (!draggedAtom) return prev;

                    const others = prev.filter(a => a.id !== draggedId);
                    let newOthers = [...others];
                    let merged = false;

                    for (let i = 0; i < newOthers.length; i++) {
                        if (newOthers[i].pos.distanceTo(draggedAtom.pos) < 2.5) {
                            const aType = newOthers[i].type;
                            const bType = draggedAtom.type;
                            const combo = [aType, bType].sort().join('+');

                            let resultType: AtomType | null = null;
                            if (combo === 'H+O') resultType = 'OH';
                            else if (combo === 'H+OH') resultType = 'H2O';
                            else if (combo === 'C+O') resultType = 'CO';
                            else if (combo === 'CO+O') resultType = 'CO2';
                            else if (combo === 'Cl+Na') resultType = 'NaCl';
                            else if (combo === 'H+N') resultType = 'NH';
                            else if (combo === 'H+NH') resultType = 'NH2';
                            else if (combo === 'H+NH2') resultType = 'NH3';
                            else if (combo === 'C+H') resultType = 'CH';
                            else if (combo === 'CH+H') resultType = 'CH2';
                            else if (combo === 'CH2+H') resultType = 'CH3';
                            else if (combo === 'CH3+H') resultType = 'CH4';

                            if (resultType) {
                                newOthers[i] = {
                                    ...newOthers[i],
                                    type: resultType
                                };
                                merged = true;
                                break;
                            }
                        }
                    }
                    return merged ? newOthers : prev;
                });
            }
        }
    });

    const isHoveredId = (id: string) => hoveredObject.current?.userData?.id === id && isAtDepth;

    const getColor = (type: AtomType) => {
        if (type === 'H') return '#ff3366';
        if (type === 'O') return '#3366ff';
        if (type === 'C') return '#66aa66';
        if (type === 'N') return '#ab47bc';
        if (type === 'Na') return '#ffa726';
        if (type === 'Cl') return '#8d6e63';
        if (type === 'OH') return '#cc66cc';
        if (type === 'H2O') return '#00ffff';
        if (type === 'CO') return '#9999ff';
        if (type === 'CO2') return '#ffaa00';
        if (type === 'NaCl') return '#ffffff';
        if (type.startsWith('NH')) return '#8e24aa';
        if (type.startsWith('CH')) return '#4caf50';
        return '#ffffff';
    };

    return (
        <group scale={0.75} position={[0, 0, 0]}>
            {/* ═══════════ TOP BAR — centered ═════════════════════════════════ */}

            {/* Back button — center-left of top */}
            <mesh position={[-2, 5.5, 0]} userData={{ interactable: true, id: 'back' }}>
                <boxGeometry args={[2, 0.7, 0.2]} />
                <meshStandardMaterial
                    color={isHoveredId('back') ? '#006688' : '#002233'}
                    emissive="#00ccff"
                    emissiveIntensity={isHoveredId('back') ? 1.4 : 0.15}
                />
                <Text position={[0, 0, 0.15]} fontSize={0.3} color="white" anchorX="center" anchorY="middle">
                    ← Back
                </Text>
            </mesh>

            {/* Reset button — center-right of top */}
            <mesh position={[2, 5.5, 0]} onClick={handleReset} userData={{ interactable: true, id: 'reset' }}
                onPointerDown={handleReset}
            >
                <boxGeometry args={[2, 0.7, 0.2]} />
                <meshStandardMaterial
                    color={isHoveredId('reset') ? '#550000' : '#330000'}
                    emissive="#ff2200"
                    emissiveIntensity={isHoveredId('reset') ? 1.2 : 0.2}
                />
                <Text position={[0, 0, 0.15]} fontSize={0.3} color="white" anchorX="center" anchorY="middle">
                    ✕ Reset
                </Text>
            </mesh>

            {/* Title — centered below buttons */}
            <Text position={[0, 4.2, 0]} fontSize={0.7} color="cyan" anchorX="center" anchorY="middle" fontWeight="bold">
                FORM {targetMolecule}
            </Text>

            {isSuccess && (
                <Text position={[0, 2, 2]} fontSize={2} color="#00ff00" anchorX="center" anchorY="middle" fontWeight="bold">
                    GOOD!
                </Text>
            )}

            {isSuccess && (
                <mesh position={[0, -2, 0]} onClick={handleNext} userData={{ interactable: true, id: 'next' }}
                    onPointerDown={handleNext}
                >
                    <boxGeometry args={[1.5, 0.6, 0.2]} />
                    <meshStandardMaterial color="#00aa00" />
                    <Text position={[0, 0, 0.15]} fontSize={0.3} color="white" anchorX="center" anchorY="middle">
                        Next
                    </Text>
                </mesh>
            )}

            {atoms.map(a => {
                const isHovered = hoveredObject.current?.userData?.id === a.id;
                const isDragged = draggedObject.current?.userData?.id === a.id;

                if (a.id === 'reset') return null;
                if (isSuccess && a.type !== targetMolecule) return null;

                const isComplex = a.type === 'H2O' || a.type === 'CO2' || a.type === 'NaCl' || a.type === 'NH3' || a.type === 'CH4';
                const isCompound = a.type !== 'H' && a.type !== 'O' && a.type !== 'C' && a.type !== 'N' && a.type !== 'Na' && a.type !== 'Cl';
                const size = isComplex ? 1.5 : (isCompound ? 1.2 : 0.8);

                const color = getColor(a.type);
                const emissiveProps = (isAtDepth && (isHovered || isDragged)) ? { emissive: color, emissiveIntensity: 0.6 } : {};

                return (
                    <group key={a.id} position={a.pos} userData={{ draggable: true, id: a.id }}>
                        <mesh>
                            <sphereGeometry args={[size, 32, 32]} />
                            <meshStandardMaterial
                                color={color}
                                wireframe={!isDragged && !isComplex && !isCompound}
                                transparent opacity={isDragged ? 1 : 0.8}
                                {...emissiveProps}
                            />
                        </mesh>
                        <Text position={[0, 0, size + 0.2]} fontSize={size * 0.75} color="white" anchorX="center" anchorY="middle">
                            {a.type}
                        </Text>
                    </group>
                );
            })}
        </group>
    );
}
