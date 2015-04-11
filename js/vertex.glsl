uniform mat4 projection, frustum, modelview;
//uniform mat3 normalMatrix;

attribute vec3 vertex;
//attribute vec3 normal;

//varying vec3 normalV;

void main() {
  gl_Position = projection * frustum * modelview * vec4(vertex, 1.);
  //normalV = normalMatrix * normal;
}
