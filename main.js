// Modulos necesarios
// import { TextureLoader, PlaneGeometry, MeshStandardMaterial, Mesh, RepeatWrapping } from "three";
import * as THREE from "three";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// import {TWEEN} from "../lib/tween.module.min.js";
// import {GUI} from "../lib/lil-gui.module.min.js";

const textureLoader = new THREE.TextureLoader();
const groundTexture = textureLoader.load('./textures/Floor1.jpg'); // Change this path!
groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
groundTexture.repeat.set(10, 10); // Repeat texture for a tiled effect

// Variables estandar
let renderer, scene, camera;

// Acciones
init();
loadScene();
setupGUI();
render();

function init(){
    // Motor de render
    renderer = new THREE.WebGLRenderer();
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
    
    renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Softer shadows

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
    // Load GLTF Model
    const loader = new GLTFLoader();
    loader.load(
        './models/2016-ferrari-488-gtb/source/2016_ferrari_488_gtb.glb', // Change this to your actual model path
        function (gltf) {
            const model = gltf.scene;
            model.scale.set(80, 80, 80); // Scale model by 50 times
            model.position.set(0, 0.1, 0); // Adjust X, Y, Z positions
            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true; // Allow model to cast shadows
                    child.receiveShadow = true; // Allow model to receive shadows (optional)
                }
            });
            scene.add(model)
        },
        function (xhr) {
            console.log(`Model ${(xhr.loaded / xhr.total) * 100}% loaded`);
        },
        function (error) {
            console.error('An error happened', error);
        }
        );
    }
    function setupGUI(){}
    function render(){
        requestAnimationFrame(render);
        update();
        renderer.render(scene,camera);
    }
    
    function updateAspectRatio(){}
    function update(){}
    
    // function animate() {
    //     requestAnimationFrame(animate);
    //     renderer.render(scene, camera);
    // }