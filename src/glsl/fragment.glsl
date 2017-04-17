precision highp float;

/* varying float distFromCenter; */
varying vec3 vNormal;
varying vec4 debug;

void main() {
  /* gl_FragColor = debug; */
  gl_FragColor = vec4(2.0 * vNormal, 1.0);
}
