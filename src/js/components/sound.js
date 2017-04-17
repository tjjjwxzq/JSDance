import {createjs} from 'imports-loader?this=>window!components/soundjs';
import Config from 'config';

let src = Config.sound.src;
let fftSize = Config.sound.fftSize;
let tickFreq = Config.sound.tickFreq;

// let righthandX = 0
// let righthandY = 0
// let righthandZ = 0
// let lefthandX = 0
// let lefthandY = 0
// let lefthandZ = 0
// let rightlegX = 0
// let rightlegY = 0
// let rightlegZ = 0
// let leftlegX = 0
// let leftlegY = 0
// let leftlegZ = 0



export default class Sound {
  constructor(arms) {
    // Create object of position objects for each arm
    let armPositions = {};
    let baseArmPositions = {};

    for (let armName in Config.arms) {
        if (Config.arms.hasOwnProperty(armName)) {
            armPositions[armName] = {
                x: arms[armName].targetPosition.x,
                y: arms[armName].targetPosition.y,
                z: arms[armName].targetPosition.z
            }
        }
    }
    this.baseArmPositions = armPositions;
    this.armPositions = armPositions;
    createjs.Sound.registerPlugins([createjs.WebAudioPlugin]);
    createjs.Sound.registerSound(src, 'sound');
    createjs.Sound.on('fileload', this.handleLoad.bind(this));
    // this.righthandX = 0;
    // this.righthandY = 0;
    // this.righthandZ = 0;
    // this.lefthandX = 0;
    // this.lefthandY = 0;
    // this.lefthandZ = 0;
    // this.rightlegX = 0;
    // this.rightlegY = 0;
    // this.rightlegZ = 0;
    // this.leftlegX = 0;
    // this.leftlegY = 0;
    // this.leftlegZ = 0;
  }

  handleLoad() {
    // set up analyser node
    let context = createjs.Sound.activePlugin.context;
    this.analyserNode = context.createAnalyser();
    this.analyserNode.fftSize = fftSize;
    this.analyserNode.smoothingTimeConstant = 0.99;
    this.analyserNode.connect(context.destination);


  // attach visualizer node to our existing dynamicsCompressorNode, which was connected to context.destination
    let dynamicsNode = createjs.Sound.activePlugin.dynamicsCompressorNode;
    dynamicsNode.disconnect();  // disconnect from destination
    dynamicsNode.connect(this.analyserNode);

    // arrays for retrieving analyserNode data
    this.freqFloatData = new Float32Array(this.analyserNode.frequencyBinCount);
    this.freqByteData = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.timeByteData = new Uint8Array(this.analyserNode.frequencyBinCount);

    this.startPlayback();
  }

  startPlayback() {
    if (this.soundInstance) return;

    this.soundInstance = createjs.Sound.play(src, {loop: -1});
    this.analyse();
  }

  analyse() {
    requestAnimationFrame(this.analyse.bind(this));
    //this.analyserNode.getFloatFrequencyData(freqFloatData); //dB
    this.analyserNode.getByteFrequencyData(this.freqByteData); //frequency
    this.analyserNode.getByteTimeDomainData(this.timeByteData); //waveform
    // console.log(this.freqByteData);
    //console.log(this.timeByteData);

    //console.log(this.timeByteData[0], this.freqByteData[0]);

    //there are 12 IK parameters, so there should be 12 variables
    
    //let mapping = [1,2,3,4,5,6,7,8,9,10,11,12];
    let mapping = [1,3,5,7,9,11,13,15,17,19,20,21];
    let n = 0;

    let armPositions = this.armPositions;
    let baseArmPositions = this.baseArmPositions;

    for (let armName in Config.arms) {
        if (Config.arms.hasOwnProperty(armName)) {
            //console.log(baseArmPositions[armName].x, baseArmPositions[armName].y, baseArmPositions[armName].z);

            armPositions[armName].x = baseArmPositions[armName].x + (this.timeByteData[mapping[n]]-100)/255;
            if (isNaN(armPositions[armName].x)) armPositions[armName].x = baseArmPositions[armName].x;

            armPositions[armName].y = baseArmPositions[armName].y + (this.timeByteData[mapping[n+1]]-100)/255;
            if (isNaN(armPositions[armName].y)) armPositions[armName].y = baseArmPositions[armName].y;

            armPositions[armName].z = baseArmPositions[armName].z + (this.timeByteData[mapping[n+2]]-100)/255;
            if (isNaN(armPositions[armName].z)) armPositions[armName].z = baseArmPositions[armName].z;

            //console.log(armPositions[armName].x,armPositions[armName].y,armPositions[armName].z)
            // armPositions[armName].x = baseArmPositions[armName].x ;
            // armPositions[armName].y = baseArmPositions[armName].y ;
            // armPositions[armName].z = baseArmPositions[armName].z ;
            n = n+3;
        }
    }

    // this.righthandX = this.timeByteData[0]
    // this.righthandY = this.timeByteData[1]
    // this.righthandZ = this.timeByteData[2]
    // this.lefthandX = this.timeByteData[3]
    // this.lefthandY = this.timeByteData[4]
    // this.lefthandZ = this.timeByteData[5]
    // this.rightlegX = this.timeByteData[6]
    // this.rightlegY = this.timeByteData[7]
    // this.rightlegZ = this.timeByteData[8]
    // this.leftlegX = this.timeByteData[9]
    // this.leftlegY = this.timeByteData[10]
    // this.leftlegZ = this.timeByteData[11]

    //console.log(righthandX, righthandY, righthandZ, lefthandX, lefthandY,lefthandZ,
    //rightlegX, rightlegY, rightlegZ, leftlegX, leftlegY, leftlegZ)
  }
}
