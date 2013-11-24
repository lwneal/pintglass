var gl;

function initGL(canvas) {
  try {
    gl = canvas.getContext("experimental-webgl");
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
  } catch (e) {
    console.log(e);
  }
}

function getShader(gl, id) {
  var shaderScript = document.getElementById(id);
  if (!shaderScript) {
    return null;
  }

  var str = "";
  var k = shaderScript.firstChild;
  while (k) {
    if (k.nodeType == 3) {
      str += k.textContent;
    }
    k = k.nextSibling;
  }

  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;
  }

  gl.shaderSource(shader, str);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.log(gl.getShaderInfoLog(shader));
    return null;
  }
  return shader;
}

var shaderProgram;
function initShaders() {
  var fragmentShader = getShader(gl, "shader-fs");
  var vertexShader = getShader(gl, "shader-vs");

  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.log("Could not init shaders");
  }
  gl.useProgram(shaderProgram);

  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
  gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
}

var mvMatrix = mat4.create();
var pMatrix = mat4.create();

function setMatrixUniforms() {
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
  var normalMatrix = mat3.create();
  mat4.toInverseMat3(mvMatrix, normalMatrix);
  mat3.transpose(normalMatrix);
  gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, normalMatrix);

}

function initTriforceBuffer() {
  var vbufTri;
  vbufTri = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbufTri);
  var vertices = [
    0, 2, 0,
    -1, 0, 0,
    1, 0, 0,
    0, -2, 0,
    -1, 0, 0,
    -2, -2, 0,
    2, -2, 0,
    1, 0, 0,
    0, -2, 0
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  vbufTri.itemSize = 3;
  vbufTri.numItems = 9;
  return vbufTri;
}

function initGhostBuffer() {
  var vbufSquare;
  vbufSquare = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbufSquare);
  vertices = [0,0,0];
  var pi = 3.1415
  var res = 100
  for (var x = 0; x < pi; x += pi/res) {
    var top = 2 * Math.sqrt(pi/4 - Math.pow(x - pi/2, 2));
    var bot = -0.1 * top - 0.3 * Math.sin(6.5*2*x );
    vertices = vertices.concat([x, top, 0]);
    vertices = vertices.concat([x, bot, 0]);
  }
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  vbufSquare.itemSize = 3;
  vbufSquare.numItems = 2 * res;
  return vbufSquare;
}

function initCupBuffer() {
  var pi = 3.1415;
  var res = 10;
  var verts = [];
  var norms = [];
  var slope = 1.45;
  var height = 4;
  for (var i = 0; i < res + 1; i++) {
    var x = 2 * (pi / res) * i;
    var u = Math.cos(x);
    var v = Math.sin(x);
    var normLen = Math.sqrt(slope);

    verts = verts.concat([u, 0, v]);
    norms = norms.concat([u / normLen, -(slope - 1) / normLen, v / normLen]);

    verts = verts.concat([slope*u, height, slope*v]);
    norms = norms.concat([u / normLen, -(slope - 1) / normLen, v / normLen]);
  }
  /*
  for (var i = 0; i < res; i++) {
    var x = (pi / res) * i;
    var u = Math.cos(x*2);
    var v = Math.sin(x*2);
    verts = verts.concat([u, 0, v]);
    norms = norms.concat([0, -1, 0]);

    verts = verts.concat([0, 0, 0]);
    norms = norms.concat([0, -1, 0]);
  }
  */

  var buf = gl.createBuffer();
  var nbuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, nbuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(norms), gl.STATIC_DRAW);
  return {
    vertices: buf,
    normals: nbuf,
    itemSize: 3,
    numItems: 2 * (res + 1)
  };
}
