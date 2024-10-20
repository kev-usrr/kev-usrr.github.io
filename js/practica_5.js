var scene, renderer, camera, cameraControls, gui, params;
var robotObject, robotBaseObject, robotArmObject, robotForearmObject, robotHandObject, gripper1, gripper2;
var prevHandAngle = 0, prevForearmZAngle = 0, prevForearmYAngle = 0;

var spotLight, lightOrigin;
// Definición de parámetros
var params = {
    baseRotation: 0,
    armRotation: 0,
    forearmRotationY: 0,
    forearmRotationZ: 0,
    handRotation: 0,
    gripperPos: 0,
    spotPosX: 100,
    spotPosY: 100,
    spotRotY: 0,
    spotLightAngle: 90,
    spotLightIntensity: 1
}

let textureLoader = new THREE.TextureLoader();

const robotTexture = textureLoader.load('assets_p5/wall_2_red.jpg');
robotTexture.wrapS = THREE.RepeatWrapping;
robotTexture.wrapT = THREE.RepeatWrapping;
robotTexture.repeat.set(2, 8);

const metalTexture = textureLoader.load('assets_p5/metal.jpg');
const metalTexture2 = textureLoader.load('assets_p5/wall_2_red.jpg');

const posXWall = textureLoader.load('assets_p5/posx.jpg');
const negXWall = textureLoader.load('assets_p5/negx.jpg');
const posYWall = textureLoader.load('assets_p5/posy.jpg');
const negYWall = textureLoader.load('assets_p5/negy.jpg');
const posZWall = textureLoader.load('assets_p5/posz.jpg')

const baseCylinderRadius = 50; const baseCylinderHeight = 15;
const baseArmCylinderRadius = 20; const baseArmCylinderHeight = 18;

const robotArmAxisHeight = 120; const robotArmAxisDepth = 18; const robotArmAxisWidth = 12;
const robotArmSphereRadius = 20;

const robotForearmCylinderHeight = 6; const robotForearmCylinderRadius = 22;
const robotForearmAxisHeight = 80; const robotForearmAxisDepth = 4; const robotForearmAxisWidht = 4;
const robotHandHeight = 40; const robotHandRadius = 15;

const robotGripperBoxWidth = 20; const robotGripperBoxHeight = 19; const robotGripperBoxDepth = 4;

var controls = {
    moveForward:false,
    moveBackward:false,
    moveLeft:false,
    moveRight:false
};

document.addEventListener('keydown', (event) => {
    switch (event.code) {
        case 'ArrowUp':
            controls.moveForward = true;
            break;
        case 'ArrowDown':
            controls.moveBackward = true;
            break;
        case 'ArrowLeft':
            controls.moveLeft = true;
            break;
        case 'ArrowRight':
            controls.moveRight = true;
            break;
    }
});

document.addEventListener('keyup', (event) => {
    switch (event.code) {
        case 'ArrowUp':
            controls.moveForward = false;
            break;
        case 'ArrowDown':
            controls.moveBackward = false;
            break;
        case 'ArrowLeft':
            controls.moveLeft = false;
            break;
        case 'ArrowRight':
            controls.moveRight = false;
            break;
    }
});

init();
loadRoom();
loadRobot();
loadLights();
render();

function degreesToRadians(degree) {
    return degree * Math.PI / 180;
}

gui.add(params, 'baseRotation', -180, 180).name('Rotación Base').onChange(function (value) {
    robotBaseObject.rotation.y = degreesToRadians(value);
});

gui.add(params, 'armRotation', -45, 45).name('Rotación Brazo').onChange(function (value) {
    robotArmObject.rotation.z = degreesToRadians(value);
});

gui.add(params, 'forearmRotationY', -180, 180).name('Rotación Antebrazo Y').onChange(function (value) {
    robotForearmObject.rotateOnAxis(new THREE.Vector3(0, 1, 0), degreesToRadians(value));
});

gui.add(params, 'forearmRotationZ', -45, 45).name('Rotación Antebrazo Z').onChange(function (value) {
    let angle = degreesToRadians(value);
    
    let auxPos = robotForearmObject.children[0].position
    let rotationZ = new THREE.Matrix4().makeRotationZ(angle - prevForearmZAngle);
    let transOO   = new THREE.Matrix4().makeTranslation(-auxPos.x, -auxPos.y, -auxPos.z);
    let transBack = new THREE.Matrix4().makeTranslation(auxPos.x, auxPos.y, auxPos.z);
    prevForearmZAngle = angle;
    
    let M = new THREE.Matrix4();
    M.multiply(transBack);
    M.multiply(rotationZ);
    M.multiply(transOO);

    robotForearmObject.applyMatrix4(M);
    robotForearmObject.updateMatrix();
});

gui.add(params, 'handRotation', -40, 220).name('Rotación Mano').onChange(function (value) {
    let angle = degreesToRadians(value);
    let auxPos = robotHandObject.children[0].position
    let rotationZ = new THREE.Matrix4().makeRotationZ(angle - prevHandAngle);
    let transOO   = new THREE.Matrix4().makeTranslation(-auxPos.x, -auxPos.y, -auxPos.z);
    let transBack = new THREE.Matrix4().makeTranslation(auxPos.x, auxPos.y, auxPos.z);
    prevHandAngle = angle;

    let M = new THREE.Matrix4();
    M.multiply(transBack);
    M.multiply(rotationZ);
    M.multiply(transOO);
    robotHandObject.applyMatrix4(M);
    robotHandObject.updateMatrix();
});

gui.add(params, 'gripperPos', 0, 15).name('Separación Pinza').onChange(function (value) {
    gripper1.position.z = value;
    gripper2.position.z = -value;
});

// gui.add(params, 'spotRotY', 0, 360).name('Rotación Luz Focal Y').onChange(function (value) {
//     spotLight.rotation.y = degreesToRadians(value);
// });

gui.add(params, 'spotPosY', 0, 500).name('Luz Focal Y').onChange(function (value) {
    spotLight.position.y    = value;
    lightOrigin.position.y  = value;
    lightOrigin.lookAt(robotObject.position);
});

gui.add(params, 'spotPosX', -500, 500).name('Luz Focal X').onChange(function (value) {
    spotLight.position.x    = value;
    lightOrigin.position.x  = value;
    lightOrigin.lookAt(robotObject.position);
});

gui.add(params, 'spotLightAngle', 30, 180).name('Ángulo Luz Focal').onChange(function (value) {
    spotLight.angle = degreesToRadians(value);
});

gui.add(params, 'spotLightIntensity', 0, 10).name('Intensidad Luz Focal').onChange(function (value) {
    spotLight.intensity = value;
});

gui.add({triggerAnimation}, 'triggerAnimation').name('Animar');

function triggerAnimation() {
    let aux1 = gripper1.position; let aux2 = gripper2.position;
    let foreArmRotY = robotForearmObject.rotation.y;
    let initAngle = {angle:foreArmRotY}; 
    let finalAngle = {angle:8 * Math.PI};
    let lastAngle = 0;
    let move1 = new TWEEN.Tween(robotObject.position).to({x:100, y:0, z:100}, 2000);
    let move2 = new TWEEN.Tween(robotBaseObject.rotation).to({x:0, y:Math.PI / 2, z:0}, 2000);
    let move3 = new TWEEN.Tween(robotArmObject.rotation).to({x:0, y:0, z:-Math.PI / 4}, 2000);
    let move4 = new TWEEN.Tween(initAngle).to(finalAngle, 2000).onUpdate(() => { foreArmRotY = initAngle.angle; robotForearmObject.rotateY(foreArmRotY - lastAngle); lastAngle = foreArmRotY});
    let move5 = new TWEEN.Tween(gripper1.position).to({x:gripper1.position.x, y:gripper1.position.y, z:15}, 2000);
    let move6 = new TWEEN.Tween(gripper2.position).to({x:gripper2.position.x, y:gripper2.position.y, z:-15}, 2000);
    
    let moveBack6 = new TWEEN.Tween(gripper2.position).to({x:aux2.x, y:aux2.y, z:aux2.z}, 2000);
    let moveBack5 = new TWEEN.Tween(gripper1.position).to({x:aux1.x, y:aux1.y, z:aux1.z}, 2000);
    let moveBack3 = new TWEEN.Tween(robotArmObject.rotation).to({x:0, y:0, z:0}, 2000);
    let moveBack2 = new TWEEN.Tween(robotBaseObject.rotation).to({x:0, y:0, z:0}, 2000);
    let moveBack1 = new TWEEN.Tween(robotObject.position).to({x:0, y:0, z:0}, 2000);

    move1.onComplete(() => 
        { move2.onComplete(() => 
            { move3.onComplete(() => {
                move4.onComplete(() => {
                    move5.start();
                    move6.onComplete(() => {
                        moveBack6.start();
                        moveBack5.onComplete(() => {
                            moveBack3.onComplete(() => {
                                moveBack2.onComplete(() => {
                                    moveBack1.start();
                                }).start();
                            }).start();
                        }).start();
                    }).start();
                }).start();  
            }).start(); 
        }).start() 
    }).start();
}

function init() {
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(new THREE.Color(0xFFFFFF));
    renderer.shadowMap.enabled = true;
    document.getElementById('container').appendChild(renderer.domElement);

    scene = new THREE.Scene();

    var aspectRatio = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(50, aspectRatio , 0.1, 2000);
    camera.position.set(300, 300, 300);
    
    cameraControls = new THREE.OrbitControls( camera, renderer.domElement );
    cameraControls.target.set(0, 100, 0);
    window.addEventListener('resize', updateAspectRatio);

    gui = new dat.GUI();
}

function updateAspectRatio() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
}

function update() {
    cameraControls.update();
    let posInc = 5;
    if (controls.moveForward) { robotObject.position.z -= posInc; }
    if (controls.moveBackward) { robotObject.position.z += posInc; }
    if (controls.moveLeft) { robotObject.position.x -= posInc; }
    if (controls.moveRight) { robotObject.position.x += posInc; }
    TWEEN.update();
    lightOrigin.lookAt(robotObject.position);
}

function render() {
	requestAnimationFrame(render);
    update();
	renderer.render(scene, camera);
}

function loadLights() {
    const ambientLight      = new THREE.AmbientLight(0xffffff, 0.5);
    const directionalLight  = new THREE.DirectionalLight(0xffffff, 0.3);
    spotLight               = new THREE.SpotLight(0xffffff, 1);
    let lightOriginGeom     = new THREE.BoxGeometry(10, 10, 30);
    lightOrigin             = new THREE.Mesh(lightOriginGeom, new THREE.MeshBasicMaterial({color:0x000000}));
    
    spotLight.castShadow        = true;
    directionalLight.castShadow = true;
    directionalLight.position.set(5, 10, 7.5);
    
    spotLight.position.set(100, 100, 0);
    lightOrigin.position.set(100, 100, 0);
    
    spotLight.target    = robotObject;
    lightOrigin.lookAt(robotObject.position);
    
    spotLight.angle     = Math.PI / 4;
    spotLight.intensity = 1;
    spotLight.penumbra  = 0.2;
    spotLight.distance  = 1000;

    spotLight.shadow.mapSize.width  = 2048;
    spotLight.shadow.mapSize.height = 2048;
    
    scene.add(directionalLight);
    scene.add(ambientLight);
    scene.add(spotLight);
    scene.add(lightOrigin);
}

function loadRoom() {
    let textures = [
        textureLoader.load('assets_p5/posx.jpg'),
        textureLoader.load('assets_p5/negx.jpg'),
        textureLoader.load('assets_p5/posy.jpg'),
        textureLoader.load('assets_p5/piso.jpg'),
        textureLoader.load('assets_p5/posz.jpg'),
        textureLoader.load('assets_p5/negz.jpg')
    ];

    let roomMaterials = textures.map(texture => new THREE.MeshStandardMaterial({side: THREE.DoubleSide, map: texture})); 
    let roomGeometry = new THREE.BoxGeometry(1000, 1000, 1000);
    
    let roomMesh = new THREE.Mesh(roomGeometry, roomMaterials);
    roomMesh.position.set(0, 495, 0);
    roomMesh.receiveShadow = true;

    scene.add(roomMesh);
}

function loadRobot() {
    robotObject         = new THREE.Object3D();
    robotBaseObject     = new THREE.Object3D();
    robotArmObject      = new THREE.Object3D();
    robotForearmObject  = new THREE.Object3D();
    robotHandObject     = new THREE.Object3D(); 

    let robotMaterial1  = new THREE.MeshPhongMaterial({side:THREE.DoubleSide, map:metalTexture, shading:THREE.FlatShading});
    let robotMaterial2  = new THREE.MeshLambertMaterial({side:THREE.DoubleSide, map:robotTexture, shading:THREE.FlatShading});
    let robotMaterial3  = new THREE.MeshStandardMaterial({side:THREE.DoubleSide, map:metalTexture2, shading:THREE.FlatShading});
    
    let sphereMAP       = THREE.ImageUtils.loadTextureCube([
        'assets_p5/posx.jpg', 'assets_p5/negx.jpg',
        'assets_p5/posy.jpg', 'assets_p5/piso_2048.jpg',
        'assets_p5/posz.jpg', 'assets_p5/negz.jpg'
    ]);
    sphereMAP.format = THREE.RGBFormat;
    let sphereMaterial  = new THREE.MeshPhongMaterial({
        ambient:0xff0000, color:0xffffff,
        specular:0x222222, shininess:50,
        envMap:sphereMAP
    });

    let baseCylinder        = new THREE.CylinderGeometry(baseCylinderRadius, baseCylinderRadius, baseCylinderHeight, 64, 64);
    let baseCylinderMesh    = new THREE.Mesh(baseCylinder, robotMaterial2);
    baseCylinderMesh.position.y = baseCylinderHeight / 2.0;
    robotBaseObject.add(baseCylinderMesh);

    let baseArmCylinder     = new THREE.CylinderGeometry(baseArmCylinderRadius, baseArmCylinderRadius, baseArmCylinderHeight, 64, 64);
    let baseArmCylinderMesh = new THREE.Mesh(baseArmCylinder, robotMaterial2);
    baseArmCylinderMesh.position.y = baseCylinderHeight;
    baseArmCylinderMesh.rotation.x = Math.PI / 2.0;
    
    let robotArmAxis        = new THREE.BoxGeometry(robotArmAxisWidth, robotArmAxisHeight, robotArmAxisDepth);
    let robotArmAxisMesh    = new THREE.Mesh(robotArmAxis, robotMaterial2);
    robotArmAxisMesh.position.y = baseCylinderHeight + (robotArmAxisHeight / 2.0);
    // robotArmAxisMesh.rotation.x = Math.PI / 2.0;

    let robotArmSphere      = new THREE.SphereGeometry(robotArmSphereRadius);
    let robotArmSphereMesh  = new THREE.Mesh(robotArmSphere, sphereMaterial);
    robotArmSphereMesh.position.y = baseCylinderHeight + robotArmAxisHeight;

    robotArmObject.add(baseArmCylinderMesh);
    robotArmObject.add(robotArmAxisMesh);
    robotArmObject.add(robotArmSphereMesh);

    let robotForearmCylinder        = new THREE.CylinderGeometry(robotForearmCylinderRadius, robotForearmCylinderRadius, robotForearmCylinderHeight, 64, 64);
    let robotForearmCylinderMesh    = new THREE.Mesh(robotForearmCylinder, robotMaterial1);
    robotForearmCylinderMesh.position.y = baseCylinderHeight + robotArmAxisHeight;
    robotForearmObject.add(robotForearmCylinderMesh);

    let positions = [
        4.0, 4.0,
        4.0, -4.0,
        -4.0, 4.0,
        -4.0, -4.0
    ];
    for (let i = 0; i < 4; i++) {
        let robotForearmAxis        = new THREE.BoxGeometry(robotForearmAxisWidht, robotForearmAxisHeight, robotForearmAxisDepth);
        let robotForearmAxisMesh    = new THREE.Mesh(robotForearmAxis, robotMaterial2);
        robotForearmAxisMesh.position.y   = baseCylinderHeight + robotArmAxisHeight + (robotForearmCylinderHeight / 2.0) + (robotForearmAxisHeight / 2.0);
        robotForearmAxisMesh.position.x   = positions[2*i];
        robotForearmAxisMesh.position.z   = positions[2*i + 1];
        robotForearmObject.add(robotForearmAxisMesh);
    }

    let robotHand         = new THREE.CylinderGeometry(robotHandRadius, robotHandRadius, robotHandHeight, 64, 64);
    let robotHandMesh     = new THREE.Mesh(robotHand, robotMaterial1);
    robotHandMesh.position.y = baseCylinderHeight + robotArmAxisHeight + robotForearmCylinderHeight + robotForearmAxisHeight;
    robotHandMesh.rotation.x = Math.PI / 2.0;
    robotHandObject.add(robotHandMesh);

    for (let i = 1; i < 3; i++) {
        // Parte cuadrada de la pinza
        let robotGripperBox     = new THREE.BoxGeometry(robotGripperBoxWidth, robotGripperBoxHeight, robotGripperBoxDepth);
        let robotGripperMesh    = new THREE.Mesh(robotGripperBox, robotMaterial3);
        robotGripperMesh.position.x = robotHandRadius;
        robotGripperMesh.position.y = baseCylinderHeight + robotArmAxisHeight + robotForearmCylinderHeight + robotForearmAxisHeight;
        robotGripperMesh.position.z = Math.sign(i - 1.1) * robotHandHeight / 2.25;
        // Cuña de la pinza
        let robotGripperP2 = new THREE.BufferGeometry();
        let halfDepth = robotGripperBoxDepth / 2.0;
        let halfWidth = robotGripperBoxWidth / 2.0;
        let half2Width = halfWidth / 2.0;
        let half2Depth = halfDepth / 2.0;

        let vertices = new Float32Array([
            -halfWidth, 0, -halfDepth,
            halfWidth, 0, -halfDepth,
            halfWidth, 0, halfDepth,
            -halfWidth, 0, halfDepth,
            
            -half2Width, robotGripperBoxHeight, 0,
            half2Width, robotGripperBoxHeight, 0,
            half2Width, robotGripperBoxHeight, halfDepth,
            -half2Width, robotGripperBoxHeight, halfDepth,
        ]);

        let indexes = new Uint16Array([
            0, 1, 2, 2, 3, 0, // Cara inferior
            4, 5, 6, 6, 7, 4, // Cara superior
            1, 2, 6, 6, 5, 1,  // Cara derecha
            0, 4, 7, 7, 3, 0,  // Cara izquierda
            2, 3, 7, 7, 6, 2, // Cara trasera
            0, 1, 5, 5, 4, 0 // Cara inclinada (frontal)
        ]);
      
        robotGripperP2.setIndex(new THREE.BufferAttribute(indexes, 1));
        robotGripperP2.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        robotGripperP2.computeVertexNormals();

        let robotGripperP2Mesh = new THREE.Mesh(robotGripperP2, robotMaterial3);
        robotGripperP2Mesh.position.x = robotHandRadius + (robotGripperBoxHeight / 2.0);
        robotGripperP2Mesh.position.y = baseCylinderHeight + robotArmAxisHeight + robotForearmCylinderHeight + robotForearmAxisHeight;
        robotGripperP2Mesh.position.z = Math.sign(i - 1.1) * (robotHandHeight / 2.25);
        
        robotGripperP2Mesh.rotation.x = Math.sign(i - 1) * Math.PI;
        robotGripperP2Mesh.rotation.z = -Math.PI / 2.0;

        if (gripper1 == null) {
            gripper1 = new THREE.Object3D();
            gripper1.add(robotGripperMesh);
            gripper1.add(robotGripperP2Mesh);
            robotHandObject.add(gripper1);
        } else {
            gripper2 = new THREE.Object3D();
            gripper2.add(robotGripperMesh);
            gripper2.add(robotGripperP2Mesh);
            robotHandObject.add(gripper2);
        }
    }
    // Creamos grafo de escena
    robotObject.add(robotBaseObject);
    robotBaseObject.add(robotArmObject);
    robotArmObject.add(robotForearmObject);
    robotForearmObject.add(robotHandObject);
    
    scene.add(robotObject);

    robotObject.traverse(function (child) {
        if (child instanceof THREE.Mesh) {
            child.receiveShadow = true;
            child.castShadow = true;
        }
    })
}