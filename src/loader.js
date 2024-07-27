import * as THREE from "three";
const textureCache = new Map();
const loader = new THREE.TextureLoader();
export async function loadAllAssets() {
  const els = document.querySelectorAll("[data-webgl]");
  for (const el of els) {
    const data = el.dataset;
    for (const key in data) {
      if (!key.includes("tex")) continue;
      const url = data[key];
      if (!textureCache.has(url)) {
        const tex = new THREE.TextureLoader().load(url);
        textureCache.set(url, null);
      }
    }
  }
  const textPrms = [];
  textureCache.forEach((_, url) => {
    const prms = loadTex(url).then((tex) => {
      textureCache.set(url, tex);
    });
    textPrms.push(prms);
  });
  await Promise.all(textPrms);
  async function loadTex(url) {
    const tex = await loader.loadAsync(url);
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearFilter;
    tex.needsUpdate = false;
    return tex;
  }
}
export async function getTexture(target) {
  const texes = new Map();
  const data = target.dataset;
  let mediaLoaded = null;
  let first = true;
  for (let key in data) {
    if (!key.includes("tex")) continue;
    const url = target.dataset[key];
    key = key.replace("-", "");
    const tex = textureCache.get(url);
    texes.set(key, tex);
    if (first && target instanceof HTMLImageElement) {
      mediaLoaded = new Promise((resolve) => {
        target.onload = () => {
          resolve();
        };
      });
      target.src = url;
      first = false;
    }
  }
  await mediaLoaded;
  return texes;
}
