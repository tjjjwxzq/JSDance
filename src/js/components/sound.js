import {createjs} from 'imports-loader?this=>window!components/soundjs';
import Config from 'config';

var TWEEN = require('tween.js');

let src = Config.sound.src;
let fftSize = Config.sound.fftSize;
let tickFreq = Config.sound.tickFreq;

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
    createjs.Sound.registerPlugins([createjs.WebAudioPlugin]);
    createjs.Sound.registerSound(src, 'sound');
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

  startPlayback() {
    if (this.soundInstance) {
      this.soundInstance.play({loop: -1});
      return;
    };

    this.soundInstance = createjs.Sound.play(src, {loop: -1});
    console.log("tweening");
    setInterval(this.analyse.bind(this), 500);
  }

  stopPlayback() {
    this.soundInstance.stop();
  }

  analyse() {
    requestAnimationFrame(this.analyse.bind(this));
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
            
            armPositions[armName].x = baseArmPositions[armName].x + (this.freqByteData[mapping[n]]/255)*scaling[n];    //divide by 255 to normalize 
            if (isNaN(armPositions[armName].x)) {armPositions[armName].x = baseArmPositions[armName].x}

            armPositions[armName].y = baseArmPositions[armName].y + (this.freqByteData[mapping[n+1]]/255)*scaling[n+1];
            if (isNaN(armPositions[armName].y)) {armPositions[armName].y = baseArmPositions[armName].y}

            armPositions[armName].z = baseArmPositions[armName].z + (this.freqByteData[mapping[n+2]]/255)*scaling[n+2]; 
            if (isNaN(armPositions[armName].z)) {armPositions[armName].z = baseArmPositions[armName].z};
            

            //console.log(armPositions[armName].x);
            //console.log(armPositions[armName].x,armPositions[armName].y,armPositions[armName].z)

            new TWEEN.Tween(this.armPositions[armName])
            // .to({ internalArmPositions }, 3000)
              .to({ x: internalArmPositions[armName].x, y: internalArmPositions[armName].y, z: internalArmPositions[armName].z }, 500)
              .start();

            n = n+3;
        }
    }
  }
}
