// import { createOrthographicCamera } from "./createCamera";
import { lerp } from "three/src/math/MathUtils.js";
import gsap from "gsap";
import * as THREE from "three";
import vertex from "./shaders/vert.glsl";
import fragment from "./shaders/frag.glsl";
import { loadAllAssets, getTexture } from "./loader";
import { createOrthographicCamera } from "./createCamera";
import Lenis from "lenis";
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
    this.pixel = [
      1, 1.5, 2, 2.5, 3, 1, 1.5, 2, 2.5, 3, 3.5, 4, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5,
      7, 7.5, 8, 8.5, 9, 20, 100,
    ].map((v) => v / 100);
    this.raycaster = new THREE.Raycaster();
    this.clock = new THREE.Clock();
    this.scrollVelocity = 0;
    this.delta = 0;
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
    // smooth scroll (lenis)
    const lenis = new Lenis();
    // let scroll = {
    //   scrollY: window.scrollY,
    //   scrollVelocity: 0,
    // };
    lenis.on("scroll", (e) => {
      // scroll.scrollY = window.scrollY;
      this.scrollVelocity = e.velocity;
    });
    function scrollRaf(time) {
      lenis.raf(time);
      requestAnimationFrame(scrollRaf);
    }
    requestAnimationFrame(scrollRaf);
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
      const geometry = new THREE.PlaneGeometry(this.newRect.width, rect.height, 100, 100);
      const material = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uHover: { value: 1 },
          uPixels: { value: this.pixel },
          uScrollVelocity: { value: 0 },
          // uTex: { value: tex1 },
        },
        vertexShader: vertex,
        fragmentShader: fragment,
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
        material,
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
            gsap.to(material.uniforms.uHover, { value: 0, duration: 2 });
          } else {
            gsap.to(material.uniforms.uHover, { value: 1, duration: 2 });
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
    this.delta = this.clock.getElapsedTime();
    this.objects.forEach((object) => {
      this.updateScroll(object);
      object.material.uniforms.uTime.value = this.delta;
      object.material.uniforms.uScrollVelocity.value = this.scrollVelocity;
      console.log(object.material.uniforms.uScrollVelocity.value);
    });

    this.global.renderer.render(this.global.renderer.scene, this.global.renderer.camera);
  }
}

new CanvasBase();
