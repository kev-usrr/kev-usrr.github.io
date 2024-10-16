const base1RadiusTop = 1; const base1RadiusBot = base1RadiusTop; const base1Height = 1;
const shootRadiusTop = 0.1; const shootRadiusBot = shootRadiusTop; const shootHeight = 5;
const maxBullets = 100;
// Texturas
let textureLoader = new THREE.TextureLoader();
const gun1Texture = textureLoader.load('assets/gun_1.jpg');
const gun2Texture = textureLoader.load('assets/gun_2.jpg');
const gun3Texture = textureLoader.load('assets/gun_3.jpg');
const gunExplTexture = textureLoader.load('assets/gun_expl.png');
gun3Texture.wrapS = THREE.RepeatWrapping;
gun3Texture.wrapT = THREE.RepeatWrapping;
gun3Texture.repeat.set(4, 1);

export function drawWeapon(scene) {
    let material1 = new THREE.MeshBasicMaterial({side:THREE.DoubleSide, map:gun1Texture});
    let material2 = new THREE.MeshBasicMaterial({side:THREE.DoubleSide, map:gun2Texture});
    let material3 = new THREE.MeshBasicMaterial({side:THREE.DoubleSide, map:gun3Texture});

    let weaponBase1 = new THREE.CylinderGeometry(base1RadiusTop, base1RadiusBot, base1Height, 32, 32);
    let weaponBase1Mesh = new THREE.Mesh(weaponBase1, [material3, material2, material2]);
    // weaponBase1.groups[0].materialIndex = 1;
    // weaponBase1.groups[1].materialIndex = 0;
    // weaponBase1.groups[2].materialIndex = 0;
    let angle = 0;
    // Vamos a dibujar 8 cilindros dispuestos "circularmente" sobre la base
    let angleInc = (2 * Math.PI) / 8;
    for (let i = 0; i < 8; i++) {
        let weaponShoot = new THREE.CylinderGeometry(shootRadiusTop, shootRadiusBot, shootHeight, 32, 32);
        let weaponShootMesh = new THREE.Mesh(weaponShoot, material1);
        weaponShootMesh.position.y = shootHeight / 2;
        weaponShootMesh.position.x = Math.cos(angle) * (base1RadiusTop - 0.3);
        weaponShootMesh.position.z = Math.sin(angle) * (base1RadiusTop - 0.3);
        weaponShootMesh.name = 'cylinder';
        
        angle += angleInc;
        weaponBase1Mesh.add(weaponShootMesh);
    }
    let weaponRing = new THREE.RingGeometry(base1RadiusTop - 0.3, base1RadiusTop - 0.1, 32);
    let weaponRingMesh = new THREE.Mesh(weaponRing, material3);
    weaponRingMesh.rotation.x = Math.PI / 2;
    weaponRingMesh.position.y = base1Height + (shootHeight / 2);
    weaponBase1Mesh.add(weaponRingMesh);

    weaponBase1Mesh.rotation.x = Math.PI / 2;
    weaponBase1Mesh.position.set(0, 5, 20);
    scene.add(weaponBase1Mesh);
    return weaponBase1Mesh;
}

export function animWeapon(weaponMesh, camera, shooting, angle, scene) {
    let cameraDirection = new THREE.Vector3();
    // weaponMesh.rotation.x = Math.PI / 2;
    camera.getWorldDirection(cameraDirection);
    weaponMesh.position.copy(camera.position).add(new THREE.Vector3(cameraDirection.x * 2, cameraDirection.y - 2, cameraDirection.z * 2));
    let quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), cameraDirection);
    weaponMesh.quaternion.copy(quaternion);
    
    if (shooting) {
        let localQ = new THREE.Quaternion();
        localQ.setFromAxisAngle(cameraDirection.normalize(), angle);
        weaponMesh.quaternion.multiplyQuaternions(localQ, weaponMesh.quaternion);
        angle += 0.5;

        let explGeom = new THREE.CylinderGeometry(0.1, 0.1, 0.1, 3, 3);
        let shootCylinders = weaponMesh.children.filter(obj => obj.name === 'cylinder');
        for (let i = 0; i < shootCylinders.length; i++) {
            let explMesh = new THREE.Mesh(explGeom, new THREE.MeshBasicMaterial({side:THREE.DoubleSide, map:gunExplTexture}));
            let topCoord = shootCylinders[i].localToWorld(new THREE.Vector3(0, shootHeight / 2, 0));
            
            explMesh.position.set(topCoord.x, topCoord.y+0.2, topCoord.z);
            explMesh.name = 'bullet';
            explMesh.time = 0;
            scene.add(explMesh);
        }
    }
    moveBullets(cameraDirection, scene);
    return angle;
}

function moveBullets(cameraDirection, scene, time) {
    let bullets = scene.children.filter(obj => obj.name === 'bullet');
    if (bullets.length > maxBullets) {
        let diff = bullets.length - maxBullets;
        for (let i = 0; i < diff; i++) {
            scene.remove(bullets[i]);
        }
    }
    
    bullets = scene.children.filter(obj => obj.name === 'bullet');
    for (let i = 0; i < bullets.length; i++) {
        let bullet = bullets[i];
        bullet.time += 0.1;
        if (bullet.time >= 1.0) { scene.remove(bullet); }
        else { bullet.position.add(cameraDirection.clone().multiplyScalar(1)); }
    }
}