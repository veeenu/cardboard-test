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
      vbuf = gl.createBuffer();

  for(var x = -10; x <= 10; x += 10/8) {
    var z = x;
    vertices.push(
        x, -10, 10,   x, -10, -10,      x,  10, -10,  x,  10,  10,
      -10,   x, 10, -10,   x, -10,     10,   x, -10, 10,   x,  10,
      -10, -10,  z,  10, -10,   z,    -10,  10,   z, 10,  10,   z,
      -10, -10,  z, -10,  10,   z,     10, -10,   z, 10,  10,   z,

        x, -10, -10,  x,  10, -10,    -10,   x, -10, 10,   x, -10,
        x, -10,  10,  x,  10,  10,    -10,   x,  10, 10,   x,  10
    );
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, vbuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  return { count: ~~(vertices.length / 3), buf: vbuf };
    
}());

var projection = mat4.create(),
    frustum    = mat4.create(),
    view       = mat4.create(),
    model      = mat4.create(),
    viewmodel  = mat4.create(),
    dx = 0, dy = 0, inc = 0,
    vloc = gl.getAttribLocation(program, 'vertex');

mat4.identity(frustum);
mat4.identity(model);
mat4.identity(view);
mat4.scale(model, model, [ 2, 2, 2 ]);

gl.enable(gl.DEPTH_TEST);

var lerp = function(a, b, t) {
  return a * (1 - t) + b * t;
}

var rot = { a: 0, b: 0, g: 0 },
    initRot = null;

window.addEventListener('deviceorientation', function(evt) {
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

  gl.uniformMatrix4fv(gl.getUniformLocation(program, 'frustum'),    false, frustum);
  gl.uniformMatrix4fv(gl.getUniformLocation(program, 'modelview'),  false, viewmodel);

  inc += 1 / 32;

  mat4.identity(view);
  //mat4.translate(view, view, [ax, ay, 0]);
  mat4.rotateX(view, view, rot.g * Math.PI / 180);
  mat4.rotateY(view, view, rot.a * Math.PI / 180);
  if(initRot === null)
    mat4.lookAt(view, [ Math.cos(inc) / 4, Math.sin(inc) / 4, 0 ], [0, 0, -5], [0, 1, 0]);

  mat4.mul(viewmodel, view, model);

  var fov     = Math.PI,
      aspect  = .5 * canvas.width / canvas.height,
      znear   = .1,
      zfar    = 100,
      zscr    = 10,
      iod     = .5,
      tf      = znear * Math.tan(Math.PI / 4),
      rf      = aspect * tf,
      fshift  = (iod / 2) * znear / zscr,
      top     = -tf,
      bottom  =  tf,
      leftL   = -rf + fshift,
      rightL  =  rf + fshift,
      leftR   = -rf - fshift,
      rightR  =  rf - fshift;

  mat4.frustum(projection, leftL, rightL, bottom, top, znear, zfar);
  gl.uniformMatrix4fv(gl.getUniformLocation(program, 'projection'), false, projection);
  gl.viewport(0, 0, canvas.width / 2, canvas.height);
  gl.drawArrays(gl.LINES, 0, modelGeom.count);

  mat4.frustum(projection, leftR, rightR, bottom, top, znear, zfar);
  gl.uniformMatrix4fv(gl.getUniformLocation(program, 'projection'), false, projection);
  gl.viewport(canvas.width / 2, 0, canvas.width / 2, canvas.height);
  gl.drawArrays(gl.LINES, 0, modelGeom.count);

  requestAnimationFrame(render);
}

render();
