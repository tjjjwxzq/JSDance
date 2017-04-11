import * as THREE from 'three';
import * as _orb from 'utils/orbitControls';
import Config from 'config';

// Orbit controls
export default class Controls {
  constructor(camera, container) {
    this.threeControls = new THREE.OrbitControls(camera, container);
    this.init();
  }

  init() {
    this.threeControls.autoRotate = Config.controls.autoRotate;
    this.threeControls.autoRotateSpeed = Config.controls.autoRotateSpeed;
    this.threeControls.enableDamping = Config.controls.enableDamping;
    this.threeControls.dampingFactor = Config.controls.dampingFactor;
  }
}
