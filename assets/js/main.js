/**
 *
 *  14551147 - Sebastian Aguilera Novoa
 *
 * Programa usando WegGL para demonstrar a animação 3D de um cubo
 * em perspectiva com rotação em cada eixo. O cubo é iluminação por
 * uma fonte de luz pontual segundo o modelo de Phong.
 *
 * Bibliotecas utilizadas:
 * - macWebglUtils.js
 * - MVnew.js do livro -- Interactive Computer Graphics
 *
 */
"use strict";

var gl;        // webgl2
var gCanvas;   // canvas
var gaTexCoords = []; // coordenadas de textura

// Creating objects
var gObjetos = [];

createObjects()

// guarda coisas do shader
var gShader = {
  aTheta: null,
};

// guarda coisas da interface e contexto do programa
var gCtx = {
  view: mat4(),     // view matrix, inicialmente identidade
  perspective: mat4(), // projection matrix
  hp: 100,
  time: 0,
  deltaTime: 0.1,
  gameStopped: false,
  deltaHP: 1,
  // velRotacion: 0.3,   // velocidade de rotação dos objetos
};

var keys;
var rodando = false // animação rodando

// ==================================================================
// chama a main quando terminar de carregar a janela
window.onload = main;

/**
 * programa principal.
 */
function main() {
  // ambiente
  gCanvas = document.getElementById("glcanvas");
  gl = gCanvas.getContext('webgl2');
  if (!gl) alert("Vixe! Não achei WebGL 2.0 aqui :-(");

  console.log("Canvas: ", gCanvas.width, gCanvas.height);

  // Initialize mouse controls
  initMouseControls(gCanvas, function() {
    gCtx.view = getViewMatrix();
    gl.uniformMatrix4fv(gShader.uView, false, flatten(gCtx.view));
  });

  // Track keyboard state
  keys = {};
  window.addEventListener('keydown', (e) => {
      keys[e.key.toLowerCase()] = true;
  });
  window.addEventListener('keyup', (e) => {
      keys[e.key.toLowerCase()] = false;
  });

  // interface
  crieInterface();

  // objetos
  for(let i=0; i < gObjetos.length; i++) {
    gObjetos[i].init();
    
    let noImg = parseInt(Math.floor(Math.random() * 18) + 1);

    let no_car = Math.round(randomRange(1, 20));

    if(gObjetos[i].id == "carro") 
      gObjetos[i].texture = loadTexture(`assets/images/car/${no_car}.png`);
    else if(gObjetos[i].id == "floor")
      gObjetos[0].texture = loadTexture(`assets/images/floor/3.png`);
    else if(gObjetos[i].id == "sun")
      gObjetos[i].texture = loadTexture(`assets/images/simple/sun.png`);
    else if(gObjetos[i].id == "robot")
      gObjetos[i].texture = loadTexture(`assets/images/simple/robot.png`);
    else //if(gObjetos[i] == "building")
      gObjetos[i].texture = loadTexture(`assets/images/${gObjetos[i].id}/${noImg}.png`);

  }

  // Inicializações feitas apenas 1 vez
  gl.viewport(0, 0, gCanvas.width, gCanvas.height);
  gl.clearColor(FUNDO[0], FUNDO[1], FUNDO[2], FUNDO[3]);
  gl.enable(gl.DEPTH_TEST);
  gl.disable(gl.CULL_FACE);

  // shaders
  crieShaders();

  // finalmente...
  render();
}

// ==================================================================
/**
 * Cria e configura os elementos da interface e funções de callback
 */
function crieInterface() {
    // ------------------------ sliders ------------------------
    document.getElementById("jumpForceSlider").onchange = function (e) {
      // document.getElementById("jumpForceValueLabel").textContent = e.target.value;

      camera.jumpForce = parseFloat(e.target.value)/100;
      console.log("Jump Force = ", camera.gravity);
    };

    document.getElementById("gravitySlider").onchange = function (e) {
      // document.getElementById("gravityValueLabel").textContent = e.target.value;

      camera.gravity = -parseFloat(e.target.value)/1000;
      console.log("Gravity = ", camera.gravity);
    };

    document.getElementById("velocitySlider").onchange = function (e) {
      SPEED_INITIAL = parseFloat(e.target.value/100);
      console.log("Velocidade de Personagem = ", SPEED_INITIAL);
      // document.getElementById("velocityValueLabel").textContent = e.target.value;
    };


    document.getElementById("MouseSensitivitySlider").onchange = function (e) {
      camera.sensitivity = parseFloat(e.target.value/1000);
      console.log("Velocidade de Personagem = ", camera.sensitivity);
      // document.getElementById("velocityValueLabel").textContent = e.target.value;
    };

    
}

// ==================================================================
/**
 * cria e configura os shaders
 */
var bufNormais, bufVertices, aPosition, aNormal, bufTextura, aTexCoord, texture;

function crieShaders() {
  
  
  bufNormais = gl.createBuffer();
  bufVertices = gl.createBuffer();  
  bufTextura = gl.createBuffer();
  //  cria o programa
  gShader.program = makeProgram(gl, gVertexShaderSrc, gFragmentShaderSrc);
  gl.useProgram(gShader.program);

  // resolve os uniforms
  gShader.uModel = gl.getUniformLocation(gShader.program, "uModel");
  gShader.uView = gl.getUniformLocation(gShader.program, "uView");
  gShader.uPerspective = gl.getUniformLocation(gShader.program, "uPerspective");
  gShader.uInverseTranspose = gl.getUniformLocation(gShader.program, "uInverseTranspose");

  // perspective matrix
  gCtx.perspective = perspective(FOVY, ASPECT, NEAR, FAR);
  gCtx.view = lookAt(camera.eye, camera.at, camera.up);

  gl.uniformMatrix4fv(gShader.uPerspective, false, flatten(gCtx.perspective));
  gl.uniformMatrix4fv(gShader.uView, false, flatten(gCtx.view));


  // parametros para iluminação
  gShader.uLuzPos = gl.getUniformLocation(gShader.program, "uLuzPos");
  gl.uniform4fv(gShader.uLuzPos, LUZ.pos);

  // fragment shader
  gShader.uCorAmb = gl.getUniformLocation(gShader.program, "uCorAmbiente");
  gShader.uCorDif = gl.getUniformLocation(gShader.program, "uCorDifusao");
  gShader.uCorEsp = gl.getUniformLocation(gShader.program, "uCorEspecular");
  gShader.uAlfaEsp = gl.getUniformLocation(gShader.program, "uAlfaEsp");

  gl.uniform4fv(gShader.uCorEsp, LUZ.esp);

  binderNormVert(gObjetos[0]);

  
};

// ==================================================================
/**
 * Usa o shader para desenhar.
 * Assume que os dados já foram carregados e são estáticos.
 */
var lastTime = 0;
var fixedTimeStep = 10; // 100 milisecond in milliseconds
var accumulator = 0;

function render(currentTime) {
  updateCameraPosition(keys, function() {
    gCtx.view = getViewMatrix();
    gl.uniformMatrix4fv(gShader.uView, false, flatten(gCtx.view));
  });

  // Initialize lastTime if this is the first frame
  if (!lastTime) {
      lastTime = currentTime;
      window.requestAnimationFrame(render);
      return;
  }

// Calculate delta time (time since last frame)
  var deltaTime = currentTime - lastTime;
  lastTime = currentTime;
  accumulator += deltaTime;

  // Fixed timestep update (1 second)
  while (accumulator >= fixedTimeStep) {
      // Your fixed update logic here
      checkCollisionHouses()
      carLimit()
      updateScene(fixedTimeStep);
      accumulator -= fixedTimeStep;

      gCtx.time += gCtx.deltaTime;
      if(gCtx.time > 60*24) gCtx.time = 0;
      
      setTimerClock(gCtx.time);

      // gObjetos[1].trans = camera.pos;
  }

  // Render at display refresh rate
  renderScene();

  window.requestAnimationFrame(render);
}

function updateScene(step) {
    // This runs exactly once per second
    // console.log("Fixed update at 1 second interval");

    for (const objeto of gObjetos) {
        if (objeto.rodando) {
            objeto.theta[objeto.axis] -= gCtx.velRotacion*step;

        }
        if (objeto instanceof Cubo) {
          objeto.trans = add(objeto.trans, objeto.velocidade);
          objeto.range = {
            x: [objeto.trans[0] - 0.5*objeto.escala[0], objeto.trans[0] + 0.5*objeto.escala[0]],
            y: [objeto.trans[1] - 0.5*objeto.escala[1], objeto.trans[1] + 0.5*objeto.escala[1]],
            z: [objeto.trans[2] - 0.5*objeto.escala[2], objeto.trans[2] + 0.5*objeto.escala[2]],
          };
        }
        // console.log(objeto.trans, objeto.velocidade);
    }
}



function renderScene(){
  let mR;
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  for (const objeto of gObjetos) {
      // modelo muda a cada frame da animação
      if (objeto.rodando) objeto.theta[objeto.axis] -= gCtx.velRotacion;

      let model = mat4();
      if (objeto instanceof Cubo) {
        // A normal na superfície da esfera é a própria posição normalizada
        var normal = normalize(vec3(objeto.trans[0], objeto.trans[1], objeto.trans[2]));

        // Cria matriz de rotação para alinhar o cubo com a normal
        var up = vec3(0, 1, 0);

        let angulo = Math.acos(dot(normal, up) / (length(normal) * length(up))) * 180.0 / Math.PI;
        mR = rotate(angulo, vec3(0,0,1));
        // console.log("Angulo: ", angulo, "Angulo rads: ", radians(angulo))
       // model = mult(model, orientation);
    }
    else{
      mR = rotate(0, vec3(0,0,1));
    }
    // gl.uniform1f(gShader.uAlfaEsp, MAT.alfa)

    // Rotação própria do cubo
    model = mult(model, rotate(-objeto.theta[EIXO_X_IND], EIXO_X));
    model = mult(model, rotate(-objeto.theta[EIXO_Y_IND], EIXO_Y));
    model = mult(model, rotate(-objeto.theta[EIXO_Z_IND], EIXO_Z));

    // Escala e translação
    if (1) {
      model = mult(model, rotate(-objeto.theta[EIXO_X_IND], EIXO_X));
      model = mult(model, rotate(-objeto.theta[EIXO_Y_IND], EIXO_Y));
      model = mult(model, rotate(-objeto.theta[EIXO_Z_IND], EIXO_Z));
    }
    else {
      let rx = rotateX(objeto.theta[EIXO_X_IND]);
      let ry = rotateY(objeto.theta[EIXO_Y_IND]);
      let rz = rotateZ(objeto.theta[EIXO_Z_IND]);
      model = mult(rz, mult(ry, rx));
    }

    // escala e translação
    let mT = translate(objeto.trans[0], objeto.trans[1], objeto.trans[2]);
    let mS = scale(objeto.escala[0], objeto.escala[1], objeto.escala[2]);

    model = mult(model, mT)
    // model = mult(model, mR);
    model = mult(model, mS);
    // console.log("Angulo: ", angulo);

    // Update view matrix with current camera position
    gCtx.view = getViewMatrix();
    gl.uniformMatrix4fv(gShader.uView, false, flatten(gCtx.view));

    let modelView = mult(gCtx.view, model);
    let modelViewInv = inverse(modelView);
    let modelViewInvTrans = transpose(modelViewInv);

    binderNormVert(objeto)

    // uniformes
    gl.uniformMatrix4fv(gShader.uModel, false, flatten(model));
    gl.uniformMatrix4fv(gShader.uInverseTranspose, false, flatten(modelViewInvTrans));

    gl.bindTexture(gl.TEXTURE_2D, objeto.texture);

    gl.drawArrays(gl.TRIANGLES, 0, objeto.np);
  };
}



function binderNormVert(objeto){
    // configureTexturaDaURL(objeto.textureURL);
    // buffer das normais
    // var bufNormais = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufNormais);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(objeto.nor), gl.STATIC_DRAW);

    aNormal = gl.getAttribLocation(gShader.program, "aNormal");
  
    gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aNormal);

    // buffer dos vértices
    // var bufVertices = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufVertices);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(objeto.pos), gl.STATIC_DRAW);

    aPosition = gl.getAttribLocation(gShader.program, "aPosition");
    gl.vertexAttribPointer(aPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aPosition);

    // iluminação
    gl.uniform4fv(gShader.uCorAmb, mult(LUZ.amb, objeto.mat.amb));
    gl.uniform4fv(gShader.uCorDif, mult(LUZ.dif, objeto.mat.dif));
    gl.uniform1f(gShader.uAlfaEsp, MAT.alfa);

    //  ------------ textura -----------------
    gl.bindBuffer(gl.ARRAY_BUFFER, bufTextura);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(objeto.tex), gl.STATIC_DRAW);

    aTexCoord = gl.getAttribLocation(gShader.program, "aTexCoord");
    gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aTexCoord);

    gl.uniform1i(gl.getUniformLocation(gShader.program, "uTextureMap"), 0);

    // console.log("id: ", objeto.id, "objeto pos: ", objeto.pos, "objeto nor: ", objeto.nor, "objeto tex: ", objeto.tex, "aTexCoord: ", aTexCoord);
}


// ==================================================================
/**
 * Textura
**/
/**
 * recebe a URL de imagem e configura a textura
 * @param {URL} url 
 */
function configureTexturaDaURL(url) {
    let texture = gl.createTexture();  // cria a textura
    gl.activeTexture(gl.TEXTURE0); // seleciona a unidade TEXTURE0
    // ativa a textura
    // gl.bindTexture(gl.TEXTURE_w2D, texture);
    // Carrega uma textura de um pixel 1x1 vermelho, temporariamente
    // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 0, 255]));

    let img = new Image(); // cria um bitmap
    img.src = url;
    img.crossOrigin = "anonymous";
    // espera carregar = evento "load"
    img.addEventListener('load', function () {
        console.log("Carregou imagem", img.width, img.height);
        // depois de carregar, copiar para a textura
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, img.width, img.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.generateMipmap(gl.TEXTURE_2D);
        // experimente usar outros filtros removendo o comentário da linha abaixo.
        //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    }
  );
  return img;
};

function loadTexture(url) {
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Temporary pixel while image loads
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0,0,255,255]));

    const image = new Image();
    image.onload = function() {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);
    };
    image.src = url;

    return texture;
}

// Clamp camera X and Z to stay inside the grid
function clampCameraToGrid() {
  camera.eye[0] = Math.max(-TOTAL_BLOCK_WIDTH/2+STREET_MARGIN, Math.min(TOTAL_BLOCK_WIDTH/2+STREET_MARGIN, camera.eye[0]));
  camera.eye[2] = Math.max(-TOTAL_BLOCK_LENGTH/2, Math.min(TOTAL_BLOCK_LENGTH/2+STREET_MARGIN, camera.eye[2]));
}

// Patch updateCameraPosition to call clampCameraToGrid at the end
const originalUpdateCameraPosition = updateCameraPosition;
updateCameraPosition = function(...args) {
  originalUpdateCameraPosition.apply(this, args);
  clampCameraToGrid();
};

// Set the HP bar width and label (value: 0-100)
function setHPBar(percent) {
  const bar = document.getElementById('hp-bar');
  const label = document.querySelector('.hp-bar-label');
  if (bar) bar.style.width = Math.max(0, Math.min(100, percent)) + '%';
  if (label) label.textContent = Math.round(percent) + '%';
}

// Set the timer clock value (input: seconds as decimal, output: mm:ss)
function setTimerClock(seconds) {
  const el = document.getElementById('timer-clock');
  if (!el || isNaN(seconds)) return;
  seconds = Math.max(0, seconds);
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  el.textContent = (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;

  
  // Animate ambient light as a sine function of time
  // Range: 0.0 (dark) to 0.9 (bright)
  let amb = 0.5 + 0.5 * Math.sin((2 * Math.PI * seconds) / (60 * 24)); // period = 60*24 seconds
  amb = Math.max(0, Math.min(0.9, amb));
  LUZ.amb = vec4(amb, amb, amb, 1.0);

  // Move LUZ.pos in a circle (line on sphere surface) of radius 70
  // let radius = 70;
  // let theta = seconds * 0.2; // speed of movement
  // let phi = Math.PI/2; // equator (horizontal line)
  // LUZ.pos[0] = radius * Math.cos(theta) * Math.sin(phi);
  // LUZ.pos[1] = radius * Math.cos(phi);
  // LUZ.pos[2] = radius * Math.sin(theta) * Math.sin(phi);
  // LUZ.pos[3] remains unchanged (homogeneous coordinate)

  // sun = new Esfera(
  //   5,
  //   vec3(sizeSun,sizeSun,sizeSun),
  //   vec3(LUZ.pos[0], LUZ.pos[1], LUZ.pos[2]), // posição do sol
  //   LUZ // brilho ou shininess
  // );
  // sun.id = "sun"

  // gObjetos[1] = sun;
  // gObjetos[1].init();
}

// Function to stop the game loop and freeze the scene

function stopGame() {
  gCtx.gameStopped = true;
}

// Patch render to respect gameStopped
var _originalRender = render;
render = function(currentTime) {
  if (gCtx.gameStopped) return; // Do not continue rendering
  _originalRender(currentTime);
};