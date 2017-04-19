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
  static solve(arm, ikMethod) {
    let J = this.computeJacobian(arm);
    console.log(arm);
    // if (arm.joints.length === 1)
    //   console.log(J);
    return this.getAngleUpdate(J, arm, ikMethod);
  }

  /**
   * @param {object} arm: Arm instance
   * @param {object} axis: THREE Vector3 local axis of hinge joints
   * @return {array} J: 3 x joints.length nested array
   */
  static computeJacobian(arm) {
    let J = [[], [], []]; // 3 x joints.length, first row is end
    let endEffectorPos = arm.getEndEffector().getWorldPosition();
    for (let i = 0; i < arm.joints.length; i++) {
      let joint = arm.joints[i];
      let jointPos = joint.getWorldPosition();

      // Calculate vector from joint to end
      let jointToEndEffector = endEffectorPos.clone();
      jointToEndEffector.sub(jointPos);

      let axis = joint.axis;
      let axisGlobal = new THREE.Vector3();
      if (joint.type === 'hinge') {
        // Transform axis to global coordinates
        axisGlobal = axis.clone();
        axisGlobal.applyMatrix4(joint.matrixWorld);
        // Remove translation component of Matrix4
        axisGlobal.sub(jointPos);
        axisGlobal.normalize();
      } else if (joint.type === 'ball') {
        // i is never 0 since end effectors are always hinges
        let jointToChildJoint = arm.joints[i-1].getWorldPosition().clone();
        jointToChildJoint.sub(joint.getWorldPosition());
        let jointToGoal = arm.getTargetPosition().clone();
        jointToGoal.sub(joint.getWorldPosition());

        axisGlobal.crossVectors(jointToChildJoint, jointToGoal).normalize();
        joint.axis = joint.worldToLocal(axisGlobal).normalize();
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
   * @param {string} ikMethod: 'transpose', 'pseudoinverse', or 'damped'
   * @return {array} angleUpdate: joints.length array of change in angles
   */
  static getAngleUpdate(jacobian, arm, ikMethod) {
    let alpha = 0.01;
    if (ikMethod === 'transpose') {
      return numeric.dot(numeric.transpose(jacobian), arm.getError().toArray()).map((x) => x * alpha);
    } else {
      let Jt = numeric.transpose(jacobian);
      var JJt = numeric.dot(jacobian, Jt);
      var JJtInv;
      if (ikMethod === 'pseudoinverse') {
        JJtInv = numeric.inv(JJt);
      } else if (ikMethod === 'damped') {
        let lambda = 1;
        let JJtDamped = numeric.add(JJt, numeric.diag([lambda, lambda, lambda]));
        JJtInv = numeric.inv(JJtDamped); 
      }
      let pseudoinverse = numeric.dot(Jt, JJtInv);
      
      return numeric.dot(pseudoinverse, arm.getError().toArray()).map((x) => x * alpha);
    } 
  }

}
