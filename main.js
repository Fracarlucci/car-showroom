// Modulos necesarios
// import { TextureLoader, PlaneGeometry, MeshStandardMaterial, Mesh, RepeatWrapping } from "three";
import * as THREE from "three";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

// import {TWEEN} from "../lib/tween.module.min.js";

const textureLoader = new THREE.TextureLoader();
const groundTexture = textureLoader.load('./textures/Floor1.jpg'); // Change this path!
groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
groundTexture.repeat.set(10, 10); // Repeat texture for a tiled effect

// Variables estandar
let renderer, scene, camera;
const loader = new GLTFLoader();
let currentModel = null; // Store the current model

const gui = new GUI();
const modelOptions = {
    Model: 'Ferrari 488',
};
const modelPaths = {
    "Ferrari 488": './models/2016-ferrari-488-gtb/source/2016_ferrari_488_gtb.glb',
    "Ferrari F40": './models/1987_ferrari_f40.glb',
    "Ferrari 288 GTO": './models/ferrari_288_gto.glb'
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
    //renderer.setClearColor( new THREE.Color(0x0000AA) );
    document.getElementById('container').appendChild( renderer.domElement );
    
    // Escena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0.5,0.5,0.5);
    
    // Camara
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 1,1000);
    camera.position.set( 0.5, 2, 7 );
    camera.lookAt( new THREE.Vector3(0,1,0) );
    
    // Add lighting
    const light = new THREE.AmbientLight(0xffffff, 1);
    scene.add(light);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 3); // Intensity 3
    dirLight.position.set(5, 10, 5); // Position the light
    dirLight.castShadow = true;
    scene.add(dirLight);
    
    
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
    const groundGeometry = new THREE.PlaneGeometry(500, 500); // Large ground
    const groundMaterial = new THREE.MeshStandardMaterial({ map: groundTexture });
    
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2; // Make it horizontal
    ground.position.y = 0; // Adjust if needed
    ground.receiveShadow = true;
    scene.add(ground);
    
    renderer.shadowMap.enabled = true;
}
function setupGUI(){
    
    gui.add(modelOptions, 'Model', Object.keys(modelPaths)).onChange((value) => {
        loadModel(modelPaths[value]); // Load selected model
    });
    
    // Load default model
    loadModel(modelPaths[modelOptions.Model]);
}

function loadModel(modelPath) {
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
        model.position.set(0, 0.1, 0);
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
    update();
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
const keys = {}; // Store key states
const moveSpeed = 0.2; // Adjust movement speed
const rotateSpeed = 0.05; // Adjust rotation speed

window.addEventListener('keydown', (event) => { keys[event.key] = true; });
window.addEventListener('keyup', (event) => { keys[event.key] = false; });

function updateModelMovement() {
    if (!currentModel) return; // Make sure a model is loaded
    
    if (keys['ArrowUp']) currentModel.position.z -= moveSpeed;  // Move forward
    if (keys['ArrowDown']) currentModel.position.z += moveSpeed; // Move backward
    if (keys['ArrowLeft']) currentModel.rotation.y += rotateSpeed; // Rotate left
    if (keys['ArrowRight']) currentModel.rotation.y -= rotateSpeed; // Rotate right
}