// Imports
import { generateEnemies, enemyDetectionRadius, enemyMinPlayerDist, enemySpeed, radiusReductionFactor, minEnemyRadius, isInsideObstacle } from "./enemies.js";
import { drawRoom, roomWidth, roomHeight, roomDepth, tunnelWidth, tunnelDepth, groundLevel } from "./rooms.js";
import { drawHealthPoints, animHealthPoints, crossHealth, drawAmmo, animAmmoBoxes, ammoGiven } from "./room_objects.js";
import { drawWeapon, animWeapon } from "./weapon.js";

var renderer, scene, camera, cameraTop;
var playerOnMap, playerObj, objectsToCheck;
var playerLight;
// Posiciones iniciales de las habitaiciones que se van generando
var roomPositionsZ = [];
// Meshes de todas las puertas dibujadas
var doors = [];
var objDict = {};
// Índice para controlar la última habitación que el jugador puede explorar
var roomIndex = -1;
// Listas para controlar las esferas que dibujamos-movemos
var spheres = [];
var spheresMap = [];
var spheresNumRoom = 0;
// Variable para contorlar el arma del jugador
var weapon;
var weaponAngle = 0;
// Variable para dibujar el "suelo" fuera del mapa
var piso;
// Parámetros de la flecha que representa al jugador en el minimapa
const arrowLength = 10; const arrowColor = 0x00ff00; 
const arrowHeadLength = 15; const arrowHeadWidth = 10;
// Parámetros del cilindro que representa al jugador físicamente (colisiones)
const playerRadiusTop = 1; const playerRadiusBottom = playerRadiusTop;
const playerHeight = 8;
// Raycaster para detectar colisiones
var raycaster = new THREE.Raycaster();
// Otros parámetros
const numRooms = 5;
const nearPlane = 1;
const playerCamY = groundLevel + playerHeight;
// Salud máxima y mínima del jugador
const playerMinHealth = 1; const playerMaxHealth = 100;
var playerHealth = playerMaxHealth;
const playerMaxAmmo = 200;
var playerAmmo = playerMaxAmmo;
// Distancia mínima al centro de una habitación para generar sus enemigos
const minDistGenerateEnemies = 250;
// Habitaciones para las que ya hemos generado enemigos
var roomGenerated = [];
// Variables para controlar el salto
const gravity = -9.8;
const jumpSpeed = 10;
var velY = 0.0;
var blockJump = false;
// Variable tipo lista para almacenar las caraterísticas de los obstáculos.
var obstacleSizes = [];
// Diccionario para controlar que teclas están pulsadas
const controls = {
    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false,
    jump: false,
    speed: 1,
    shooting: false
};
var pointerLock = false;
const sensitivity = 0.002;
var p_pos  = new THREE.Vector3(0, playerCamY, 50);

document.addEventListener('keydown', (event) => {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            controls.moveForward = true;
            break;
        case 'ArrowDown':
        case 'KeyS':
            controls.moveBackward = true;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            controls.moveLeft = true;
            break;
        case 'ArrowRight':
        case 'KeyD':
            controls.moveRight = true;
            break;
        case 'Space':
            if (!blockJump) {
                controls.jump = true;
                velY = jumpSpeed;
            }
            break;
    }
});

document.addEventListener('keyup', (event) => {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            controls.moveForward = false;
            break;
        case 'ArrowDown':
        case 'KeyS':
            controls.moveBackward = false;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            controls.moveLeft = false;
            break;
        case 'ArrowRight':
        case 'KeyD':
            controls.moveRight = false;
            break;
    }
});

document.addEventListener('click', () => {
    shoot();
});

var shootingInteval;
document.addEventListener('mousedown', (event) => {
    if (event.button == 0) {
        controls.shooting = true;
        shootingInteval = setInterval(() => {
            shoot();
        }, 30)
    }
});

document.addEventListener('mouseup', (event) => {
    if (event.button == 0) {
        controls.shooting = false;
        clearInterval(shootingInteval);
    }
});

// Event listeners para obtener el PointerLock sobre el juego
const container = document.getElementById('container');
container.addEventListener('click', () => {
    container.requestPointerLock();
});

document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement == container) {
        pointerLock = true;
    } else {
        pointerLock = false;
    }
});

document.addEventListener('mousemove', (event) => {
    if (pointerLock) {
        // Desplazamiento del cursor respecto a la última vez que se lanzó el evento
        const movementX = event.movementX;
        const movementY = event.movementY;

        let pitchAxis = new THREE.Vector3(1, 0, 0);
        let yawAxis = new THREE.Vector3(0, 1, 0);

        let yawRot = new THREE.Quaternion().setFromAxisAngle(yawAxis, -movementX * sensitivity);
        let pitchRot = new THREE.Quaternion().setFromAxisAngle(pitchAxis, -movementY * sensitivity);

        camera.quaternion.multiplyQuaternions(yawRot, camera.quaternion);
        camera.quaternion.multiplyQuaternions(camera.quaternion, pitchRot);
    }
});

document.getElementById('restart-button-1').addEventListener('click', function() {
    location.reload();
});
document.getElementById('restart-button-2').addEventListener('click', function() {
    location.reload();
});

function displayGameOver() {
    document.exitPointerLock();
    const gameOverElement = document.getElementById('game-over');
    gameOverElement.style.display = 'block';
}

function displayGameSuccess() {
    document.exitPointerLock();
    const gameOverElement = document.getElementById('game-success');
    gameOverElement.style.display = 'block';
}

function updatePlayerHealth() {
    document.getElementById('health-number').textContent = 'Salud: ' + Math.max(0, Math.floor(playerHealth));
    let healthPercentage = Math.max(0, playerHealth / 100) * 100;
    document.getElementById('health-fill').style.width = healthPercentage + '%';
}

function updatePlayerAmmo() {
    document.getElementById('ammo-number').textContent = 'Munición: ' + Math.floor(playerAmmo) + '/' + playerMaxAmmo;
}

function updateEnemyCount() {
    document.getElementById('enemy-number').textContent = 'Enemigos: ' + spheres.length + '/' + spheresNumRoom;
}

function updateLevelCount() {
    document.getElementById('level-number').textContent = 'Nivel: ' + (roomIndex + 2) + '/' + numRooms;
}


init();
loadScene();
render();

var timer;
function setTimerTeleport() {
    if (timer) { clearInterval(timer); }
    let elapsed = 0;
    timer = setInterval(() => {
        elapsed++;
        if (elapsed >= 20) {
            teleportSpheres();
        }
    }, 1000);
}

function teleportSpheres() {
    for (let i = 0; i < spheres.length; i++) {
        let correctPos = false;
        let xPos, yPos, zPos;
        while (!correctPos) {
            xPos = p_pos.x + (Math.sign((Math.random() * 2) - 1) * (Math.random() * (50 - 30) + 30));
            yPos = p_pos.y + (Math.sign((Math.random() * 2) - 1) * (Math.random() * (50 - 30) + 30));
            zPos = p_pos.z + (Math.sign((Math.random() * 2) - 1) * (Math.random() * (50 - 30) + 30));
            correctPos = (!isInsideObstacle(new THREE.Vector3(xPos, yPos, zPos), spheres[i].geometry.parameters.radius, roomIndex+1, obstacleSizes)) &&
                         (yPos >= playerCamY) && (yPos < roomHeight - 5.0);         
        }
        spheres[i].position.set(xPos, yPos, zPos);
        spheresMap[i].position.set(xPos, roomHeight + 5.0, zPos);
        checkSphereStuck(spheres[i], spheresMap[i]);
    }
    if (timer) { clearInterval(timer); }
}

function shoot() {
    // Disparamos únicamente si tenemos munición
    if (playerAmmo > 0) {
        playerAmmo -= 1;
        updatePlayerAmmo();
        // Calculamos la "velocidad" es decir, la dirección hacia la que mira el jugador
        let velocity = new THREE.Vector3();
        camera.getWorldDirection(velocity);
        raycaster.set(p_pos, velocity.normalize());
        // Obtenemos las intersecciones del rayo con el conjunto de esferas (enemigos)
        const intersects = raycaster.intersectObjects(spheres, true);

        if (intersects.length > 0) {
            // if (spheres.length <= 5) { setTimerTeleport(); }
            // Nos quedamos con el primer enemigo
            let enemy = intersects[0].object;
            // Aplicamos a su radio un factor de reducción
            let newRadius = enemy.geometry.parameters.radius * radiusReductionFactor;
            if (newRadius > minEnemyRadius) {
                // Si el radio sigue siendo mayor que el radio mínimo aplicamos una nueva geometría
                // al enemigo (radio reducido, el resto de cosas igual)
                let redGeom = new THREE.SphereGeometry(newRadius);
                enemy.geometry.dispose();
                enemy.geometry = redGeom;
            } else {
                // En caso contrario eliminamos el enemigo de la escena
                // y también del conjunto de esferas y representacion de esferas en el
                // mapa.
                scene.remove(enemy);
                let enemyIndex = spheres.indexOf(enemy)
                if (enemyIndex > -1) {
                    spheres.splice(enemyIndex, 1);
                    let sphereMapRep = spheresMap[enemyIndex];
                    scene.remove(sphereMapRep);
                    spheresMap.splice(enemyIndex, 1);
                }
                updateEnemyCount();
                if (spheres.length == 0) {
                    roomIndex += 1;
                    updateLevelCount();
                }
            }
        }
    }
}

function checkSphereStuck(sphere, sphereMap) {
    // Como las esferas solo tienen colisión hacia "delante" (Vector velocidad) bajo
    // condiciones en las que se mueven hacia detrás se pueden quedar "atascadas"
    // Con esto controlamos esas situaciones
    if (sphere.position.y < playerCamY) {
        sphere.position.y = playerCamY;
        sphereMap.position.y = roomHeight + 5.0;
    }
    if (sphere.position.y > roomHeight) {
        sphere.position.y = roomHeight - sphere.geometry.parameters.radius - 5.0;
        sphereMap.position.y = roomHeight + 5.0;
    }
    
    if (sphere.position.x >= (roomWidth / 2.0)) {
        sphere.position.x = (roomWidth / 2.0) - sphere.geometry.parameters.radius - 10.0;
        sphereMap.position.x = sphere.position.x;
    }
    if (sphere.position.x <= -(roomWidth / 2.0)) {
        sphere.position.x = -(roomWidth / 2.0) + sphere.geometry.parameters.radius + 10.0;
        sphereMap.position.x = sphere.position.x
    }
    
    if (sphere.position.z >= roomPositionsZ[roomIndex+1][0] - (tunnelDepth / 2.0)) {
        sphere.position.z = roomPositionsZ[roomIndex+1][0] - (tunnelDepth / 2.0) - sphere.geometry.parameters.radius - 10.0;
        sphereMap.position.z = sphere.position.z
    }

    if (sphere.position.z <= roomPositionsZ[roomIndex+1][1] - (roomDepth / 2.0)) {
        sphere.position.z = roomPositionsZ[roomIndex+1][1] - (roomDepth / 2.0) + sphere.geometry.parameters.radius + 10.0;
        sphereMap.position.z = sphere.position.z;
    }
}

function checkHealthCollision(intersects) {
    if (intersects.length > 0 
        && intersects[0].object.name === "health" 
        && p_pos.distanceTo(intersects[0].object.position) < 5
        && !objDict[intersects[0].object.uuid]) {
        scene.remove(intersects[0].object);
        objDict[intersects[0].object.uuid] = true;
        playerHealth = Math.min(playerHealth + crossHealth, playerMaxHealth);
        updatePlayerHealth();
    }
}

function checkAmmoCollision(intersects) {
    if (intersects.length > 0 
        && intersects[0].object.name === "ammo" 
        && p_pos.distanceTo(intersects[0].object.position) < 5
        && !objDict[intersects[0].object.uuid]) {
        scene.remove(intersects[0].object);
        objDict[intersects[0].object.uuid] = true;
        playerAmmo = Math.min(playerAmmo + ammoGiven, playerMaxAmmo);
        updatePlayerAmmo();
    }
}

function isRoomGeometry(obj) {
    return obj.isMesh && obj.geometry instanceof THREE.BufferGeometry && obj.material.side === THREE.DoubleSide;
}

function euclideanDistance(pos1, pos2) {
    return Math.sqrt((pos2.x - pos1.x) ** 2 + (pos2.y - pos1.y) ** 2 + (pos2.z - pos1.z) ** 2);
}

function loadRooms() {
    let lastRoomZPos   = 0; let mRoomPos = 0; let roomObstacleSizes; let door;
    for (let i = 0; i < numRooms; i++) {
        [lastRoomZPos, mRoomPos, roomObstacleSizes, door] = drawRoom(lastRoomZPos, scene);
        roomPositionsZ.push([lastRoomZPos, mRoomPos]);
        roomGenerated.push(false);
        obstacleSizes.push(roomObstacleSizes);
        doors.push(door);
        drawHealthPoints(lastRoomZPos, scene)
        for (let j = 0; j < 20; j++) {
            drawAmmo(mRoomPos, roomWidth, roomHeight, roomDepth, scene)
        }
    }
    let doorBlock = new THREE.BoxGeometry(tunnelWidth, roomHeight, 1.0);
    let doorBlockMesh = new THREE.Mesh(doorBlock, new THREE.MeshBasicMaterial({side:THREE.DoubleSide, color:0x000000}));
    doorBlockMesh.position.set(0, roomHeight / 2, 25);
    scene.add(doorBlockMesh);
}

function loadFloor() {
    let material        = new THREE.MeshBasicMaterial({side:THREE.DoubleSide, color:0x000000});
    let floorGeometry   = new THREE.PlaneGeometry(1000, 10000, 10, 10);
    piso            = new THREE.Mesh(floorGeometry, material);
    piso.rotateOnAxis(new THREE.Vector3(1, 0, 0), -Math.PI / 2.0);
    piso.position.y = -1.0;
    scene.add(piso);
}

function loadPlayerOnMap() {
    playerOnMap = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), 
                                        new THREE.Vector3(0, 0, 0), 
                                        arrowLength, 
                                        arrowColor,
                                        arrowHeadLength,
                                        arrowHeadWidth);
    scene.add(playerOnMap);
}

function loadPlayerMesh() {
    playerObj = new THREE.Mesh(
        new THREE.CylinderGeometry(playerRadiusTop, playerRadiusBottom, playerHeight, 32, 32),
        new THREE.MeshBasicMaterial()
    );
    playerObj.position.set(p_pos);
    playerObj.visible = false;

    // Cámara y características
    playerLight = new THREE.SpotLight(0xffffff, 1.0);
    playerLight.position.set(p_pos);
    playerLight.angle = Math.PI / 6;
    playerLight.distance = 100;
    playerLight.intensity = 2.0;
    playerLight.decay = 1.1;
    
    scene.add(playerObj);
    scene.add(playerLight);
}

function getObjectIntersects() {
    objectsToCheck = scene.children.filter(obj => (obj !== playerObj) && (obj !== weapon));  
}

function createObjsDict() {
    const ammoBoxes = scene.children.filter(child => child.name === "ammo");
    const healthPoints = scene.children.filter(child => child.name === "health");
    for (let i = 0; i < ammoBoxes.length; i++) {
        objDict[ammoBoxes[i].uuid] = false;
    }
    for (let i = 0; i < healthPoints.length; i++) {
        objDict[healthPoints[i].uudid] = false;
    }
}

function loadScene() {
    updateLevelCount();
    loadFloor();
    loadRooms();
    loadPlayerOnMap();
    loadPlayerMesh();
    weapon = drawWeapon(scene);
    getObjectIntersects();
    createObjsDict();
}

function init() {
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(new THREE.Color(0xFFFFFF));
    renderer.shadowMap.enabled = true;
    document.getElementById('container').appendChild(renderer.domElement);

    scene = new THREE.Scene();

    // Cámara del jugador
    var aspectRatio = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(50, aspectRatio , 0.1, 1000);
    camera.position.set(0, 0, 0);
    camera.rotation.set(0, Math.PI, 0);
    
    // vista de planta
    cameraTop = new THREE.OrthographicCamera(-100, 100, 100, -100, 1, 1000);
    cameraTop.position.set(0, 100, 0);
    cameraTop.lookAt(0, 0, 0);
    cameraTop.up.set(0, 0, 1);
    cameraTop.updateProjectionMatrix(); 

    window.addEventListener('resize', updateAspectRatio);
}

function updateAspectRatio() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
}

function checkForwardBackwarColls() {
    let velocity = new THREE.Vector3();
    camera.getWorldDirection(velocity);
    let aux_vel = velocity.clone();
    let aux = controls.speed;
    if (controls.moveBackward) { aux *= -1; aux_vel.multiplyScalar(-1); }
    
    // Controlamos las colisiones horizontales
    if (controls.moveForward || controls.moveBackward) {
        // Configurar el rayo desde la posición actual del jugador y en la dirección de movimiento
        raycaster.set(p_pos, aux_vel);
        // Detectar intersecciones con objetos en la escena (por ejemplo, las paredes)
        const intersects = raycaster.intersectObjects(objectsToCheck, true);
        // Detectamos colisiones con puntos de salud y cajas de munición
        checkHealthCollision(intersects);
        checkAmmoCollision(intersects);

        // Si no hay intersección, permitir el movimiento
        if (intersects.length === 0 || intersects[0].distance > controls.speed + nearPlane + 0.1) {
            // mueve el personaje
            p_pos.add(velocity.clone().multiplyScalar(aux));
        }     
    }
    return velocity
}

function checkSideColls(velocity) {
    // Para generar movimiento a izquierda o a derecha, calculamos mediante el producto vectorial
    // el vector perpendicular al vector velocidad y el vector unitario (0, 1, 0) (eje Y)
    let perpVect = new THREE.Vector3(0, 0, 0);
    perpVect.crossVectors(velocity, new THREE.Vector3(0, 1, 0));
    if (controls.moveLeft) { perpVect.multiplyScalar(-1); }
    
    if (controls.moveLeft || controls.moveRight) {
        raycaster.set(p_pos, perpVect);
        
        const intersects = raycaster.intersectObjects(objectsToCheck, true);
        checkHealthCollision(intersects);
        checkAmmoCollision(intersects);
        
        if (intersects.length === 0 || intersects[0].distance > controls.speed + nearPlane + 0.1) {
            p_pos.add(perpVect.clone().multiplyScalar(controls.speed));
        } 
    }
}

function checkUpwardColls() {
    let auxHeight = roomHeight - (playerHeight / 2) - 1;
    if (controls.jump) {
        raycaster.set(p_pos, new THREE.Vector3(0, 1, 0));
        
        const intersects = raycaster.intersectObjects(objectsToCheck, true);
        checkHealthCollision(intersects);
        checkAmmoCollision(intersects);
        
        // Si no colisionamos con nada aplicamos gravedad
        if (intersects.length === 0) {
            velY += gravity * 0.025;
            p_pos.y += velY * 0.025;
        }
        // Para no sobrepasar el techo 
        if (p_pos.y >= auxHeight) {
            p_pos.y = auxHeight - 0.1;
        }
    }
}

function checkDownwardColls() {
    raycaster.set(p_pos, new THREE.Vector3(0, -1, 0));
    
    const intersects = raycaster.intersectObjects(objectsToCheck, true);  
    checkHealthCollision(intersects);
    checkAmmoCollision(intersects);
    
    if (intersects.length > 0 && intersects[0].distance <= playerHeight / 2) {
        p_pos.y = intersects[0].point.y + playerHeight / 2;
        velY = 0;
        controls.jump = false;
    } else {
        velY += gravity * 0.025;
        p_pos.y += velY * 0.025;
    }

    // Para no bajar demasiado
    if (p_pos.y <= playerCamY) {
        p_pos.y = playerCamY;
    }
}

function updatePlayerPositions(velocity) {
    camera.position.set(p_pos.x, p_pos.y, p_pos.z);
    camera.lookAt(new THREE.Vector3().addVectors(p_pos, velocity.multiplyScalar(25)));

    playerObj.position.set(p_pos.x, p_pos.y, p_pos.z);
    playerOnMap.position.set(p_pos.x, roomHeight + 10, p_pos.z);
    playerOnMap.setDirection(velocity.clone().normalize());
    
    playerLight.position.set(p_pos.x, p_pos.y, p_pos.z);
    playerLight.target.position.copy(camera.position.clone().add(velocity));
    playerLight.target.updateMatrixWorld();

    cameraTop.position.set(p_pos.x, 1000, p_pos.z);
    cameraTop.lookAt(p_pos);
}

function checkOpenDoor() {
    // Calculamos si es necesario abrir la siguiente puerta y generar más enemigos. Abriremos la puerta cuando el jugador elimine a todas las 
    // esferas de la habitación en la cual se encuentra.
    let roomPosZ, mRoomPosZ;
    if (spheres.length == 0 && (roomIndex + 1 < numRooms)) {
        [roomPosZ, mRoomPosZ] = roomPositionsZ[roomIndex + 1];
        if (!roomGenerated[roomIndex + 1]) {
            [spheres, spheresMap, spheresNumRoom] = generateEnemies(mRoomPosZ, roomIndex + 1, roomWidth, roomDepth, roomHeight, obstacleSizes);
            if (timer) { clearInterval(timer); }
            for (let j = 0; j < spheres.length; j++) {
                scene.add(spheres[j]);
                scene.add(spheresMap[j]);
            }
            updateEnemyCount();
            roomGenerated[roomIndex + 1] = true;
        }
        
        if (roomIndex >= 0 && doors[roomIndex].position.y < roomHeight) {
            doors[roomIndex].position.add((new THREE.Vector3(0, 1, 0)).multiplyScalar(25));
        }
    } 
}

function updateSpheres() {
    const angleSphere = 0.1;
    let rotationY = new THREE.Matrix4().makeRotationY(angleSphere);
    for (let i = 0; i < spheres.length; i++) {
        let sphere = spheres[i];
        let sphereMap = spheresMap[i];

        let transOO   = new THREE.Matrix4().makeTranslation(-sphere.position.x, -sphere.position.y, -sphere.position.z);
        let transBack = new THREE.Matrix4().makeTranslation(sphere.position.x, sphere.position.y, sphere.position.z);

        let M = new THREE.Matrix4();
        M.multiply(transBack);
        M.multiply(rotationY);
        M.multiply(transOO);
        sphere.applyMatrix4(M);
        
        let enemyDist = sphere.position.distanceTo(p_pos);
        let enemyRaycaster = new THREE.Raycaster();
        if (enemyDist <= enemyDetectionRadius && enemyDist >= enemyMinPlayerDist) {
            let enemyVel = new THREE.Vector3(
                p_pos.x - sphere.position.x, 
                p_pos.y - sphere.position.y,
                p_pos.z - sphere.position.z
            );
            
            let enemyObjsToCheck = scene.children.filter(obj => (obj !== sphere) && (obj !== piso) && (!isRoomGeometry(obj)));
            enemyRaycaster.set(sphere.position, enemyVel.clone().normalize());
            let intersectEnemy = enemyRaycaster.intersectObjects(enemyObjsToCheck);
            if (intersectEnemy.length > 0 && intersectEnemy[0].object != playerObj) {
                enemyVel.multiplyScalar(-1);
            }
            
            sphere.position.add(enemyVel.clone().multiplyScalar(enemySpeed));
            sphereMap.position.set(sphere.position.x, roomHeight + 5.0, sphere.position.z);
            sphereMap.position.y = roomHeight + 5.0;
        }

        if (enemyDist <= enemyMinPlayerDist) {
            playerHealth -= 0.2;
            updatePlayerHealth();
        }
        checkSphereStuck(sphere, sphereMap);
    }
}


var time = 0.0;
function update() {
    if (Math.floor(playerHealth) <= 0) { displayGameOver(); }
    if ((spheres.length === 0) && (roomIndex === numRooms - 1)) { displayGameSuccess(); }
    time += 0.01;

    let velocity = checkForwardBackwarColls();
    checkSideColls(velocity);
    checkUpwardColls();
    checkDownwardColls();
    updatePlayerPositions(velocity);
    checkOpenDoor();
    updateSpheres();
    animHealthPoints(scene);
    animAmmoBoxes(scene);
    weaponAngle = animWeapon(weapon, camera, controls.shooting && (playerAmmo > 0), weaponAngle, scene);
    weaponAngle = weaponAngle % (2 * Math.PI);
}

function render() {
	requestAnimationFrame(render);
    update();

	renderer.autoClear = false;
    renderer.setViewport(0,0,window.innerWidth,window.innerHeight);
    renderer.setClearColor(new THREE.Color(0xa2a2f2));
    renderer.clear();
    renderer.render(scene, camera);

    // vista de arriba
    var ds = Math.min(window.innerHeight , window.innerWidth)/4;
    renderer.setViewport(0, 0, ds, ds);
    renderer.setScissor(0, 0, ds, ds);
    renderer.setScissorTest(true);
    renderer.setClearColor(new THREE.Color(0xaffff));
    renderer.clear();	
    renderer.setScissorTest(false);
    renderer.render(scene, cameraTop);
}
