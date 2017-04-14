/**
 * object containing all 5 end effectors
 * key: name of end effector
 * value: index of end effector in mesh.skeleton.bones[i]
 */

export default {
  'right hand': {'end': 16,
                 'base': 14
                },
  'left hand': {'end': 20,
                'base': 18
               },
  'right foot': {'end': 12,
                 'base': 9},
  'left foot': {'end': 7,
                'base': 5}
}
