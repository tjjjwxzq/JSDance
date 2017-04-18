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
    kinematicsType: 'inverse',
    skinningTypes: ['dual quaternion', 'linear'],
    kinematicsTypes: ['inverse', 'forward'],
  },
  /**
   * object containing all 5 end effectors
   * key: name of end effector
   * value: object containing:
   * - index of end effector in mesh.skeleton.bones[i]
   * etc.
   */
  arms: {
    'right hand': {'end': 7,
      'base': 5,
      'axis': [0, 1, 0],
      'constraints': [[-90, 90],
        [0, 140],
        {
          x: [-30, 30],
          y: [-60, 110],
          z: [-50, 60],
        }],
      'types': ['hinge',
        'hinge',
        'ball'],
    },
    'left hand': {'end': 11,
      'base': 9,
      'axis': [0, 1, 0],
      'constraints': [[-90, 90],
        [-140, 0],
        {
          x: [-30, 30],
          y: [-110, 60],
          z: [-50, 60],
        }],
      'types': ['hinge',
        'hinge',
        'ball'],
    },
    'right foot': {'end': 19,
      'base': 17,
      'axis': [1, 0, 0],
      'constraints': [[-30, 90],
        [0, 140],
        {
          x: [-120, 60],
          y: [-50, 50],
          z: [-70, 10],
        }],
      'types': ['hinge',
        'hinge',
        'ball'],
    },
    'left foot': {'end': 15,
      'base': 13,
      'axis': [1, 0, 0],
      'constraints': [[-30, 90],
        [0, 140],
        {
          x: [-120, 60],
          y: [-50, 50],
          z: [-10, 70],
        }],
      'types': ['hinge',
        'hinge',
        'ball'],
    },
    // 'head': {'end': 0,
      // 'base': 3,
      // 'axis': [1, 0, 0],
      // 'constraints': [[-90, 90],
        // [-90, 90],
        // [-90, 90],
        // [-90, 90]],
      // 'types': ['hinge',
        // 'hinge',
        // 'hinge',
        // 'hinge'],
    // },
  },
  sound: {

    assetPath: 'assets/',
    srcs: [
      'Goof.mp3',
      'xxangels.wav',
      'sample.wav',
      'simon.mp3',
      'ss.wav',
      'simplebeat.wav',
      'sine.wav',
    ],

    sampleRate: [
      521,  //goof
      500,  //xxangels
      1000, //sample
      448,  //simon
      120,  //ss.wav
      1000, //simplebeat.wav
      500,  //sine.wav
    ],

    map: [
      [1,15,1,    //goof
      1,15,1,
      5,15,15,
      5,15,15],

      [1,15,1,
      1,15,1,
      5,15,15,
      5,15,15],

      [1,15,1,
      1,15,1,
      5,15,15,
      5,15,15],

      [1,12,30,  //simon
      1,12,30,
      5,15,12,
      5,15,12],

      [15,15,15, //ss
      2,2,2,
      15,15,15,
      10,10,10],

      [1,15,1,
      1,15,1,
      5,15,15,
      5,15,15],

      [1,15,1,
      1,15,1,
      5,15,15,
      5,15,15],
    ],
    scaling: [
      [10,  4,  1.5,   //right hand: x,y,z goof
      -10,  4,  1.5,    //left hand: x,y,z
      -0,    3,  1,    //right leg: x,y,z
      0,     3,  1],    //left leg: x,y,z

      [1.5,  3,  2.5,   //right hand: x,y,z
      -1.5,  3,  2.5,    //left hand: x,y,z
      -2,    3,  2,    //right leg: x,y,z
      2,     3,  2],    //left leg: x,y,z

      [1.5,  3,  2.5,   //right hand: x,y,z
      -1.5,  3,  2.5,    //left hand: x,y,z
      -2,    3,  2,    //right leg: x,y,z
      2,     3,  2],    //left leg: x,y,z

      [1,  -5,  2,   //right hand: x,y,z simon
      1,  5,  2,    //left hand: x,y,z
      0,    5,  -2,    //right leg: x,y,z
      0,     5,  -2],    //left leg: x,y,z

      [1,  10,  10,   //right hand: x,y,z SS
      1,  10,  10,    //left hand: x,y,z
      -0.5,    5,  -12,    //right leg: x,y,z
      0.5,     5,  -12],    //left leg: x,y,z

      [1.5,  3,  2.5,   //right hand: x,y,z
      -1.5,  3,  2.5,    //left hand: x,y,z
      -2,    3,  2,    //right leg: x,y,z
      2,     3,  2],    //left leg: x,y,z

      [1.5,  3,  2.5,   //right hand: x,y,z
      -1.5,  3,  2.5,    //left hand: x,y,z
      -2,    3,  2,    //right leg: x,y,z
      2,     3,  2],    //left leg: x,y,z

    ],

    add: [
      [0,0,0,        
      0,0,0,
      0,0,0,
      0,0,0],

      [0,0,0,        
      0,0,0,
      0,0,0,
      0,0,0],

      [0,0,0,        
      0,0,0,
      0,0,0,
      0,0,0],

      [0,0,0,       //simon 
      0,0,0,
      0,0,0,
      0,0,0],

      [1,-6,-5,        //SS
      -1,-6,-5,
      0,-3,5,
      0,-3,5],

      [0,0,0,        
      0,0,0,
      0,0,0,
      0,0,0],

      [0,0,0,        
      0,0,0,
      0,0,0,
      0,0,0],
    ],


    randScale: [
      [0,0,0,        //scales the random addition. cannot be too big
      0,0,0,
      0,1,1,
      0,1,1],

      [0.5,0.5,0.5,        //scales the random addition. cannot be too big
      0.5,0.5,0.5,
      1,1,1,
      1,1,1],

      [0.5,0.5,0.5,        //scales the random addition. cannot be too big
      0.5,0.5,0.5,
      1,1,1,
      1,1,1],

      [0.5,0.5,0.5,        //simon
      0.5,0.5,0.5,
      1,1,0,
      1,1,0],

      [0,0,0,        //SS
      0,0,0,
      0,0,0,
      0,0,0],

      [0.5,0.5,0.5,        //scales the random addition. cannot be too big
      0.5,0.5,0.5,
      1,1,1,
      1,1,1],

      [0.5,0.5,0.5,        //scales the random addition. cannot be too big
      0.5,0.5,0.5,
      1,1,1,
      1,1,1],
    ],

    posNegSwitch: [true, true, true, true, false, true, true],

    fftSize: 32,
    //sampleRate: 500,
  },
  ikMethods: ['transpose',
              'damped']
};
