import dat from 'dat.gui';
import Config from 'config';

/**
 * class for initializing GUI controls
 */
export default class ViewerGui {
  /**
   * constructor
   * @param {Array.<String>} models: array of model names
   * @param {Array.<String>} songs: array of song names
   */
  constructor(models) {
    this.controls = {
      'Active Model': models[0],
      'Show Skeleton': false,
      'Show Debug': true,
      'Play Sound': false,
      'Song Selection': Config.sound.srcs[0],
      'IK Method': Config.ikMethods[0],
      'Skinning Type': Config.model.skinningType,
      'Kinematics Type': Config.model.kinematicsType,
    };
    this.extras = {
      'Previous Active Model': models[0],
    };
    this.gui = new dat.GUI();
    this.gui.add(this.controls, 'Active Model', models).onChange(this.onChangeModel.bind(this));
    this.gui.add(this.controls, 'Show Skeleton').onChange(this.onToggleShowSkeleton.bind(this));
    this.gui.add(this.controls, 'Show Debug').onChange(this.onToggleShowDebug.bind(this));
    this.gui.add(this.controls, 'Play Sound').onChange(this.onTogglePlaySound.bind(this));
    this.gui.add(this.controls, 'Song Selection', Config.sound.srcs).onChange(this.onChangeSong.bind(this));
    this.gui.add(this.controls, 'Skinning Type', Config.model.skinningTypes).onChange(this.onChangeSkinningType.bind(this));
    this.gui.add(this.controls, 'Kinematics Type', Config.model.kinematicsTypes).onChange(this.onChangeKinematicsType.bind(this));
    this.gui.add(this.controls, 'IK Method', Config.ikMethods).onChange(this.onChangeIKMethod.bind(this));
  }

  /**
   * adds target position controls for IK for every arm
   * @param {string} modelName : name of the model
   * @param {object} arms : arms object
   */
  addIKControls(modelName, arms) {
    let f = this.gui.addFolder(`${modelName} IK Target Controls`);
    this.allIKControls = {};
    this.allIKControls[modelName] = {};

    for (let arm in arms) {
      if (arms.hasOwnProperty(arm)) {
        this.allIKControls[modelName][arm] = {
          x: arms[arm].targetPosition.x,
          y: arms[arm].targetPosition.y,
          z: arms[arm].targetPosition.z,
        };
        let ff = f.addFolder(arm);
        ff.add(this.allIKControls[modelName][arm], 'x', -10, 10, 0.1);
        ff.add(this.allIKControls[modelName][arm], 'y', -10, 10, 0.1);
        ff.add(this.allIKControls[modelName][arm], 'z', -10, 10, 0.1);
      }
    }
  }

  /**
   * adds controls for all models to gui
   * @param {object} allModelControls : object containing model controls
   * @param {object} allDefaultControls : copy of original controls for reset
   * first level keys are the model names
   */
  addAllModelControls(allModelControls, allDefaultControls) {
    // copy of original default controls for reset
    this.allDefaultControls = allDefaultControls;
    this.allModelControls = allModelControls;
    for (let modelName of Object.keys(allModelControls)) {
      // Add folder for model controls
      let f = this.gui.addFolder(modelName);
      this.addModelControls(allModelControls[modelName], f);
    }
  }

  /**
   * adds controls for a single model to gui
   * @param {object} modelControls : object containing controls
   * @param {object} folder : folder to attach controls to
   * @param {float} min : min value for numeric control (optional)
   * @param {float} max : max value for numeric control (optional)
   */
  addModelControls(modelControls, folder, min, max) {
    for (let control in modelControls) {
      if (modelControls.hasOwnProperty(control)) {
        // Add subfolder
        if (typeof modelControls[control] === 'object') {
          let subFolder = folder.addFolder(control);
          if (control.includes('position')) {
            this.addModelControls(modelControls[control], subFolder, -5, 5, 1);
          } else {
            this.addModelControls(modelControls[control], subFolder, -180, 180, 1);
          }
        } else {
          folder.add(modelControls, control, min, max);
        }
      }
    }
  }

  /**
   * callback invoked when model is changed in gui
   * dispatches an event with the control value
   */
  onChangeModel() {
    let data = {
      detail: {
        modelName: this.controls['Active Model'],
        prevModelName: this.extras['Previous Active Model'],
      },
    };
    this.extras['Previous Active Model'] = this.controls['Active Model'];
    window.dispatchEvent(new CustomEvent('on-change-model', data));
  }

  /**
   * callback invoked when show skeleton is toggled in gui
   * dispatches an event with the control value
   */
  onToggleShowSkeleton() {
    let data = {
      detail: {
        show: this.controls['Show Skeleton'],
      },
    };
    window.dispatchEvent(new CustomEvent('on-toggle-skeleton', data));
  }

  /**
   * callback invoked when skinning type is changed
   * dispatches an event with the control value
   */
  onChangeSkinningType() {
    let data = {
      detail: {
        type: this.controls['Skinning Type'],
      },
    };
    window.dispatchEvent(new CustomEvent('on-change-skinning-type', data));
  }

  /**
   * callback invoked when kinematics type is changed
   * dispatches an event with the control value
   */
  onChangeKinematicsType() {
    let data = {
      detail: {
        type: this.controls['Kinematics Type'],
      },
    };
    window.dispatchEvent(new CustomEvent('on-change-kinematics-type', data));
  }

  /**
   * callback invoked when show debug is toggled
   * dispatches an event with the control value
   */
  onToggleShowDebug() {
    let data = {
      detail: {
        show: this.controls['Show Debug'],
      },
    };
    window.dispatchEvent(new CustomEvent('on-toggle-debug', data));
  }

  /**
   * callback invoked when play sound is toggled
   * dispatches an event with the control value
   */
  onTogglePlaySound() {
    let data = {
      detail: {
        play: this.controls['Play Sound'],
      },
    };
    window.dispatchEvent(new CustomEvent('on-toggle-sound', data));
  }

  onChangeSong() {
    let data = {
      detail: {
        songName: this.controls['Song Selection'],
      }
    };
    window.dispatchEvent(new CustomEvent('on-change-song', data));
  }

  onChangeIKMethod() {
    let data = {
      detail: {
        ikMethod: this.controls['IK Method'],
      }
    };
    window.dispatchEvent(new CustomEvent('on-change-ik-method', data));
  }
}
