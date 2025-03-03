// Modulos necesarios
// import { TextureLoader, PlaneGeometry, MeshStandardMaterial, Mesh, RepeatWrapping } from "three";
import * as THREE from "three";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
// import {TWEEN} from "../lib/tween.module.min.js";

// Variables estandar
let renderer, scene, camera;
const loader = new GLTFLoader();

const gui = new GUI();
let currentModel = null; // Store the current model
let isMoving = false; // Toggle movement
let angle = 0; // Initial angle
const radius = 5; // Circle size
const speed = 0.02; // Speed of movement
let originalPosition = new THREE.Vector3(); // Store the initial position


const modelOptions = {
    Model: 'Ferrari 488',
};
const modelPaths = {
    "Ferrari 488": { path: './models/2016-ferrari-488-gtb/source/2016_ferrari_488_gtb.glb', height: 0.1 },
    "Ferrari F40": { path: './models/1987_ferrari_f40.glb', height: 0 },
    "Ferrari 288 GTO": { path: './models/ferrari_288_gto.glb', height: -1 }
};
const lightOptions = {
    // 🌍 Ambient Light
    Ambient: true,
    Ambient_Intensity: 1,
    
    // ☀️ Directional Light
    Directional: true,
    Directional_Intensity: 1,
    
    // 🔦 Spot Light
    Spot: true,
    Spot_Intensity: 10,
    Spot_Angle: 0.6, // Default angle
    Spot_Penumbra: 0.05, // Soft edges
    Spot_Height: 3.5, // Default height
    
    // 💡 Point Light
    Point: true,
    Point_Intensity: 40,
    Point_Distance: 4, // How far the light reaches
    Point_Height: 2.5, // Default height
    Point_X: 0, // Move left/right
    Point_Z: 0 // Move forward/backward
};

const ambientLight = new THREE.AmbientLight(0xffffff, lightOptions.Ambient_Intensity);
const dirLight = new THREE.DirectionalLight(0xffffff, lightOptions.Directional_Intensity);
const spotLight = new THREE.SpotLight(0xffffff, lightOptions.Spot_Intensity);
const pointLight = new THREE.PointLight(0xffffff, lightOptions.Point_Intensity, lightOptions.Point_Distance);

// Acciones
init();
loadScene();
setupGUI();
render();

function init(){
    // Motor de render
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize( window.innerWidth, window.innerHeight );
    //renderer.setClearColor( new THREE.Color(0x0000AA) );
    document.getElementById('container').appendChild( renderer.domElement );
    
    // Escena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0.5,0.5,0.5);
    
    // Camara
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 1,1000);
    camera.position.set( 0.5, 2, 7 );
    camera.lookAt( new THREE.Vector3(0,1,0) );
    
    
// 🚀 Lights Setup
    scene.add(ambientLight);

    dirLight.position.set(5, 10, 5);
    dirLight.castShadow = true;
    scene.add(dirLight);

    spotLight.position.set(0, lightOptions.Spot_Height, 0);
    spotLight.angle = lightOptions.Spot_Angle;
    spotLight.penumbra = lightOptions.Spot_Penumbra;
    spotLight.castShadow = true;
    scene.add(spotLight);

    pointLight.position.set(lightOptions.Point_X, lightOptions.Point_Height, lightOptions.Point_Z);
    scene.add(pointLight);
    
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 3;  // Minimum zoom (prevents camera from going inside model)
    controls.maxDistance = 6;
    controls.maxPolarAngle = Math.PI / 2.5; // Limits vertical rotation (prevents looking below ground)
    controls.minPolarAngle = 0;
    controls.update();
    
    
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Softer shadows
    
    window.addEventListener('resize', updateAspectRatio );
    
}

function loadScene(){ 
    
    // 📺 Create a video element for the portrait TV
    const video1 = document.createElement('video');
    video1.src = './videos/portrait.mp4'; // Change to your video file
    video1.loop = true;
    video1.muted = true;
    video1.autoplay = true;
    video1.play();

    // 🎥 Create a video texture
    const videoTexture1 = new THREE.VideoTexture(video1);
    videoTexture1.minFilter = THREE.LinearFilter;
    videoTexture1.magFilter = THREE.LinearFilter;
    videoTexture1.format = THREE.RGBFormat;

    // 🖥️ Create portrait-style TV screen
    const portraitTV = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 3), // **Portrait: taller than wide**
        new THREE.MeshBasicMaterial({ map: videoTexture1 })
    );
    portraitTV.position.set(-3, 2.5, -9.9); // Move left for spacing
    scene.add(portraitTV);

    // 🖼️ Add a black frame for the portrait TV
    const portraitFrame = new THREE.Mesh(
        new THREE.PlaneGeometry(2.2, 3.2), // Slightly bigger than TV
        new THREE.MeshBasicMaterial({ color: 0x000000 })
    );
    portraitFrame.position.set(-3, 2.5, -9.95);
    scene.add(portraitFrame);


    // 📺 Create a video element for the landscape TV
    const video2 = document.createElement('video');
    video2.src = './videos/intern_landscape.mp4'; // Change to your second video file
    video2.loop = true;
    video2.muted = true;
    video2.autoplay = true;
    video2.play();

    // 🎥 Create a video texture
    const videoTexture2 = new THREE.VideoTexture(video2);
    videoTexture2.minFilter = THREE.LinearFilter;
    videoTexture2.magFilter = THREE.LinearFilter;
    videoTexture2.format = THREE.RGBFormat;

    // 🖥️ Create landscape-style TV screen
    const landscapeTV = new THREE.Mesh(
        new THREE.PlaneGeometry(3.5, 2), // **Landscape: wider than tall**
        new THREE.MeshBasicMaterial({ map: videoTexture2 })
    );
    landscapeTV.position.set(3, 2.5, -9.9); // Move right for spacing
    scene.add(landscapeTV);

    // 🖼️ Add a black frame for the landscape TV
    const landscapeFrame = new THREE.Mesh(
        new THREE.PlaneGeometry(3.7, 2.2), // Slightly bigger than TV
        new THREE.MeshBasicMaterial({ color: 0x000000 })
    );
    landscapeFrame.position.set(3, 2.5, -9.95);
    scene.add(landscapeFrame);

    
    const textureLoader = new THREE.TextureLoader();
    const wallTexture = textureLoader.load('./textures/wall.jpg'); // Change path to your wall texture
    const groundTexture = textureLoader.load('./textures/floor2.jpg'); // Change this path!
    const ceilingTexture = textureLoader.load('./textures/ceiling.jpg'); // Change this path!
    groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(5,5); // Repeat texture for a tiled effect
    const groundGeometry = new THREE.PlaneGeometry(20,20); // Large ground
    const groundMaterial = new THREE.MeshStandardMaterial({ map: groundTexture });
    
    // Wall size
    const wallWidth = 20;
    const wallHeight = 10;
    const ceilingHeight = 5;
    const wallMaterial = new THREE.MeshStandardMaterial({ map: wallTexture });
    const ceilingMaterial = new THREE.MeshStandardMaterial({ map: ceilingTexture });
    
    // Ground
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2; // Make it horizontal
    ground.position.y = 0; // Adjust if needed
    ground.receiveShadow = true;
    scene.add(ground);
    
    //  Back Wall
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(wallWidth, wallHeight), wallMaterial);
    backWall.position.set(0, wallHeight / 2, -wallWidth / 2);
    scene.add(backWall);
    
    //  Front Wall
    const frontWall = new THREE.Mesh(new THREE.PlaneGeometry(wallWidth, wallHeight), wallMaterial);
    frontWall.position.set(0, wallHeight / 2, wallWidth / 2);
    frontWall.rotation.y = Math.PI;
    scene.add(frontWall);
    
    //  Left Wall
    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(wallWidth, wallHeight), wallMaterial);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-wallWidth / 2, wallHeight / 2, 0);
    scene.add(leftWall);
    
    //  Right Wall
    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(wallWidth, wallHeight), wallMaterial);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(wallWidth / 2, wallHeight / 2, 0);
    scene.add(rightWall);
    
    //  Ceiling
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(wallWidth, wallWidth), ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = ceilingHeight; // Keep it at original height
    scene.add(ceiling);
    
    renderer.shadowMap.enabled = true;
}

function setupGUI(){
    const options = { MoveInCircle: false };
    let selectedModel = modelPaths[modelOptions.Model]; // Get the selected model info
    
    gui.add(modelOptions, 'Model', Object.keys(modelPaths)).onChange((value) => {
        let selectedModel = modelPaths[value]; // Get the selected model info
        loadModel(selectedModel.path, selectedModel.height); // Load selected model
    });
    
    gui.add(options, 'MoveInCircle').onChange((value) => {
        isMoving = value;
        if (isMoving && currentModel) {
            // Save the model's initial position when movement starts
            originalPosition.copy(currentModel.position);
            angle = 0; // Reset angle to start from the same point
        }
    });

    gui.add(lightOptions, 'Ambient').onChange(value => ambientLight.visible = value);
gui.add(lightOptions, 'Ambient_Intensity', 0, 5).onChange(value => ambientLight.intensity = value);

gui.add(lightOptions, 'Directional').onChange(value => dirLight.visible = value);
gui.add(lightOptions, 'Directional_Intensity', 0, 10).onChange(value => dirLight.intensity = value);

// 🔦 Spot Light Controls
gui.add(lightOptions, 'Spot').onChange(value => spotLight.visible = value);
gui.add(lightOptions, 'Spot_Intensity', 0, 50).onChange(value => spotLight.intensity = value);

// 💡 Point Light Controls
gui.add(lightOptions, 'Point').onChange(value => pointLight.visible = value);
gui.add(lightOptions, 'Point_Intensity', 0, 50).onChange(value => pointLight.intensity = value);

    
    // Load default model
    loadModel(selectedModel.path, selectedModel.height);
}
    
function loadModel(modelPath, groundHeight = 0.1) {
    if (currentModel) {
        scene.remove(currentModel);
        currentModel.traverse((child) => {
            if (child.isMesh) {
                child.geometry.dispose(); // Free memory
                child.material.dispose();
            }
        });
        currentModel = null;
    }
    
    loader.load(modelPath, function (gltf) {
        const model = gltf.scene;
        model.scale.set(80, 80, 80); // Scale model by 50 times
        model.position.set(0, groundHeight, 0);
        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        scene.add(model)
        currentModel = model; // Store current model for future removal
    },
    function (xhr) {
        console.log(`Model ${(xhr.loaded / xhr.total) * 100}% loaded`);
    },
    function (error) {
        console.error('An error happened', error);
    }
    );
}
    
function render(){
    requestAnimationFrame(render);
    moveInCircle(); // Move model in a circle
    renderer.render(scene,camera);
}

function update(){}

function updateAspectRatio()
{
    const ar = window.innerWidth/window.innerHeight;
    renderer.setSize(window.innerWidth,window.innerHeight);
    camera.aspect = ar;
    camera.updateProjectionMatrix();
}


function moveInCircle() {
    if (!currentModel || !isMoving) return;
    
    angle += speed;
    currentModel.position.x = originalPosition.x + Math.cos(angle) * radius;
    currentModel.position.z = originalPosition.z + Math.sin(angle) * radius;
    currentModel.rotation.y = -angle; // Rotate to face movement direction
}

