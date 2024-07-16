// import { createOrthographicCamera } from "./createCamera";
import { lerp } from "three/src/math/MathUtils.js";
import gsap from "gsap";
import * as THREE from "three";
import { loadAllAssets, getTexture } from "./loader";
import { createOrthographicCamera } from "./createCamera";
// import { raycast, onPointerMove } from "./Mouse";

// const pointer = new THREE.Vector2();
// const onPointerMove = () => {
//   window.addEventListener("pointermove", (event) => {
//     pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
//     pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
//   });
// };
// onPointerMove();

class CanvasBase {
  constructor() {
    this.objects = [];
    this.global = {};
    this.raycaster = new THREE.Raycaster();
    this.loadTex = new THREE.TextureLoader();
    this.canvas = document.querySelector("#canvas");
    this.canvasRect = this.canvas.getBoundingClientRect();
    this.newRect = null;
    // window.addEventListener("loaded", () => {
    this.init().then(() => {
      this.getSize(this.newRect, this.canvasRect);
      this.getResize = this.getResize.bind(this);
      this.getResize(this.objects, this.canvasRect);
      this.render = this.render.bind(this);
      this.render();
      this.updateScroll();
    });
    // });
  }
  async init() {
    const canvasWidth = this.canvasRect.width;
    const canvasHeight = this.canvasRect.height;
    this.global.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.global.renderer.setSize(this.canvasRect.width, this.canvasRect.height, false);
    this.global.renderer.setPixelRatio(window.devicePixelRatio);
    this.global.renderer.setClearColor(0x000000, 0);
    const camera = createOrthographicCamera(canvasWidth, canvasHeight);
    this.global.renderer.camera = camera;
    this.global.renderer.camera.position.z = 200;
    const targets = document.querySelectorAll("[data-webgl]");
    this.global.renderer.scene = new THREE.Scene();
    const prim = [...targets].map(async (target) => {
      this.newRect = target.getBoundingClientRect();
      const rect = target.getBoundingClientRect();
      await loadAllAssets();
      const texes = await getTexture(target);
      const { x, y } = this.getSize(this.newRect, this.canvasRect);
      const geometry = new THREE.PlaneGeometry(this.newRect.width, rect.height, 1, 1);
      const material = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uHover: { value: 0 },
          // uTex: { value: tex1 },
        },
        vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
        `,
        fragmentShader: `
        uniform float uTime;
        uniform float uHover;
        uniform sampler2D tex1;
        uniform sampler2D tex2;
        varying vec2 vUv;
        float rand(vec2 n) {
          return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
        }
        float noise(vec2 p){
          vec2 ip = floor(p);
          vec2 u = fract(p);
          u = u*u*(3.0-2.0*u);
          float res = mix(
            mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),
            mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);
          return res*res;
        }
        void main() {
        float intensity =sin(3.14159 * uHover);
        float distortion = noise(vUv * 10.0) * 1.*intensity;
        vec2 distortedUV = vec2(vUv.x  , vUv.y +  distortion *.3 );
        vec4 color1 = texture2D(tex1, distortedUV);
        vec4 color2 = texture2D(tex2, distortedUV);
        gl_FragColor = mix(color1, color2, uHover);
          //  gl_FragColor = texture2D(tex1, vUv);
        }
        `,
      });

      for (let [key, tex] of texes) {
        material.uniforms[key] = { value: tex };
      }

      const mesh = new THREE.Mesh(geometry, material);
      const object = {
        mesh,
        x,
        y,
        geometry,
        rect,
        target,
      };
      mesh.position.x = x;
      mesh.position.y = y;
      this.objects.push(object);

      // target.addEventListener("mouseover", (event) => {
      //   gsap.to(material.uniforms.uHover, { value: 1 });
      // });
      // target.addEventListener("mouseleave", (event) => {
      //   gsap.to(material.uniforms.uHover, { value: 0 });
      // });
      this.global.renderer.scene.add(mesh);

      // 今回の交差を監視する要素
      const options = {
        root: null, // 今回はビューポートをルート要素とする
        rootMargin: "-50% 0px", // ビューポートの中心を判定基準にする
        threshold: 0, // 閾値は0
      };
      const observer = new IntersectionObserver(doWhenIntersect, options);
      // それぞれのboxを監視する
      // target.forEach((box) => {

      // });
      observer.observe(target);
      function doWhenIntersect(entries) {
        // 交差検知をしたもののなかで、isIntersectingがtrueのDOMを色を変える関数に渡す
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            gsap.to(material.uniforms.uHover, { value: 1 });
          } else {
            gsap.to(material.uniforms.uHover, { value: 0 });
          }
        });
      }

      return object;
    });
    await Promise.all(prim);
  }

  updateScroll(object) {
    if (!object) return;
    const { mesh, target } = object;
    const rect = target.getBoundingClientRect();
    const { y } = this.getSize(rect, this.canvasRect);
    mesh.position.y = y;
  }

  getSize(rect, canvasRect) {
    const x = rect.left + rect.width / 2 - canvasRect.width / 2;
    const y = -rect.top - rect.height / 2 + canvasRect.height / 2;
    return { x, y };
  }

  getResize() {
    let timerId = null;
    window.addEventListener("resize", () => {
      clearTimeout(timerId);
      timerId = setTimeout(() => {
        //canvasのサイズを変更
        const canvasRect = this.canvas.getBoundingClientRect();
        this.global.renderer.setSize(canvasRect.width, canvasRect.height, false);

        //meshの位置を変更,
        this.objects.forEach((object) => {
          const { target, mesh, geometry, rect } = object;
          //domの位置を取得
          const targetRect = target.getBoundingClientRect();
          const { x, y } = this.getSize(targetRect, canvasRect);
          mesh.position.x = x;
          mesh.position.y = y;
          geometry.scale(targetRect.width / rect.width, targetRect.height / rect.height, 1);
          object.rect = targetRect;
        });

        //カメラの位置を変更
        const canvasWidth = canvasRect.width;
        const canvasHeight = canvasRect.height;
        const camera = createOrthographicCamera(canvasWidth, canvasHeight);

        this.global.renderer.camera = camera;
        console.log(this.global.renderer.camera);
        this.global.renderer.camera.position.z = 200;
        console.log(this.global.renderer.camera);
      }, 500);
    });
  }

  render() {
    requestAnimationFrame(this.render);
    this.objects.forEach((object) => {
      this.updateScroll(object);
    });
    this.global.renderer.render(this.global.renderer.scene, this.global.renderer.camera);
  }
}

new CanvasBase();
