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
};
