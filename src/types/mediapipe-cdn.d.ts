declare module 'https://cdn.jsdelivr.net/npm/@mediapipe/hands?module' {
  export const Hands: any;
  export default Hands;
}

declare module 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils?module' {
  export const Camera: any;
  export default Camera;
}

// Also support imports without the ?module query
declare module 'https://cdn.jsdelivr.net/npm/@mediapipe/hands' {
  export const Hands: any;
  export default Hands;
}

declare module 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils' {
  export const Camera: any;
  export default Camera;
}