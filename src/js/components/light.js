import * as THREE from 'three';
import Config from 'config';

// Sets up and places all lights in scene
export default class Light {
  constructor(scene) {
    this.scene = scene;
    this.init();
  }

  init() {
    // Ambient Light
    this.ambientLight = new THREE.AmbientLight(Config.ambientLight.color);
    this.ambientLight.visible = Config.ambientLight.enabled;

    // Directional Light
    this.directionalLight = new THREE.DirectionalLight(Config.directionalLight.color, Config.directionalLight.intensity);
    this.directionalLight.position.set(Config.directionalLight.x, Config.directionalLight.y, Config.directionalLight.z);
    this.directionalLight.visible = Config.directionalLight.enabled;
  }

  place(lightName) {
    switch(lightName) {
      case 'ambient':
        this.scene.add(this.ambientLight);
        break;

      case 'directional':
        this.scene.add(this.directionalLight);
        break;
    }
  }
}
