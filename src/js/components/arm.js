import * as THREE from 'three';

/**
 * Class to control arm
 */

export default class Arm {
  /**
   * @param base: THREE bone of base
   * @param end: THREE bone of end
   * @param axis: THREE Vector3 of rotation axis
   */
  constructor(base, end, axis, targetPosition) {
    this.joints = [];
    this.targetPosition = (targetPosition === undefined) ? end.getWorldPosition() : targetPosition;
    this.addJoints(base, end);
    this.axis = axis;
  }

  addJoints(base, end) {
    let curr = end;

    // List of joints from end to base
    while (curr !== base) {
      this.joints.push(curr);
      curr = curr.parent;
    }
    this.joints.push(base);
  }

  getEndEffector() {
    return this.joints[0];
  }

  getEndEffectorPos() {
    return this.getEndEffector().getWorldPosition();
  }

  getAxis() {
    return this.axis;
  }

  getError() {
    let error = this.targetPosition.clone();
    error.sub(this.getEndEffector().getWorldPosition());
    return error;
  }

  setTargetPosition(targetPosition) {
    this.targetPosition = targetPosition;
  }
}
