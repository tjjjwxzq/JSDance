import * as THREE from 'three';
import * as numeric from 'numeric';

export default class IK {
  /**
   *
   */
  static solve(arm) {
    let J = this.computeJacobian(arm);
    return this.getAngleUpdate(J, arm);
  }

  /**
   * @param arm: Arm instance
   * @param axis: THREE Vector3 local axis of hinge joints
   * @return J: 3 x joints.length nested array
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

      // Transform axis to global coordinates
      let axisGlobal = axis.clone();
      axisGlobal.applyMatrix4(arm.joints[i].matrixWorld);
      // Remove translation component of Matrix4
      axisGlobal.sub(jointPos);
      axisGlobal.normalize();

      // Get direction
      let direction = new THREE.Vector3();
      direction.crossVectors(axisGlobal, jointToEndEffector);
      
      J[0].push(direction.x);
      J[1].push(direction.y);
      J[2].push(direction.z);
    }
    console.log(arm.joints);
    console.log(J);
    return J;
  }

  /**
   * @param jacobian: result from computeJacobian()
   * @param arm: Arm instance
   * @return angleUpdate: joints.length array of change in angles
   */
  static getAngleUpdate(jacobian, arm) {
    let alpha = 0.001; 
    return alpha * numeric.dot(numeric.transpose(jacobian), arm.getError().toArray());
  }
}
