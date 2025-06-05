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
var raio_world = 4.0;
var res_esfera = 3;

var numCubos = 10;
var gCubos = [];
var aux;
var cor;

// Creating houses
for (var i = 0; i < numCubos; i++) {
  // Calcula ângulos theta e phi para distribuição uniforme
  var theta = (Math.PI) / 2; // Equador
  var phi = (2 * Math.PI / numCubos) * i; // Divide o círculo igualmente
  
  // Converte para coordenadas cartesianas
  var x = (raio_world) * Math.sin(theta) * Math.cos(phi);
  var y = raio_world * Math.sin(theta) * Math.sin(phi);
  var z = raio_world * Math.cos(theta);
  
  cor = randomCor();
  // Cria um novo material para cada cubo, garantindo cor única
  let matCubo = {
    amb: vec4(randomRange(), randomRange(), randomRange(), 1.0),
    dif: vec4(1.0, 1.0, 1.0, 1.0),
    alfa: 50.0
  };
  console.log(" cor: ", cor);
  // Cria cubo na posição calculada
  gCubos.push(new Cubo(vec3(1, 1, 1), vec3(x, y, z+1.5), matCubo));

  let matCubo1 = {
    amb: vec4(randomRange(), randomRange(), randomRange(), 1.0),
    dif: vec4(1.0, 1.0, 1.0, 1.0),
    alfa: 50.0
  };

  gCubos.push(new Cubo(vec3(1, 1, 1), vec3(x, y, z-1.5), matCubo1));
}

// var gCubo = new Cubo(vec3(1,1,1), vec3(raio_world,0,2));
var gEsfera = new Esfera(res_esfera, vec3(raio_world,raio_world,raio_world), vec3(0,0,0), MAT_ESFERA); // world

// casas
var gEsferas = [gEsfera];
var gObjetos = gCubos.concat(gEsferas);

// calcula a matriz de transformação da camera, apenas 1 vez
// const eye = vec3(3, 3, 3);
var gCameraHeight = 2;
const up = vec3(0, 1, 0);

// const eye = vec3(3.61, gCameraHeight, 0); 
// const at = vec3(0, 7, 0);

const eye = vec3(8, gCameraHeight, 0); 
const at = vec3(0, 1, 0);


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

  // calcula a matriz de transformação perpectiva (fovy, aspect, near, far)
  // que é feita apenas 1 vez
  gCtx.perspective = perspective(FOVY, ASPECT, NEAR, FAR);
  gl.uniformMatrix4fv(gShader.uPerspective, false, flatten(gCtx.perspective));

  gCtx.view = lookAt(eye, at, up);
  gl.uniformMatrix4fv(gShader.uView, false, flatten(gCtx.view));

  // parametros para iluminação
  gShader.uLuzPos = gl.getUniformLocation(gShader.program, "uLuzPos");
  gl.uniform4fv(gShader.uLuzPos, LUZ.pos);

  // fragment shader
  gShader.uCorAmb = gl.getUniformLocation(gShader.program, "uCorAmbiente");
  gShader.uCorDif = gl.getUniformLocation(gShader.program, "uCorDifusao");
  gShader.uCorEsp = gl.getUniformLocation(gShader.program, "uCorEspecular");
  gShader.uAlfaEsp = gl.getUniformLocation(gShader.program, "uAlfaEsp");

  // gl.uniform4fv(gShader.uCorAmb, mult(LUZ.amb, MAT.amb));
  // gl.uniform4fv(gShader.uCorDif, mult(LUZ.dif, MAT.dif));
  gl.uniform4fv(gShader.uCorEsp, LUZ.esp);
  // gl.uniform1f(gShader.uAlfaEsp, MAT.alfa);

  binderNormVert(gObjetos[0]);
  
};

// ==================================================================
/**
 * Usa o shader para desenhar.
 * Assume que os dados já foram carregados e são estáticos.
 */
function render() {
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
      model = mult(model, mR);
      model = mult(model, mS);
      // console.log("Angulo: ", angulo);
      

      let modelView = mult(gCtx.view, model);
      let modelViewInv = inverse(modelView);
      let modelViewInvTrans = transpose(modelViewInv);

    binderNormVert(objeto)

    // uniformes
    gl.uniformMatrix4fv(gShader.uModel, false, flatten(model));
    gl.uniformMatrix4fv(gShader.uInverseTranspose, false, flatten(modelViewInvTrans));

    gl.drawArrays(gl.TRIANGLES, 0, objeto.np);
    };

  window.requestAnimationFrame(render);
}


function binderNormVert(objeto){

    var bufNormais = gl.createBuffer();
  // buffer das normais
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
