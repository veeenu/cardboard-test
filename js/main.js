var glMatrix = require('gl-matrix'),
    Util     = require('./util'),
    mat4     = glMatrix.mat4,
    quat     = glMatrix.quat,
    vec3     = glMatrix.vec3;

var canvas   = document.querySelector('canvas#canvas'),
    gl       = canvas.getContext('webgl');

canvas.width  = innerWidth;
canvas.height = innerHeight;

var program = Util.makeShader(gl, document.querySelector('#vertex-shader').textContent, document.querySelector('#fragment-shader').textContent);

gl.useProgram(program);
gl.clearColor(0, 0, 0, 1);

var modelGeom = (function() {
  var vertices = [],
      vbuf = gl.createBuffer(),
      sc = 50;

  for(var x = -sc; x <= sc; x += sc/8) {
    var z = x;
    vertices.push(
        x, -sc, sc,   x, -sc, -sc,      x,  sc, -sc,  x,  sc,  sc,
      -sc,   x, sc, -sc,   x, -sc,     sc,   x, -sc, sc,   x,  sc,
      -sc, -sc,  z,  sc, -sc,   z,    -sc,  sc,   z, sc,  sc,   z,
      -sc, -sc,  z, -sc,  sc,   z,     sc, -sc,   z, sc,  sc,   z,

        x, -sc, -sc,  x,  sc, -sc,    -sc,   x, -sc, sc,   x, -sc,
        x, -sc,  sc,  x,  sc,  sc,    -sc,   x,  sc, sc,   x,  sc
    );
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, vbuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  return { count: ~~(vertices.length / 3), buf: vbuf };
    
}());

var projection = mat4.create(),
    frustum    = mat4.create(),
    view       = mat4.create(),
    viewL      = mat4.create(),
    viewR      = mat4.create(),
    model      = mat4.create(),
    dx = 0, dy = 0, inc = 0,
    vloc = gl.getAttribLocation(program, 'vertex');

mat4.identity(frustum);
mat4.identity(model);
mat4.identity(view);

gl.enable(gl.DEPTH_TEST);

var lerp = function(a, b, t) {
  return a * (1 - t) + b * t;
}

var rot = { a: 0, b: 0, g: 0 },
    initRot = null;

window.addEventListener('deviceorientation', function(evt) {
  if(evt.absolute === null)
    return;

  if(initRot === null)
    initRot = { a: evt.alpha, b: evt.beta, g: evt.gamma };
  rot = { a: initRot.a - evt.alpha, b: initRot.b - evt.beta, g: initRot.g - evt.gamma };

  document.querySelector('pre').textContent = parseInt(rot.a) + ',' + parseInt(rot.b) + ',' + parseInt(rot.g);
}, true);

var render = function() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.bindBuffer(gl.ARRAY_BUFFER, modelGeom.buf);
  gl.enableVertexAttribArray(vloc);
  gl.vertexAttribPointer(vloc, 3, gl.FLOAT, false, 0, 0);

  gl.uniformMatrix4fv(gl.getUniformLocation(program, 'model'),   false, model);

  inc += 1 / 64;

  if(initRot === null) {
    var d = 24;
    mat4.lookAt(view, [ d * Math.cos(inc), d * Math.sin(inc), -100 ], [0, 0, 100], [0, 1, 0]);
  } else {
    mat4.identity(view);
    //mat4.translate(view, view, [ax, ay, 0]);
    //mat4.rotateX(view, view, rot.g * Math.PI / 180);
    mat4.rotateY(view, view, rot.a * Math.PI / 180);
  }

  var fov     = Math.PI / 2,
      znear   = .001,
      zfar    = 1000,
      aspect  = canvas.width / canvas.height,
      focLen  = 15,
      sep     = 3,
      ndfl    = znear / focLen,
      hfh     = Math.tan(.5 * fov) * focLen,
      hfw     = hfh * .5 * aspect,
      top     = hfh * ndfl,
      bottom  = -top,
      innf    = (hfw + sep / 2) / (hfw * 2),
      outf    = 1 - innf,
      outer   = hfw * 2 * ndfl * outf,
      inner   = hfw * 2 * ndfl * innf;

  mat4.translate(viewL, view, [ -sep/2, 0, 0 ]);
  mat4.translate(viewR, view, [  sep/2, 0, 0 ]);

  mat4.frustum(projection, -outer, inner, bottom, top, znear, zfar);
  gl.uniformMatrix4fv(gl.getUniformLocation(program, 'projection'), false, projection);
  gl.uniformMatrix4fv(gl.getUniformLocation(program, 'view'), false, viewL);
  gl.viewport(0, 0, canvas.width / 2, canvas.height);
  gl.drawArrays(gl.LINES, 0, modelGeom.count);

  mat4.frustum(projection, -inner, outer, bottom, top, znear, zfar);
  gl.uniformMatrix4fv(gl.getUniformLocation(program, 'projection'), false, projection);
  gl.uniformMatrix4fv(gl.getUniformLocation(program, 'view'), false, viewR);
  gl.viewport(canvas.width / 2, 0, canvas.width / 2, canvas.height);
  gl.drawArrays(gl.LINES, 0, modelGeom.count);

  requestAnimationFrame(render);
}

render();
