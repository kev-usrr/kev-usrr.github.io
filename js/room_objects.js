const crossHeight = 6; const crossWidth = 2.5; const crossDepth = 1; export const crossHealth = 50;
const ammoHeight = 3; const ammoWidth = 6;  const ammoDepth = 3; export const ammoGiven = 50;

let textureLoader = new THREE.TextureLoader();
const ammo1Texture = textureLoader.load('assets/ammo_bot.jpg');
const ammo2Texture = textureLoader.load('assets/ammo_side.png')


export function drawHealthPoints(mRoomPosZ, scene) {
    let material = new THREE.MeshPhongMaterial({side:THREE.DoubleSide, color: 0xff0000, specular: 0xff0000, shininess:100});
    let part1 = new THREE.BoxGeometry(crossWidth, crossHeight, crossDepth);
    let part2 = new THREE.BoxGeometry(crossWidth, crossHeight, crossDepth);

    let part1Mesh = new THREE.Mesh(part1, material);
    let part2Mesh = new THREE.Mesh(part2, material);

    part1Mesh.position.set(0, 0, 0);
    part2Mesh.position.set(0, 0, 0);
    part2Mesh.rotation.z = Math.PI / 2.0;
    part1Mesh.add(part2Mesh);
    part1Mesh.name = "health";

    part1Mesh.position.set(0, 10, mRoomPosZ);
    scene.add(part1Mesh);
}

export function drawAmmo(mRoomZ, roomWidth, roomHeight, roomDepth, scene) {
    let material1 = new THREE.MeshPhongMaterial({side:THREE.DoubleSide, map:ammo1Texture, specular:0xffffff, shininess:100});
    let material2 = new THREE.MeshPhongMaterial({side:THREE.DoubleSide, map:ammo2Texture, specular:0xff0000, shininess:100});

    const maxX = roomWidth / 2.0; const minX = -maxX;
    const maxZ = mRoomZ + (roomDepth / 2.0); const minZ = mRoomZ - (roomDepth / 2.0);
    let position = new THREE.Vector3(
        Math.random() * (maxX - minX) + minX, 
        Math.random() * (roomHeight - 15) + 5, 
        Math.random() * (maxZ - minZ) + minZ
    )
    
    let box = new THREE.BoxGeometry(ammoWidth, ammoHeight, ammoDepth);
    let boxMesh = new THREE.Mesh(box, [material1, material1, material1, material1, material2, material2]);
    
    boxMesh.position.set(position.x, position.y, position.z);
    boxMesh.name = "ammo";
    scene.add(boxMesh);
}

export function animAmmoBoxes(scene) {
    const ammoBoxes = scene.children.filter(child => child.name === "ammo");
    for (let i = 0; i < ammoBoxes.length; i++) {
        let ammoBox = ammoBoxes[i];
        
        const angle = 0.1;
        let rotationY = new THREE.Matrix4().makeRotationY(angle);
        let transOO   = new THREE.Matrix4().makeTranslation(-ammoBox.position.x, -ammoBox.position.y, -ammoBox.position.z);
        let transBack = new THREE.Matrix4().makeTranslation(ammoBox.position.x, ammoBox.position.y, ammoBox.position.z);
        
        let M = new THREE.Matrix4();
        M.multiply(transBack);
        M.multiply(rotationY);
        M.multiply(transOO);
        
        ammoBox.applyMatrix4(M);
    }
}

export function animHealthPoints(scene) {
    const healthPoints = scene.children.filter(child => child.name === "health");
    for(let i = 0; i < healthPoints.length; i++) {
        let healthPoint = healthPoints[i];
        // Esto lo hacemos de forma similar a como animamos las esferas
        const angle = 0.1;
        let rotationY = new THREE.Matrix4().makeRotationY(angle);
        let transOO   = new THREE.Matrix4().makeTranslation(-healthPoint.position.x, -healthPoint.position.y, -healthPoint.position.z);
        let transBack = new THREE.Matrix4().makeTranslation(healthPoint.position.x, healthPoint.position.y, healthPoint.position.z);
        
        let M = new THREE.Matrix4();
        M.multiply(transBack);
        M.multiply(rotationY);
        M.multiply(transOO);
        
        healthPoint.applyMatrix4(M);
    }
}