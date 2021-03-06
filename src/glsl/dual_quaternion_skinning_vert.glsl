precision highp float;
precision highp int;
#define SHADER_NAME ShaderMaterial
#define VERTEX_TEXTURES
#define GAMMA_FACTOR 2
#define MAX_BONES 1000
#define USE_SKINNING
#define BONE_TEXTURE
#define NUM_CLIPPING_PLANES 0
uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat3 normalMatrix;
uniform vec3 cameraPosition;
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;
#ifdef USE_COLOR
	attribute vec3 color;
#endif
#ifdef USE_MORPHTARGETS
	attribute vec3 morphTarget0;
	attribute vec3 morphTarget1;
	attribute vec3 morphTarget2;
	attribute vec3 morphTarget3;
	#ifdef USE_MORPHNORMALS
		attribute vec3 morphNormal0;
		attribute vec3 morphNormal1;
		attribute vec3 morphNormal2;
		attribute vec3 morphNormal3;
	#else
		attribute vec3 morphTarget4;
		attribute vec3 morphTarget5;
		attribute vec3 morphTarget6;
		attribute vec3 morphTarget7;
	#endif
#endif

#ifdef USE_SKINNING
	attribute vec4 skinIndex;
	attribute vec4 skinWeight;
#endif
// normalized normal passed to fragment shader for rendering
varying vec3 vNormal;
varying vec3 vViewPosition; // for Phong frag
varying vec3 vLightFront; // for Lambert frag
varying vec4 debug;

#ifdef USE_SKINNING
  // These are passed to the shader by the WebGL renderer
  // The bindMatrix (world to local) and bindMatrixInverse (local to world)
  // of the vertex currently being rendered
  uniform mat4 bindMatrix;
  uniform mat4 bindMatrixInverse;
  uniform vec4 rotQuaternions[20];
  uniform vec4 transQuaternions[20];
  vec4 getRotQuaternion(const in float i) {
    return rotQuaternions[int(i)];
  }
  vec4 getTransQuaternion(const in float i) {
    return transQuaternions[int(i)];
  }
#endif

void main() {
  #ifdef USE_SKINNING
    // get transform for each of the 4 bound bones
    // skinIndex and skinWeight are built-in ShaderMaterial attributes
    vec4 rotQuatX = getRotQuaternion(skinIndex.x);
    vec4 transQuatX = getTransQuaternion(skinIndex.x);
    vec4 rotQuatY = getRotQuaternion(skinIndex.y);
    vec4 transQuatY = getTransQuaternion(skinIndex.y);
    vec4 rotQuatZ = getRotQuaternion(skinIndex.z);
    vec4 transQuatZ = getTransQuaternion(skinIndex.z);
    vec4 rotQuatW = getRotQuaternion(skinIndex.w);
    vec4 transQuatW = getTransQuaternion(skinIndex.w);

    // blend dual quaternions
    vec4 skinRotQuaternion = vec4(0.0);
    vec4 skinTransQuaternion = vec4(0.0);

    skinRotQuaternion += rotQuatX * skinWeight.x;
    skinRotQuaternion += rotQuatY * skinWeight.y;
    skinRotQuaternion += rotQuatZ * skinWeight.z;
    skinRotQuaternion += rotQuatW * skinWeight.w;
    // get unit quaternion
    float mag = length(skinRotQuaternion);
    skinRotQuaternion = skinRotQuaternion / mag;

    skinTransQuaternion += transQuatX * skinWeight.x;
    skinTransQuaternion += transQuatY * skinWeight.y;
    skinTransQuaternion += transQuatZ * skinWeight.z;
    skinTransQuaternion += transQuatW * skinWeight.w;
    // get unit quaternion
    skinTransQuaternion = skinTransQuaternion / mag;

    // get transformation matrix
    float w0 = skinRotQuaternion.w;
    float x0 = skinRotQuaternion.x;
    float y0 = skinRotQuaternion.y;
    float z0 = skinRotQuaternion.z;

    float we = skinTransQuaternion.w;
    float xe = skinTransQuaternion.x;
    float ye = skinTransQuaternion.y;
    float ze = skinTransQuaternion.z;

    float t0 = 2.0 * (-we * x0 + xe * w0 - ye * z0 + ze * y0);
    float t1 = 2.0 * (-we * y0 + xe * z0 + ye * w0 - ze * x0);
    float t2 = 2.0 * (-we * z0 - xe * y0 + ye * x0 + ze * w0);

    mat4 skinMatrix = mat4(
        1.0 - 2.0 * pow(y0,2.0) - 2.0 * pow(z0, 2.0),
        2.0 * x0 * y0 + 2.0 * w0 * z0,
        2.0 * x0 * z0 - 2.0 * w0 * y0,
        0,
        2.0 * x0 * y0 - 2.0 * w0 * z0,
        1.0 - 2.0 * pow(x0,2.0) - 2.0 * pow(z0,2.0),
        2.0 * y0 * z0 + 2.0 * w0 * x0,
        0,
        2.0 * x0 * z0 + 2.0 * w0 * y0,
        2.0 * y0 * z0 - 2.0 * w0 * x0,
        1.0 - 2.0 * pow(x0, 2.0) - 2.0 * pow(y0,2.0),
        0,
        t0,
        t1,
        t2,
        1.0
        );

    skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;

    // get transformed normal
    vec4 skinnedNormal = skinMatrix * vec4(normal, 0.0);
    vec3 transformedNormal = normalMatrix * skinnedNormal.xyz;
    vNormal = normalize(transformedNormal);

    // get transformed position
    vec4 skinVertex = vec4(position, 1.0);
    vec4 transformedSkinVertex = skinMatrix * skinVertex;
    // modelViewMatrix and projectionMatrix are built-in uniforms
    vec4 mvPosition = modelViewMatrix * transformedSkinVertex;
  #else
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  #endif
  gl_Position = projectionMatrix * mvPosition;
}
