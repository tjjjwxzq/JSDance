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

#ifdef USE_SKINNING
  // These are passed to the shader by the WebGL renderer
  // The bindMatrix (world to local) and bindMatrixInverse (local to world)
  // of the vertex currently being rendered
  uniform mat4 bindMatrix;
  uniform mat4 bindMatrixInverse;
  uniform mat4 boneMatrices[MAX_BONES];
  mat4 getBoneMatrix(const in float i) {
    return boneMatrices[int(i)];
  }
#endif

void main() {
  #ifdef USE_SKINNING
    // get transform for each of the 4 bound bones
    // skinIndex and skinWeight are built-in ShaderMaterial attributes
    mat4 boneMatX = getBoneMatrix(skinIndex.x);
    mat4 boneMatY = getBoneMatrix(skinIndex.y);
    mat4 boneMatZ = getBoneMatrix(skinIndex.z);
    mat4 boneMatW = getBoneMatrix(skinIndex.w);

    // calculate transformed normal
    mat4 skinMatrix = mat4(0.0);
    skinMatrix += boneMatX * skinWeight.x;
    skinMatrix += boneMatY * skinWeight.y;
    skinMatrix += boneMatZ * skinWeight.z;
    skinMatrix += boneMatW * skinWeight.w;
    skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
    vec4 skinnedNormal = skinMatrix * vec4(normal, 0.0);
    // normalMatrix is a build-in ShaderMaterial attribute
    vec3 transformedNormal = normalMatrix * skinnedNormal.xyz;
    vNormal = normalize(transformedNormal);
    vNormal = normalMatrix * normal;

    // calculate transformed position
    vec4 skinVertex = vec4(position, 1.0);
    vec4 transformedSkinVertex = skinMatrix * skinVertex;
    // modelViewMatrix and projectionMatrix are built-in uniforms
    vec4 mvPosition = modelViewMatrix * transformedSkinVertex;
  #else
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  #endif
  gl_Position = projectionMatrix * mvPosition;
}
