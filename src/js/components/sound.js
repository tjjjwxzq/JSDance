import {createjs} from 'imports-loader?this=>window!components/soundjs';
import Config from 'config';

let src = Config.sound.src;
let fftSize = Config.sound.fftSize;
let tickFreq = Config.sound.tickFreq;

export default class Sound {
  constructor() {
    createjs.Sound.registerPlugins([createjs.WebAudioPlugin]);
    createjs.Sound.registerSound(src, 'sound');
    createjs.Sound.on('fileload', this.handleLoad.bind(this));
  }

  handleLoad() {
    // set up analyser node
    let context = createjs.Sound.activePlugin.context;
    this.analyserNode = context.createAnalyser();
    this.analyserNode.fftSize = fftSize;
    this.analyserNode.smoothingTimeConstant = 0;
    this.analyserNode.connect(context.destination);

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
    this.analyserNode.getByteFrequencyData(this.freqByteData);
    this.analyserNode.getByteTimeDomainData(this.timeByteData);
    // console.log(this.freqByteData);
    console.log(this.timeByteData);
  }
}
