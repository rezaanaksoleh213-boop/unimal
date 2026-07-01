import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const container = document.getElementById('chair-3d-container');
const loadingUI = document.getElementById('loading-3d');
const statusBadge = document.getElementById('3d-status-badge');

const scene = new THREE.Scene();
scene.background = null; 

const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 100);
camera.position.set(2.4, 1.4, 3.2); 

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); 
renderer.outputColorSpace = THREE.SRGBColorSpace; 
renderer.toneMapping = THREE.ACESFilmicToneMapping; 
renderer.toneMappingExposure = 1.2;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; 
container.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
keyLight.position.set(4, 6, 3);
keyLight.castShadow = true;
keyLight.shadow.mapSize.width = 2048; 
keyLight.shadow.mapSize.height = 2048;
keyLight.shadow.bias = -0.001;
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 1.0);
fillLight.position.set(-4, 3, 2);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0x0ea5e9, 3.0); 
rimLight.position.set(-3, 4, -4);
scene.add(rimLight);

const floorGeo = new THREE.PlaneGeometry(10, 10);
const floorMat = new THREE.ShadowMaterial({ opacity: 0.3 }); 
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.85; 
floor.receiveShadow = true;
scene.add(floor);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; 
controls.dampingFactor = 0.05;
controls.autoRotate = true; 
controls.autoRotateSpeed = 1.0; 
controls.enablePan = false; 
controls.minDistance = 1.5;
controls.maxDistance = 5.5;
controls.target.set(0, -0.1, 0);

const loader = new GLTFLoader();
loader.load(
    'assets/img/ergosmart-chair.glb', 
    (gltf) => {
        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        
        model.position.x += (model.position.x - center.x);
        model.position.y += (model.position.y - center.y);
        model.position.z += (model.position.z - center.z);
        model.position.y = -0.85; 

        const maxDim = Math.max(size.x, size.y, size.z);
        const desiredScale = 1.6 / maxDim; 
        model.scale.set(desiredScale, desiredScale, desiredScale);
        model.rotation.y = Math.PI / 4; 

        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                if(child.material) child.material.depthWrite = true;
            }
        });

        scene.add(model);
        
        if (loadingUI) {
            loadingUI.style.opacity = '0';
            setTimeout(() => loadingUI.style.display = 'none', 300);
        }
    }, 
    undefined, 
    (error) => {
        console.error('Error 3D:', error);
    }
);

function animate() {
    requestAnimationFrame(animate);
    controls.update(); 
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
});

window.update3DLighting = function(statusMode) {
    if(!rimLight) return;
    
    let targetColor = 0x0ea5e9; 
    let badgeText = "Standby";
    let badgeColor = "text-slate-400";
    
    switch(statusMode) {
        case 'ideal':
            targetColor = 0x10b981; 
            badgeText = "Safe";
            badgeColor = "text-ergo-green font-bold neon-glow";
            break;
        case 'forward':
        case 'back':
            targetColor = 0xef4444; 
            badgeText = "Danger";
            badgeColor = "text-ergo-red font-bold animate-pulse neon-glow";
            break;
        case 'left':
        case 'right':
            targetColor = 0xf59e0b; 
            badgeText = "Warning";
            badgeColor = "text-ergo-yellow font-bold neon-glow";
            break;
    }
    
    const newColor = new THREE.Color(targetColor);
    rimLight.color.lerp(newColor, 1); 
    
    if(statusBadge) {
        statusBadge.innerHTML = badgeText;
        statusBadge.className = `text-[10px] px-2 py-1 rounded-full uppercase tracking-wider bg-slate-800 border border-slate-600 ${badgeColor}`;
    }
};