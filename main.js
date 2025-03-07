// Modulos necesarios
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
let isRotating = false; // Toggle rotation
let angle = 0; // Initial angle
const radius = 5; // Circle size
let originalPosition = new THREE.Vector3(); // Store the initial position
let clickHandler = null;
let carGroup = null;

const modelOptions = {
    Model: 'Ferrari 488',
};

const modelPaths = {
    "Ferrari 488": {
        path: './models/2016-ferrari-488-gtb/source/2016_ferrari_488_gtb.glb',
        height: 0.1,
        sound: './sounds/ferrari_488.mp3'
    },
    "Ferrari F40": {
        path: './models/1987_ferrari_f40.glb',
        height: 0,
        sound: './sounds/ferrari_f40.mp3'
    },
};

const headlightsOptions = { Headlights: false };
let leftLight = null;
let rightLight = null;

const animationsOptions = {
    SelectedAnimation: "None",
    Speed: 0.02, // Default speed
    RotateClockwise: true
};

// TV setup
const video1 = document.createElement('video');
const video2 = document.createElement('video');
const video3 = document.createElement('video');
const videoTexture1 = new THREE.VideoTexture(video1);
const videoTexture2 = new THREE.VideoTexture(video2);
const videoTexture3 = new THREE.VideoTexture(video3);
const portraitTV = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 3),
    new THREE.MeshBasicMaterial({ map: videoTexture1 })
);
const landscapeTV = new THREE.Mesh(
    new THREE.PlaneGeometry(3, 1.685),
    new THREE.MeshBasicMaterial({ map: videoTexture2 })
);
const landscapeTV2 = new THREE.Mesh(
    new THREE.PlaneGeometry(3, 1.685),
    new THREE.MeshBasicMaterial({ map: videoTexture3 })
);

const masterTVOptions = {
    TV_On: true,
    Play_Both_Videos: () => {
        video1.play();
        video2.play();
        video3.play();
    },
    Pause_Both_Videos: () => {
        video1.pause();
        video2.pause();
        video3.pause();
    }
};

const lightOptions = {
    Ambient: false,
    Ambient_Intensity: 1,
    
    Directional_1: false,
    Directional_2: false,
    Directional_Intensity: 1,
    
    Spot_Center: true,
    Spot_Front: true,
    Spot_Back: true,
    Spot_Left: true,
    Spot_Right: true,
    Spot_Intensity: 10,
    Spot_Angle: 0.6, // Default angle
    Spot_Penumbra: 0.02, // Soft edges
    Spot_Height: 3.5, // Default height
};

const ambientLight = new THREE.AmbientLight(0xffffff, lightOptions.Ambient_Intensity);
const dirLight1 = new THREE.DirectionalLight(0xffffff, 1);
const dirLight2 = new THREE.DirectionalLight(0xffffff, 1);
const spotLights = {
    Center: new THREE.SpotLight(0xffffff, lightOptions.Spot_Intensity),
    Front: new THREE.SpotLight(0xffffff, lightOptions.Spot_Intensity),
    Back: new THREE.SpotLight(0xffffff, lightOptions.Spot_Intensity),
    Left: new THREE.SpotLight(0xffffff, lightOptions.Spot_Intensity),
    Right: new THREE.SpotLight(0xffffff, lightOptions.Spot_Intensity),
};

// Acciones
init();
loadScene();
setupGUI();
render();

function init(){
    // Motor de render
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.getElementById('container').appendChild( renderer.domElement );
    
    // Escena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0.5,0.5,0.5);
    
    // Camara
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 1,1000);
    camera.position.set(0, 2, 7 );
    
    // Lights Setup
    ambientLight.visible = false;
    scene.add(ambientLight);

    dirLight1.position.set(5, 10, 5);
    dirLight1.castShadow = true;
    dirLight1.visible = false; // Start OFF
    scene.add(dirLight1);

    dirLight2.position.set(-5, 8, -5);
    dirLight2.castShadow = true;
    dirLight2.visible = false; // Start OFF
    scene.add(dirLight2);

    // Set SpotLight positions
    spotLights.Center.position.set(0, lightOptions.Spot_Height, 0);
    spotLights.Front.position.set(0, 5, 9.9);  // Slightly in front of the back wall
    spotLights.Back.position.set(0, 5, -9.9);  // Slightly in front of the front wall
    spotLights.Left.position.set(-9.9, 5, 0);  // Slightly in front of the right wall
    spotLights.Right.position.set(9.9, 5, 0);  // Slightly in front of the left wall

    Object.values(spotLights).forEach(light => {
        light.angle = 0.2;
        light.castShadow = true;
        light.penumbra = lightOptions.Spot_Penumbra;
        scene.add(light.target);
        scene.add(light);
    });
    spotLights.Center.angle = lightOptions.Spot_Angle;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false; 
    controls.minDistance = 3;  // Minimum zoom (prevents camera from going inside model)
    controls.maxDistance = 6;
    controls.maxPolarAngle = Math.PI / 2.7; // Limits vertical rotation (prevents looking below ground)
    controls.minPolarAngle = 0;

    controls.addEventListener('change', () => {
        camera.position.y = camera.position.y < 0 ? 0 : camera.position.y;
        camera.position.x = camera.position.x < -8 ? -8 : camera.position.x > 8 ? 8 : camera.position.x;
        camera.position.z = camera.position.z < -8 ? -8 : camera.position.z > 8 ? 8 : camera.position.z;
    });
    controls.update();
    
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Softer shadows

    window.addEventListener('resize', updateAspectRatio );
}

function loadScene(){ 
    
    // Create a video element for the portrait TV
    video1.src = './videos/portrait.mp4';
    video1.loop = true;
    video1.muted = true;
    video1.autoplay = true;
    video1.play();

    // Create a video texture
    videoTexture1.minFilter = THREE.LinearFilter;
    videoTexture1.magFilter = THREE.LinearFilter;
    videoTexture1.format = THREE.RGBFormat;

    portraitTV.position.set(-9.9, 2.5, 0); // Move it to the left wall
    portraitTV.rotation.y = Math.PI / 2;
    scene.add(portraitTV);

    // Add a black frame for the portrait TV
    const portraitFrame = new THREE.Mesh(
        new THREE.PlaneGeometry(2.2, 3.2), // Slightly bigger than TV
        new THREE.MeshBasicMaterial({ color: 0x000000 })
    );
    portraitFrame.position.set(-9.95, 2.5, 0); // Move it to the left wall
    portraitFrame.rotation.y = Math.PI / 2;
    scene.add(portraitFrame);

    // Create a video element for the landscape TV
    video2.src = './videos/intern_landscape.mp4';
    video2.loop = true;
    video2.muted = true;
    video2.autoplay = true;
    video2.play();

    // Create a video texture
    videoTexture2.minFilter = THREE.LinearFilter;
    videoTexture2.magFilter = THREE.LinearFilter;
    videoTexture2.format = THREE.RGBFormat;

    landscapeTV.position.set(0, 2.5, -9.9); // Move right for spacing
    scene.add(landscapeTV);

    // Add a black frame for the landscape TV
    const landscapeFrame = new THREE.Mesh(
        new THREE.PlaneGeometry(3.2, 1.885), // Slightly bigger than TV
        new THREE.MeshBasicMaterial({ color: 0x000000 })
    );
    landscapeFrame.position.set(0, 2.5, -9.95);
    scene.add(landscapeFrame);

    // Create a video element for the portrait TV
    video3.src = './videos/extern_landscape.mp4';
    video3.loop = true;
    video3.muted = true;
    video3.autoplay = true;
    video3.play();

    // Create a video texture
    videoTexture3.minFilter = THREE.LinearFilter;
    videoTexture3.magFilter = THREE.LinearFilter;
    videoTexture3.format = THREE.RGBFormat;

    landscapeTV2.position.set(9.9, 2.5, 0); // Move right for spacing
    landscapeTV2.rotation.y = - Math.PI / 2;
    scene.add(landscapeTV2);

    // Add a black frame for the portrait TV
    const landscapeFrame2 = new THREE.Mesh(
        new THREE.PlaneGeometry(3.2, 1.885), // Slightly bigger than TV
        new THREE.MeshBasicMaterial({ color: 0x000000 })
    );
    landscapeFrame2.position.set(9.95, 2.5, 0); // Move it to the left wall
    landscapeFrame2.rotation.y = - Math.PI / 2;
    scene.add(landscapeFrame2);

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

    addImageToWall('./images/ferrari-logo.png', 0, 2.7, 9.9)
    
    renderer.shadowMap.enabled = true;
}

function setupGUI(){
    let selectedModel = modelPaths[modelOptions.Model]; // Get the selected model info
    const modelFolder = gui.addFolder('Model');
    const animationFolder = gui.addFolder('Animation');
    const lightFolder = gui.addFolder('Extern lights');
    const ambientFolder = lightFolder.addFolder('Ambient Light');
    const directionalFolder = lightFolder.addFolder('Directional Lights');
    const spotFolder = lightFolder.addFolder('Spot Lights');
    const centralSpotFolder = spotFolder.addFolder('Central Spotlight');
    const masterTVFolder = gui.addFolder('Master TV Controls');
    
    modelFolder.add(modelOptions, 'Model', Object.keys(modelPaths)).onChange((value) => {
        let selectedModel = modelPaths[value]; // Get the selected model info
        loadModel(selectedModel.path, selectedModel.height, selectedModel.sound); // Load selected model
    });

    modelFolder.add(headlightsOptions, 'Headlights').onChange(value => { 
        leftLight.visible = value;
        rightLight.visible = value;
    });
    
    // Animation Controls
    animationFolder.add(animationsOptions, 'SelectedAnimation', ["None", "Move in circle", "Rotate"]).onChange((value) => {
        currentModel.rotation.y = 0;
        currentModel.position.x = originalPosition.x;
        currentModel.position.z = originalPosition.z;
    
        if (value === "None") {
            isMoving = false;
            isRotating = false;
        } else if (value === "Move in circle") {
            isMoving = true;
            isRotating = false;
        } else if (value === "Rotate") {
            isMoving = false;
            isRotating = true;
        }
    });
    
    // Allow users to set speed and rotation direction
    animationFolder.add(animationsOptions, 'Speed', 0, 0.1).name('Animation Speed');
    animationFolder.add(animationsOptions, 'RotateClockwise').name('Clockwise Rotation');

    // Play/Pause both videos
    masterTVFolder.add(masterTVOptions, 'Play_Both_Videos');
    masterTVFolder.add(masterTVOptions, 'Pause_Both_Videos');
    masterTVFolder.add(masterTVOptions, 'TV_On').onChange(value => {
        portraitTV.visible = value;
        landscapeTV.visible = value;
        landscapeTV2.visible = value;
    });
    
    // Ambient Light Controls
    ambientFolder.add(lightOptions, 'Ambient').onChange(value => ambientLight.visible = value);
    ambientFolder.add(lightOptions, 'Ambient_Intensity', 0, 3).onChange(value => ambientLight.intensity = value);
    
    // Directional Light Controls
    directionalFolder.add(lightOptions, 'Directional_1').onChange(value => dirLight1.visible = value);
    directionalFolder.add(lightOptions, 'Directional_2').onChange(value => dirLight2.visible = value);
    directionalFolder.add(lightOptions, 'Directional_Intensity', 0, 3).onChange(value => {
        dirLight1.intensity = value;
        dirLight2.intensity = value;
    });

    // SpotLights Controls
    spotFolder.add(lightOptions, 'Spot_Front').onChange(value => spotLights.Front.visible = value);
    spotFolder.add(lightOptions, 'Spot_Back').onChange(value => spotLights.Back.visible = value);
    spotFolder.add(lightOptions, 'Spot_Left').onChange(value => spotLights.Left.visible = value);
    spotFolder.add(lightOptions, 'Spot_Right').onChange(value => spotLights.Right.visible = value);
    spotFolder.add(lightOptions, 'Spot_Intensity', 0, 200).onChange(value => {
        Object.values(spotLights).forEach(light => light.intensity = value);
    });
    
    // Central Spotlight Controls
    centralSpotFolder.add(lightOptions, 'Spot_Center').onChange(value => spotLights.Center.visible = value);
    const targetXControl = centralSpotFolder.add(spotLights.Center.target.position, 'x', -10, 10).name('Move central spotlight X');
    const targetYControl = centralSpotFolder.add(spotLights.Center.target.position, 'z', -10, 10).name('Move central spotlight Z');
    const targetZControl = centralSpotFolder.add(spotLights.Center, 'angle', 0, Math.PI / 2).name('Central spotlight angle').onChange(value => {
        spotLights.Center.angle = value;
    });

    // Reset center spotlight
    centralSpotFolder.add({ reset: () => {
        spotLights.Center.position.set(0, lightOptions.Spot_Height, 0);
        spotLights.Center.target.position.set(0, 0, 0);
        spotLights.Center.angle = lightOptions.Spot_Angle;
        targetXControl.updateDisplay();
        targetYControl.updateDisplay();
        targetZControl.updateDisplay();
    }}, 'reset').name('Reset central spotlight');

    // Load default model
    loadModel(selectedModel.path, selectedModel.height, selectedModel.sound);
}

function loadModel(modelPath, groundHeight=0.1, soundPath) {
    const loadingDiv = document.getElementById('loading');
    const loadingText = document.getElementById('loadingText');
    loadingDiv.style.display = 'flex'; // Show loading screen

    if (currentModel) {
        scene.remove(carGroup)
        currentModel.traverse((child) => {
            if (child.isMesh) {
                child.geometry.dispose(); // Free memory
                child.material.dispose();
            }
        });
        currentModel = null;
    }
    
    loader.load(
        modelPath,
        function (gltf) {
            currentModel = gltf.scene;
            currentModel.scale.set(80, 80, 80); // Scale model by 50 times
            currentModel.position.set(0, groundHeight, 0);
            originalPosition = currentModel.position.clone(); // Store initial position
            currentModel.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            carGroup = new THREE.Group();
            carGroup.add(currentModel); // Add car as a child
            scene.add(carGroup);

            currentModel = carGroup;
            initClickSound(soundPath);
            addHeadlights(carGroup);
            loadingDiv.style.display = 'none'; // Hide loading when done
        },
        function (xhr) {
            const percentLoaded = Math.round((xhr.loaded / xhr.total) * 100);
            loadingText.innerText = `Loading... ${percentLoaded}%`; // Update percentage
        },
        function (error) {
            console.error('Error loading model:', error);
            loadingText.innerText = "Failed to load model.";
        }
    );
}

function addHeadlights(car) {
    if (!(car instanceof THREE.Object3D)) {
        console.error("Error: Car is not a THREE.Object3D");
        return;
    }

    const headlightIntensity = 50;  
    const headlightDistance = 100;  
    const headlightAngle = Math.PI / 6; // Narrow beam like real headlights

    // Left Headlight
    leftLight = new THREE.SpotLight(0xffffff, headlightIntensity, headlightDistance, headlightAngle);
    leftLight.position.set(-1, 1, 1.5); // Adjust position to match car's headlights
    leftLight.penumbra = 1; // Soft edges
    leftLight.castShadow = true;
    leftLight.angle = Math.PI / 4;

    // Right Headlight
    rightLight = new THREE.SpotLight(0xffffff, headlightIntensity, headlightDistance, headlightAngle);
    rightLight.position.set(1, 1, 1.5);
    rightLight.castShadow = true;

    // Target for headlights (a bit in front of the car)
    const lightTarget = new THREE.Object3D();
    lightTarget.position.set(0, 1, 10); // Place in front of the car
    rightLight.angle = Math.PI / 4;
    rightLight.penumbra = 1; // Soft edges
    car.add(lightTarget); // Attach target to the car

    leftLight.target = lightTarget;
    rightLight.target = lightTarget;

    leftLight.visible = false;
    rightLight.visible = false;

    car.add(leftLight);
    car.add(rightLight);
}

function initClickSound(soundPath) {
    if (!soundPath) return; // No sound assigned

    // Remove previous event listener (if exists)
    if (clickHandler) {
        window.removeEventListener('mousedown', clickHandler);
    }
    
    // Load an audio file
    const listener = new THREE.AudioListener();
    camera.add(listener); // Attach the listener to the camera

    const sound = new THREE.Audio(listener);
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load(soundPath, function(buffer) {
        sound.setBuffer(buffer);
        sound.setVolume(1.0);
    });

    // Raycaster for detecting clicks
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // Detect clicks ONLY on the imported GLTF model
    clickHandler = function(event) {
        if (!currentModel) return;

        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(currentModel, true);

        if (intersects.length > 0) {
            sound.play(); // Play the sound of the selected car
        }
    };

    // Add new click event listener
    window.addEventListener('mousedown', clickHandler);
}

function moveInCircle() {
    if (!currentModel || !isMoving || isRotating) return;
    
    angle += animationsOptions.Speed;
    currentModel.position.x = originalPosition.x + Math.cos(angle) * radius;
    currentModel.position.z = originalPosition.z + Math.sin(angle) * radius;
    currentModel.rotation.y = -angle;
}

function rotate() {
    if (!currentModel || isMoving || !isRotating) return;
    
    currentModel.position.x = originalPosition.x;
    currentModel.position.z = originalPosition.z;
    
    const direction = animationsOptions.RotateClockwise ? 1 : -1; // Clockwise or Counterclockwise
    currentModel.rotation.y += animationsOptions.Speed * direction;
}

function addImageToWall(imagePath, x, y, z) {
    const texture = new THREE.TextureLoader().load(imagePath);
    
    const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true, // Enables transparency
        alphaTest: 1, // Discard transparent pixels
    });
    const geometry = new THREE.PlaneGeometry(3,2.3); // Regola dimensioni
    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.set(x, y, z); 
    mesh.rotation.y = Math.PI;
    scene.add(mesh);
}

function updateAspectRatio()
{
    const ar = window.innerWidth/window.innerHeight;
    renderer.setSize(window.innerWidth,window.innerHeight);
    camera.aspect = ar;
    camera.updateProjectionMatrix();
}
    
function render(){
    requestAnimationFrame(render);
    update();
    renderer.render(scene,camera);
}

function update(){
    if(isMoving) moveInCircle();
    else if(isRotating) rotate();
}
