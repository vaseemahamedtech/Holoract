import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

interface UseHoloractRaycasterProps {
  pointerX: number;
  pointerY: number;
  pointerZ?: number;
  isPinching: boolean;
  onHover?: (object: THREE.Object3D | null) => void;
  onPinchStart?: (object: THREE.Object3D | null) => void;
  onPinchEnd?: () => void;
  onDrag?: (position: THREE.Vector3) => void;
}

export function useHoloractRaycaster({
  pointerX,
  pointerY,
  pointerZ,
  isPinching,
  onHover,
  onPinchStart,
  onPinchEnd,
  onDrag,
}: UseHoloractRaycasterProps) {
  const { camera, scene } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const pointer = useRef(new THREE.Vector2());
  
  const plane = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0));

  const hoveredObject = useRef<THREE.Object3D | null>(null);
  const draggedObject = useRef<THREE.Object3D | null>(null);
  const wasPinching = useRef(false);
  const initialPointerZ = useRef(0);
  const initialObjectZ = useRef(0);

  useFrame(() => {
    pointer.current.set(pointerX, pointerY);
    raycaster.current.setFromCamera(pointer.current, camera);

    if (isPinching && !wasPinching.current) {
        const intersects = raycaster.current.intersectObjects(scene.children, true);
        
        let found = null;
        for (const hit of intersects) {
            if (hit.object.userData.interactable || hit.object.userData.draggable) {
                found = hit.object;
                break;
            }
            let parent = hit.object.parent;
            while (parent) {
                 if (parent.userData.interactable || parent.userData.draggable) {
                     found = parent;
                     break;
                 }
                 parent = parent.parent;
            }
            if (found) break;
        }

        if (found) {
            draggedObject.current = found;
            initialPointerZ.current = pointerZ || 0;
            initialObjectZ.current = found.position.z;
            onPinchStart?.(found);
            
            plane.current.setFromNormalAndCoplanarPoint(
                camera.getWorldDirection(plane.current.normal),
                found.position
            );
        } else {
             onPinchStart?.(null);
        }

        wasPinching.current = true;
    } else if (!isPinching && wasPinching.current) {
        onPinchEnd?.();
        draggedObject.current = null;
        wasPinching.current = false;
    } else if (isPinching && draggedObject.current) {
        const intersectPoint = new THREE.Vector3();
        raycaster.current.ray.intersectPlane(plane.current, intersectPoint);
        if (intersectPoint) {
            if (pointerZ !== undefined) {
               const depthDelta = pointerZ - initialPointerZ.current;
               intersectPoint.z = initialObjectZ.current + depthDelta;
            }
            onDrag?.(intersectPoint);
        }
    } else if (!isPinching) {
        const intersects = raycaster.current.intersectObjects(scene.children, true);
        let found = null;
        for (const hit of intersects) {
            if (hit.object.userData.interactable || hit.object.userData.draggable) {
                found = hit.object;
                break;
            }
             let parent = hit.object.parent;
            while (parent) {
                 if (parent.userData.interactable || parent.userData.draggable) {
                     found = parent;
                     break;
                 }
                 parent = parent.parent;
            }
            if (found) break;
        }

        if (found !== hoveredObject.current) {
            hoveredObject.current = found;
            onHover?.(found);
        }
    }
  });

  return { raycaster, hoveredObject, draggedObject };
}
