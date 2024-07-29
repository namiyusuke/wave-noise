varying vec2 vUv;
float PI = 3.141592653589793;
uniform float uScrollVelocity; // - (scroll up) / + (scroll down)
  vec3 deformationCurve(vec3 position, vec2 uv) {
  position.y = position.y - (sin(uv.x * PI) * min(abs(uScrollVelocity), 20.0) * sign(uScrollVelocity) * -10.01);
  return position;
}
void main() {

   vec3 deformedPosition = deformationCurve(position, uv);
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(deformedPosition, 1.0);
}
