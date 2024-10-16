// Dimensiones máximas y mínimas de las esferas enemigas
const maxEnemyRadius = 3; export const minEnemyRadius = 1; export const radiusReductionFactor = 0.9;
// Dimensiones de las cuchillas del enemigo
const bladeWidth = 0.3; const bladeHeight = 10; const bladeDepth = 0.5; const bladeTipHeight = 1;
// Máximo y mínimo de enemigos que pueden spawnear por habitación
const maxEnemiesRoom = 20;  const minEnemiesRoom = 15;
// Parámetros de detección de los enemigos
export const enemyDetectionRadius = 150; export const enemyMinPlayerDist = 10; export const enemySpeed = 0.01;

// Texturas
let textureLoader = new THREE.TextureLoader();

const enemyTexture = textureLoader.load('assets/trak_rustypanel.jpg');
enemyTexture.wrapS = THREE.RepeatWrapping;
enemyTexture.wrapT = THREE.RepeatWrapping;
enemyTexture.repeat.set(5, 5);

const bladeTexture = textureLoader.load('assets/laser_green.png');


export function isInsideObstacle(enemyPos, radius, roomIndex, obstacleSizes) {
    let obstacles = obstacleSizes[roomIndex]
    for (let i = 0; i < obstacles.length; i++) {
        let obstacle = obstacles[i];
        let halfWidth = obstacle.width / 2;
        let halfDepth = obstacle.depth / 2;

        if (enemyPos.x + radius > obstacle.position.x - halfWidth && // Borde izquierdo del enemigo por la derecha del borde izq del obstáculo
            enemyPos.x - radius < obstacle.position.x + halfWidth && // Borde derecho del enemigo por la izquierda del borde derecho del obstáculo
            enemyPos.z + radius < obstacle.position.z - halfDepth && // Borde trasero del enemigo antes del borde trasero del obstáculo
            enemyPos.z - radius < obstacle.position.z + halfDepth && // Borde frontal del enemigo después del borde frontal del obstáculo
            enemyPos.y + radius < obstacle.position.y + obstacle.heght && // Borde superior del enemigo por debajo del borde superior del obstáculo
            enemyPos.y - radius > obstacle.position.y // Borde inferior del enemigo por encima de la base del obstáculo
        ) {
            return true;
        }
    }
    return false;
}

function drawBlade(material) {
    let blade1 = new THREE.CylinderGeometry(bladeWidth, bladeWidth, bladeHeight, 3);
    let blade2 = new THREE.ConeGeometry(bladeWidth, bladeTipHeight, 3);
    let blade1Mesh = new THREE.Mesh(blade1, material);
    let blade2Mesh = new THREE.Mesh(blade2, material);
    blade2Mesh.position.y = bladeHeight / 2.0 + bladeTipHeight - 0.5;

    blade1Mesh.add(blade2Mesh);
    // let halfBladeWidth = bladeWidth / 2;
    // let halfBladeDepth = bladeDepth / 2;
    
    // let vertices = new Float32Array([
    //     // PARTE INFERIOR CUCHILLA
    //     -halfBladeWidth, -halfBladeDepth, 0, // Vértice inf izq 0
    //     halfBladeWidth, -halfBladeDepth, 0, // Vértice inf der 1
    //     halfBladeWidth, -halfBladeDepth, bladeHeight, // Vértice sup der 2
    //     -halfBladeWidth, -halfBladeDepth, bladeHeight, // Vértice sup izq 3
    //     0, -halfBladeDepth, bladeHeight + bladeTipHeight, // Punta cuchilla 4
    //     // PARTE SUPERIOR CUCHILLA
    //     -halfBladeWidth, halfBladeDepth, 0, // Vértice inf izq 5
    //     halfBladeWidth, halfBladeDepth, 0, // Vértice inf der 6
    //     halfBladeWidth, halfBladeDepth, bladeHeight, // Vértice sup der 7
    //     -halfBladeWidth, halfBladeDepth, bladeHeight, // Vértice sup izq 8
    //     0, halfBladeDepth, bladeHeight + bladeTipHeight // Punta cuchilla 9
    // ]);
    
    // let indices = new Uint16Array([
    //     0,1,6, 6,5,0,
    //     1,0,3, 3,2,1,
    //     5,6,7, 7,8,5,
    //     2,3,8, 8,7,2,
    //     6,1,2, 2,7,6,
    //     0,5,8, 8,3,0,
    //     8,7,9,
    //     2,3,4,
    //     7,2,4, 4,9,7,
    //     3,8,9, 9,4,3
    // ]);

    // blade.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    // blade.setIndex(new THREE.BufferAttribute(indices, 1));
    // blade.computeVertexNormals();
    // return new THREE.Mesh(blade1, material);
    return blade1Mesh;
}

export function generateEnemies(mRoomZ, roomIndex, roomWidth, roomDepth, roomHeight, obstacleSizes) {
    // DIBUJAR KUXILLAS EN LOS ENEMIGOS LOL
    let spheres = []; let spheresMap = [];
    let nEnemies = Math.floor(Math.random() * (maxEnemiesRoom - minEnemiesRoom) + minEnemiesRoom);
    let material        = new THREE.MeshStandardMaterial({map:enemyTexture});
    let materialMap     = new THREE.MeshBasicMaterial({side:THREE.DoubleSide, color:0xff0000});
    let materialBlade   = new THREE.MeshStandardMaterial({map:bladeTexture});

    const maxX = (roomWidth / 2.0) - 10.0; const minX = -maxX;
    const maxZ = mRoomZ + (roomDepth / 2.0) - 10.0;; const minZ = mRoomZ - (roomDepth / 2.0) + 75;
    for (let i = 0; i < nEnemies; i++) {
        // let enemy = new THREE.Object3D();
        let radius = Math.random() * (maxEnemyRadius - minEnemyRadius) + minEnemyRadius;
        
        let enemySphere = new THREE.SphereGeometry(radius);
        let eSphere = new THREE.Mesh(enemySphere, material);
        eSphere.position.set(Math.random() * (maxX - minX) + minX, 4, Math.random() * (maxZ - minZ) + minZ);
        while (isInsideObstacle(eSphere.position, radius, roomIndex, obstacleSizes)) {
            eSphere.position.set(Math.random() * (maxX - minX) + minX, 20, Math.random() * (maxZ - minZ) + minZ);
        }
        eSphere.castShadow = true;
        eSphere.receiveShadow = true;
        
        // Dibujamos cuchillas en la esfera
        let auxRand = (Math.random() < 0.5);
        for (let j = 0; j < 8; j++) {
            let blade = drawBlade(materialBlade);
            if (auxRand) { blade.rotation.x = Math.PI / 2; }
            blade.rotation.z = ((j + 1) / 8) * (2 * Math.PI);
            // Hacemos este cambio para que los disparos y las colisiones obvien a las cuchillas
            blade.raycast = function() {};
            blade.castShadow = true;
            blade.receiveShadow = true;
            eSphere.add(blade);
        }
        
        let enemySphereMap = new THREE.SphereGeometry(radius);
        let eSphereMap = new THREE.Mesh(enemySphereMap, materialMap)
        eSphereMap.position.set(eSphere.position.x, roomHeight + radius + 5, eSphere.position.z);

        spheres.push(eSphere);
        spheresMap.push(eSphereMap);
    }
    return [spheres, spheresMap, nEnemies];
}