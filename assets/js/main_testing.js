/**
 * 
 *  NUSP - Nome: Nome do Aluno
 *  NUSP - Nome: Nome do Aluno
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

// constantes de world
// var raio_world = 4.0;
// var res_esfera = 3;

var numCubos = 10;
var gCubos = [];
var aux;
var cor;

// Propriedades do material
var MAT_FLOOR = {
  amb: vec4(1.0, 0.0, 0.0, 1.0),
  dif: vec4(1.0, 1.0, 1.0, 1.0),
  alfa: 50.0,    // brilho ou shininess
};

let scale_floor = 100;
var floor = new Floor(
    vec3(scale_floor, 1, scale_floor),
    vec3(0,0,0),
    MAT_FLOOR,
) 

const MIN_NO_ANDARES = 1;
const MAX_NO_ANDARES = 5;
const ALTURA_ANDAR = 2.5;
const NO_CASA = 5;
const LARGURA_CASA = 4;
var gObjetos = [floor];

let altura, largo;
for(let j=0; j<2; j++){
  for(let i=0; i<NO_CASA; i++){
    let mat = {
      amb: randomCor(),
      dif: vec4(1.0, 1.0, 1.0, 1.0),
      alfa: 50.0,    // brilho ou shininess
    }
    altura = randomRange(MIN_NO_ANDARES, MAX_NO_ANDARES)
    largo = 5;
    let cube = new Cubo(
      vec3(largo, 2*ALTURA_ANDAR*altura, LARGURA_CASA),
      vec3(largo*i, ALTURA_ANDAR*altura, (-1)**j*LARGURA_CASA/2),
      mat,
    );
    gObjetos.push(cube)

  }
}

// // objetos


// const at = vec3(0,0,0); // ponto para onde está olhando
// const eye = vec3(3,3,3);

// guarda coisas do shader
var gShader = {
  aTheta: null,
};

// guarda coisas da interface e contexto do programa
var gCtx = {
  view: mat4(),     // view matrix, inicialmente identidade
  perspective: mat4(), // projection matrix
  velRotacion: 0.3,   // velocidade de rotação dos objetos
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
  gObjetos.forEach(objeto => {
    objeto.init();
  })

  // Inicializações feitas apenas 1 vez
  gl.viewport(0, 0, gCanvas.width, gCanvas.height);
  gl.clearColor(FUNDO[0], FUNDO[1], FUNDO[2], FUNDO[3]);
  gl.enable(gl.DEPTH_TEST);

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
  // ------------------------ buttons ------------------------
    document.getElementById("xButton").onclick = function () {
      for (const objeto of gObjetos) {
        objeto.axis = EIXO_X_IND;
      }
    };
    document.getElementById("yButton").onclick = function () {
      for (const objeto of gObjetos) {
        objeto.axis = EIXO_Y_IND;
      }
    };
    document.getElementById("zButton").onclick = function () {
      for (const objeto of gObjetos) {
        objeto.axis = EIXO_Z_IND;
      }
    };
    document.getElementById("pButton").onclick = function () {
      for (const objeto of gObjetos) {
        objeto.rodando = !objeto.rodando;
      }
    };

    // ------------------------ eventos de teclado ------------------------
    window.onkeydown = function(event) {
      const keyName = event.key.toLowerCase();

      if (keyName === 'p') {
      for (const objeto of gObjetos) {
        objeto.rodando = !objeto.rodando;
      }
      } else if (keyName === '1') {
      for (const objeto of gObjetos) {
        objeto.axis = EIXO_X_IND;
      }
      } else if (keyName === '2') {
      for (const objeto of gObjetos) {
        objeto.axis = EIXO_Y_IND;
      }
      } else if (keyName === '3') {
      for (const objeto of gObjetos) {
        objeto.axis = EIXO_Z_IND;
      }
      }
      else if (keyName === 'i') {
      for (const objeto of gObjetos) {
        gCtx.velRotacion *= -1;
      }
      }
    };
    // window.onkeyup = callbackKeyUp;
    

    // ------------------------ sliders ------------------------
    document.getElementById("alfaSlider").onchange = function (e) {
      document.getElementById("alfaValueLabel").textContent = e.target.value;
      
      for (const objeto of gObjetos) {
        objeto.mat.alfa = e.target.value;
        console.log("Alfa = ", objeto.mat.alfa);
      }

      gCtx.alfaEspecular = e.target.value;
      console.log("Alfa = ", gCtx.alfaEspecular);
      gl.uniform1f(gShader.uAlfaEsp, gCtx.alfaEspecular);
    };
    document.getElementById("velocitySlider").onchange = function (e) {
      gCtx.velRotacion = e.target.value;
      console.log("Velocidade de Rotacao = ", gCtx.velRotacion);
      document.getElementById("velocityValueLabel").textContent = e.target.value;
    };
}

// ==================================================================
/**
 * cria e configura os shaders
 */
function crieShaders() {
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
var fixedTimeStep = 1000; // 1 second in milliseconds
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
      updateScene(fixedTimeStep);
      accumulator -= fixedTimeStep;
  }

  // Render at display refresh rate
  renderScene();

  window.requestAnimationFrame(render);
}

function updateScene(step) {
    // This runs exactly once per second
    console.log("Fixed update at 1 second interval");
    
    // Put your animation/logic updates here
    for (const objeto of gObjetos) {
        if (objeto.rodando) {
            objeto.theta[objeto.axis] -= gCtx.velRotacion;
        }
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

    gl.drawArrays(gl.TRIANGLES, 0, objeto.np);
    };
}


function binderNormVert(objeto){
    // buffer das normais
    var bufNormais = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufNormais);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(objeto.nor), gl.STATIC_DRAW);

    var aNormal = gl.getAttribLocation(gShader.program, "aNormal");
    gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aNormal);

    // buffer dos vértices
    var bufVertices = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufVertices);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(objeto.pos), gl.STATIC_DRAW);

    var aPosition = gl.getAttribLocation(gShader.program, "aPosition");
    gl.vertexAttribPointer(aPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aPosition);

    // iluminação
    gl.uniform4fv(gShader.uCorAmb, mult(LUZ.amb, objeto.mat.amb));
    gl.uniform4fv(gShader.uCorDif, mult(LUZ.dif, objeto.mat.dif));
    gl.uniform1f(gShader.uAlfaEsp, MAT.alfa);
}




// // physical model
// const GRAVITY = 9.8; // m/s^2
// const MASS = 70; // Kg 

// var lastTime = 0;
// // var fixedTimeStep = 1000; // 1 second in milliseconds
// let jump_accumulator = 0;
// const ML_S = 1000;
// // const T_JUMP = 10; // seconds
// function jump(duration = 10*ML_S){ // 2 s in ms
//   var deltaTime = currentTime - lastTime;
//   lastTime = currentTime;
//   jump_accumulator += deltaTime;

//   while (jump_accumulator >= duration) {
//       camera.eye = -(g/m)*(t-duration/2)**2 + 1.8 // y(t) = -g/m t^2 + y0
//       jump_accumulator -= duration;
//   }
// }