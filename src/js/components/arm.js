/**
 * Class to control arm
 */
export default class Arm {
  /**
   * @param {object} base: (THREE bone) base
   * @param {object} end: (THREE bone) end
   * @param {object} axis: (THREE Vector3) rotation axis
   * @param {array} constraints: (array of 2-arrays) min and max angle constraints of each joint
   * @param {array} types: type of each joint - "hinge" or "ball"
   * @param {object} targetPosition : (THREE Vector3) initial target position
   */
  constructor(base, end, axis, constraints, types, targetPosition) {
    this.targetPosition = (targetPosition === undefined) ? end.getWorldPosition() : targetPosition;
    this.joints = [];
    this.addJoints(base, end);
    for (let i = 0; i < this.joints.length; i++) {
      if (types[i] === 'hinge') {
        let radConstraints = constraints[i].map((x) => x / 360 * 2 * Math.PI);
        this.joints[i].constraints = radConstraints;
      } else if (types[i] === 'ball') {
        let radConstraints = {};
        radConstraints.x = constraints[i].x.map((x) => x / 360 * 2 * Math.PI);
        radConstraints.y = constraints[i].y.map((x) => x / 360 * 2 * Math.PI);
        radConstraints.z = constraints[i].z.map((x) => x / 360 * 2 * Math.PI);
        this.joints[i].constraints = radConstraints;
      }
      this.joints[i].type = types[i];
      this.joints[i].axis = axis;
    }
    this.prevError = this.getError();
  }

  /**
   * adds joints for this arm
   * @param {object} base THREE Bone
   * @param {object} end THREE Bone
   */
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
