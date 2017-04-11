import * as THREE from 'three';
import dat from 'dat.gui';

export default class ViewerGui {
  /**
   * constructor
   * @param {Array.<String>} models: array of model names
   */
  constructor(models) {
    this.controls = {
      'Active Model': models[0],
      'Show Skeleton': false,
    };
    this.extras = {
      'Previous Active Model': models[0],
    };
    this.gui = new dat.GUI();
    this.gui.add(this.controls, 'Active Model', models).onChange(this.onChangeModel.bind(this));
    this.gui.add(this.controls, 'Show Skeleton').onChange(this.onToggleShowSkeleton.bind(this));
  }

  /**
   * adds controls for all models to gui
   * @param {object} allModelControls : object containing model controls
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
}
