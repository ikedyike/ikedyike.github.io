import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const gltfLoader = new GLTFLoader();

const renderJobs = [];
const clock = new THREE.Clock();

function createRenderer(stage) {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.setClearColor(0x000000, 0);

  stage.prepend(renderer.domElement);
  return renderer;
}

function addLighting(scene) {
  scene.add(new THREE.HemisphereLight(0xffffff, 0x555555, 1.65));

  const key = new THREE.DirectionalLight(0xffffff, 2.3);
  key.position.set(3.5, 5, 4);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0xffffff, 1.1);
  rim.position.set(-4, 2.5, -3);
  scene.add(rim);
}

function makeDraggable(stage, state) {
  let dragging = false;
  let lastX = 0;

  stage.addEventListener("pointerdown", (event) => {
    dragging = true;
    lastX = event.clientX;
    state.velocity = 0;
    stage.setPointerCapture?.(event.pointerId);
  });

  stage.addEventListener("pointermove", (event) => {
    if (!dragging) return;

    const dx = event.clientX - lastX;
    lastX = event.clientX;

    const delta = dx * 0.006;
    state.dragYaw += delta;
    state.velocity = THREE.MathUtils.clamp(delta, -0.12, 0.12);
  });

  const finish = () => {
    dragging = false;
  };

  stage.addEventListener("pointerup", finish);
  stage.addEventListener("pointercancel", finish);

  state.isDragging = () => dragging;
}

function setupModelStage(stage, index) {
  const renderer = createRenderer(stage);
  const scene = new THREE.Scene();

  addLighting(scene);

  const isHero = stage.dataset.hero === "true";
  const camera = new THREE.PerspectiveCamera(isHero ? 30 : 34, 1, 0.01, 100);
  camera.position.set(0, isHero ? 0.1 : 0.08, isHero ? 3.25 : 3.05);
  camera.lookAt(0, 0, 0);

  const group = new THREE.Group();
  scene.add(group);

  let model = null;
  let visible = true;

  const state = {
    dragYaw: 0,
    velocity: 0,
    isDragging: () => false
  };

  makeDraggable(stage, state);

  const resize = () => {
    const width = Math.max(1, stage.clientWidth);
    const height = Math.max(1, stage.clientHeight);

    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  new ResizeObserver(resize).observe(stage);
  resize();

  new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
    },
    { threshold: 0.02 }
  ).observe(stage);

  gltfLoader.load(
    stage.dataset.model,
    (gltf) => {
      model = gltf.scene;

      const box = new THREE.Box3().setFromObject(model);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();

      box.getSize(size);
      box.getCenter(center);

      model.position.sub(center);

      const maxDimension = Math.max(size.x, size.y, size.z);
      if (Number.isFinite(maxDimension) && maxDimension > 0) {
        model.scale.setScalar((isHero ? 2.15 : 1.9) / maxDimension);
      }

      model.rotation.x = isHero ? 0.10 : 0.08;
      group.rotation.y = index * 0.31;

      group.add(model);
      stage.classList.add("is-loaded");
    },
    undefined,
    (error) => {
      console.warn(`Could not load ${stage.dataset.model}`, error);
      stage.classList.add("is-error");
    }
  );

  renderJobs.push({
    update(delta) {
      if (!visible) return;

      if (model && !reducedMotion) {
        if (!state.isDragging()) {
          group.rotation.y += delta * (isHero ? 0.32 : 0.40);
          state.dragYaw += state.velocity;
          state.velocity *= 0.92;
        }

        group.rotation.y += state.dragYaw;
        state.dragYaw *= 0.82;
      }

      renderer.render(scene, camera);
    }
  });
}

function coverCropTexture(texture, frameAspect) {
  const image = texture.image;
  if (!image || !image.width || !image.height) return;

  const imageAspect = image.width / image.height;
  texture.center.set(0.5, 0.5);

  if (imageAspect > frameAspect) {
    const scaleX = frameAspect / imageAspect;
    texture.repeat.set(scaleX, 1);
    texture.offset.set((1 - scaleX) / 2, 0);
  } else {
    const scaleY = imageAspect / frameAspect;
    texture.repeat.set(1, scaleY);
    texture.offset.set(0, (1 - scaleY) / 2);
  }

  texture.needsUpdate = true;
}

async function loadTexture(loader, src, renderer) {
  return new Promise((resolve) => {
    loader.load(
      src,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        resolve(texture);
      },
      undefined,
      () => resolve(null)
    );
  });
}

async function setupOrbitingGallery() {
  const stage = document.getElementById("threejs-orbit-stage");
  if (!stage) return;

  const renderer = createRenderer(stage);
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0.25, 7.8);
  camera.lookAt(0, 0, 0);

  const ring = new THREE.Group();
  ring.rotation.x = -0.12;
  scene.add(ring);

  const imagePaths = [
    "../assets/images/projects/spellfister.jpg",
    "../assets/images/projects/waxheart.jpg",
    "../assets/images/projects/dealt-in-darkness.jpg",
    "../assets/images/projects/rock-paw-scissors.jpg",
    "../assets/images/projects/dino-drop.jpg",
    "../assets/images/projects/trick-or-treat.jpg",
    "../assets/images/projects/recycle-me.jpg",
    "../assets/images/projects/custom-gift-platformer.jpg",
    "../assets/images/projects/tbdtdgoat.jpg"
  ];

  const textureLoader = new THREE.TextureLoader();
  const textures = (
    await Promise.all(
      imagePaths.map((src) => loadTexture(textureLoader, src, renderer))
    )
  ).filter(Boolean);

  const cardAspect = 16 / 10;
  const cardHeight = 1.38;
  const cardWidth = cardHeight * cardAspect;
  const radius = 3.25;

  const geometry = new THREE.PlaneGeometry(cardWidth, cardHeight);
  const cards = [];

  textures.forEach((texture, index) => {
    coverCropTexture(texture, cardAspect);

    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide
    });

    const card = new THREE.Mesh(geometry, material);
    const angle = (index / textures.length) * Math.PI * 2;

    card.position.set(
      Math.cos(angle) * radius,
      0,
      Math.sin(angle) * radius
    );

    ring.add(card);
    cards.push(card);
  });

  if (cards.length > 0) {
    stage.classList.add("is-loaded");
  }

  let dragging = false;
  let lastX = 0;
  let velocity = 0;
  let dragSpin = 0;
  let visible = true;

  stage.addEventListener("pointerdown", (event) => {
    dragging = true;
    lastX = event.clientX;
    velocity = 0;
    stage.setPointerCapture?.(event.pointerId);
  });

  stage.addEventListener("pointermove", (event) => {
    if (!dragging) return;

    const dx = event.clientX - lastX;
    lastX = event.clientX;

    const delta = dx * 0.0045;
    dragSpin += delta;
    velocity = THREE.MathUtils.clamp(delta, -0.12, 0.12);
  });

  const finish = () => {
    dragging = false;
  };

  stage.addEventListener("pointerup", finish);
  stage.addEventListener("pointercancel", finish);

  const resize = () => {
    const width = Math.max(1, stage.clientWidth);
    const height = Math.max(1, stage.clientHeight);

    renderer.setSize(width, height, false);
    camera.aspect = width / height;

    // Pull the camera back a little on narrower screens.
    camera.position.z = width < 650 ? 9.1 : 7.8;
    camera.updateProjectionMatrix();
  };

  new ResizeObserver(resize).observe(stage);
  resize();

  new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
    },
    { threshold: 0.02 }
  ).observe(stage);

  const worldPosition = new THREE.Vector3();

  renderJobs.push({
    update(delta, elapsed) {
      if (!visible) return;

      if (!reducedMotion) {
        if (!dragging) {
          ring.rotation.y += delta * 0.12;
          dragSpin += velocity;
          velocity *= 0.92;
        }

        ring.rotation.y += dragSpin;
        dragSpin *= 0.84;
      }

      cards.forEach((card, index) => {
        card.position.y = reducedMotion
          ? 0
          : Math.sin(elapsed * 1.2 + index * 0.6) * 0.08;

        card.lookAt(camera.position);
        card.rotateY(Math.PI);

        card.getWorldPosition(worldPosition);
        const distance = worldPosition.distanceTo(camera.position);

        const depth = THREE.MathUtils.clamp(
          (distance - 5.1) / 6.1,
          0,
          1
        );

        const scale = THREE.MathUtils.lerp(1, 0.82, depth);
        card.scale.setScalar(scale);
        card.material.opacity = THREE.MathUtils.lerp(1, 0.64, depth);
      });

      renderer.render(scene, camera);
    }
  });
}


document.querySelectorAll(".threejs-model-stage").forEach((stage, index) => {
  setupModelStage(stage, index);
});

await setupOrbitingGallery();

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.elapsedTime;

  renderJobs.forEach((job) => job.update(delta, elapsed));
}

animate();
