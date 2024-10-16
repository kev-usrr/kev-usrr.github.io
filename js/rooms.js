// Dimensiones para cada habitación donde se posiciónan los enemigos
export const roomHeight = 50; export const roomWidth = 250; export const roomDepth = 350;
// Dimensioes para los túneles que unen las habitaciones
const tunnelHeight = roomHeight; export const tunnelWidth = 30; export const tunnelDepth = 50;
const roomOpenHeight = roomHeight; const roomOpenWidth = roomWidth / 4;
// Máximo y mínimo de obstáculos que pueden aparecer por habitación
const maxObstacles = 50; const minObstacles = 20;
const planeWidth = 1; const planeHeight = roomDepth; 
const planeTunnelWidth = 1; const planeTunnelHeight = 2*tunnelDepth;
// "Altura" del suelo
export const groundLevel = 0.1;

// Texturas
let textureLoader = new THREE.TextureLoader();
const obstacleTexture = textureLoader.load('assets/trak_rustypanel.jpg');
obstacleTexture.wrapS = THREE.RepeatWrapping;
obstacleTexture.wrapT = THREE.RepeatWrapping;
obstacleTexture.repeat.set(5, 5);

const wallTexture1 = textureLoader.load('assets/wall_2_red.jpg');
wallTexture1.wrapS = THREE.RepeatWrapping;
wallTexture1.wrapT = THREE.RepeatWrapping;

const wallTexture2 = textureLoader.load('assets/wall_2_red.jpg');
wallTexture2.wrapS = THREE.RepeatWrapping;
wallTexture2.wrapT = THREE.RepeatWrapping;
wallTexture2.repeat.set(1, 3);

const floorTexture = textureLoader.load('assets/wall_2_red.jpg');
floorTexture.wrapS = THREE.RepeatWrapping;
floorTexture.wrapT = THREE.RepeatWrapping;
floorTexture.repeat.set(5, 5);

const doorTexture = textureLoader.load('assets/trak_rustypanel.jpg');
doorTexture.wrapS = THREE.RepeatWrapping;
doorTexture.wrapT = THREE.RepeatWrapping;
doorTexture.repeat.set(10, 10);

function drawPlane(position, scene, color, width, height) {
    let material = new THREE.MeshBasicMaterial({color:color, side:THREE.DoubleSide});
    let stripe = new THREE.PlaneGeometry(width, height);
    let stripeMesh = new THREE.Mesh(stripe, material);

    stripeMesh.position.copy(position);
    stripeMesh.rotation.x = Math.PI / 2;
    scene.add(stripeMesh);
}

function drawPlanes(scene, lastRoomZPos, color, numElemsY, numElemsX, spaceWidth, spaceHeight, spaceDepth, planeWidth, planeHeight) {
    let spaceY = spaceHeight / numElemsY;
    let auxY = 0
    for (let i = 0; i < numElemsY; i++) {
        drawPlane(new THREE.Vector3(-(spaceWidth / 2), auxY,  lastRoomZPos + spaceDepth / 2.0), scene, color, planeWidth, planeHeight);
        auxY += spaceY
    }
    
    auxY = 0
    for (let i = 0; i < numElemsY; i++) {
        drawPlane(new THREE.Vector3((spaceWidth / 2), auxY, lastRoomZPos + spaceDepth / 2.0), scene, color, planeWidth, planeHeight);
        auxY += spaceY
    }

    let spaceX = spaceWidth / numElemsX;
    let auxX = -(spaceWidth / 2);
    for(let i = 0; i < numElemsX; i++) {
        drawPlane(new THREE.Vector3(auxX, 0.2, lastRoomZPos + (spaceDepth / 2)), scene, color, planeWidth, planeHeight);
        auxX += spaceX;
    }

    auxX = -(spaceWidth / 2);
    for(let i = 0; i < numElemsX; i++) {
        drawPlane(new THREE.Vector3(auxX, spaceHeight, lastRoomZPos + (spaceDepth / 2)), scene, color, planeWidth, planeHeight);
        auxX += spaceX;
    }
}

function drawPlaneCross(position, height, rotationAngle, rotX, scene) {
    let material = new THREE.MeshBasicMaterial({color:0x00ff00, side:THREE.DoubleSide});
    let stripe = new THREE.PlaneGeometry(1, height);
    let stripeMesh = new THREE.Mesh(stripe, material);

    stripeMesh.position.copy(position);
    if (rotX) { stripeMesh.rotation.x = rotationAngle; }
    else { stripeMesh.rotation.z = rotationAngle; }
    scene.add(stripeMesh);
}

function drawDoor(mRoomZ, scene) {
    let material = new THREE.MeshStandardMaterial({map:doorTexture});
    let doorGeom = new THREE.BoxGeometry(tunnelWidth, roomHeight, 2.0);
    let doorMesh = new THREE.Mesh(doorGeom, material);
    
    doorMesh.position.z = mRoomZ + (roomDepth / 2.0);
    doorMesh.position.y = roomHeight / 2.0;
    doorMesh.castShadow = true;
    doorMesh.receiveShadow = true;
    
    scene.add(doorMesh);
    return doorMesh;
}

function generateObstacles(mRoomZ, scene) {
    let nObstacles = Math.floor(Math.random() * (maxObstacles - minObstacles) + minObstacles);
    let material = new THREE.MeshStandardMaterial({map:obstacleTexture});
    let obstacleSizes = [];
    // obstacleSizes.push([]);
    
    const maxX = (roomWidth / 2.0 - 20.0); const minX = -maxX;
    const maxZ = mRoomZ + (roomDepth / 2.0) - 20; const minZ = mRoomZ - (roomDepth / 2.0) + 20;
    const minY = 10; const maxY = roomHeight;
    for (let i = 0; i < nObstacles; i++) {
        let auxHeight = Math.random() * (maxY - minY) + minY
        let obstacleGeom = new THREE.BoxGeometry(Math.random() * (20 - 10) + 10,
                                                 auxHeight,
                                                 Math.random() * (20 - 10) + 10);
        
        let obstacleMesh = new THREE.Mesh(obstacleGeom, material);
        obstacleMesh.position.set(Math.random() * (maxX - minX) + minX, 
                                  auxHeight / 2, 
                                  Math.random() * (maxZ - minZ) + minZ);
        
        obstacleSizes.push({
            position: obstacleMesh.position,
            width: obstacleGeom.parameters.width,
            height: auxHeight,
            depth: obstacleGeom.parameters.depth
        });
        
        obstacleMesh.castShadow = true;
        obstacleMesh.receiveShadow = true;
        scene.add(obstacleMesh);

        for (let i = -1; i < 2; i+=2) {
            drawPlaneCross(new THREE.Vector3(
                obstacleMesh.position.x,
                obstacleMesh.geometry.parameters.height / 2,
                obstacleMesh.position.z - (obstacleMesh.geometry.parameters.depth / 2) - 0.2
            ), 
            obstacleMesh.geometry.parameters.height - 1, 
            Math.sign(i) * Math.atan((obstacleMesh.geometry.parameters.width / 2) / (obstacleMesh.geometry.parameters.height / 2)), 
            false, 
            scene);
        }
        for (let i = -1; i < 2; i+=2) {
            drawPlaneCross(new THREE.Vector3(
                obstacleMesh.position.x,
                obstacleMesh.geometry.parameters.height / 2,
                obstacleMesh.position.z + (obstacleMesh.geometry.parameters.depth / 2) + 0.2
            ), 
            obstacleMesh.geometry.parameters.height - 1, 
            Math.sign(i) * Math.atan((obstacleMesh.geometry.parameters.width / 2) / (obstacleMesh.geometry.parameters.height / 2)), 
            false, 
            scene);
        }
    }
    return obstacleSizes;
}


function drawOpenTunnel() {
    let material = new THREE.MeshBasicMaterial({color:0x000000, side:THREE.DoubleSide});

    let openTunnel = new THREE.BufferGeometry();
    const halfTunnelWidth = tunnelWidth / 2;

    let vertices = new Float32Array([
        -halfTunnelWidth, 0, 0, // Vértice inf izq front
        halfTunnelWidth, 0, 0, // Vértice inf der front
        halfTunnelWidth, tunnelHeight, 0, // Vértice sup der front
        -halfTunnelWidth, tunnelHeight, 0, // Vértice sup izq front

        -halfTunnelWidth, 0, tunnelDepth, // Vértice inf izq back
        halfTunnelWidth, 0, tunnelDepth, // Vértice inf der back
        halfTunnelWidth, tunnelHeight, tunnelDepth, // Vértice sup der back
        -halfTunnelWidth, tunnelHeight, tunnelDepth // Vértice sup izq back
    ]);

    let indexes = new Uint16Array([
        0,4,7, 7,3,0, // Cara izquierda
        1,5,6, 6,2,1, // Cara derecha
        3,2,6, 6,7,3, // Cara superior
        0,1,5, 5,4,0, // Cara inferior
    ]);

    openTunnel.setIndex(new THREE.BufferAttribute(indexes, 1));
    openTunnel.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    openTunnel.computeVertexNormals();

    let mesh = new THREE.Mesh(openTunnel, material);
    return mesh;
}

function drawOpenRoom() {
    let material1 = new THREE.MeshStandardMaterial({map:wallTexture1, side:THREE.DoubleSide});
    let material2 = new THREE.MeshStandardMaterial({map:floorTexture, side:THREE.DoubleSide});
    let material3 = new THREE.MeshStandardMaterial({map:wallTexture2, side:THREE.DoubleSide});

    let floorRoofGeom   = new THREE.BoxGeometry(roomWidth, roomDepth, 0.5);
    let wallGeom        = new THREE.BoxGeometry(roomHeight, roomDepth, 0.5)
    
    let floorMesh   = new THREE.Mesh(floorRoofGeom, material2);
    let roofMesh    = new THREE.Mesh(floorRoofGeom, material2);
    let wall1Mesh   = new THREE.Mesh(wallGeom, material3);
    let wall2Mesh   = new THREE.Mesh(wallGeom, material3);

    floorMesh.position.y = groundLevel;
    floorMesh.position.z = roomDepth / 2;
    floorMesh.rotation.x = Math.PI / 2;
    
    roofMesh.position.y = roomHeight
    roofMesh.position.z = roomDepth / 2;
    roofMesh.rotation.x = Math.PI / 2;

    wall1Mesh.position.x = -(roomWidth / 2);
    wall1Mesh.position.y = roomHeight / 2;
    wall1Mesh.position.z = roomDepth / 2;
    wall1Mesh.rotation.z = Math.PI / 2;
    wall1Mesh.rotation.y = Math.PI / 2;

    wall2Mesh.position.x = (roomWidth / 2);
    wall2Mesh.position.y = roomHeight / 2;
    wall2Mesh.position.z = roomDepth / 2;
    wall2Mesh.rotation.z = Math.PI / 2;
    wall2Mesh.rotation.y = Math.PI / 2;

    floorMesh.receiveShadow = true;
    roofMesh.receiveShadow = true;

    let openRoom = new THREE.BufferGeometry();
    const halfRoomWidth = roomWidth / 2;
    const halfTunnelWidth = tunnelWidth / 2;

    let vertices = new Float32Array([
        -halfRoomWidth, 0, 0, // Vértice inf izq front 0
        -halfTunnelWidth, 0, 0, // Vértice inf izq front open 1 
        halfTunnelWidth, 0, 0, // Vértice inf der front open 2
        halfRoomWidth, 0, 0, // Vértice inf der open 3
        halfRoomWidth, roomHeight, 0, // Vértice sup der front 4
        halfTunnelWidth, roomHeight, 0, // Vértice sup der front open 5
        -halfTunnelWidth, roomHeight, 0, // Vértice sup izq front open 6
        -halfRoomWidth, roomHeight, 0, // Vértice sup izq open 7

        -halfRoomWidth, 0, roomDepth, // Vértice inf izq back 8
        -halfTunnelWidth, 0, roomDepth, // Vértice inf izq back open 9
        halfTunnelWidth, 0, roomDepth, // Vértice inf der back open 10
        halfRoomWidth, 0, roomDepth, // Vértice inf der back 11
        halfRoomWidth, roomHeight, roomDepth, // Vértice sup der back 12 
        halfTunnelWidth, roomHeight, roomDepth, // Vértice sup der back open 13
        -halfTunnelWidth, roomHeight, roomDepth, // Vértice sup izq back open 14
        -halfRoomWidth, roomHeight, roomDepth // Vértice sup izq back 15
    ]);

    let indexes = new Uint16Array([
        0,1,6, 6,7,0, // Cara frontal izq open
        2,3,4, 4,5,2, // Cara frontal der open
        11,10,13, 13,12,11, // Cara back der open
        9,8,15, 15,14,9 // Cara back izq open
    ]);

    let uvs = new Float32Array([
        0, 0,
        2, 0,
        2, 2,
        0, 2,

        0, 0,
        2, 0,
        2, 2,
        0, 2,

        0, 0,
        2, 0,
        2, 2,
        0, 2,

        0, 0,
        2, 0,
        2, 2,
        0, 2,
    ]);

    openRoom.setIndex(new THREE.BufferAttribute(indexes, 1));
    openRoom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    openRoom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    openRoom.computeVertexNormals();

    openRoom.addGroup(0, 6, 0); // Cara frontal izq open (material 0)
    openRoom.addGroup(6, 6, 0); // Cara frontal der open (material 0)
    // openRoom.addGroup(12, 6, 1); // Cara derecha (material 1)
    // openRoom.addGroup(18, 6, 1); // Cara izquierda (material 1)
    // openRoom.addGroup(24, 6, 1); // Suelo (material 0)
    // openRoom.addGroup(30, 6, 1); // Techo (material 0)
    openRoom.addGroup(12, 6, 0); // Cara trasera derecha (material 1)
    openRoom.addGroup(18, 6, 0); // Cara trasera izquierda (material 1)
    
    let mesh = new THREE.Mesh(openRoom, [material1, material2]);
    mesh.receiveShadow = true;
    mesh.add(floorMesh);
    mesh.add(roofMesh);
    mesh.add(wall1Mesh);
    mesh.add(wall2Mesh);
    return mesh;
}

export function drawRoom(lastRoomZPos, scene) {
    let material = new THREE.MeshBasicMaterial()
    let tRoom1        = drawOpenTunnel();
    tRoom1.position.x = 0;
    tRoom1.position.y = groundLevel;
    tRoom1.position.z = lastRoomZPos + (tunnelDepth / 2.0);

    let mRoom        = drawOpenRoom();
    mRoom.position.x = 0;
    mRoom.position.y = groundLevel;
    mRoom.position.z = tRoom1.position.z + tunnelDepth;

    let tRoom2        = drawOpenTunnel();
    tRoom2.position.x = 0;
    tRoom2.position.y = groundLevel;
    tRoom2.position.z = mRoom.position.z + roomDepth;
        
    lastRoomZPos = tRoom2.position.z + (tunnelDepth / 2);
    scene.add(tRoom1);
    scene.add(mRoom);
    scene.add(tRoom2);

    drawPlanes(scene, lastRoomZPos, 0x00ff00, 10, 4, tunnelWidth, tunnelHeight, tunnelDepth, planeTunnelWidth, planeTunnelHeight);
    // drawPlanes(scene, mRoom.position.z, 0xff0000, 10, 20, roomWidth, roomHeight, roomDepth, planeWidth, planeHeight);
    
    let aux = mRoom.position.z + roomDepth / 2.0;
    let obstacleSizes = generateObstacles(aux, scene);
    let door = drawDoor(aux, scene);

    return [lastRoomZPos, aux, obstacleSizes, door];
}