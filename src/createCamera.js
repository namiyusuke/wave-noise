import * as THREE from "three";

export const createOrthographicCamera = (w, h) => {
  //カメラの位置を変更
  // const canvasWidth = w.width;
  // const canvasHeight = h.height;
  const aspect = w / h;
  const cameraPosition = 200;
  const near = 140;
  const far = 400;
  const radian = Math.atan(h / 2 / cameraPosition);
  const fov = radian * 2 * (180 / Math.PI);
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  // this.global.renderer.camera.position.z = cameraPosition;
  return camera;
};
