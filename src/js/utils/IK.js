import * as THREE from 'three';
import * as numeric from 'numeric';

/**
 * Utility class for IK solver
 */
export default class IK {
  /**
   * @param {object} arm : Arm instance
   * @return {array} array of updates to joint angles
   */
  static solve(arm) {
    let J = this.computeJacobian(arm);
    return this.getAngleUpdate(J, arm);
  }

  /**
   * @param {object} arm: Arm instance
   * @param {object} axis: THREE Vector3 local axis of hinge joints
   * @return {array} J: 3 x joints.length nested array
   */
  static computeJacobian(arm) {
    let axis = arm.getAxis();
    let J = [[], [], []]; // 3 x joints.length, first row is end
    let endEffectorPos = arm.getEndEffector().getWorldPosition();
    for(let i = 0; i < arm.joints.length; i++) {
      let jointPos = arm.joints[i].getWorldPosition();

      // Calculate vector from joint to end
      let jointToEndEffector = endEffectorPos.clone();
      jointToEndEffector.sub(jointPos);

      let axisGlobal = new THREE.Vector3();
      if (arm.joints[i].type === 'hinge') {
        // Transform axis to global coordinates
        axisGlobal = axis.clone();
        axisGlobal.applyMatrix4(arm.joints[i].matrixWorld);
        // Remove translation component of Matrix4
        axisGlobal.sub(jointPos);
        axisGlobal.normalize();
      } else if (arm.joints[i].type === 'ball') {
        // i is never 0 since end effectors are always hinges
        let jointToChildJoint = arm.joints[i-1].getWorldPosition().clone();
        jointToChildJoint.sub(arm.joints[i].getWorldPosition());
        let jointToGoal = arm.getTargetPosition().clone();
        jointToGoal.sub(arm.joints[i].getWorldPosition());

        axisGlobal.crossVectors(jointToChildJoint, jointToGoal).normalize();
      }

      // Get direction
      let direction = new THREE.Vector3();
      direction.crossVectors(axisGlobal, jointToEndEffector);

      J[0].push(direction.x);
      J[1].push(direction.y);
      J[2].push(direction.z);
    }
    return J;
  }

  /**
   * @param {array} jacobian: result from computeJacobian()
   * @param {object} arm: Arm instance
   * @return {array} angleUpdate: joints.length array of change in angles
   */
  static getAngleUpdate(jacobian, arm) {
    let alpha = 0.01;
    return numeric.dot(numeric.transpose(jacobian), arm.getError().toArray()).map((x) => x * alpha);
  }
}
