import Detector from 'utils/detector';
import Main from 'main';
import styles from 'main.css';

function init() {
  if (!Detector.webgl) {
    Detector.addGetWebGLMessage();
  } else {
    const container = document.createElement('div');
    document.body.appendChild(container);
    new Main(container);
  }
}

init();
