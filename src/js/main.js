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
import Sound from 'components/sound';
import Config from 'config';

import humanJSON from 'human.json';
import _simpleBeat from 'simplebeat.wav';
import _xxangels from 'xxangels.wav';
import _sample from 'sample.wav';

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

    // Sound
    this.sound;

    // Set ups model config
    this.modelName = Config.model.modelName;
    this.skinningType = Config.model.skinningType;
    this.kinematicsType = Config.model.kinematicsType;

    // Load models
    this.models = {};
    this.models[this.modelName] = null;
    this.loadJSONModel(humanJSON, this.modelName, this.skinningType);

    // GUI
    this.viewerGui = new ViewerGui(Object.keys(this.models));

    // Axes for debugging
    let axes = buildAxes(1000);
    this.scene.add(axes);

    // Listen for model load and GUI events
    window.addEventListener('model-loaded', this.onModelLoaded.bind(this));
    window.addEventListener('on-change-model', this.onChangeModel.bind(this));
    window.addEventListener('on-toggle-skeleton', this.onToggleSkeleton.bind(this));
    window.addEventListener('on-change-skinning-type', this.onChangeSkinningType.bind(this));
    window.addEventListener('on-change-kinematics-type', this.onChangeKinematicsType.bind(this));

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

    if (this.kinematicsType === 'forward') {
      this.updateFK();
    } else if (this.kinematicsType === 'inverse') {
      this.updateIK();
    }
    // updateUniforms has to be before updateIK for some reason
    if(this.skinningType === 'dual quaternion')
      this.updateUniforms();
    this.controls.threeControls.update();

    let pos = this.viewerGui.allIKControls.Human['right foot'];
    this.cube.position.set( pos.x, pos.y, pos.z );

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
        bone.position.x = this.viewerGui.allModelControls[`${this.modelName} FK Joint Controls`][`${bone.name} position`].x;
        bone.position.y = this.viewerGui.allModelControls[`${this.modelName} FK Joint Controls`][`${bone.name} position`].y;
        bone.position.z = this.viewerGui.allModelControls[`${this.modelName} FK Joint Controls`][`${bone.name} position`].z;

        bone.rotation.x = this.viewerGui.allModelControls[`${this.modelName} FK Joint Controls`][`${bone.name} rotation`].x * (2 * Math.PI) / 360;
        bone.rotation.y = this.viewerGui.allModelControls[`${this.modelName} FK Joint Controls`][`${bone.name} rotation`].y * (2 * Math.PI) / 360;
        bone.rotation.z = this.viewerGui.allModelControls[`${this.modelName} FK Joint Controls`][`${bone.name} rotation`].z * (2 * Math.PI) / 360;
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
      let sound = this.sound;
      // Update target positions
      for (let armName in arms) {
        if (arms.hasOwnProperty(armName)) {

          // Update from GUI controls
          //let targetPosition = new THREE.Vector3(controls[armName].x, controls[armName].y, controls[armName].z);

          //console.log(controls[armName].x,controls[armName].y,controls[armName].z);
          //KEITH ADDITION
          //this works
          //console.log(sound.righthandX, sound.righthandY, sound.righthandZ);
          //let targetPosition = new THREE.Vector3(sound.righthandX/10, sound.righthandY/10, sound.righthandZ/10);
          //let targetPosition = new THREE.Vector3(0.5,0.5,0.5);
          let targetPosition = new THREE.Vector3(sound.armPositions[armName].x, sound.armPositions[armName].y, sound.armPositions[armName].z);

          let arm = arms[armName];
          arm.setTargetPosition(targetPosition);

          // Solve for and set angles
          for(let i=0; i < 1; ++i) {
            let angles = IK.solve(arm);
            for (let i = 0; i < arm.joints.length; i++) {
              let joint = arm.joints[i];

              if (joint.type == 'hinge') {
                let min = joint.constraints[0];
                let max = joint.constraints[1];
                joint.rotateOnAxis(joint.axis, angles[i]);

                let updatedAngle = joint.rotation.toVector3().dot(joint.axis);

                if(updatedAngle > max) {
                  joint.setRotationFromAxisAngle(joint.axis, max);
                } else if (updatedAngle < min) {
                  joint.setRotationFromAxisAngle(joint.axis, min);
                }
              } else if (joint.type == 'ball') {
                let minX = joint.constraints.x[0];
                let maxX = joint.constraints.x[1];

                let minY = joint.constraints.y[0];
                let maxY = joint.constraints.y[1];

                let minZ = joint.constraints.z[0];
                let maxZ = joint.constraints.z[1];

                if (joint.prevAngle !== undefined && Math.abs(angles[i] - joint.prevAngle) < 0.004) {
                  joint.rotateOnAxis(joint.axis, angles[i]);
;
                  let finalRotObject = new THREE.Object3D();
                  finalRotObject.setRotationFromEuler(joint.rotation);

                  if (joint.rotation.x > maxX) {
                    finalRotObject.setRotationFromAxisAngle(new THREE.Vector3(1, 0, 0), maxX);
                  } else if (joint.rotation.x < minX) {
                    finalRotObject.setRotationFromAxisAngle(new THREE.Vector3(1, 0, 0), minX);
                  }

                  if (joint.rotation.y > maxY) {
                    finalRotObject.setRotationFromAxisAngle(new THREE.Vector3(1, 0, 0), maxY);
                  } else if (joint.rotation.y < minY) {
                    finalRotObject.setRotationFromAxisAngle(new THREE.Vector3(1, 0, 0), minY);
                  }

                  if (joint.rotation.z > maxZ) {
                    finalRotObject.setRotationFromAxisAngle(new THREE.Vector3(1, 0, 0), maxZ);
                  } else if (joint.rotation.z < minZ) {
                    finalRotObject.setRotationFromAxisAngle(new THREE.Vector3(1, 0, 0), minZ);
                  }

                  joint.setRotationFromEuler(finalRotObject.rotation);
                }

                joint.prevAngle = angles[i];
              }
            }
          }

          if(armName == 'left hand') {
            // console.log('current update ' + IK.solve(arm)[2]);
            // console.log('prev update ' + arm.joints[2].prevAngle);
            // console.log(arm.joints[2].axis);
            // console.log(arm.joints[2].rotation);
          }
        }
      }

      human.skeleton.update();
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

          arms[armName] = arm;
        }
      }

      console.log("before");
      this.sound = new Sound(arms);
      console.log("AFTER");

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
    console.log("model loaded)");
    let modelName = event.detail.modelName;
    // Unhide model
    if (this.viewerGui.controls['Active Model'] === modelName) {
      this.toggleModel(this.models[modelName], true, this.viewerGui.controls['Show Skeleton']);
    }

    // Add GUI Controls
    if (this.models[modelName].mesh !== undefined) {
      this.addGuiControls(modelName);
    }
  }

  /**
   * @param {string} modelName : name of model
   * adds GUI controls for FK and IK
   */
  addGuiControls(modelName) {
    let fkFolderName = `${modelName} FK Joint Controls`;
    let ikFolderName = `${modelName} IK Target Controls`;
    if(this.viewerGui.gui.__folders[fkFolderName] === undefined) {
        this.viewerGui.addAllModelControls(
        SkinnedMeshControls.parseMesh(this.models[modelName].mesh), SkinnedMeshControls.parseMesh(this.models[modelName].mesh));
    }

    if (this.viewerGui.gui.__folders[ikFolderName] === undefined) {
      this.viewerGui.addIKControls(modelName, this.models[modelName].arms);
    }

    this.toggleKinematicsControls();
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

  /**
   * changes skinning type and reloads mesh
   * @param {object} event : on-change-skinning-type event
   */
  onChangeSkinningType(event) {
    let type = event.detail.type;
    this.skinningType = type;
    this.disposeMesh(this.models[this.modelName]);
    this.models[this.modelName] = null;
    this.loadJSONModel(humanJSON, this.modelName, this.skinningType);
  }

  /**
   * disposes of model mesh and skeleton
   * @param {object} model : model to dispose of
   */
  disposeMesh(model) {
    this.scene.remove(model.mesh);
    this.scene.remove(model.skeleton);
    model.mesh.geometry.dispose();
    model.mesh.material.dispose();
    model.skeleton.geometry.dispose();
    model.skeleton.material.dispose();
  }

  /**
   * changes kinematics type and updates gui
   * @param {object} event : on-change-kinematics-type event
   */
  onChangeKinematicsType(event) {
    let type = event.detail.type;
    this.kinematicsType = type;
    this.toggleKinematicsControls();
  }

  /**
   * toggles visibility of kinematics controls based on
   * current kinematicsType
   */
  toggleKinematicsControls() {
    if (this.kinematicsType === 'forward') {
      this.viewerGui.gui.__folders[`${this.modelName} IK Target Controls`].domElement.style.display = 'none';
      this.viewerGui.gui.__folders[`${this.modelName} FK Joint Controls`].domElement.style.display = 'block';
    } else if (this.kinematicsType === 'inverse') {
      this.viewerGui.gui.__folders[`${this.modelName} IK Target Controls`].domElement.style.display = 'block';
      this.viewerGui.gui.__folders[`${this.modelName} FK Joint Controls`].domElement.style.display = 'none';
    }
  }
}
