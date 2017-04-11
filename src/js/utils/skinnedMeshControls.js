/**
 * class to parse and create joint controls
 * from a skinned mesh
 */
export default class SkinnedMeshControls {
  /**
   * takes a mesh and constructs controls for each joint
   * @param {object} mesh : SkinnedMesh object
   * @return {object} joint controls
   */
  static parseMesh(mesh) {
    let controls = {};
    controls[`${mesh.name} Controls`] = {};
    let subControls = controls[`${mesh.name} Controls`];
    for (let bone of mesh.skeleton.bones) {
      subControls[`${bone.name} position`] = {
        x: bone.position.x,
        y: bone.position.y,
        z: bone.position.z,
      };
      subControls[`${bone.name} rotation`] = {
        x: bone.rotation.x,
        y: bone.rotation.y,
        z: bone.rotation.z,
      };
    }
    return controls;
  }
}
