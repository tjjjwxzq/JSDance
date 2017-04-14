export default {
  camera: {
    fov: 45,
    near: 1,
    far: 1000,
    aspect: 1,
    posX: 0,
    posY: 0,
    posZ: 5,
  },
  controls: {
    autoRotate: false,
    autoRotateSpeed: 2.0,
    enableDamping: true,
    dampingFactor: 0.25,
  },
  ambientLight: {
    enabled: true,
    color: 0xffffff,
  },
  directionalLight: {
    enabled: true,
    color: 'hsl(240, 100%, 75%)',
    x: 100,
    y: 0,
    z: -100,
  },
  model: {
    modelName: 'Human',
    skinningType: 'dual quaternion',
  },
  /**
   * object containing all 5 end effectors
   * key: name of end effector
   * value: index of end effector in mesh.skeleton.bones[i]
   */

  arms: {
    'right hand': {'end': 16,
                   'base': 14,
                   'axis': [0, 1, 0]
                  },
    'left hand': {'end': 20,
                  'base': 18,
                  'axis': [0, 1, 0]
                 },
    'right foot': {'end': 12,
                   'base': 9,
                   'axis': [0, 1, 0]
                  }, 
    'left foot': {'end': 7,
                  'base': 5,
                  'axis': [0, 1, 0]
                 }
  }
};
  
