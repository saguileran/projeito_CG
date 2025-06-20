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
  this.mat = mat; // brilho ou shininess

  this.textureURL = null; // textura 

  // range where t
  this.range = {
    x: [trans[0] - 0.5 * escala[0], trans[0] + 0.5 * escala[0]],
    y: [trans[1] - 0.5 * escala[1], trans[1] + 0.5 * escala[1]],
    z: [trans[2] - 0.5 * escala[2], trans[2] + 0.5 * escala[2]],
  };
  
  this.init = function () {
    const [pos, nor] = crieEsfera(divEsfera);

    // console.log(pos, nor);

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

// Pontos do cubo (CUBO_CANTOS):
// 0: (-0.5, -0.5,  0.5, 1.0) // Frente-Baixo-Esquerda
// 1: (-0.5,  0.5,  0.5, 1.0) // Frente-Cima-Esquerda
// 2: ( 0.5,  0.5,  0.5, 1.0) // Frente-Cima-Direita
// 3: ( 0.5, -0.5,  0.5, 1.0) // Frente-Baixo-Direita
// 4: (-0.5, -0.5, -0.5, 1.0) // Trás-Baixo-Esquerda
// 5: (-0.5,  0.5, -0.5, 1.0) // Trás-Cima-Esquerda
// 6: ( 0.5,  0.5, -0.5, 1.0) // Trás-Cima-Direita
// 7: ( 0.5, -0.5, -0.5, 1.0) // Trás-Baixo-Direita
const CUBO_CANTOS = [
  vec4(-0.5, -0.5, 0.5, 1.0),  // 0
  vec4(-0.5, 0.5, 0.5, 1.0),   // 1
  vec4(0.5, 0.5, 0.5, 1.0),    // 2
  vec4(0.5, -0.5, 0.5, 1.0),   // 3
  vec4(-0.5, -0.5, -0.5, 1.0), // 4
  vec4(-0.5, 0.5, -0.5, 1.0),  // 5
  vec4(0.5, 0.5, -0.5, 1.0),   // 6
  vec4(0.5, -0.5, -0.5, 1.0)   // 7
];

var vTextura = [      // valores escolhidos para recortar a parte desejada
  vec2(0.05, 0.05),
  vec2(0.05, 0.75),
  vec2(0.95, 0.75),
  vec2(0.95, 0.05)
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
    velocidade = vec3(0,0,0), // velocidade de rotação
  ) {
  this.np = 36;  // número de posições (vértices)
  this.pos = [];  // vetor de posições
  this.nor = [];  // vetor de normais
  this.tex = [];  // vetor de texturas
  this.id = 'None'

  this.axis = EIXO_Z_IND;  // usado na animação da rotação
  this.theta = vec3(0, 0, 0);  // rotação em cada eixo
  this.rodando = rodando;        // pausa a animação
  
  this.velocidade = velocidade; // velocidade de rotação
  this.escala = escala;
  this.trans = trans;
  this.mat = mat

  this.textureURL = null; // textura 

  // range where the object is located
  this.range = {
    x: [trans[0] - 0.5*escala[0], trans[0] + 0.5*escala[0]],
    y: [trans[1] - 0.5*escala[1], trans[1] + 0.5*escala[1]],
    z: [trans[2] - 0.5*escala[2], trans[2] + 0.5*escala[2]],
  };
  

  this.init = function () {    // carrega os buffers
    quad(this.tex, this.pos, this.nor, CUBO_CANTOS, 1, 0, 3, 2);
    quad(this.tex, this.pos, this.nor, CUBO_CANTOS, 2, 3, 7, 6);
    quad(this.tex, this.pos, this.nor, CUBO_CANTOS, 3, 0, 4, 7);
    quad(this.tex, this.pos, this.nor, CUBO_CANTOS, 6, 5, 1, 2);
    quad(this.tex, this.pos, this.nor, CUBO_CANTOS, 4, 5, 6, 7);
    quad(this.tex, this.pos, this.nor, CUBO_CANTOS, 5, 4, 0, 1);
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
function quad(tex, pos, nor, vert, a, b, c, d) {
  var t1 = subtract(vert[b], vert[a]);
  var t2 = subtract(vert[c], vert[b]);
  var normal = cross(t1, t2);
  normal = vec3(normal);


  pos.push(vert[a]);
  nor.push(normal);
  tex.push(vTextura[0]);
  pos.push(vert[b]);
  nor.push(normal);
  tex.push(vTextura[1]);
  pos.push(vert[c]);
  nor.push(normal);
  tex.push(vTextura[2]);

  pos.push(vert[a]);
  nor.push(normal);
  tex.push(vTextura[0]);
  pos.push(vert[c]);
  nor.push(normal);
  tex.push(vTextura[2]);
  pos.push(vert[d]);
  nor.push(normal);
  tex.push(vTextura[3]);
};


// floor coordinates
const FLOOR_CANTOS = [
  vec4(-0.5, 0, -0.5, 1.0), // Back-Left
  vec4(-0.5, 0,  0.5, 1.0), // Front-Left
  vec4( 0.5, 0,  0.5, 1.0), // Front-Right
  vec4( 0.5, 0, -0.5, 1.0), // Back-Right
];


var MARGIN = 3;

function Floor(
    escala = vec3(1,1,1),
    trans = vec3(0,0,0),
    mat = MAT,
    
){
  this.np = 6;
  this.pos = [];  // vetor de posições
  this.nor = [];  // vetor de normais
  this.tex = [];  // vetor de texturas

  this.escala = escala;
  this.trans = trans;
  this.mat = mat

  this.axis = EIXO_Y_IND;  // usado na animação da rotação
  this.theta = vec3(0, 0, 0);  // rotação em cada eixo
  this.rodando = false;        // pausa a animação
  
  this.init = function () {    // carrega os buffers
    quad(this.tex, this.pos, this.nor, FLOOR_CANTOS, 0, 1, 2, 3);
    }

}

