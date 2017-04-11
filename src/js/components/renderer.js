import * as THREE from 'three';

// Main WebGL renderer class
export default class Renderer {
  constructor(scene, container) {
    this.scene = scene;
    this.container = container;

    // Create WebGL renderer
    this.threeRenderer = new THREE.WebGLRenderer({antialias: true});
    this.threeRenderer.setPixelRatio(window.devicePixelRatio);
    this.threeRenderer.setClearColor(new THREE.Color('hsl(0, 0%, 10%)'));

    // Append to canvas
    container.appendChild(this.threeRenderer.domElement);

    // Initial sizing
    this.updateSize();

    // Event listeners
    document.addEventListener('DOMContentLoaded', () => this.updateSize(), false);
    window.addEventListener('resize', () => this.updateSize(), false);
  }

  updateSize() {
    // this.threeRenderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
    this.threeRenderer.setSize(window.innerWidth, window.innerHeight);
  }

  render(scene, camera) {
    this.threeRenderer.render(scene, camera);
  }
}
