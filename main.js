// Modulos necesarios
import * as THREE from "../lib/three.module.js";
import {GLTFLoader} from "../lib/GLTFLoader.module.js";
import {OrbitControls} from "../lib/OrbitControls.module.js";
import {TWEEN} from "../lib/tween.module.min.js";
import {GUI} from "../lib/lil-gui.module.min.js";

// Variables estandar
let renderer, scene, camera;

// Acciones
init();
loadScene();
setupGUI();
render();

function init(){}
function loadScene(){}
function setupGUI(){}
function render(){}

function updateAspectRatio(){}
function animate(event){}
function update(){}