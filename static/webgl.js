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

  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
}

var mvMatrix = mat4.create();
var pMatrix = mat4.create();

function setMatrixUniforms() {
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
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
