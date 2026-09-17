import { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { useHoloractRaycaster } from '../../hooks/useHoloractRaycaster';
import { Text } from '@react-three/drei';

type NodeType = 'number' | 'operator' | 'expression';

interface MathNode {
    id: string;
    type: NodeType;
    value: string; // "5", "+", "5 +"
    pos: THREE.Vector3;
}

type MathLevel = {
    target: number;
    title: string;
    nodes: MathNode[];
};

// Operators isolated on the RIGHT side
const opNodes: MathNode[] = [
    { id: 'op1', type: 'operator', value: '+', pos: new THREE.Vector3(3.5,  2, 0) },
    { id: 'op2', type: 'operator', value: '-', pos: new THREE.Vector3(3.5,  0, 0) },
    { id: 'op3', type: 'operator', value: '*', pos: new THREE.Vector3(3.5, -2, 0) },
];

// Numbers on the LEFT side — separated from operators by a clear gap
const MATH_LEVELS: MathLevel[] = [
    {
        target: 5,
        title: 'MAKE 5',
        nodes: [
            { id: 'n1', type: 'number', value: '3',  pos: new THREE.Vector3(-3.5,  2.5, 0) },
            { id: 'n2', type: 'number', value: '8',  pos: new THREE.Vector3(-3.5,  0.8, 0) },
            { id: 'n3', type: 'number', value: '2',  pos: new THREE.Vector3(-3.5, -0.8, 0) },
            { id: 'n4', type: 'number', value: '1',  pos: new THREE.Vector3(-3.5, -2.5, 0) },
            ...opNodes
        ]
    },
    {
        target: 10,
        title: 'MAKE 10',
        nodes: [
            { id: 'n1', type: 'number', value: '4',  pos: new THREE.Vector3(-3.5,  2.5, 0) },
            { id: 'n2', type: 'number', value: '6',  pos: new THREE.Vector3(-3.5,  0.8, 0) },
            { id: 'n3', type: 'number', value: '15', pos: new THREE.Vector3(-3.5, -0.8, 0) },
            { id: 'n4', type: 'number', value: '5',  pos: new THREE.Vector3(-3.5, -2.5, 0) },
            ...opNodes
        ]
    },
    {
        target: 24,
        title: 'MAKE 24',
        nodes: [
            { id: 'n1', type: 'number', value: '4',  pos: new THREE.Vector3(-3.5,  2.5, 0) },
            { id: 'n2', type: 'number', value: '6',  pos: new THREE.Vector3(-3.5,  0.8, 0) },
            { id: 'n3', type: 'number', value: '8',  pos: new THREE.Vector3(-3.5, -0.8, 0) },
            { id: 'n4', type: 'number', value: '3',  pos: new THREE.Vector3(-3.5, -2.5, 0) },
            ...opNodes
        ]
    },
    {
        target: 100,
        title: 'MAKE 100',
        nodes: [
            { id: 'n1', type: 'number', value: '10', pos: new THREE.Vector3(-3.5,  2.5, 0) },
            { id: 'n2', type: 'number', value: '10', pos: new THREE.Vector3(-3.5,  0.8, 0) },
            { id: 'n3', type: 'number', value: '50', pos: new THREE.Vector3(-3.5, -0.8, 0) },
            { id: 'n4', type: 'number', value: '2',  pos: new THREE.Vector3(-3.5, -2.5, 0) },
            ...opNodes
        ]
    },
    {
        target: 42,
        title: 'MAKE 42',
        nodes: [
            { id: 'n1', type: 'number', value: '7',  pos: new THREE.Vector3(-3.5,  2.5, 0) },
            { id: 'n2', type: 'number', value: '6',  pos: new THREE.Vector3(-3.5,  0.8, 0) },
            { id: 'n3', type: 'number', value: '2',  pos: new THREE.Vector3(-3.5, -0.8, 0) },
            { id: 'n4', type: 'number', value: '21', pos: new THREE.Vector3(-3.5, -2.5, 0) },
            ...opNodes
        ]
    }
];

export function MathModule({ pointerX, pointerY, pointerZ, isPinching, isAtDepth, onBack }: any) {
    const [levelIndex, setLevelIndex] = useState(0);
    const [nodes, setNodes] = useState<MathNode[]>(MATH_LEVELS[0].nodes);
    const [isSuccess, setIsSuccess] = useState(false);

    // Always reset to level 0 on mount (prevents HMR or stale state from resuming mid-game)
    useEffect(() => {
        setLevelIndex(0);
        setNodes(MATH_LEVELS[0].nodes);
        setIsSuccess(false);
    }, []);

    const currentLevel = MATH_LEVELS[levelIndex];
    const targetValue = currentLevel.target;
    const title = currentLevel.title;

    // Use ref so keydown always has latest levelIndex without re-registering
    const levelIndexRef = useRef(levelIndex);
    useEffect(() => { levelIndexRef.current = levelIndex; }, [levelIndex]);

    const handleReset = useCallback(() => {
        setIsSuccess(false);
        setNodes(MATH_LEVELS[levelIndexRef.current].nodes);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 'r') handleReset();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleReset]);

    // Check for success condition
    useEffect(() => {
        if (!isSuccess && nodes.some(n => n.type === 'number' && parseFloat(n.value) === targetValue)) {
            setIsSuccess(true);
            // Center the successful number
            setNodes(prev => prev.map(n =>
                (n.type === 'number' && parseFloat(n.value) === targetValue) ? { ...n, pos: new THREE.Vector3(0, 0, 0) } : n
            ));
        }
    }, [nodes, targetValue, isSuccess]);

    const handleNext = () => {
        const nextIndex = (levelIndex + 1) % MATH_LEVELS.length;
        setLevelIndex(nextIndex);
        setNodes(MATH_LEVELS[nextIndex].nodes);
        setIsSuccess(false);
    };


    const { hoveredObject, draggedObject } = useHoloractRaycaster({
        pointerX, pointerY, pointerZ, isPinching,
        onDrag: (pos) => {
            if (draggedObject.current && !isSuccess) {
                const id = draggedObject.current.userData.id;
                setNodes(prev => prev.map(n =>
                    n.id === id ? { ...n, pos: pos.clone() } : n
                ));
            }
        },
        onPinchStart: (obj) => {
            if (obj?.userData?.id === 'reset') {
                handleReset();
            } else if (obj?.userData?.id === 'next') {
                handleNext();
            } else if (obj?.userData?.id === 'back') {
                if (onBack) onBack();
            }
        },
        onPinchEnd: () => {
            if (draggedObject.current && !isSuccess) {
                const draggedId = draggedObject.current.userData.id;
                setNodes(prev => {
                    const draggedNode = prev.find(n => n.id === draggedId);
                    if (!draggedNode) return prev;

                    const others = prev.filter(n => n.id !== draggedId);
                    let merged = false;
                    let newOthers = [...others];

                    for (let i = 0; i < newOthers.length; i++) {
                        if (newOthers[i].pos.distanceTo(draggedNode.pos) < 1.5) {
                            const target = newOthers[i];

                            // 1. Number + Operator = Expression (e.g., "5 +")
                            if (draggedNode.type === 'number' && target.type === 'operator') {
                                newOthers[i] = {
                                    ...target,
                                    type: 'expression',
                                    value: `${draggedNode.value} ${target.value}`
                                };
                                merged = true;
                                break;
                            } else if (draggedNode.type === 'operator' && target.type === 'number') {
                                newOthers[i] = {
                                    ...target,
                                    type: 'expression',
                                    value: `${target.value} ${draggedNode.value}`
                                };
                                merged = true;
                                break;
                            }

                            // 2. Expression + Number = Evaluated Number (e.g., "5 +" + "3" = "8")
                            const evaluateSafe = (expr: string): number | null => {
                                const parts = expr.trim().split(' ');
                                if (parts.length >= 3) {
                                    const a = parseFloat(parts[0]);
                                    const op = parts[1];
                                    const b = parseFloat(parts[2]);
                                    if (isNaN(a) || isNaN(b)) return null;
                                    if (op === '+') return a + b;
                                    if (op === '-') return a - b;
                                    if (op === '*') return a * b;
                                }
                                return null;
                            };

                            if (draggedNode.type === 'number' && target.type === 'expression') {
                                const result = evaluateSafe(`${target.value} ${draggedNode.value}`);
                                if (result === null || isNaN(result)) break; // guard: skip bad merge
                                newOthers[i] = {
                                    ...target,
                                    type: 'number',
                                    value: result.toString()
                                };
                                merged = true;
                                break;
                            } else if (draggedNode.type === 'expression' && target.type === 'number') {
                                const result = evaluateSafe(`${draggedNode.value} ${target.value}`);
                                if (result === null || isNaN(result)) break; // guard: skip bad merge
                                newOthers[i] = {
                                    ...target,
                                    type: 'number',
                                    value: result.toString()
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

    const getColor = (type: NodeType) => {
        if (type === 'operator') return '#ff9900';
        if (type === 'expression') return '#9933ff';
        return '#1a5b82'; // number
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
                {title}
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

            {nodes.map(n => {
                const isHovered = hoveredObject.current?.userData?.id === n.id;
                const isDragged = draggedObject.current?.userData?.id === n.id;

                if (isSuccess && !(n.type === 'number' && parseFloat(n.value) === targetValue)) return null;

                const width = n.type === 'expression' ? 1.5 : 0.8;

                // Base color
                const color = isDragged ? "#ff00ff" : isHovered ? "#00ffff" : getColor(n.type);
                // Glow effect if at depth AND hovered/dragged
                const emissiveProps = (isAtDepth && (isHovered || isDragged)) ? { emissive: color, emissiveIntensity: 0.6 } : {};

                return (
                    <group key={n.id} position={n.pos} userData={{ draggable: true, id: n.id }}>
                        <mesh>
                            {n.type === 'operator' ? (
                                <boxGeometry args={[width, 0.8, 0.8]} />
                            ) : (
                                <sphereGeometry args={[width, 32, 32]} />
                            )}
                            <meshStandardMaterial
                                color={color}
                                wireframe={!isDragged}
                                transparent opacity={isDragged ? 1 : 0.8}
                                {...emissiveProps}
                            />
                        </mesh>
                        <Text position={[0, 0, 0.2]} fontSize={0.8} color="white" anchorX="center" anchorY="middle">
                            {n.value}
                        </Text>
                    </group>
                );
            })}
        </group>
    );
}
