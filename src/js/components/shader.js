import * as THREE from 'three';

import BASIC_VERT from 'vertex.glsl';
import BASIC_FRAG from 'fragment.glsl';
import LINEAR_BLEND_SKINNING_VERT from 'linear_blend_skinning_vert.glsl';
import RAW_PHONG_FRAG from 'raw_phong_frag.glsl';
import RAW_LAMBERT_FRAG from 'raw_lambert_frag.glsl';

/**
 * Class to hold certain shader constants and utility functions
 */
export default class Shader {
  /**
   * creates a RawShaderMaterial based on given parameters
   * @param {string} vertex : vertex shader
   * @param {string} fragment : fragment shader
   * @param {object} uniforms : uniforms
   * @return {object} a RawShaderMaterial
   */
  static createRawShaderMaterial(vertex, fragment, uniforms) {
    if (uniforms === undefined) uniforms = {};
    return new THREE.RawShaderMaterial({
      uniforms: uniforms,
      vertexShader: vertex,
      fragmentShader: fragment,
      lights: true,
      fog: true,
    });
  }

  /**
   * creates a ShaderMaterial based on given parameters
   * @param {string} vertex : vertex shader
   * @param {string} fragment : fragment shader
   * @param {object} uniforms : uniforms
   * @return {object} a ShaderMaterial
   */
  static createShaderMaterial(vertex, fragment, uniforms) {
    if (uniforms === undefined) uniforms = {};
    return new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: vertex,
      fragmentShader: fragment,
      lights: true,
      fog: true,
    });
  }

}

// Initialize shader constants

// Custom shaders
Shader.BASIC_VERT = BASIC_VERT;
Shader.BASIC_FRAG = BASIC_FRAG;
Shader.LINEAR_BLEND_SKINNING_VERT = LINEAR_BLEND_SKINNING_VERT;
Shader.RAW_PHONG_FRAG = RAW_PHONG_FRAG;
Shader.RAW_LAMBERT_FRAG = RAW_LAMBERT_FRAG;

// Standard fragment shaders
Shader.PHONG_VERT = THREE.ShaderChunk.meshphong_vert;
Shader.LAMBERT_VERT = THREE.ShaderChunk.meshlambert_vert;
Shader.PHYSICAL_VERT = THREE.ShaderChunk.meshphysical_vert;
Shader.PHONG_FRAG = THREE.ShaderChunk.meshphong_frag;
Shader.LAMBERT_FRAG = THREE.ShaderChunk.meshlambert_frag;
Shader.PHYSICAL_FRAG = THREE.ShaderChunk.meshphysical_frag;
