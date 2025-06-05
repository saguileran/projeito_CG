/**
 * Programa usando WegGL para demonstrar a animação 3D de um cubo
 * em perspectiva com rotação em cada eixo. O cubo é iluminação por
 * uma fonte de luz pontual segundo o modelo de Phong.
 * 
 * Bibliotecas utilizadas
 * macWebglUtils.js
 * MVnew.js do livro -- Interactive Computer Graphics
 * 
 */

"use strict";

// ==================================================================
// Propriedades da fonte de luz
const LUZ = {
  pos: vec4(3.0, 10.0, 3.0, 1.0), // posição
  amb: vec4(0.2, 0.2, 0.2, 1.0), // ambiente
  dif: vec4(1.0, 1.0, 1.0, 1.0), // difusão
  esp: vec4(1.0, 1.0, 1.0, 1.0), // especular
};

// Propriedades do material
const MAT = {
  amb: vec4(0.0, 0.0, 0.8, 1.0),
  dif: vec4(1.0, 1.0, 1.0, 1.0),
  alfa: 50.0,    // brilho ou shininess
};

const MAT_ESFERA = {
  amb: vec4(0.8, 0.8, 0.8, 1.0),
  dif: vec4(1.0, 0.0, 1.0, 1.0),
  alfa: 50.0,    // brilho ou shininess
};

// Camera
const FOVY = 100;
const ASPECT = 1;
const NEAR = 0.1;
const FAR = 50;

// ==================================================================
// constantes globais

const FUNDO = [0.0, 0.0, 0.0, 1.0];
const EIXO_X_IND = 0;
const EIXO_Y_IND = 1;
const EIXO_Z_IND = 2;
const EIXO_X = vec3(1, 0, 0);
const EIXO_Y = vec3(0, 1, 0);
const EIXO_Z = vec3(0, 0, 1);

const COR_ESFERA = vec4(0.1, 0, 0, 1.0); // cor da esfera
// ==================================================================
// variáveis globais
// as strings com os código dos shaders também são globais, estão 
// no final do arquivo.

var gl;        // webgl2
var gCanvas;   // canvas

// constantes de world
var raio_world = 4.0;
var res_esfera = 3;

// objeto a ser renderizado
// var theta = 10; // ângulo em relação ao eixo Z
// var phi = 10;   // ângulo em relação ao eixo X
// var x = raio_world * Math.sin(theta) * Math.cos(phi);
// var y = raio_world * Math.sin(theta) * Math.sin(phi);
// var z = raio_world * Math.cos(theta);

var numCubos = 10;
var gCubos = [];
var aux;
var cor;

for (var i = 0; i < numCubos; i++) {
  // Calcula ângulos theta e phi para distribuição uniforme
  var theta = (Math.PI) / 2; // Equador
  var phi = (2 * Math.PI / numCubos) * i; // Divide o círculo igualmente
  
  // Converte para coordenadas cartesianas
  var x = (raio_world) * Math.sin(theta) * Math.cos(phi);
  var y = raio_world * Math.sin(theta) * Math.sin(phi);
  var z = raio_world * Math.cos(theta);
  
  // Cria cubo na posição calculada
  gCubos.push(new Cubo(vec3(1, 1, 1), vec3(x, y, z+1.5)));
  gCubos.push(new Cubo(vec3(1, 1, 1), vec3(x, y, z-1.5)));

  cor = randomCor();
  console.log("Cubo ", i, " cor: ", cor);
  // gCubos[i].mat.amb = vec4(randomCor(), 1.0); // material do cubo
  gCubos[2*i].mat.amb = vec4(cor[0], cor[1], cor[2], 1.); // material do cubo
  gCubos[2*i+1].mat.amb = vec4(cor[0], cor[1], cor[2], 1.); // material do cubo
}

// for (var i = 0; i < numCubos; i++) {
//   // Calcula ângulos theta e phi para distribuição uniforme
//   var theta = (Math.PI) / 2; // Equador
//   var phi = (2 * Math.PI / numCubos) * i; // Divide o círculo igualmente

  
//   // Converte para coordenadas cartesianas
//   var x = (raio_world) * Math.sin(theta) * Math.cos(phi);
//   var y = raio_world * Math.sin(theta) * Math.sin(phi);
//   var z = raio_world * Math.cos(theta);
  
//   // Cria cubo na posição calculada
//   gCubos.push(new Cubo(vec3(1, 1, 1), vec3(x, y, z-1.5)));
// }

// var gCubo = new Cubo(vec3(1,1,1), vec3(raio_world,0,2));
var gEsfera = new Esfera(res_esfera, vec3(raio_world,raio_world,raio_world), vec3(0,0,0), MAT_ESFERA); // world

// casas
var gEsferas = [gEsfera];
var gObjetos = gCubos.concat(gEsferas);

// calcula a matriz de transformação da camera, apenas 1 vez
// const eye = vec3(3, 3, 3);
var gCameraHeight = 2;
//const eye = vec3(3.61, gCameraHeight, 0); 
//const at = vec3(0, 7, 0);

const eye = vec3(8, gCameraHeight, 0); 
const at = vec3(0, 1, 0);
const up = vec3(0, 1, 0);


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
        if (Math.abs(dot(normal, up)) > 0.99) up = vec3(1, 0, 0); // Evita problema quando normal aponta para cima

        // var right = normalize(cross(up, normal));
        // var newUp = normalize(cross(normal, right));
        
        // var orientation = mat4(
        //     right[0], right[1], right[2], 0,
        //     newUp[0], newUp[1], newUp[2], 0,
        //     normal[0], normal[1], normal[2], 0,
        //     0, 0, 0, 1
        // );

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


// ========================================================
// Geração do modelo de uma esferaX de lado unitário
// ========================================================
function Esfera(
  divEsfera = 3,
  escala = vec3(1,1,1),
  trans = vec3(0,0,0),
  // cor = COR_ESFERA,
  mat = MAT // brilho ou shininess
) {
  this.np = 6; // número de posições (vértices)
  this.pos = []; // vetor de posições
  this.nor = []; // vetor de normais

  this.axis = EIXO_Z_IND; // usado na animação da rotação
  this.theta = vec3(0, 0, 0); // rotação em cada eixo
  this.rodando = rodando; // pausa a animação
  
  this.escala = escala;
  this.trans = trans;
  // this.cor = cor; // cor da esfera
  this.mat = mat; // brilho ou shininess
  
  this.init = function () {
    const [pos, nor] = crieEsfera(divEsfera);

    console.log(pos, nor);

    this.pos = pos;
    this.nor = nor;
    this.np = pos.length;
    console.log(this.np);
  };
}


function crieEsfera(ndivisoes = 2) {
  // começamos com os vértices de um balão
  let vp = [
      vec3(1.0, 0.0, 0.0),
      vec3(0.0, 1.0, 0.0),
      vec3(0.0, 0.0, 1.0)
  ];

  let vn = [
      vec3(-1.0, 0.0, 0.0),
      vec3(0.0, -1.0, 0.0),
      vec3(0.0, 0.0, -1.0)
  ];

  let triangulo = [
    [vp[0], vp[1], vp[2]],
    [vp[0], vn[2], vp[1]],

    [vp[0], vp[2], vn[1]],
    [vp[0], vn[1], vn[2]],

    [vn[0], vp[2], vp[1]],
    [vn[0], vp[1], vn[2]],

    [vn[0], vn[1], vp[2]],
    [vn[0], vn[2], vn[1]],
  ];

  const pos = [];
  const nor = [];

  for (let i = 0; i < triangulo.length; i++) {
    let a, b, c;
    [a, b, c] = triangulo[i];
    dividaTriangulo(a, b, c, ndivisoes, pos, nor);
  }

  return [pos, nor];
}

function dividaTriangulo(a, b, c, ndivs, pos, nor) {
  // Cada nível quebra um triângulo em 4 subtriângulos
  // a, b, c em ordem mão direita
  //    c
  // a  b

  // caso base
  if (ndivs > 0) {
    let ab = mix(a, b, 0.5);
    let bc = mix(b, c, 0.5);
    let ca = mix(c, a, 0.5);

    ab = normalize(ab);
    bc = normalize(bc);
    ca = normalize(ca);

    dividaTriangulo(a, ab, ca, ndivs - 1, pos, nor);
    dividaTriangulo(b, bc, ab, ndivs - 1, pos, nor);
    dividaTriangulo(c, ca, bc, ndivs - 1, pos, nor);
    dividaTriangulo(ab, bc, ca, ndivs - 1, pos, nor);
  } else {
    insiraTriangulo(a, b, c, pos, nor);
  }
}

function insiraTriangulo(a, b, c, pos, nor) {
  pos.push(vec4(...a, 1));
  pos.push(vec4(...b, 1));
  pos.push(vec4(...c, 1));

  // let cor = COR_ESFERA;

  // gaCores.push(cor);
  // gaCores.push(cor);
  // gaCores.push(cor);

  // var t1 = subtract(b, a);
  // var t2 = subtract(c, b);
  // var normal = cross(t1, t2);
  // normal = vec3(normal);

  var normal = getNormal(a, b, c);

  nor.push(normal);
  nor.push(normal);
  nor.push(normal);
}

function getNormal(a, b, c) {
  var t1 = subtract(b, a);
  var t2 = subtract(c, a);
  var normal = cross(t1, t2);

  return vec3(normal);
}


// ========================================================
// Geração do modelo de um cubo de lado unitário
// ========================================================

const CUBO_CANTOS = [
  vec4(-0.5, -0.5, 0.5, 1.0),
  vec4(-0.5, 0.5, 0.5, 1.0),
  vec4(0.5, 0.5, 0.5, 1.0),
  vec4(0.5, -0.5, 0.5, 1.0),
  vec4(-0.5, -0.5, -0.5, 1.0),
  vec4(-0.5, 0.5, -0.5, 1.0),
  vec4(0.5, 0.5, -0.5, 1.0),
  vec4(0.5, -0.5, -0.5, 1.0)
];

/**  ................................................................
* Objeto Cubo de lado 1 centrado na origem.
* 
* usa função auxiliar quad(pos, nor, vert, a, b, c, d)
*/
function Cubo(
    escala = vec3(1,1,1),
    trans = vec3(0,0,0),
    mat = MAT,
  ) {
  this.np = 36;  // número de posições (vértices)
  this.pos = [];  // vetor de posições
  this.nor = [];  // vetor de normais

  this.axis = EIXO_Z_IND;  // usado na animação da rotação
  this.theta = vec3(0, 0, 0);  // rotação em cada eixo
  this.rodando = rodando;        // pausa a animação
  
  this.escala = escala;
  this.trans = trans;
  this.mat = mat

  this.init = function () {    // carrega os buffers
    quad(this.pos, this.nor, CUBO_CANTOS, 1, 0, 3, 2);
    quad(this.pos, this.nor, CUBO_CANTOS, 2, 3, 7, 6);
    quad(this.pos, this.nor, CUBO_CANTOS, 3, 0, 4, 7);
    quad(this.pos, this.nor, CUBO_CANTOS, 6, 5, 1, 2);
    quad(this.pos, this.nor, CUBO_CANTOS, 4, 5, 6, 7);
    quad(this.pos, this.nor, CUBO_CANTOS, 5, 4, 0, 1);
  };
};

/**  ................................................................
* cria triângulos de um quad e os carrega nos arrays
* pos (posições) e nor (normais).  
* @param {*} pos : array de posições a ser carregado
* @param {*} nor : array de normais a ser carregado
* @param {*} vert : array com vértices do quad
* @param {*} a : indices de vertices
* @param {*} b : em ordem anti-horária
* @param {*} c : 
* @param {*} d :
*/
function quad(pos, nor, vert, a, b, c, d) {
  var t1 = subtract(vert[b], vert[a]);
  var t2 = subtract(vert[c], vert[b]);
  var normal = cross(t1, t2);
  normal = vec3(normal);

  pos.push(vert[a]);
  nor.push(normal);
  pos.push(vert[b]);
  nor.push(normal);
  pos.push(vert[c]);
  nor.push(normal);
  pos.push(vert[a]);
  nor.push(normal);
  pos.push(vert[c]);
  nor.push(normal);
  pos.push(vert[d]);
  nor.push(normal);
};

// ========================================================
// Código fonte dos shaders em GLSL
// a primeira linha deve conter "#version 300 es"
// para WebGL 2.0

var gVertexShaderSrc = `#version 300 es

in vec4 aPosition;
in vec3 aNormal;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uPerspective;
uniform mat4 uInverseTranspose;

uniform vec4 uLuzPos;

out vec3 vNormal;
out vec3 vLight;
out vec3 vView;

void main() {
    mat4 modelView = uView * uModel;
    gl_Position = uPerspective * modelView * aPosition;

    // orienta as normais como vistas pela câmera
    vNormal = mat3(uInverseTranspose) * aNormal;
    vec4 pos = modelView * aPosition;

    vLight = (uView * uLuzPos - pos).xyz;
    vView = -(pos.xyz);
}
`;

var gFragmentShaderSrc = `#version 300 es

precision highp float;

in vec3 vNormal;
in vec3 vLight;
in vec3 vView;
out vec4 corSaida;

// cor = produto luz * material
uniform vec4 uCorAmbiente;
uniform vec4 uCorDifusao;
uniform vec4 uCorEspecular;
uniform float uAlfaEsp;

void main() {
    vec3 normalV = normalize(vNormal);
    vec3 lightV = normalize(vLight);
    vec3 viewV = normalize(vView);
    vec3 halfV = normalize(lightV + viewV);
  
    // difusao
    float kd = max(0.0, dot(normalV, lightV) );
    vec4 difusao = kd * uCorDifusao;

    // especular
    float ks = pow( max(0.0, dot(normalV, halfV)), uAlfaEsp);
    
    vec4 especular = vec4(0, 0, 0, 1); // parte não iluminada
    if (kd > 0.0) {  // parte iluminada
        especular = ks * uCorEspecular;
    }

    // cor de saida
    corSaida = difusao + especular + uCorAmbiente;    
    corSaida.a = 1.0;
}
`;




// ==================================================================
/* Funções auxiliares 
*/
function randomRange(min=0, max=1) {
  return Math.random() * (max - min) + min;
}

function sorteie_corRGB() {
  let r = randomRange(0, 1);
  let g = randomRange(0, 1);
  let b = randomRange(0, 1);
  return `rgb( ${r}, ${g}, ${b} )`;  // retorna uma string
}

function randomCor() {
  let r = randomRange(0, 1);
  let g = randomRange(0, 1);
  let b = randomRange(0, 1);
  return vec3(r,g,b);  // retorna uma string
}

// ===