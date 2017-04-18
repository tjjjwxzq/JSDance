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
    console.log('tweening');
    setInterval(this.analyse.bind(this), 3000);
  }

  stopPlayback() {
    this.soundInstance.stop();
  }

  analyse() {
    console.log('analyse');
    this.analyserNode.getByteFrequencyData(this.freqByteData); //frequency
    this.analyserNode.getByteTimeDomainData(this.timeByteData); //waveform
    // console.log(this.freqByteData);
    //console.log(this.timeByteData);

    //console.log(this.timeByteData[0], this.freqByteData[0]);

    //there are 12 IK parameters, so there should be 12 variables

    //let mapping = [1,2,3,4,5,6,7,8,9,10,11,12];
    //frequency to end position mapping
    ///changes for every "genre"
    //right hand, left hand, right leg, left leg
    let mapping = [1,15,15,
                    1,15,15,
                    1,15,15,
                    1,15,15];

    ///change to suit your needs
    let scaling =   [1.2,  3,  1,   //right hand: x,y,z
                    -1.2,  3,  1,    //left hand: x,y,z
                    -1,    8,  10,    //right leg: x,y,z
                    1,     8,  10]    //left leg: x,y,z
    let n = 0;

    let internalArmPositions = this.internalArmPositions;
    let baseArmPositions = this.baseArmPositions;

    for (let armName in Config.arms) {
      if (Config.arms.hasOwnProperty(armName)) {

        /********** Using random number **********/
        // internalArmPositions[armName].x = baseArmPositions[armName].x + (Math.random() * 2 - 1.0) * 2;
        // internalArmPositions[armName].y = baseArmPositions[armName].y + (Math.random() * 2 - 1.0) * 2;
        // internalArmPositions[armName].z = baseArmPositions[armName].z + (Math.random() * 2 - 1.0) * 2;
        /******************************/

        /*************** Using frequencies -- problem is the variation is poor ***************/
        let rand = (Math.random() * 2 - 1.0); // [-3, 3]
        internalArmPositions[armName].x = baseArmPositions[armName].x + (this.freqByteData[mapping[n]]-128/10 + rand);
        if (isNaN(internalArmPositions[armName].x)) {internalArmPositions[armName].x = baseArmPositions[armName].x}

        internalArmPositions[armName].y = baseArmPositions[armName].y + (this.freqByteData[mapping[n+1]]-128)/10 + rand;
        if (isNaN(internalArmPositions[armName].y)) {internalArmPositions[armName].y = baseArmPositions[armName].y}

        internalArmPositions[armName].z = baseArmPositions[armName].z + (this.freqByteData[mapping[n+2]]-128)/10 + rand;
        if (isNaN(internalArmPositions[armName].z)) {internalArmPositions[armName].z = baseArmPositions[armName].z};
        console.log(internalArmPositions[armName])
        /********************************************/

        new TWEEN.Tween(this.armPositions[armName])
		    // .to({ internalArmPositions }, 3000)
		      .to({ x: internalArmPositions[armName].x, y: internalArmPositions[armName].y, z: internalArmPositions[armName].z }, 3000)
		      .start();

        n = n+3;
      }
    }
  }
}
