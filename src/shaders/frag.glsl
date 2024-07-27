uniform float uTime;
uniform float uHover;
uniform sampler2D tex1;
uniform sampler2D tex2;
uniform float uPixels[36];
varying vec2 vUv;
#include '../glsl/noise.glsl'
void main() {
int indexProgress = int(uHover * 36.1);
float pixellation = floor(500. * uPixels[indexProgress]);
float gridSize = 2500. / pixellation;
vec2 newUV = floor(vUv * gridSize) / gridSize + 0.5/vec2(gridSize);
// float intensity =sin(3.14159 * uHover);
// float distortion = noise(vUv * 10.0) * 1.* intensity;
// vec2 distortedUV = vec2(vUv.x  , vUv.y +  distortion *.3 );
// vec4 color1 = texture2D(tex2, vUv);
// vec4 color2 = texture2D(tex2, distortedUV);
// vec4 color2 = texture2D(tex2,vec2(abs(.01 * uTime),vUv.y));
gl_FragColor = texture2D(tex2,newUV);
// gl_FragColor = mix(color2, color1 , step(vUv.x,uHover) );
}
