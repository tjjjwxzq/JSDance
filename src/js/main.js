import * as THREE from 'three';
// ensure MTLLoader, OBJLoader, and OrbitControl
// properties are added to THREE object
import * as _mtl from 'utils/mtlLoader';
import * as _obj from 'utils/objLoader';
import * as _orb from 'utils/orbitControls';
import SkinnedMeshControls from 'utils/skinnedMeshControls'

import Camera from 'components/camera';
import Controls from 'components/controls';
import Renderer from 'components/renderer';
import Light from 'components/light';
import ViewerGui from 'components/viewerGui';
import Shader from 'components/shader';

import humanJSON from'human.json';

/**
 * ties components together into core threejs program
 */
export default class Main {
  /**
   * initializes components and core logic
   * @param {object} container : WebGL container element
   */
  constructor(container) {
    // container element (canvas)
    this.container = container;

    // Scene and Lighting
    this.scene = new THREE.Scene();
    this.light = new Light(this.scene);

    const lights = ['ambient', 'directional'];
    for(const l of lights) {
      this.light.place(l);
    }

    // Renderer
    this.renderer = new Renderer(this.scene, container);

    // Camera
    this.camera = new Camera(this.renderer.threeRenderer);

    // Controls
    this.controls = new Controls(this.camera.threeCamera, this.renderer.threeRenderer.domElement);

    // Load models
    this.models = {
      'Human': null,
    };
    this.loadJSONModel(humanJSON, 'Human');

    // GUI
    this.viewerGui = new ViewerGui(Object.keys(this.models));

    // Listen for model load and GUI events
    window.addEventListener('model-loaded', this.onModelLoaded.bind(this));
    window.addEventListener('on-change-model', this.onChangeModel.bind(this));
    window.addEventListener('on-toggle-skeleton', this.onToggleSkeleton.bind(this));

    // Start animation/render
    this.animate();
  }


  /**
   * render loop
   */
  animate() {
    // the callback invoked should repeatedly invoke itself
    // need to bind to this object or `this` will be undefined
    requestAnimationFrame(this.animate.bind(this));

    // rotate hand
    let human = this.models['Human'];
    if (human !== null) {
      for (let bone of human.mesh.skeleton.bones) {
        bone.position.x = this.viewerGui.allModelControls['Human Controls'][`${bone.name} position`].x;
        bone.position.y = this.viewerGui.allModelControls['Human Controls'][`${bone.name} position`].y;
        bone.position.z = this.viewerGui.allModelControls['Human Controls'][`${bone.name} position`].z;

        bone.rotation.x = this.viewerGui.allModelControls['Human Controls'][`${bone.name} rotation`].x * (2 * Math.PI) / 360;
        bone.rotation.y = this.viewerGui.allModelControls['Human Controls'][`${bone.name} rotation`].y * (2 * Math.PI) / 360;
        bone.rotation.z = this.viewerGui.allModelControls['Human Controls'][`${bone.name} rotation`].z * (2 * Math.PI) / 360;
      }
    }

    // update skeleton helper
    human.skeleton.update();

    this.controls.threeControls.update();
    this.render();
  }

  /**
   *  renders the scene
   */
  render() {
    this.renderer.threeRenderer.render(this.scene, this.camera.threeCamera);
  }

  /**
   * loads mesh from .obj file
   * @param {string} filename
   * @param {string} modelName
   */
  loadOBJMesh(filename, modelName) {
    // Object mesh and material
    const mtlLoader = new THREE.MTLLoader();
    mtlLoader.setTexturePath('assets/');
    mtlLoader.setPath('assets/');
    mtlLoader.load(`${filename}.mtl`, (materials) => {
      materials.preload();

      const objLoader = new THREE.OBJLoader();
      objLoader.setMaterials(materials);
      objLoader.setPath('assets/');
      objLoader.load(`${filename}.obj`, (object) => {
        object.visible = false;
        object.name = modelName;
        this.scene.add(object);
        this.models[modelName] = object;
        let data = {
          detail: {
            modelName: modelName,
          },
        };
        window.dispatchEvent(new CustomEvent('model-loaded', data));
      });
    });
  }

  /**
   * loads mesh and skeleton from JSON file
   * @param {string} filename
   * @param {string} modelName
   */
  loadJSONModel(filename, modelName) {
    let loader = new THREE.JSONLoader();
    loader.load(filename, (geometry, materials) => {
      // let material = new THREE.MultiMaterial(materials);
      let material = Shader.createRawShaderMaterial(Shader.LINEAR_BLEND_SKINNING_VERT, Shader.RAW_LAMBERT_FRAG, THREE.ShaderLib.lambert.uniforms);
      // let material = Shader.createShaderMaterial(Shader.LAMBERT_VERT, Shader.LAMBERT_FRAG, THREE.ShaderLib.lambert.uniforms);
      let mesh = new THREE.SkinnedMesh(geometry, material);

      // setting both the flags below seem to be necessary for getting
      // the custom skinning shader to work
      mesh.material.skinning = true;
      mesh.skeleton.useVertexTexture = false;

      // Not sure how to make helper also rotate with mesh bones?
      let skeletonHelper = new THREE.SkeletonHelper(mesh);
      skeletonHelper.material.linewidth = 10;
      skeletonHelper.visible = false;
      mesh.visible = false;
      mesh.name = modelName;
      this.scene.add(skeletonHelper);
      this.scene.add(mesh);
      this.models[modelName] = {
        skeleton: skeletonHelper,
        mesh: mesh,
      };

      let data = {
        detail: {
          modelName: modelName,
        },
      };
      window.dispatchEvent(new CustomEvent('model-loaded', data));
    });
  }

  /**
   *  Sets visibility of model once loaded
   *  @param {object} event : model-loaded event
   */
  onModelLoaded(event) {
    let modelName = event.detail.modelName;
    if (this.viewerGui.controls['Active Model'] === modelName) {
      this.toggleModel(this.models[modelName], true, this.viewerGui.controls['Show Skeleton']);
    }

    if (this.models[modelName].mesh !== undefined) {
      this.viewerGui.addAllModelControls(
      SkinnedMeshControls.parseMesh(this.models[modelName].mesh), SkinnedMeshControls.parseMesh(this.models[modelName].mesh));
    }
  }

  /**
   * hides old model and shows current model
   * @param {object} event : on-change-model event
   */
  onChangeModel(event) {
    let prevModelName = event.detail.prevModelName;
    let modelName = event.detail.modelName;

    // Hide previously active model
    this.toggleModel(this.models[prevModelName], false, this.viewerGui.controls['Show Skeleton']);
    // Show current model
    this.toggleModel(this.models[modelName], true, this.viewerGui.controls['Show Skeleton']);
  }

  /**
   * toggles visibility of skeleton (if any)
   * @param {object} event : on-toggle-skeleton event
   */
  onToggleSkeleton(event) {
    let show = event.detail.show;
    let modelName = this.viewerGui.controls['Active Model'];
    this.toggleModel(this.models[modelName], true, show);
  }

  /**
   * toggles visibility of given model object
   * @param {object} model : model object, may contain skeleton and mesh
   * @param {boolean} toggle : visibility of model or mesh
   * @param {boolean} skeleton : visibility of skeleton
   */
  toggleModel(model, toggle, skeleton) {
    if(model.visible !== undefined) {
      model.visible = toggle;
    } else {
      model.skeleton.visible = skeleton;
      model.mesh.visible = toggle;
    }
  }
}
