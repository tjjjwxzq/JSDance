
import * as THREE from 'three';
// ensure MTLLoader, OBJLoader, and OrbitControl
// properties are added to THREE object
import * as _mtl from 'utils/mtlLoader';
import * as _obj from 'utils/objLoader';
import * as _orb from 'utils/orbitControls';
import SkinnedMeshControls from 'utils/skinnedMeshControls';
import {buildAxes} from 'utils/axes';
import IK from 'utils/IK';

import Arm from 'components/arm';
import Camera from 'components/camera';
import Controls from 'components/controls';
import Renderer from 'components/renderer';
import Light from 'components/light';
import ViewerGui from 'components/viewerGui';
import Shader from 'components/shader';
import Config from 'config';

import humanJSON from 'human.json';

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

    // Set ups model config
    this.modelName = Config.model.modelName;
    this.skinningType = Config.model.skinningType;

    // Load models
    this.models = {};
    this.models[this.modelName] = null;
    this.loadJSONModel(humanJSON, 'Human', this.skinningType);

    // GUI
    this.viewerGui = new ViewerGui(Object.keys(this.models));

    // Axes for debugging
    let axes = buildAxes(1000);
    this.scene.add(axes);

    // Listen for model load and GUI events
    window.addEventListener('model-loaded', this.onModelLoaded.bind(this));
    window.addEventListener('on-change-model', this.onChangeModel.bind(this));
    window.addEventListener('on-toggle-skeleton', this.onToggleSkeleton.bind(this));

    this.cube = new THREE.Mesh( new THREE.BoxGeometry(1, 1, 1), new THREE.MeshNormalMaterial() );
    this.scene.add(this.cube);

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
    this.updateFK();
    // updateUniforms has to be before updateIK for some reason
    if(this.skinningType === 'dual quaternion')
      this.updateUniforms();
    this.updateIK();
    this.controls.threeControls.update();

    // let pos = this.viewerGui.allIKControls.Human['head'];
    // this.cube.position.set( pos.x, pos.y, pos.z );

    this.render();
  }

  /**
   *  renders the scene
   */
  render() {
    this.renderer.threeRenderer.render(this.scene, this.camera.threeCamera);
  }

  /**
   * Updates joint parameters based on GUI controls
   */
  updateFK() {
    let human = this.models[this.modelName];
    if (human !== null) {
      let bones = human.mesh.skeleton.bones;
      for (let bone of bones) {
        bone.position.x = this.viewerGui.allModelControls[`${this.modelName} Controls`][`${bone.name} position`].x;
        bone.position.y = this.viewerGui.allModelControls[`${this.modelName} Controls`][`${bone.name} position`].y;
        bone.position.z = this.viewerGui.allModelControls[`${this.modelName} Controls`][`${bone.name} position`].z;

        bone.rotation.x = this.viewerGui.allModelControls[`${this.modelName} Controls`][`${bone.name} rotation`].x * (2 * Math.PI) / 360;
        bone.rotation.y = this.viewerGui.allModelControls[`${this.modelName} Controls`][`${bone.name} rotation`].y * (2 * Math.PI) / 360;
        bone.rotation.z = this.viewerGui.allModelControls[`${this.modelName} Controls`][`${bone.name} rotation`].z * (2 * Math.PI) / 360;
      }

      // update skeleton helper
      human.skeleton.update();
    }
  }

  /**
   * Updates uniforms for dual quaternion skinning
   */
  updateUniforms() {
    let human = this.models[this.modelName];
    if (human !== null) {
      let skeleton = human.mesh.skeleton;
      let bones = skeleton.bones;

      let rotQuaternions = human.mesh.material.uniforms.rotQuaternions.value;
      let transQuaternions = human.mesh.material.uniforms.transQuaternions.value;
      for (let i=0; i < bones.length; i++) {
        let offsetTransformWorld = new THREE.Matrix4();
        offsetTransformWorld.multiplyMatrices(bones[i].matrixWorld, skeleton.boneInverses[i]);
        let pos = new THREE.Vector3();
        let quat = new THREE.Quaternion();
        let scale = new THREE.Vector3();
        offsetTransformWorld.decompose(pos, quat, scale);

        rotQuaternions[i] = quat;
        let position = pos.multiplyScalar(0.5);
        position = (new THREE.Quaternion(pos.x, pos.y, pos.z, 0)).multiply(quat);
        transQuaternions[i] = position;
      }
    }
  }

  /**
   * update the target positions and joint angles
   * with IK
   */
  updateIK() {
    if (this.models[this.modelName] !== null) {
      let human = this.models[this.modelName];
      let arms = human.arms;
      let controls = this.viewerGui.allIKControls[this.modelName];
      // Update target positions
      for (let armName in arms) {
        if (arms.hasOwnProperty(armName)) {
          let targetPosition = new THREE.Vector3(controls[armName].x, controls[armName].y, controls[armName].z);
          let arm = arms[armName];
          arm.setTargetPosition(targetPosition);

          // Solve for and set angles
          for(let i=0; i < 10; ++i) {
            let angles = IK.solve(arm);
            for (let i = 0; i < arm.joints.length; i++) {
              let joint = arm.joints[i];
              let currentAngle = joint.rotation.toVector3().dot(joint.axis);
              let newAngle = currentAngle + angles[i];
              let angleUpdate = angles[i];

              // Clamp angle of joint
              let max = joint.constraints[1];
              let min = joint.constraints[0];
              if (newAngle > max) {
                angleUpdate = max - currentAngle;
              } else if (newAngle < min) {
                angleUpdate = min - currentAngle;
              }
              joint.rotateOnAxis(joint.axis, angleUpdate);
            }
          }
        }
      }
    }
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
   * using a custom shader if `type` is given
   * @param {string} filename
   * @param {string} modelName
   * @param {string} type of shader
   */
  loadJSONModel(filename, modelName, type) {
    let loader = new THREE.JSONLoader();
    loader.load(filename, (geometry, materials) => {
      let material;
      switch(type) {
        case 'linear':
          material = Shader.createRawShaderMaterial(Shader.LINEAR_BLEND_SKINNING_VERT, Shader.BASIC_FRAG);
          break;
        case 'dual quaternion':
          let rotQuaternions = [];
          let transQuaternions = [];
          for (let i=0; i < geometry.bones.length; i++) {
            let bone = geometry.bones[i];
            let rotQuat = new THREE.Quaternion(bone.rotq[0], bone.rotq[1], bone.rotq[2]);
            rotQuaternions.push(rotQuat);
            let transQuat = new THREE.Quaternion(0.5 * bone.pos[0], 0.5 * bone.pos[1], 0.5 * bone.pos[2], 0);
            transQuat.multiply(rotQuat);
            transQuaternions.push(transQuat);
          }
          let uniforms = {
            rotQuaternions: {type: 'v4v', value: rotQuaternions},
            transQuaternions: {type: 'v4v', value: transQuaternions},
          };

          material = Shader.createRawShaderMaterial(Shader.DUAL_QUAT_SKINNING_VERT, Shader.BASIC_FRAG, uniforms);

          break;
        default:
          material = new THREE.MultiMaterial(materials);
      }

      let mesh = new THREE.SkinnedMesh(geometry, material);

      // setting both the flags below seem to be necessary for getting
      // the custom skinning shader to work
      mesh.material.skinning = true;
      mesh.skeleton.useVertexTexture = false;

      let skeletonHelper = new THREE.SkeletonHelper(mesh);
      skeletonHelper.material.linewidth = 10;
      skeletonHelper.visible = false;
      mesh.visible = false;
      mesh.name = modelName;

      // Load arms
<<<<<<< HEAD
      let arms = [];
      for (let armName in Config.arms) {
        if (Config.arms.hasOwnProperty(armName)) {
          let baseIdx = Config.arms[armName].base;
          let endIdx = Config.arms[armName].end;
          let axisArr = Config.arms[armName].axis;
          let axis = new THREE.Vector3(...axisArr);

          let arm = new Arm(mesh.skeleton.bones[baseIdx], mesh.skeleton.bones[endIdx], axis);
=======
      let arms = {};
      for (let armName in Config.arms) {
        if (Config.arms.hasOwnProperty(armName)) {
          let armConfig = Config.arms[armName];
          let baseIdx = armConfig.base;
          let endIdx = armConfig.end;
          let axisArr = armConfig.axis;
          let axis = new THREE.Vector3(...axisArr);
          let constraints = armConfig.constraints;
          let types = armConfig.types;

          let arm = new Arm(mesh.skeleton.bones[baseIdx], mesh.skeleton.bones[endIdx], axis, constraints, types);
>>>>>>> ik-in-progress-broken

          arms[armName] = arm;
        }
      }

      this.scene.add(skeletonHelper);
      this.scene.add(mesh);
      this.models[modelName] = {
        skeleton: skeletonHelper,
        mesh: mesh,
        arms: arms,
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
      console.log(this.models[modelName].mesh.skeleton.bones);
      this.viewerGui.addAllModelControls(
        SkinnedMeshControls.parseMesh(this.models[modelName].mesh), SkinnedMeshControls.parseMesh(this.models[modelName].mesh));
      this.viewerGui.addIKControls(modelName, this.models[modelName].arms);
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
