import {createjs} from 'imports-loader?this=>window!components/soundjs';
import Config from 'config';

var TWEEN = require('tween.js');

let assetPath = Config.sound.assetPath;
let srcs = Config.sound.srcs;
let fftSize = Config.sound.fftSize;
let sampleRate = Config.sound.sampleRate;

export default class Sound {
  constructor(arms) {
    // Create object of position objects for each arm
    let armPositions = {};
    let baseArmPositions = {};
    let internalArmPositions = {};

    for (let armName in arms) {
      if (arms.hasOwnProperty(armName)) {
        armPositions[armName] = {
          x: arms[armName].targetPosition.x,
          y: arms[armName].targetPosition.y,
          z: arms[armName].targetPosition.z
        }
        baseArmPositions[armName] = {
          x: arms[armName].targetPosition.x,
          y: arms[armName].targetPosition.y,
          z: arms[armName].targetPosition.z
        }
        internalArmPositions[armName] = {
          x: arms[armName].targetPosition.x,
          y: arms[armName].targetPosition.y,
          z: arms[armName].targetPosition.z
        }
      }
    }
    this.baseArmPositions = baseArmPositions;
    this.internalArmPositions = internalArmPositions;
    this.armPositions = armPositions;
    let srcObjects = srcs.map((x) => { return {src: x}; });
    createjs.Sound.registerPlugins([createjs.WebAudioPlugin]);
    createjs.Sound.registerSounds(srcObjects, assetPath);
    createjs.Sound.on('fileload', this.handleLoad.bind(this));
  }

  handleLoad() {
    // set up analyser node
    let context = createjs.Sound.activePlugin.context;
    this.analyserNode = context.createAnalyser();
    this.analyserNode.fftSize = fftSize;
    this.analyserNode.smoothingTimeConstant = 0.9;
    this.analyserNode.connect(context.destination);


    // attach visualizer node to our existing dynamicsCompressorNode, which was connected to context.destination
    let dynamicsNode = createjs.Sound.activePlugin.dynamicsCompressorNode;
    dynamicsNode.disconnect();  // disconnect from destination
    dynamicsNode.connect(this.analyserNode);

    // arrays for retrieving analyserNode data
    this.freqFloatData = new Float32Array(this.analyserNode.frequencyBinCount);
    this.freqByteData = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.timeByteData = new Uint8Array(this.analyserNode.frequencyBinCount);
  }

  createInstance(src) {
    if (this.soundInstance) {
      this.soundInstance.stop();
      this.soundInstance.destroy();
    }
    this.soundInstance = createjs.Sound.createInstance(assetPath + src);
  }

  startPlayback() {
    if (this.soundInstance) {
      this.soundInstance.play({loop: -1});
      setInterval(this.analyse.bind(this), sampleRate);
    };

  }

  stopPlayback() {
    if (this.soundInstance)
      this.soundInstance.stop();
  }

  analyse() {
    // console.log('analyse');
    this.analyserNode.getByteFrequencyData(this.freqByteData); //frequency
    this.analyserNode.getByteTimeDomainData(this.timeByteData); //waveform

    //frequency to end position mapping
    ///changes for every "genre"
    //right hand, left hand, right leg, left leg
    // let mapping = [1,15,15,
    //                 1,15,15,
    //                 1,15,15,
    //                 1,15,15];

    let mapping = [1,15,1,
      1,15,1,
      5,15,15,
      5,15,15];

    // let mapping = [2,20,30,
      // 2,10,20,
      // 1,13,31,
      // 5,20,31];

    // let mapping = [2,2,2,
      // 20,20,20,
      // 15,15,15,
      // 15,15,15];

    ///change to suit your needs
    let scaling =   [1.7,  3,  2.5,   //right hand: x,y,z
      -1.7,  3,  2.5,    //left hand: x,y,z
      -1,    8,  2,    //right leg: x,y,z
      1,     8,  2]    //left leg: x,y,z
    let n = 0;

    let internalArmPositions = this.internalArmPositions;
    let baseArmPositions = this.baseArmPositions;
    let armPositions = this.armPositions;
    console.log("analyse");
    for (let armName in Config.arms) {
      if (Config.arms.hasOwnProperty(armName)) {
        //console.log(baseArmPositions[armName].x, baseArmPositions[armName].y, baseArmPositions[armName].z);

        /********** Using random number **********/
        // internalArmPositions[armName].x = baseArmPositions[armName].x + (Math.random() * 2 - 1.0) * 2;
        // internalArmPositions[armName].y = baseArmPositions[armName].y + (Math.random() * 2 - 1.0) * 2;
        // internalArmPositions[armName].z = baseArmPositions[armName].z + (Math.random() * 2 - 1.0) * 2;
        /******************************/

        //console.log(this.freqByteData[mapping[n]]);

        internalArmPositions[armName].x = baseArmPositions[armName].x + (this.timeByteData[mapping[n]]/255)*scaling[n];    //divide by 255 to normalize
        if (isNaN(internalArmPositions[armName].x)) {internalArmPositions[armName].x = baseArmPositions[armName].x}

        internalArmPositions[armName].y = baseArmPositions[armName].y + (this.timeByteData[mapping[n+1]]/255)*scaling[n+1];
        if (isNaN(internalArmPositions[armName].y)) {internalArmPositions[armName].y = baseArmPositions[armName].y}

        internalArmPositions[armName].z = baseArmPositions[armName].z + (this.timeByteData[mapping[n+2]]/255)*scaling[n+2];
        if (isNaN(internalArmPositions[armName].z)) {internalArmPositions[armName].z = baseArmPositions[armName].z};

        //console.log(armPositions[armName].x);
        //console.log(armPositions[armName].x,armPositions[armName].y,armPositions[armName].z)

        new TWEEN.Tween(this.armPositions[armName])
        // .to({ internalArmPositions }, 3000)
          .to({ x: internalArmPositions[armName].x, y: internalArmPositions[armName].y, z: internalArmPositions[armName].z }, sampleRate)
          .start();

        n = n+3;
      }
    }
  }
}
