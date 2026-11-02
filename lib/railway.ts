import * as THREE from "three";

export class RailwaySystem {
  group = new THREE.Group();
  tracks: THREE.CatmullRomCurve3[] = [];
  locomotive: THREE.Group;
  
  private speed = 0;
  private maxSpeed = 15;
  private progress = 0;
  private currentTrackIndex = 0;
  
  constructor(scene: THREE.Scene, nodes: THREE.Vector3[]) {
    // Generate tracks connecting nodes
    if (nodes.length >= 2) {
      const curve = new THREE.CatmullRomCurve3(nodes);
      this.tracks.push(curve);
      
      // Create track geometry
      const points = curve.getPoints(1000);
      const trackGeo = new THREE.BufferGeometry().setFromPoints(points);
      const trackMat = new THREE.LineBasicMaterial({ color: 0x475569 });
      const trackLine = new THREE.Line(trackGeo, trackMat);
      this.group.add(trackLine);
      
      // Add ties (sleepers)
      for (let i = 0; i < 1000; i += 2) {
        const pos = curve.getPointAt(i / 1000);
        const tan = curve.getTangentAt(i / 1000);
        const tie = new THREE.Mesh(
          new THREE.BoxGeometry(1.2, 0.1, 0.2),
          new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 })
        );
        tie.position.copy(pos);
        tie.lookAt(pos.clone().add(tan));
        tie.rotation.y += Math.PI / 2;
        this.group.add(tie);
      }
    }
    
    // Create Locomotive
    this.locomotive = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.8, 2.2),
      new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.8, roughness: 0.3 })
    );
    body.position.y = 0.5;
    this.locomotive.add(body);
    
    const chimney = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9 })
    );
    chimney.position.set(0, 1.2, -0.6);
    this.locomotive.add(chimney);
    
    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 16);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });
    for (let x of [-0.6, 0.6]) {
      for (let z of [-0.7, 0.7]) {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(x, 0.3, z);
        this.locomotive.add(wheel);
      }
    }
    
    this.group.add(this.locomotive);
    scene.add(this.group);
  }
  
  update(dt: number, input: number) {
    if (this.tracks.length === 0) return;
    
    // Manual speed control
    this.speed = THREE.MathUtils.damp(this.speed, input * this.maxSpeed, 2, dt);
    
    const track = this.tracks[this.currentTrackIndex];
    const length = track.getLength();
    
    this.progress += (this.speed * dt) / length;
    if (this.progress > 1) this.progress = 0;
    if (this.progress < 0) this.progress = 1;
    
    const pos = track.getPointAt(this.progress);
    const tan = track.getTangentAt(this.progress);
    
    this.locomotive.position.copy(pos);
    this.locomotive.lookAt(pos.clone().add(tan));
  }
  
  getLocomotivePosition() {
    return this.locomotive.position;
  }
}
