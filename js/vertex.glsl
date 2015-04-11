uniform mat4 projection, view, model;
//uniform mat3 normalMatrix;

attribute vec3 vertex;
//attribute vec3 normal;

//varying vec3 normalV;

void main() {
  gl_Position = projection * view * model * vec4(vertex, 1.);
  //normalV = normalMatrix * normal;
}
