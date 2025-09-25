
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { NearestFilter } from 'three';

// Helper to create a cone for FOV visualization
function createFOVCone(fovDeg, aspect, near, far) {
  const fov = THREE.MathUtils.degToRad(fovDeg);
  const height = far - near;
  const radius = Math.tan(fov / 2) * far;
  const geometry = new THREE.ConeGeometry(radius, far, 32, 1, true);
  geometry.translate(0, -far/2, 0);
  const material = new THREE.MeshBasicMaterial({ color: 0x60a5fa, opacity: 0.15, transparent: true, depthWrite: false });
  const cone = new THREE.Mesh(geometry, material);
  cone.rotateX(-Math.PI/2);
  return cone;
}

export default function Scene3D({ selectedCamera, setQuantitative }) {
  const mountRef = useRef(null);
  const [objectsLoaded, setObjectsLoaded] = useState(false);

  useEffect(() => {
    const width = mountRef.current.clientWidth || window.innerWidth;
    const height = mountRef.current.clientHeight || window.innerHeight;

    // Main renderer and scene
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    mountRef.current.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf3f4f6);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 15, 30);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(20, 30, 20);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x666666));

    // Ground
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100),
      new THREE.MeshStandardMaterial({ color: 0xe5e7eb })
    );
    plane.rotation.x = -Math.PI / 2;
    scene.add(plane);

    // Overlay scene to show camera view as a textured quad
    const overlayScene = new THREE.Scene();
    const overlayCamera = new THREE.OrthographicCamera(-width/2, width/2, height/2, -height/2, 0, 10);

    // Loaders
    const loader = new GLTFLoader();

    // Arrays to store logical cameras and objects
    const logicalCameras = [];
    const objectMeshes = [];

    // Function to load models referenced in backend DB (stored in frontend/public/models)
    const modelFiles = ['car.glb','motorcycle.glb','person.glb','dog.glb','tree.glb'];
    const modelPromises = modelFiles.map(name => {
      const p = new Promise((resolve) => {
        const path = `./public/models/${name}`;
        loader.load(path, (gltf) => {
          const mesh = gltf.scene;
          mesh.userData = { src: path };
          mesh.scale.set(1,1,1);
          resolve(mesh);
        }, undefined, () => {
          // on error, create a simple placeholder box
          const box = new THREE.Mesh(new THREE.BoxGeometry(1.5,1.5,1.5), new THREE.MeshStandardMaterial({color:0x999999}));
          resolve(box);
        });
      });
      return p;
    });

    Promise.all(modelPromises).then(meshes => {
      // position meshes in scene
      meshes.forEach((m, i) => {
        m.position.set((i-2)*6, 0.75, (i%2===0)? -4 : 4);
        scene.add(m);
        objectMeshes.push(m);
      });

      // create sample logical cameras (these would normally come from DB or user)
      const cam1 = new THREE.PerspectiveCamera(60, 16/9, 0.1, 100);
      cam1.userData = { name: 'Cam 1', resolution: 1080, lensFov: 90, pos: new THREE.Vector3(-10,4,10) };
      cam1.position.copy(cam1.userData.pos);
      cam1.lookAt(new THREE.Vector3(0,1,0));
      scene.add(cam1);
      logicalCameras.push(cam1);

      const cam2 = new THREE.PerspectiveCamera(45, 16/9, 0.1, 100);
      cam2.userData = { name: 'Cam 2', resolution: 2688, lensFov: 45, pos: new THREE.Vector3(12,4,8) };
      cam2.position.copy(cam2.userData.pos);
      cam2.lookAt(new THREE.Vector3(0,1,0));
      scene.add(cam2);
      logicalCameras.push(cam2);

      setObjectsLoaded(true);
    });

    // Create a render target (will be resized when we have a selectedCamera)
    let rt = new THREE.WebGLRenderTarget(256, 144);
    rt.texture.minFilter = NearestFilter;
    rt.texture.magFilter = NearestFilter;

    // Plane to display the render target texture as overlay
    const overlayPlaneMat = new THREE.MeshBasicMaterial({ map: rt.texture, toneMapped: false });
    const overlayPlaneGeom = new THREE.PlaneGeometry(320, 180);
    const overlayPlane = new THREE.Mesh(overlayPlaneGeom, overlayPlaneMat);
    // position it bottom-right in screen space via overlayScene units (which range -w/2..w/2)
    overlayPlane.position.set(width/2 - 170, -height/2 + 100, 0);
    overlayScene.add(overlayPlane);

    // FOV cone helpers per logical camera
    const fovHelpers = [];

    function updateRenderTargetForSelected(camData) {
      if (!camData) return;
      // derive a small render target size based on camera resolution (simulate pixelation)
      const res = camData.resolution || 1080;
      // choose width proportional to resolution; downscale factor to produce visible pixels
      const baseWidth = Math.min(1920, res);
      const smallWidth = Math.max(64, Math.round(baseWidth * 0.18)); // adjustable factor
      const smallHeight = Math.max(36, Math.round(smallWidth * 9/16));
      if (rt) rt.dispose();
      rt = new THREE.WebGLRenderTarget(smallWidth, smallHeight);
      rt.texture.minFilter = NearestFilter;
      rt.texture.magFilter = NearestFilter;
      overlayPlane.material.map = rt.texture;
      overlayPlane.material.needsUpdate = true;
    }

    // Animation loop
    function animate() {
      requestAnimationFrame(animate);

      // Render the scene normally
      renderer.setRenderTarget(null);
      renderer.render(scene, camera);

      // If a selectedCamera is provided, render scene from that camera into small RT, then show as overlay with pixelation (nearest filter)
      if (selectedCamera && objectsLoaded) {
        // find nearest logical camera or use passed selectedCamera parameters to setup a temp camera
        // In this prototype, selectedCamera can be an object { position: {x,y,z}, rotationY, resolution, lensFov }
        let viewCam = new THREE.PerspectiveCamera(
          selectedCamera.lensFov || 60,
          16/9,
          0.1,
          200
        );
        viewCam.position.set(selectedCamera.position.x, selectedCamera.position.y, selectedCamera.position.z);
        const target = new THREE.Vector3(selectedCamera.target?.x || 0, selectedCamera.target?.y || 1, selectedCamera.target?.z || 0);
        viewCam.lookAt(target);

        // update RT based on resolution
        updateRenderTargetForSelected(selectedCamera);

        // render scene from viewCam into rt
        renderer.setRenderTarget(rt);
        renderer.clear();
        renderer.render(scene, viewCam);
        renderer.setRenderTarget(null);

        // render overlay scene (which contains a plane textured with rt.texture)
        renderer.clearDepth();
        renderer.render(overlayScene, overlayCamera);
      }
    }

    animate();

    // handle resize
    function onResize() {
      const w = mountRef.current.clientWidth || window.innerWidth;
      const h = mountRef.current.clientHeight || window.innerHeight;
      renderer.setSize(w, h);
      camera.aspect = w/h;
      camera.updateProjectionMatrix();
      overlayCamera.left = -w/2; overlayCamera.right = w/2;
      overlayCamera.top = h/2; overlayCamera.bottom = -h/2;
      overlayCamera.updateProjectionMatrix();
      // reposition overlayPlane
      overlayPlane.position.set(w/2 - 170, -h/2 + 100, 0);
    }
    window.addEventListener('resize', onResize);

    // cleanup on unmount
    return () => {
      try {
        window.removeEventListener('resize', onResize);
        mountRef.current.removeChild(renderer.domElement);
        renderer.dispose();
        rt.dispose();
      } catch (e) {}
    };
  }, [selectedCamera]);

  return <div ref={mountRef} style={{ width: '100%', height: '100vh' }} />;
}
