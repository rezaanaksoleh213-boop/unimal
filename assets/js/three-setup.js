import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ==========================================
// SCENE 1: MAIN DASHBOARD 3D CHAIR
// ==========================================
const container = document.getElementById('chair-3d-container');
const loadingUI = document.getElementById('loading-3d');
const statusBadge = document.getElementById('3d-status-badge');

const scene = new THREE.Scene();
scene.background = null; 

const camera = new THREE.PerspectiveCamera(40, container?.clientWidth / container?.clientHeight || 1, 0.1, 100);
camera.position.set(2.2, 0.8, 3.0); 

let renderer = null;
let controls = null;
let rimLight = null;

if (container) {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
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

    rimLight = new THREE.DirectionalLight(0x0ea5e9, 3.0); 
    rimLight.position.set(-3, 4, -4);
    scene.add(rimLight);

    const floorGeo = new THREE.PlaneGeometry(10, 10);
    const floorMat = new THREE.ShadowMaterial({ opacity: 0.3 }); 
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; 
    controls.dampingFactor = 0.05;
    controls.autoRotate = true; 
    controls.autoRotateSpeed = 1.0; 
    controls.enablePan = false; 
    controls.minDistance = 1.5;
    controls.maxDistance = 5.5;
    controls.target.set(0, -0.2, 0);

    const loader = new GLTFLoader();
    loader.load(
        'assets/img/ergosmart-chair.glb', 
        (gltf) => {
            const model = gltf.scene;
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());
            
            model.position.set(-center.x, -center.y, -center.z);

            const chairWrapper = new THREE.Group();
            chairWrapper.add(model);

            const maxDim = Math.max(size.x, size.y, size.z);
            const desiredScale = 1.6 / maxDim; 
            chairWrapper.scale.setScalar(desiredScale);
            chairWrapper.rotation.y = Math.PI / 4; 
            chairWrapper.position.y = -0.2;

            chairWrapper.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    if(child.material) child.material.depthWrite = true;
                }
            });

            scene.add(chairWrapper);
            floor.position.y = chairWrapper.position.y - ((size.y * desiredScale) / 2);
            
            if (loadingUI) {
                loadingUI.style.opacity = '0';
                setTimeout(() => loadingUI.style.display = 'none', 300);
            }
        }, 
        undefined, 
        (error) => { console.error('Error 3D:', error); }
    );

    function animate() {
        requestAnimationFrame(animate);
        controls.update(); 
        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
        if(container && camera && renderer) {
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        }
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
}

// ==========================================
// SCENE 2: INTRO PARTICLE ASSEMBLY (EFEK SINEMATIK)
// ==========================================
let introInitialized = false;
let introPhase = 0; 
let progressVal = 0;
let isSwooshPlayed = false;

window.resetIntroAnimation = function() {
    introPhase = 0;
    progressVal = 0;
    isSwooshPlayed = false;
    introInitialized = false; 
    
    const introContainer = document.getElementById('intro-3d-container');
    if(introContainer) introContainer.innerHTML = '';
    
    const introText = document.getElementById('intro-text');
    const introProgress = document.getElementById('intro-progress');
    const btnContinue = document.getElementById('btn-continue-dashboard');
    
    if(introText) introText.classList.remove('opacity-0');
    if(introProgress) {
        introProgress.classList.remove('opacity-0');
        introProgress.innerText = "0%";
    }
    if(btnContinue) btnContinue.classList.add('opacity-0', 'pointer-events-none');
};

window.playIntro3D = function() {
    if (introInitialized) return;
    introInitialized = true;

    const introContainer = document.getElementById('intro-3d-container');
    const introProgress = document.getElementById('intro-progress');
    if(introProgress) introProgress.classList.remove('opacity-0');

    const introScene = new THREE.Scene();
    const introCamera = new THREE.PerspectiveCamera(45, introContainer.clientWidth / introContainer.clientHeight, 0.1, 100);
    introCamera.position.set(0, 0.2, 4.2);
    introCamera.lookAt(0, 0, 0);

    const introRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    introRenderer.setSize(introContainer.clientWidth, introContainer.clientHeight);
    introRenderer.setPixelRatio(window.devicePixelRatio);
    introContainer.appendChild(introRenderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    introScene.add(ambient);
    const rim = new THREE.DirectionalLight(0x0ea5e9, 3.0);
    rim.position.set(0, 5, -5);
    introScene.add(rim);

    const cageGeo = new THREE.BoxGeometry(1.6, 2.2, 1.6);
    const cageEdges = new THREE.EdgesGeometry(cageGeo);
    const cageMat = new THREE.LineBasicMaterial({ color: 0x0ea5e9, transparent: true, opacity: 0.15 });
    const cage = new THREE.LineSegments(cageEdges, cageMat);
    introScene.add(cage);

    const dustCount = 100;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    for(let i=0; i<dustCount; i++){
        dustPos[i*3] = (Math.random() - 0.5) * 6;
        dustPos[i*3+1] = (Math.random() - 0.5) * 6;
        dustPos[i*3+2] = (Math.random() - 0.5) * 6;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({color: 0xbae6fd, size: 0.02, transparent: true, opacity: 0.4});
    const dustParticles = new THREE.Points(dustGeo, dustMat);
    introScene.add(dustParticles);

    const particleCount = 8000;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    const particleSpeeds = new Float32Array(particleCount);

    for(let i=0; i<particleCount; i++) {
        const u = Math.random(); const v = Math.random();
        const theta = u * 2.0 * Math.PI; const phi = Math.acos(2.0 * v - 1.0);
        const r = 3 + Math.random() * 5; 

        particlePos[i*3] = r * Math.sin(phi) * Math.cos(theta);
        particlePos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
        particlePos[i*3+2] = r * Math.cos(phi);
        particleSpeeds[i] = 0.02 + Math.random() * 0.05;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    const particleMat = new THREE.PointsMaterial({ color: 0x0ea5e9, size: 0.02, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending });
    const particles = new THREE.Points(particleGeo, particleMat);
    introScene.add(particles);

    let chairWrapper = null;
    let targetScale = 1.0;
    
    const gltfLoader = new GLTFLoader();
    gltfLoader.load('assets/img/ergosmart-chair.glb', (gltf) => {
        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        model.position.set(-center.x, -center.y, -center.z);

        chairWrapper = new THREE.Group();
        chairWrapper.add(model);

        const maxDim = Math.max(size.x, size.y, size.z);
        targetScale = 2.2 / maxDim; 
        
        chairWrapper.scale.setScalar(0); 
        chairWrapper.rotation.y = -Math.PI; 
        introScene.add(chairWrapper);
    });

    const targetRot = Math.PI * 2 + (Math.PI / 4); 

    function animateIntro() {
        requestAnimationFrame(animateIntro);

        dustParticles.rotation.y += 0.001;
        dustParticles.rotation.x += 0.0005;

        if (introPhase === 0) {
            if(!isSwooshPlayed) {
                if(window.playSciFiSwoosh) window.playSciFiSwoosh();
                isSwooshPlayed = true;
            }

            progressVal += 0.7;
            if(progressVal > 99) progressVal = 99;
            if(introProgress) introProgress.innerText = Math.floor(progressVal) + "%";

            cage.rotation.y += 0.002;

            const positions = particles.geometry.attributes.position.array;
            let allArrived = true;
            for(let i=0; i<particleCount; i++) {
                const px = positions[i*3]; const py = positions[i*3+1]; const pz = positions[i*3+2];

                positions[i*3] -= px * particleSpeeds[i];
                positions[i*3+1] -= py * particleSpeeds[i];
                positions[i*3+2] -= pz * particleSpeeds[i];

                if (Math.abs(px) > 0.1 || Math.abs(py) > 0.1 || Math.abs(pz) > 0.1) {
                    allArrived = false;
                }
            }
            particles.geometry.attributes.position.needsUpdate = true;
            particles.rotation.y += 0.01; 

            if(chairWrapper) { chairWrapper.scale.setScalar(0); chairWrapper.rotation.y = -Math.PI; }

            if (allArrived && chairWrapper) {
                introPhase = 1;
                if(introProgress) introProgress.innerText = "100%";
                
                const txt = document.getElementById('intro-text');
                if(txt) txt.classList.add('opacity-0');
            }
        } else if (introPhase === 1) {
            particles.material.opacity -= 0.02;
            cage.material.opacity -= 0.005; 
            
            chairWrapper.scale.x += (targetScale - chairWrapper.scale.x) * 0.08;
            chairWrapper.scale.y = chairWrapper.scale.x;
            chairWrapper.scale.z = chairWrapper.scale.x;
            
            if (chairWrapper.scale.x > targetScale * 0.98) {
                chairWrapper.scale.setScalar(targetScale);
                introPhase = 2;
            }
        } else if (introPhase === 2) {
            chairWrapper.rotation.y += (targetRot - chairWrapper.rotation.y) * 0.05;
            if (targetRot - chairWrapper.rotation.y < 0.01) {
                chairWrapper.rotation.y = targetRot;
                introPhase = 3; 
                
                const btn = document.getElementById('btn-continue-dashboard');
                if (btn) btn.classList.remove('opacity-0', 'pointer-events-none');
            }
        } else if (introPhase === 3) {
            chairWrapper.rotation.y = targetRot + Math.sin(Date.now() * 0.001) * 0.05;
        }

        introRenderer.render(introScene, introCamera);
    }

    animateIntro();

    window.addEventListener('resize', () => {
        if(introContainer && introCamera && introRenderer) {
            introCamera.aspect = introContainer.clientWidth / introContainer.clientHeight;
            introCamera.updateProjectionMatrix();
            introRenderer.setSize(introContainer.clientWidth, introContainer.clientHeight);
        }
    });
};

// ==========================================
// SCENE 3: INTERACTIVE SHOWCASE DENGAN EXTREME ZOOM & HOTSPOT ANOTASI 
// ==========================================
const showcaseContainer = document.getElementById('showcase-3d-container');
const loadingShowcase = document.getElementById('loading-showcase');

// Elemen HTML Anotasi Tanda Panah
const annotOverlay = document.getElementById('annotation-overlay');
const annotText = document.getElementById('annot-text');
const annotDotGlow = document.getElementById('annot-dot-glow');
const annotLine = document.getElementById('annot-line');

if (showcaseContainer) {
    const shScene = new THREE.Scene();
    shScene.background = null; 

    const shCamera = new THREE.PerspectiveCamera(45, showcaseContainer.clientWidth / showcaseContainer.clientHeight, 0.1, 100);
    
    // Kamera Posisi Awal (Default Global View Jauh)
    let targetCamPos = new THREE.Vector3(2.5, 1.2, 3.0);
    let targetLookAt = new THREE.Vector3(0, 0, 0);
    shCamera.position.copy(targetCamPos);

    const shRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    shRenderer.setSize(showcaseContainer.clientWidth, showcaseContainer.clientHeight);
    shRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    shRenderer.outputColorSpace = THREE.SRGBColorSpace;
    showcaseContainer.appendChild(shRenderer.domElement);

    shScene.add(new THREE.AmbientLight(0xffffff, 1.0));
    const shKeyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    shKeyLight.position.set(4, 6, 3);
    shScene.add(shKeyLight);
    
    const shRimLight = new THREE.DirectionalLight(0x0ea5e9, 3.0); 
    shRimLight.position.set(-3, 4, -4);
    shScene.add(shRimLight);

    const shControls = new OrbitControls(shCamera, shRenderer.domElement);
    shControls.enableDamping = true;
    shControls.dampingFactor = 0.05;
    shControls.enablePan = false;
    shControls.minDistance = 0.5;
    shControls.maxDistance = 5.0;

    let activeAnnotation = null;

    const shLoader = new GLTFLoader();
    shLoader.load('assets/img/ergosmart-chair.glb', (gltf) => {
        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        
        model.position.set(-center.x, -center.y, -center.z);
        const wrapper = new THREE.Group();
        wrapper.add(model);

        const maxDim = Math.max(size.x, size.y, size.z);
        wrapper.scale.setScalar(2.0 / maxDim); 
        wrapper.rotation.y = Math.PI / 6; 
        wrapper.position.y = -0.2; 

        shScene.add(wrapper);
        
        if (loadingShowcase) {
            loadingShowcase.style.opacity = '0';
            setTimeout(() => loadingShowcase.style.display = 'none', 500);
        }
        
        if (window.updateShowcaseCamera) window.updateShowcaseCamera('mekanikal', 0);
    });

    // Peta Koordinat Kamera (EXTREME CLOSE-UP ZOOM)
    const cameraMap = {
        'mekanikal_0': { pos: [0.8, 0.4, 0.8], target: [0.4, 0.2, 0.2] },      // Zoom Lengan (Armrest)
        'mekanikal_1': { pos: [1.0, -0.4, 1.0], target: [0, -0.6, 0] },        // Zoom Rangka Bawah
        'mekanikal_2': { pos: [0.6, -0.2, 1.0], target: [0, -0.3, 0] },        // Zoom Engsel/Hidrolik
        'material_0':  { pos: [0, 0.8, 0.6], target: [0, 0.1, 0] },            // Zoom Permukaan Busa
        'material_1':  { pos: [0.6, 0.6, -1.0], target: [0, 0.5, -0.1] },      // Zoom Kain Sandaran
        'material_2':  { pos: [0.8, 0.3, -1.0], target: [0, 0.2, -0.1] },      // Zoom Lumbar Pinggang
        'elektronik_0':{ pos: [-0.3, 0.4, 0.8], target: [0, 0.1, 0] },         // Zoom Dudukan Sensor FSR
        'elektronik_1':{ pos: [-0.5, -0.3, 0.8], target: [0, -0.2, 0] },       // Zoom Kolong Kompartemen MUX
        'elektronik_2':{ pos: [-0.4, -0.2, 0.9], target: [0, -0.2, 0] },       // Zoom Kompartemen ESP32
        'elektronik_3':{ pos: [2.5, 1.2, 3.0], target: [0, 0, 0] },            // Mundur Global (Cloud)
        'elektronik_4':{ pos: [2.5, 1.2, 3.0], target: [0, 0, 0] }             // Mundur Global (Mobile App)
    };

    // Peta Koordinat Titik HTML (Raycasting Point 3D ke Layar 2D CSS)
    const annotationMap = {
        'mekanikal_0': { point: [0.4, 0.2, 0.3], text: 'Armrest 4D', color: 'bg-ergo-blue', border: 'border-ergo-blue', line: 'from-ergo-blue' },
        'mekanikal_1': { point: [0, -0.6, 0.2], text: 'Sasis Aluminium', color: 'bg-ergo-blue', border: 'border-ergo-blue', line: 'from-ergo-blue' },
        'mekanikal_2': { point: [0, -0.4, 0.1], text: 'Gas Lift Hidrolik', color: 'bg-ergo-blue', border: 'border-ergo-blue', line: 'from-ergo-blue' },
        'material_0':  { point: [0, -0.1, 0.2], text: 'Memory Foam 50D', color: 'bg-ergo-green', border: 'border-ergo-green', line: 'from-ergo-green' },
        'material_1':  { point: [-0.1, 0.4, -0.2], text: 'Mesh 3D Breathable', color: 'bg-ergo-green', border: 'border-ergo-green', line: 'from-ergo-green' },
        'material_2':  { point: [0, 0.1, -0.2], text: 'Lumbar Support', color: 'bg-ergo-green', border: 'border-ergo-green', line: 'from-ergo-green' },
        'elektronik_0':{ point: [0, 0.05, 0], text: '16x FSR Sensor', color: 'bg-ergo-orange', border: 'border-ergo-orange', line: 'from-ergo-orange' },
        'elektronik_1':{ point: [0, -0.25, 0.1], text: 'Multiplexer MUX', color: 'bg-ergo-orange', border: 'border-ergo-orange', line: 'from-ergo-orange' },
        'elektronik_2':{ point: [0, -0.25, 0.1], text: 'ESP32 Wi-Fi', color: 'bg-ergo-orange', border: 'border-ergo-orange', line: 'from-ergo-orange' },
        'elektronik_3': null, 
        'elektronik_4': null  
    };

    window.updateShowcaseCamera = function(tabId, index) {
        const key = `${tabId}_${index}`;
        
        // 1. Bergerak ke Target Posisi Lensa Zoom Kamera
        if (cameraMap[key]) {
            targetCamPos.set(...cameraMap[key].pos);
            targetLookAt.set(...cameraMap[key].target);
        }

        // 2. Tampilkan dan Atur Tanda Panah & Teks Info HTML
        if (annotationMap[key]) {
            activeAnnotation = annotationMap[key];
            annotText.innerText = activeAnnotation.text;
            
            // Ubah pewarnaan tema berdasarkan tab yang diklik
            annotText.className = `absolute left-10 md:left-16 bg-slate-900/90 backdrop-blur border text-white text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-lg shadow-[0_0_20px_rgba(0,0,0,0.8)] whitespace-nowrap ${activeAnnotation.border}`;
            annotDotGlow.className = `w-4 h-4 rounded-full opacity-50 animate-ping absolute -left-2 ${activeAnnotation.color}`;
            annotLine.className = `w-10 md:w-16 h-[2px] bg-gradient-to-r ml-1 to-transparent ${activeAnnotation.line}`;
            
            annotOverlay.style.opacity = '1';
        } else {
            activeAnnotation = null;
            annotOverlay.style.opacity = '0';
        }
    };

    function animateShowcase() {
        requestAnimationFrame(animateShowcase);
        
        // Pergerakan kamera meluncur (Lerp) super mulus
        shCamera.position.lerp(targetCamPos, 0.04);
        shControls.target.lerp(targetLookAt, 0.04);
        
        // Proses Memproyeksikan Koordinat Titik 3D ke Layar HTML (Panah Melayang)
        if (activeAnnotation && annotOverlay) {
            const point3D = new THREE.Vector3(...activeAnnotation.point);
            
            // Terapkan penyesuaian rotasi (Math.PI / 6) dan posisi (y=-0.2) agar sesuai objek
            point3D.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 6); 
            point3D.y -= 0.2; 
            
            // Tembakkan titik tersebut mengikuti sorotan kamera saat diputar pengguna
            point3D.project(shCamera);
            
            // Mengubah posisi left dan top pada elemen div CSS
            const x = (point3D.x * 0.5 + 0.5) * showcaseContainer.clientWidth;
            const y = (point3D.y * -0.5 + 0.5) * showcaseContainer.clientHeight;
            
            annotOverlay.style.left = `${x}px`;
            annotOverlay.style.top = `${y}px`;
        }

        shControls.update();
        shRenderer.render(shScene, shCamera);
    }
    animateShowcase();

    window.addEventListener('resize', () => {
        if(showcaseContainer && shCamera && shRenderer) {
            shCamera.aspect = showcaseContainer.clientWidth / showcaseContainer.clientHeight;
            shCamera.updateProjectionMatrix();
            shRenderer.setSize(showcaseContainer.clientWidth, showcaseContainer.clientHeight);
        }
    });
}
