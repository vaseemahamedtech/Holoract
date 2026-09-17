import { useState, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useHoloractRaycaster } from '../../hooks/useHoloractRaycaster';
import { Text, Line } from '@react-three/drei';

/* ────────────────────────────────────────────────────────────────────────── */
/*  Types & Constants                                                        */
/* ────────────────────────────────────────────────────────────────────────── */

interface Stroke {
    id: string;
    points: THREE.Vector3[];
    color: string;
    width: number;
}

const DRAW_COLOR = '#00ffff';
const DRAW_WIDTH = 5;

const MIN_POINT_DIST = 0.07;   // higher = smoother lines, fewer micro-jitter points
const ENTRY_LOCK_MS = 1000;

export function PaintModule({ pointerX, pointerY, pointerZ, isPinching, isAtDepth, onBack }: any) {
    /* ── State ────────────────────────────────────────────────────────────── */
    const [strokes, setStrokes] = useState<Stroke[]>([]);

    const currentStrokeRef = useRef<Stroke | null>(null);
    const [renderTick, setRenderTick] = useState(0);

    const wasPinching = useRef(false);
    const mountTime = useRef(Date.now());
    const waitForRelease = useRef(isPinching as boolean);
    const isDrawingRef = useRef(false);

    const { hoveredObject } = useHoloractRaycaster({ pointerX, pointerY, pointerZ, isPinching });

    /* ── Helpers ──────────────────────────────────────────────────────────── */
    const clearAll = useCallback(() => {
        setStrokes([]);
        currentStrokeRef.current = null;
        setRenderTick(t => t + 1);
    }, []);

    const handleUndo = useCallback(() => {
        setStrokes(prev => prev.slice(0, -1));
        currentStrokeRef.current = null;
        setRenderTick(t => t + 1);
    }, []);

    const getCurvePoints = (points: THREE.Vector3[]) => {
        if (points.length < 3) return points;
        try {
            const curve = new THREE.CatmullRomCurve3(points, false, 'chordal');
            return curve.getPoints(Math.max(points.length * 4, 10));
        } catch (e) {
            return points;
        }
    };

    /* ── Frame loop ──────────────────────────────────────────────────────── */
    useFrame(() => {
        const elapsed = Date.now() - mountTime.current;
        if (elapsed < ENTRY_LOCK_MS) { wasPinching.current = isPinching; return; }
        if (waitForRelease.current) {
            if (!isPinching) waitForRelease.current = false;
            wasPinching.current = isPinching;
            return;
        }

        // Pinch released → commit stroke
        if (!isPinching) {
            if (wasPinching.current && currentStrokeRef.current) {
                const finished = currentStrokeRef.current;
                if (finished.points.length > 1) setStrokes(prev => [...prev, finished]);
                currentStrokeRef.current = null;
                isDrawingRef.current = false;
                setRenderTick(t => t + 1);
            }
            wasPinching.current = false;
            return;
        }

        // Stroke points always on z=0 plane — Z wobble never distorts drawn lines
        const worldPos = new THREE.Vector3(pointerX * 10, pointerY * 10, 0);

        // Pinch START (rising edge)
        if (isPinching && !wasPinching.current) {
            const action = hoveredObject.current?.userData?.action;

            if (action === 'clear') { clearAll(); isDrawingRef.current = false; wasPinching.current = true; return; }
            if (action === 'back')  { if (onBack) onBack(); wasPinching.current = true; return; }
            if (action === 'undo')  { handleUndo(); isDrawingRef.current = false; wasPinching.current = true; return; }

            // Begin drawing a new stroke — lock depth requirement off
            isDrawingRef.current = true;
            currentStrokeRef.current = {
                id: Math.random().toString(36).substring(2, 9),
                points: [new THREE.Vector3(pointerX * 10, pointerY * 10, 0)],
                color: DRAW_COLOR,
                width: DRAW_WIDTH,
            };
        }

        // Pinch HOLD → extend stroke (render every frame for smooth lines)
        if (isPinching && wasPinching.current && currentStrokeRef.current) {
            const pts = currentStrokeRef.current.points;
            const last = pts[pts.length - 1];
            if (last.distanceTo(worldPos) > MIN_POINT_DIST) {
                currentStrokeRef.current.points = [...pts, worldPos.clone()];
                setRenderTick(t => t + 1);
            }
        }

        wasPinching.current = isPinching;
    });

    /* ── Stroke list for rendering ───────────────────────────────────────── */
    const live = currentStrokeRef.current;
    const allStrokes: Stroke[] = live && live.points.length > 1 ? [...strokes, live] : strokes;
    void renderTick;

    const hoverAction = hoveredObject.current?.userData?.action;

    return (
        <group>
            {/* ═══════════ TOP BAR — centered ═════════════════════════════════ */}

            {/* Back button */}
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

            {/* Undo button */}
            <mesh position={[0, 3.5, 0]} userData={{ interactable: true, action: 'undo' }}>
                <boxGeometry args={[2, 0.7, 0.15]} />
                <meshStandardMaterial
                    color={hoverAction === 'undo' && isAtDepth ? '#666600' : '#333300'}
                    emissive="#ffff00"
                    emissiveIntensity={hoverAction === 'undo' && isAtDepth ? 1.2 : 0.2}
                />
                <Text position={[0, 0, 0.12]} fontSize={0.26} color="white" anchorX="center" anchorY="middle" font={undefined}>
                    ⟲ Undo
                </Text>
            </mesh>

            {/* Reset button */}
            <mesh position={[2.5, 3.5, 0]} userData={{ interactable: true, action: 'clear' }}>
                <boxGeometry args={[2, 0.7, 0.15]} />
                <meshStandardMaterial
                    color={hoverAction === 'clear' && isAtDepth ? '#550000' : '#330000'}
                    emissive="#ff2200"
                    emissiveIntensity={hoverAction === 'clear' && isAtDepth ? 1.2 : 0.2}
                />
                <Text position={[0, 0, 0.12]} fontSize={0.26} color="white" anchorX="center" anchorY="middle" font={undefined}>
                    ✕ Reset
                </Text>
            </mesh>

            {/* Title — centered below buttons */}
            <Text position={[0, 2.5, -1]} fontSize={0.5} color="#00ffff" anchorX="center" anchorY="middle" font={undefined}>
                PAINT
            </Text>

            {/* ═══════════ STROKES (glow + core) ═══════════════════════════ */}
            {allStrokes.map(stroke =>
                stroke.points.length > 1 ? (
                    <group key={stroke.id}>
                        {/* Outer glow halo — wider, semi-transparent */}
                        <Line
                            points={getCurvePoints(stroke.points)}
                            color={stroke.color}
                            lineWidth={stroke.width * 3.5}
                            transparent
                            opacity={0.15}
                            dashed={false}
                        />
                        {/* Mid glow */}
                        <Line
                            points={getCurvePoints(stroke.points)}
                            color={stroke.color}
                            lineWidth={stroke.width * 2}
                            transparent
                            opacity={0.35}
                            dashed={false}
                        />
                        {/* Core line — bright and sharp */}
                        <Line
                            points={getCurvePoints(stroke.points)}
                            color={stroke.color}
                            lineWidth={stroke.width}
                            dashed={false}
                        />
        </group>
                ) : null
            )}

            {/* ═══════════ LIVE BRUSH CURSOR (glowing) ══════════════════════ */}
            <group position={[pointerX * 10, pointerY * 10, pointerZ * 5]}>
                {/* Outer glow */}
                <mesh>
                    <sphereGeometry args={[isPinching ? 0.5 : 0.3, 16, 16]} />
                    <meshBasicMaterial
                        color={DRAW_COLOR}
                        opacity={isPinching ? 0.12 : 0.06}
                        transparent
                    />
                </mesh>
                {/* Inner glow */}
                <mesh>
                    <sphereGeometry args={[isPinching ? 0.3 : 0.18, 16, 16]} />
                    <meshBasicMaterial
                        color={DRAW_COLOR}
                        opacity={isPinching ? 0.3 : 0.15}
                        transparent
                    />
                </mesh>
                {/* Core dot */}
                <mesh>
                    <sphereGeometry args={[isPinching ? 0.15 : 0.08, 16, 16]} />
                    <meshBasicMaterial
                        color={DRAW_COLOR}
                        opacity={isPinching ? 1.0 : 0.6}
                        transparent
                    />
                </mesh>
            </group>
        </group>
    );
}
