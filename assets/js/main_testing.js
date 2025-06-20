

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
var gaTexCoords = []; // coordenadas de textura
var URL = 'https://upload.wikimedia.org/wikipedia/commons/4/47/PNG_transparency_demonstration_1.png'
//"https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Flower_poster_2.jpg/1200px-Flower_poster_2.jpg"


var numCubos = 10;
var gCubos = [];
var aux;
var cor;

// Propriedades do material
let scale_floor = 1000;

var MAT_FLOOR = {
  amb: vec4(1.0, 0.0, 0.0, 1.0),
  dif: vec4(1.0, 1.0, 1.0, 1.0),
  alfa: 50.0,    // brilho ou shininess
};

var floor = new Floor(
    vec3(scale_floor, 1, scale_floor),
    vec3(0,0,0),
    MAT_FLOOR,
)
floor.id = 'floor';
var gObjetos = [floor];

// Parameters for the grid of house blocks
const GRID_ROWS = 4;
const GRID_COLS = 6;
const BLOCK_WIDTH = 15;   // Width of each block region (meters)
const BLOCK_LENGTH = 20;  // Length of each block region (meters)
const STREET_WIDTH = 20;   // Distance between blocks (meters)

const MIN_NO_ANDARES = 1;
const MAX_NO_ANDARES = 5;
const ALTURA_ANDAR = 2.5; // meters
const LARGURA_CASA = 6;   // width of a house (meters)
const LARGO_CASA = 8;     // length of a house (meters)
const NO_CASAS_LINEAS = 4; // houses per row in a block


// Generate a grid of blocks (2x2), each block is a group of houses close together
for (let row = 0; row < GRID_ROWS; row++) {
  for (let col = 0; col < GRID_COLS; col++) {
    // Calculate the center (x0, z0) for each block
    let x0 = col*(BLOCK_WIDTH + STREET_WIDTH) - ((GRID_COLS - 1) * (BLOCK_WIDTH + STREET_WIDTH)) / 2;
    let z0 = row*(BLOCK_LENGTH + STREET_WIDTH) - ((GRID_ROWS - 1) * (BLOCK_LENGTH + STREET_WIDTH)) / 2;
    createBlockOfHouses(x0, z0, NO_CASAS_LINEAS, NO_CASAS_LINEAS);
  }
}

// Function to create a block of houses centered at (centerX, centerZ)
function createBlockOfHouses(centerX = 0, centerZ = 0, casasX = 2, casasZ = 2) {
  // Houses are placed adjacent to each other, forming a compact block
  let totalWidth = casasX * LARGURA_CASA;
  let totalLength = casasZ * LARGO_CASA;
  let startX = centerX - totalWidth / 2 + LARGURA_CASA / 2;
  let startZ = centerZ - totalLength / 2 + LARGO_CASA / 2;

  for (let ix = 0; ix < casasX; ix++) {
    for (let iz = 0; iz < casasZ; iz++) {
      let altura = randomRange(MIN_NO_ANDARES, MAX_NO_ANDARES);
      let posX = startX + ix * LARGURA_CASA;
      let posZ = startZ + iz * LARGO_CASA;
      let posY = ALTURA_ANDAR * altura;

      
      let cube = new Cubo(
        vec3(LARGURA_CASA, 2 * ALTURA_ANDAR * altura, LARGO_CASA), // scale
        vec3(posX, posY, posZ), // translation
        RandomMat()
      );
      cube.id = `building`;
      gObjetos.push(cube);
    }
  }
}

// carros
const CAR_HEIGHT = 2; // height of the car
const CAR_WIDTH = 3; // width of the car
let carro = new Cubo(
    vec3(CAR_WIDTH, CAR_HEIGHT, 1),
    vec3(0, CAR_HEIGHT/2, -5),
    RandomMat(),
    vec3(0,0,0.01)
  )

gObjetos.push(carro);


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
  gObjetos[0].init();
  gObjetos[0].texture = loadTexture(`assets/images/floor/3.png`);
  // cube.texture = loadTexture(`assets/images/${noImg}.png`);
      
  for(let i=1; i < gObjetos.length; i++) {
    // configureTexturaDaURL(URL);
    gObjetos[i].init();
    
    let noImg = parseInt(Math.floor(Math.random() * 18) + 1);

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
  // ------------------------ buttons ------------------------
    // document.getElementById("xButton").onclick = function () {
    //   for (const objeto of gObjetos) {
    //     objeto.axis = EIXO_X_IND;
    //   }
    // };
    // document.getElementById("yButton").onclick = function () {
    //   for (const objeto of gObjetos) {
    //     objeto.axis = EIXO_Y_IND;
    //   }
    // };
    // document.getElementById("zButton").onclick = function () {
    //   for (const objeto of gObjetos) {
    //     objeto.axis = EIXO_Z_IND;
    //   }
    // };
    // document.getElementById("pButton").onclick = function () {
    //   for (const objeto of gObjetos) {
    //     objeto.rodando = !objeto.rodando;
    //   }
    // };

    // // ------------------------ eventos de teclado ------------------------
    // window.onkeydown = function(event) {
    //   const keyName = event.key.toLowerCase();

    //   if (keyName === 'p') {
    //   for (const objeto of gObjetos) {
    //     objeto.rodando = !objeto.rodando;
    //   }
    //   } else if (keyName === '1') {
    //   for (const objeto of gObjetos) {
    //     objeto.axis = EIXO_X_IND;
    //   }
    //   } else if (keyName === '2') {
    //   for (const objeto of gObjetos) {
    //     objeto.axis = EIXO_Y_IND;
    //   }
    //   } else if (keyName === '3') {
    //   for (const objeto of gObjetos) {
    //     objeto.axis = EIXO_Z_IND;
    //   }
    //   }
    //   else if (keyName === 'i') {
    //   for (const objeto of gObjetos) {
    //     gCtx.velRotacion *= -1;
    //   }
    //   }
    // };
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
      updateScene(fixedTimeStep);
      accumulator -= fixedTimeStep;
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

function checkCollisionHouses() {
  for(const house of gObjetos) {
    if (house instanceof Cubo) {
      // Check if the house is within the bounds of the floor
      if (camera.eye[0] >= house.range.x[0] && camera.eye[0] <= house.range.x[1] &&
          camera.eye[1] >= house.range.y[0] && camera.eye[1] <= house.range.y[1] &&
          camera.eye[2] >= house.range.z[0] && camera.eye[2] <= house.range.z[1]) {

          console.log("Collision with house at position: ", house );
            // Calculate the direction vector from the house center to the camera
            let houseCenter = vec3(
              (house.range.x[0] + house.range.x[1]) / 2,
              (house.range.y[0] + house.range.y[1]) / 2,
              (house.range.z[0] + house.range.z[1]) / 4
            );
            let dir =  subtract(camera.eye, houseCenter)
            // Normalize direction
            console.log("dir:" , dir, dot(dir, dir));
            let len = Math.sqrt( dot(dir, dir));
            if (len === 0) len = 1;
            dir = dir.map(v => v / len);

            // Find the closest point outside the house bounding box
            // Move the camera just outside the house along the direction vector
            let margin = 0.1; // small offset to prevent sticking
            let newEye = vec3(camera.eye);
            // For each axis, push the camera out of the box
            let i = 0 ;
            for (const [key, value] of Object.entries(house.range)) {
              if (camera.eye[0] < value[0]) newEye[i] = value[0] - margin;
              if (camera.eye[0] > value[1]) newEye[i] = value[1] + margin;
              i += 1;
            }

            // If inside, push out along the largest penetration axis
            let dx0 = Math.abs(camera.eye[0] - house.range.x[0]);
            let dx1 = Math.abs(camera.eye[0] - house.range.x[1]);
            let dy0 = Math.abs(camera.eye[1] - house.range.y[0]);
            let dy1 = Math.abs(camera.eye[1] - house.range.y[1]);
            let dz0 = Math.abs(camera.eye[2] - house.range.z[0]);
            let dz1 = Math.abs(camera.eye[2] - house.range.z[1]);
            let minPen = Math.min(dx0, dx1, dy0, dy1, dz0, dz1);

            if (minPen === dx0) newEye[0] = house.range.x[0] - margin;
            else if (minPen === dx1) newEye[0] = house.range.x[1] + margin;
            else if (minPen === dy0) newEye[1] = house.range.y[0] - margin;
            else if (minPen === dy1) newEye[1] = house.range.y[1] + margin;
            else if (minPen === dz0) newEye[2] = house.range.z[0] - margin;
            else if (minPen === dz1) newEye[2] = house.range.z[1] + margin;

            // Elastic collision: reflect the camera's velocity (if you have one)
            if (camera.vel) {
            // Find normal of the collision surface
            let normal = [0, 0, 0];
            if (minPen === dx0) normal      = vec3(-1, 0, 0);
            else if (minPen === dx1) normal = vec3(1,  0, 0);
            else if (minPen === dy0) normal = vec3(0, -1, 0);
            else if (minPen === dy1) normal = vec3(0, 1,  0);
            else if (minPen === dz0) normal = vec3(0, 0, -1);
            else if (minPen === dz1) normal = vec3(0, 0,  1);

            // v' = v - 2*(v·n)*n
            let vDotN = dot(camera.vel, normal);
            camera.vel = subtract(camera.vel, scale(2*vDotN, normal));
            }

            // Move camera to the new position outside the house
            camera.eye[0] = newEye[0];
            camera.eye[2] = newEye[2];
         }
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