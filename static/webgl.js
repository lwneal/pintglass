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

  shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
  gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
  shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
}

function handleLoadedTexture(texture) {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.bindTexture(gl.TEXTURE_2D, null);
}

function handleLoadedTexture(texture, textureCanvas) {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureCanvas); // This is the important line!
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);

    gl.bindTexture(gl.TEXTURE_2D, null);
}

function initTestTexture() {
  var tex;
  tex = gl.createTexture();
  tex.image = new Image();
  tex.image.onload = function () {
      handleLoadedTexture(tex)
  }

  tex.image.src = "/test.png";
  return tex
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

// Counterclockwise is pointing towards the viewer.
// Clockwise gets culled
function initCupBuffer() {
  var pi = 3.1415;
  var res = 500;
  var verts = [];
  var norms = [];
  var tex = [];
  var slope = 1.45;
  var height = 4;
  var innerRadius = 0.95
  var innerBottom = 0.1

  // Bottom to top around the outside
  for (var i = 0; i < res; i++) {
    var x = 2 * (pi / res) * i;
    var x_n = 2 * (pi / res) * (i + 1);
    var u = Math.cos(x);
    var v = Math.sin(x);
    var u_n = Math.cos(x_n);
    var v_n = Math.sin(x_n);
    var normLen = Math.sqrt(slope);
    var norm = [u / normLen, -(slope - 1) / normLen, v / normLen];
    var tx = 1 - (i / res);
    var tx_n = 1 - ((i+1) / res);

    verts = verts.concat([u, 0, v]);
    norms = norms.concat(norm); 
    tex = tex.concat([tx, 0]);

    verts = verts.concat([u_n, 0, v_n]);
    norms = norms.concat(norm);
    tex = tex.concat([tx_n, 0]);

    verts = verts.concat([slope*u, height, slope*v]);
    norms = norms.concat(norm);
    tex = tex.concat([tx_n, 1]);

    verts = verts.concat([slope*u, height, slope*v]);
    norms = norms.concat(norm);
    tex = tex.concat([tx_n, 1]);

    verts = verts.concat([u_n, 0, v_n]);
    norms = norms.concat(norm);
    tex = tex.concat([tx_n, 0]);

    verts = verts.concat([slope*u_n, height, slope*v_n]);
    norms = norms.concat(norm);
    tex = tex.concat([tx_n, 1]);
  }

  // Bottom to top around the inside
  for (var i = 0; i < res; i++) {
    var x = 2 * (pi / res) * i;
    var x_n = 2 * (pi / res) * (i + 1);
    var u = innerRadius * Math.cos(x);
    var v = innerRadius * Math.sin(x);
    var u_n = innerRadius * Math.cos(x_n);
    var v_n = innerRadius * Math.sin(x_n);
    var normLen = Math.sqrt(slope);
    var norm = [-u / normLen, (slope - 1) / normLen, -v / normLen];

    verts = verts.concat([slope*u, height, slope*v]);
    norms = norms.concat(norm);
    tex = tex.concat([0, 0]);

    verts = verts.concat([u, innerBottom, v]);
    norms = norms.concat(norm);
    tex = tex.concat([0, 0]);

    verts = verts.concat([u_n, innerBottom, v_n]);
    norms = norms.concat(norm);
    tex = tex.concat([0, 0]);

    verts = verts.concat([slope*u_n, height, slope*v_n]);
    norms = norms.concat(norm);
    tex = tex.concat([0, 0]);

    verts = verts.concat([slope*u, height, slope*v]);
    norms = norms.concat(norm);
    tex = tex.concat([0, 0]);

    verts = verts.concat([u_n, innerBottom, v_n]);
    norms = norms.concat(norm);
    tex = tex.concat([0, 0]);
  }

  // Outside-in triangle fan for the outer bottom
  for (var i = 0; i < res; i++) {
    var x = 2 * (pi / res) * i;
    var x_n = 2 * (pi / res) * (i + 1);
    var u = Math.cos(x);
    var v = Math.sin(x);
    var u_n = Math.cos(x_n);
    var v_n = Math.sin(x_n);

    verts = verts.concat([u, 0, v]);
    norms = norms.concat([u, -1, v]);
    tex = tex.concat([0, 0]);

    verts = verts.concat([0, 0, 0]);
    norms = norms.concat([0, -1, 0]);
    tex = tex.concat([0, 0]);

    verts = verts.concat([u_n, 0, v_n]);
    norms = norms.concat([u_n, -1, v_n]);
    tex = tex.concat([0, 0]);
  }

  // Outside-in triangle fan for the inner bottom
  for (var i = 0; i < res; i++) {
    var x = 2 * (pi / res) * i;
    var x_n = 2 * (pi / res) * (i + 1);
    var u = innerRadius * Math.cos(x);
    var v = innerRadius * Math.sin(x);
    var u_n = innerRadius * Math.cos(x_n);
    var v_n = innerRadius * Math.sin(x_n);

    verts = verts.concat([u, innerBottom, v]);
    norms = norms.concat([-u, 1, -v]);
    tex = tex.concat([0, 0]);

    verts = verts.concat([0, innerBottom, 0]);
    norms = norms.concat([0, 1, 0]);
    tex = tex.concat([0, 0]);

    verts = verts.concat([u_n, innerBottom, v_n]);
    norms = norms.concat([-u_n, 1, -v_n]);
    tex = tex.concat([0, 0]);
  }

  // The lip between the inner and outer rim
  for (var i = 0; i < res; i++) {
    var x = 2 * (pi / res) * i;
    var x_n = 2 * (pi / res) * (i + 1);
    var u = Math.cos(x);
    var v = Math.sin(x);
    var u_n = Math.cos(x_n);
    var v_n = Math.sin(x_n);
    var normLen = Math.sqrt(slope);
    var norm = [0, 1, 0];

    verts = verts.concat([slope * u, height, slope * v]);
    norms = norms.concat(norm);
    tex = tex.concat([0, 0]);

    verts = verts.concat([innerRadius * slope * u_n, height, innerRadius * slope * v_n]);
    norms = norms.concat(norm);
    tex = tex.concat([0, 0]);

    verts = verts.concat([innerRadius * slope*u, height, innerRadius * slope*v]);
    norms = norms.concat(norm);
    tex = tex.concat([0, 0]);

    verts = verts.concat([slope*u_n, height, slope*v_n]);
    norms = norms.concat(norm);
    tex = tex.concat([0, 0]);

    verts = verts.concat([innerRadius * slope * u_n, height, innerRadius * slope * v_n]);
    norms = norms.concat(norm);
    tex = tex.concat([0, 0]);

    verts = verts.concat([slope*u, height, slope*v]);
    norms = norms.concat(norm);
    tex = tex.concat([0, 0]);
  }

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);

  var nbuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, nbuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(norms), gl.STATIC_DRAW);

  var tbuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, tbuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(tex), gl.STATIC_DRAW);

  // 8 sets of triangles (2 from fans, 6 from cylinders), 3 verts per triangle
  return {
    vertices: buf,
    normals: nbuf,
    texMap: tbuf,
    numItems: (8 * 3) * res
  };
}
