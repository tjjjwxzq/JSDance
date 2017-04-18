import {createjs} from 'imports-loader?this=>window!components/soundjs';
import Config from 'config';

var TWEEN = require('tween.js');

let assetPath = Config.sound.assetPath;
let srcs = Config.sound.srcs;
let fftSize = Config.sound.fftSize;
let sampleRate = Config.sound.sampleRate;
let map = Config.sound.map;
let scaling = Config.sound.scaling;
let randScale = Config.sound.randScale;
let add = Config.sound.add;
let posNegSwitch = Config.sound.posNegSwitch;

export default class Sound {
  constructor(arms) {
    this.i = 0;
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
      let i = srcs.findIndex(el => "assets/" + el === this.soundInstance.src);
      console.log(i);
      console.log(sampleRate[i]);
      this.soundInstance.play({loop: -1});
      setInterval(this.analyse.bind(this), sampleRate[i]);
      this.i = i;
    };

  }

  stopPlayback() {
    if (this.soundInstance)
      this.soundInstance.stop();
  }

  analyse() {
    this.analyserNode.getByteFrequencyData(this.freqByteData); //frequency
    this.analyserNode.getByteTimeDomainData(this.timeByteData); //waveform

    //let i = srcs.findIndex(el => "assets/" + el === this.soundInstance.src); //gets index of map, scale, randScale

    //frequency to end position mapping
    ///changes for every "genre"
    //right hand, left hand, right leg, left leg
    // let mapping = [1,15,15,
    //                 1,15,15,
    //                 1,15,15,
    //                 1,15,15];

    // let mapping = [1,15,1,
    //                 1,15,1,
    //                 5,15,15,
    //                 5,15,15];
    // let mapping2 = [1,3,20,
    //                 1,3,20,
    //                 5,3,15,
    //                 5,3,15];

    //let mapping = [];
    //mapping.push(mapping1);
    //mapping.push(mapping2);

    ///change to suit your needs
    // let scaling =   [1.5,  3,  2.5,   //right hand: x,y,z
    //                 -1.5,  3,  2.5,    //left hand: x,y,z
    //                 -2,    3,  2,    //right leg: x,y,z
    //                 2,     3,  2];    //left leg: x,y,z


    // let randScale = [0.5,0.5,0.5,        //scales the random addition. cannot be too big
    //                 0.5,0.5,0.5,
    //                 1,1,1,
    //                 1,1,1];

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
            let posNeg = 1;
            if (posNegSwitch[i] == true) {
                posNeg = Math.random() < 0.5 ? -1 : 1;
            }

            let i = this.i;

            //console.log(i);

            console.log(this.timeByteData[map[i][n]]);
            
            internalArmPositions[armName].x = baseArmPositions[armName].x 
                                        + posNeg * (this.timeByteData[map[i][n]]/255)*scaling[i][n]                                    //divide by 255 to normalize
                                        + add[i][n]
                                        + ((Math.random()-0.5) * randScale[i][n] * (this.freqByteData[map[i][n]]/255));       //random * scaling * zero randomness if silence
            

            internalArmPositions[armName].y = baseArmPositions[armName].y 
                                        + posNeg * (this.timeByteData[map[i][n+1]]/255)*scaling[i][n+1] 
                                        + add[i][n+1]
                                        + ((Math.random()-0.5) * randScale[i][n+1] * (this.timeByteData[map[i][n+1]]/255));
            

            internalArmPositions[armName].z = baseArmPositions[armName].z 
                                        + posNeg * (this.timeByteData[map[i][n+2]]/255)*scaling[i][n+2] 
                                        + add[i][n+2]
                                        + ((Math.random()-0.5) * randScale[i][n+2]* (this.freqByteData[map[i][n+2]]/255)); 

            if (isNaN(internalArmPositions[armName].y)) {internalArmPositions[armName].y = baseArmPositions[armName].y+ add[i][n]}
            if (isNaN(internalArmPositions[armName].x)) {internalArmPositions[armName].x = baseArmPositions[armName].x+ add[i][n+1]}
            if (isNaN(internalArmPositions[armName].z)) {internalArmPositions[armName].z = baseArmPositions[armName].z+ add[i][n+2]};
            

        // internalArmPositions[armName].z = baseArmPositions[armName].z + (this.timeByteData[mapping[n+2]]/255)*scaling[n+2];
        // if (isNaN(internalArmPositions[armName].z)) {internalArmPositions[armName].z = baseArmPositions[armName].z};

        //let i = srcs.findIndex(el => "assets/" + el === this.soundInstance.src);
        new TWEEN.Tween(this.armPositions[armName])
        // .to({ internalArmPositions }, 3000)
          .to({ x: internalArmPositions[armName].x, y: internalArmPositions[armName].y, z: internalArmPositions[armName].z }, sampleRate[i])
          .start();

        n = n+3;
      }
    }
  }
}
