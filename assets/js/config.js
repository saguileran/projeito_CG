

// ==================================================================
// Propriedades da fonte de luz
const LUZ = {
  pos: vec4(30.0, 100.0, 30.0, 1.0), // posição
  amb: vec4(0.2, 0.2, 0.2, 1.0), // ambiente
  dif: vec4(1.0, 1.0, 1.0, 1.0), // difusão
  esp: vec4(1.0, 1.0, 1.0, 1.0), // especular
};

// Propriedades do material
var MAT = {
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
const FAR = 500;

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
  return vec4(r,g,b,1);  // retorna uma string
}

function RandomMat(random_amb = false) {
  let amb;
  if (random_amb) amb = randomCor();
  else amb = vec4(1.0, 1.0, 1.0, 1.0)
  
  return {
    amb: amb,
    dif: vec4(1.0, 1.0, 1.0, 1.0),
    alfa: randomRange(10, 500), // shininess
  };
}