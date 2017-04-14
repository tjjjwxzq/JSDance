import * as THREE from 'three';

/**
 * Class to control arm
 */

export default class Arm {
  /**
   * @param base: (THREE bone) base
   * @param end: (THREE bone) end
   * @param axis: (THREE Vector3) rotation axis
   * @param constraints: (array of 2-arrays) min and max angle constraints of each joint 
   * @param types: (array) type of each joint - "hinge" or "ball"
   */
  constructor(base, end, axis, constraints, types, targetPosition) {
    console.log(types);
    this.targetPosition = (targetPosition === undefined) ? end.getWorldPosition() : targetPosition;
    this.joints = [];
    this.addJoints(base, end);
    for (let i = 0; i < this.joints.length; i++) {
      let radConstraints = constraints[i].map(x => x / 360 * 2 * Math.PI);
      this.joints[i].constraints = radConstraints;
      this.joints[i].type = types[i];
    }
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

  getTargetPosition() {
    return this.targetPosition;
  }

  setTargetPosition(targetPosition) {
    this.targetPosition = targetPosition;
  }
}
