var scene, renderer, camera, cameraControls;

const baseCylinderRadius = 50; const baseCylinderHeight = 15;
const baseArmCylinderRadius = 20; const baseArmCylinderHeight = 18;

const robotArmAxisHeight = 120; const robotArmAxisDepth = 18; const robotArmAxisWidth = 12;
const robotArmSphereRadius = 20;

const robotForearmCylinderHeight = 6; const robotForearmCylinderRadius = 22;
const robotForearmAxisHeight = 80; const robotForearmAxisDepth = 4; const robotForearmAxisWidht = 4;
const robotHandHeight = 40; const robotHandRadius = 15;

const robotGripperBoxWidth = 20; const robotGripperBoxHeight = 19; const robotGripperBoxDepth = 4;

init();
loadFloor();
loadRobot();
render();

function init() {
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(new THREE.Color(0xFFFFFF));
    document.getElementById('container').appendChild(renderer.domElement);

    scene = new THREE.Scene();

    var aspectRatio = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(50, aspectRatio , 0.1, 1000);
    camera.position.set(0, 20, 100);
    
    cameraControls = new THREE.OrbitControls( camera, renderer.domElement );
    cameraControls.target.set(0, 0, 0);

    window.addEventListener('resize', updateAspectRatio);
}

function updateAspectRatio() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
}

function update() {
    cameraControls.update();
}

function render() {
	requestAnimationFrame(render);
	renderer.render(scene, camera);
}

function loadFloor() {
    let material        = new THREE.MeshBasicMaterial({side:THREE.DoubleSide, color:0xff0000});
    let floorGeometry   = new THREE.PlaneGeometry(1000, 1000, 10, 10);
    let floorMesh       = new THREE.Mesh(floorGeometry, material);
    
    floorMesh.rotateOnAxis(new THREE.Vector3(1, 0, 0), -Math.PI / 2.0);
    floorMesh.position.y = -1.0;
    
    scene.add(floorMesh);
}

function loadRobot() {
    let robotObject         = new THREE.Object3D();
    let robotBaseObject     = new THREE.Object3D();
    let robotArmObject      = new THREE.Object3D();
    let robotForearmObject  = new THREE.Object3D();
    let robotHandObject     = new THREE.Object3D();

    let material = new THREE.MeshNormalMaterial({side:THREE.DoubleSide, color:0xff0000});

    let baseCylinder        = new THREE.CylinderGeometry(baseCylinderRadius, baseCylinderRadius, baseCylinderHeight, 16, 16);
    let baseCylinderMesh    = new THREE.Mesh(baseCylinder, material);
    baseCylinderMesh.position.y = baseCylinderHeight / 2.0;
    robotBaseObject.add(baseCylinderMesh);

    let baseArmCylinder     = new THREE.CylinderGeometry(baseArmCylinderRadius, baseArmCylinderRadius, baseArmCylinderHeight, 16, 16);
    let baseArmCylinderMesh = new THREE.Mesh(baseArmCylinder, material);
    baseArmCylinderMesh.position.y = baseCylinderHeight;
    baseArmCylinderMesh.rotation.x = Math.PI / 2.0;
    
    let robotArmAxis        = new THREE.BoxGeometry(robotArmAxisWidth, robotArmAxisHeight, robotArmAxisDepth);
    let robotArmAxisMesh    = new THREE.Mesh(robotArmAxis, material);
    robotArmAxisMesh.position.y = baseCylinderHeight + (robotArmAxisHeight / 2.0);
    // robotArmAxisMesh.rotation.x = Math.PI / 2.0;

    let robotArmSphere      = new THREE.SphereGeometry(robotArmSphereRadius);
    let robotArmSphereMesh  = new THREE.Mesh(robotArmSphere, material);
    robotArmSphereMesh.position.y = baseCylinderHeight + robotArmAxisHeight;

    robotArmObject.add(baseArmCylinderMesh);
    robotArmObject.add(robotArmAxisMesh);
    robotArmObject.add(robotArmSphereMesh);

    let robotForearmCylinder        = new THREE.CylinderGeometry(robotForearmCylinderRadius, robotForearmCylinderRadius, robotForearmCylinderHeight, 16, 16);
    let robotForearmCylinderMesh    = new THREE.Mesh(robotForearmCylinder, material);
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
        let robotForearmAxisMesh    = new THREE.Mesh(robotForearmAxis, material);
        robotForearmAxisMesh.position.y   = baseCylinderHeight + robotArmAxisHeight + (robotForearmCylinderHeight / 2.0) + (robotForearmAxisHeight / 2.0);
        robotForearmAxisMesh.position.x   = positions[2*i];
        robotForearmAxisMesh.position.z   = positions[2*i + 1];
        robotForearmObject.add(robotForearmAxisMesh);
    }

    let robotHand         = new THREE.CylinderGeometry(robotHandRadius, robotHandRadius, robotHandHeight, 16, 16);
    let robotHandMesh     = new THREE.Mesh(robotHand, material);
    robotHandMesh.position.y = baseCylinderHeight + robotArmAxisHeight + robotForearmCylinderHeight + robotForearmAxisHeight;
    robotHandMesh.rotation.x = Math.PI / 2.0;
    robotHandObject.add(robotHandMesh);

    for (let i = 1; i < 3; i++) {
        // Parte cuadrada de la pinza
        let robotGripperBox     = new THREE.BoxGeometry(robotGripperBoxWidth, robotGripperBoxHeight, robotGripperBoxDepth);
        let robotGripperMesh    = new THREE.Mesh(robotGripperBox, material);
        robotGripperMesh.position.x = robotHandRadius;
        robotGripperMesh.position.y = baseCylinderHeight + robotArmAxisHeight + robotForearmCylinderHeight + robotForearmAxisHeight;
        robotGripperMesh.position.z = Math.sign(i - 1.1) * robotHandHeight / 4.0;
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
        ])

        let indexes = new Uint16Array([
            0, 1, 2, 2, 3, 0, // Cara inferior
            4, 5, 6, 6, 7, 4, // Cara superior
            1, 2, 6, 6, 5, 1,  // Cara derecha
            0, 4, 7, 7, 3, 0,  // Cara izquierda
            2, 3, 7, 7, 6, 2, // Cara trasera
            0, 1, 5, 5, 4, 0 // Cara inclinada (frontal)
        ])
        robotGripperP2.setIndex(new THREE.BufferAttribute(indexes, 1));
        robotGripperP2.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        robotGripperP2.computeVertexNormals();

        let robotGripperP2Mesh = new THREE.Mesh(robotGripperP2, material);
        robotGripperP2Mesh.position.x = robotHandRadius + (robotGripperBoxHeight / 2.0);
        robotGripperP2Mesh.position.y = baseCylinderHeight + robotArmAxisHeight + robotForearmCylinderHeight + robotForearmAxisHeight;
        robotGripperP2Mesh.position.z = Math.sign(i - 1.1) * (robotHandHeight / 4.0);
        
        robotGripperP2Mesh.rotation.x = Math.sign(i - 1) * Math.PI;
        robotGripperP2Mesh.rotation.z = -Math.PI / 2.0;

        robotHandObject.add(robotGripperMesh);
        robotHandObject.add(robotGripperP2Mesh);
    }
    // Creamos grafo de escena
    robotObject.add(robotBaseObject);
    robotBaseObject.add(robotArmObject);
    robotArmObject.add(robotForearmObject);
    robotForearmObject.add(robotHandObject);
    
    scene.add(robotObject);
}