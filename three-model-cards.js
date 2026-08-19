import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const stages = Array.from(document.querySelectorAll(".model-showcase-stage"));
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (stages.length > 0) {
  const loader = new GLTFLoader();

  stages.forEach((stage, index) => {
    const card = stage.closest(".model-showcase-card");
    const modelPath = stage.dataset.model;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(32, 1, 0.01, 100);
    camera.position.set(0, 0.15, 3.2);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.setClearColor(0x000000, 0);

    stage.prepend(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x5a5a5a, 1.7));

    const key = new THREE.DirectionalLight(0xffffff, 2.25);
    key.position.set(3.5, 5, 4);
    scene.add(key);

    const rim = new THREE.DirectionalLight(0xffffff, 1.15);
    rim.position.set(-4, 2.5, -3);
    scene.add(rim);

    const modelGroup = new THREE.Group();
    scene.add(modelGroup);

    let modelRoot = null;
    let isVisible = true;

    const resize = () => {
      const width = Math.max(1, stage.clientWidth);
      const height = Math.max(1, stage.clientHeight);

      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(stage);
    resize();

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0.02 }
    );

    visibilityObserver.observe(stage);

    loader.load(
      modelPath,
      (gltf) => {
        modelRoot = gltf.scene;

        const initialBox = new THREE.Box3().setFromObject(modelRoot);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();

        initialBox.getSize(size);
        initialBox.getCenter(center);

        modelRoot.position.sub(center);

        const maxDimension = Math.max(size.x, size.y, size.z);
        if (Number.isFinite(maxDimension) && maxDimension > 0) {
          modelRoot.scale.setScalar(1.95 / maxDimension);
        }

        modelRoot.rotation.x = 0.08;
        modelRoot.rotation.y = index * 0.42;

        modelGroup.add(modelRoot);
        stage.classList.add("is-loaded");
      },
      undefined,
      (error) => {
        console.warn(`Could not load 3D showcase model: ${modelPath}`, error);

        // Empty model slots should not leave broken cards in the portfolio.
        if (card) card.hidden = true;
      }
    );

    const clock = new THREE.Clock();

    const animate = () => {
      requestAnimationFrame(animate);

      const delta = Math.min(clock.getDelta(), 0.05);

      if (modelRoot && !reducedMotion && isVisible) {
        modelGroup.rotation.y += delta * 0.45;
      }

      if (isVisible) {
        renderer.render(scene, camera);
      }
    };

    animate();
  });
}
