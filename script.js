/**
 * Programa usando WegGL para demonstrar a animação 3D de três cubos
 * com cores diferentes e controle de velocidade de rotação
 */

"use strict";

// ==================================================================
// Configurações iniciais
// //configuraçoes para jogo
// const eye = vec3(3, 3, 3);
// const at = vec3(0, 1, 0);
// const up = vec3(0, 1, 0);

// const eye = vec3(3, 3, 3);

// Propriedades da fonte de luz
const LUZ_DIR = vec4(1.0, 1.0, 1.0, 0.0);

// Cores dos cubos
const CUBE_COLORS = [
    vec4(1.0, 0.0, 0.0, 1.0),  // Vermelho
    vec4(0.0, 1.0, 0.0, 1.0),  // Verde
    vec4(0.0, 0.0, 1.0, 1.0)   // Azul
];

// Posições dos cubos
const CUBE_POSITIONS = [
    vec3(0.0, 0.0, 0.0),
    vec3(0.0, 0.0, 2.0),
    vec3(1.5, -1.0, 0.0)
];

// Near other global variables
var gCameraAngle = 0;       // Horizontal rotation (radians)
var gCameraRadius = 1;      // Distance from center
var gCameraHeight = 2;      // Initial height (y-axis)

const eye = vec3(5, gCameraHeight, 0); // X=5, Y=gCameraHeight, Z=0
const at = vec3(0, 0, 0);
const up = vec3(0, 1, 0);

//camera para jogo 
// var gCameraAngle = 0;       // Horizontal rotation (radians)
// var gCameraRadius = 1;      // Distance from center
// var gCameraHeight = 0.5;
// var gCameraSpeed = 0.1;     // Rotation speed (radians per keypress)
// var gVerticalSpeed = 0.2;   // Vertical movement speed

var gLastTime = 0;
var gPausedTime = 0;
// Camera
const FOVY = 80;
const ASPECT = 1;  // Updated for wider view
const NEAR = 0.1;
const FAR = 50;

// ==================================================================
// constantes globais
const FUNDO = [0.0, 0.0, 1.0, 0.650];
const EIXO_X_IND = 0;
const EIXO_Y_IND = 1;
const EIXO_Z_IND = 2;
const EIXO_X = vec3(1, 0, 0);
const EIXO_Y = vec3(0, 1, 0);
const EIXO_Z = vec3(0, 0, 1);

// ==================================================================
// variáveis globais
var gl;
var gCanvas;

// Array de cubos
var gCubos = [];
var gEsferas = [];

// Configurações do shader
var gShader = {
    aTheta: null,
    velocity: 0.1  // Default rotation speed
};

// Contexto do programa
var gCtx = {
    view: mat4(),
    perspective: mat4()
};

// ==================================================================
window.onload = main;

function main() {
    gCanvas = document.getElementById("glcanvas");
    gl = gCanvas.getContext('webgl2');
    if (!gl) alert("WebGL 2.0 not supported");

    // Configuração da interface
    crieInterface();

    // Remove a criação do cubo e adiciona a esfera
    // Esfera
    let esfera = new Esfera(1, 10);
    esfera.init();
    
    esfera.color = vec4(0.128, 0.128, 0.128, 0);  // Esfera vermelha
    esfera.position = vec3(0, 0, 0);   // Posição central
    esfera.rodando = true;             // Já começa rotacionando
    esfera.axis = EIXO_X_IND;          // Rotaciona no eixo Y por padrão
    gEsferas.push(esfera);

    // Cubo
    let cubo = new Cubo();
    cubo.init();
    
    cubo.color = vec4(1, 0, 0, 0);
    cubo.position = vec3(0, 1.5, 0);   // Posição central
    cubo.rodando = false;            // Já começa rotacionando
    cubo.axis = EIXO_X_IND;          // Rotaciona no eixo Y por padrão
    gCubos.push(cubo);

    // Configurações WebGL
    gl.viewport(0, 0, gCanvas.width, gCanvas.height);
    gl.clearColor(FUNDO[0], FUNDO[1], FUNDO[2], FUNDO[3]);
    gl.enable(gl.DEPTH_TEST);

    updateCamera();

    // Shaders
    crieShaders();

    // Inicia a renderização
    render();
}

function crieInterface() {

    // Controle deslizante de velocidade
    const velocitySlider = document.getElementById("velocitySlider");
    const velocityValue = document.getElementById("velocityValue");

    // Track pressed keys
    const gKeysPressed = {};
    // Update camera continuously in render loop
    function handleCameraMovement() {
        updateCamera(); // Apply changes
    }


    velocitySlider.addEventListener("input", function () {
        gShader.velocity = parseFloat(this.value);
        velocityValue.textContent = this.value;
    });

    // Integrate into the render loop
    const originalRender = render;
    render = function () {
        handleCameraMovement();
        originalRender();
    };
}

function updateCamera() {
    // Calculate circular path (x/z plane)
    gCameraHeight = Math.max(-5, Math.min(5, gCameraHeight));
    // const eyeX = gCameraRadius * Math.sin(gCameraAngle);
    // const eyeZ = gCameraRadius * Math.cos(gCameraAngle);
    const eyeX = gCameraRadius;
    const eyeZ = gCameraRadius;


    // Apply height (y-axis)
    const eye = vec3(eyeX, gCameraHeight, eyeZ);

    // Always look at the center (0, gCameraHeight/2, 0) for better feel
    gCtx.view = lookAt(eye, at, up);
    gl.uniformMatrix4fv(gShader.uView, false, flatten(gCtx.view));
}

function crieShaders() {
    gShader.program = makeProgram(gl, gVertexShaderSrc, gFragmentShaderSrc);
    gl.useProgram(gShader.program);

    // Buffer de vértices (usando a esfera)
    var bufVertices = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufVertices);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(gEsferas[0].pos), gl.STATIC_DRAW);

    var aPosition = gl.getAttribLocation(gShader.program, "aPosition");
    gl.vertexAttribPointer(aPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aPosition);

    // Buffer de normais (usando a esfera)
    var bufNormais = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufNormais);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(gEsferas[0].nor), gl.STATIC_DRAW);

    var aNormal = gl.getAttribLocation(gShader.program, "aNormal");
    gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aNormal);

    // Buffer de índices (novo - específico para esfera)
    var bufIndices = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufIndices);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(gEsferas[0].indices), gl.STATIC_DRAW);

    // Uniforms
    gShader.uModel = gl.getUniformLocation(gShader.program, "uModel");
    gShader.uView = gl.getUniformLocation(gShader.program, "uView");
    gShader.uPerspective = gl.getUniformLocation(gShader.program, "uPerspective");
    gShader.uInverseTranspose = gl.getUniformLocation(gShader.program, "uInverseTranspose");
    gShader.uMatDif = gl.getUniformLocation(gShader.program, "uMatDif");
    gShader.uLuzDir = gl.getUniformLocation(gShader.program, "uLuzDir");

    // Matrizes de visualização
    gCtx.perspective = perspective(FOVY, ASPECT, NEAR, FAR);
    gl.uniformMatrix4fv(gShader.uPerspective, false, flatten(gCtx.perspective));

    gCtx.view = lookAt(eye, at, up);
    gl.uniformMatrix4fv(gShader.uView, false, flatten(gCtx.view));

    // Parâmetros de iluminação
    gl.uniform4fv(gShader.uLuzDir, LUZ_DIR);
}

function render(timestamp) {
    if (!gLastTime) gLastTime = timestamp;
    const deltaTime = timestamp - gLastTime;
    gLastTime = timestamp;
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Renderiza cada esfera
    gEsferas.forEach(esfera => {
        if (esfera.rodando) {
            esfera.theta[esfera.axis] += gShader.velocity;
        }

        // Matrizes de transformação
        let translation = translate(esfera.position[0], esfera.position[1], esfera.position[2]);
        let rx = rotateX(esfera.theta[EIXO_X_IND]);
        let ry = rotateY(esfera.theta[EIXO_Y_IND]);
        let rz = rotateZ(esfera.theta[EIXO_Z_IND]);

        // Combina as transformações
        let model = mult(translation, mult(rz, mult(ry, rx)));

        // Define a cor da esfera
        gl.uniform4fv(gShader.uMatDif, esfera.color);

        // Aplica as transformações
        gl.uniformMatrix4fv(gShader.uModel, false, flatten(model));

        // Desenha a esfera usando elementos (índices)
        gl.drawElements(gl.TRIANGLES, esfera.np, gl.UNSIGNED_SHORT, 0);
    });

    // Renderiza cada cubo
    gCubos.forEach(cubo => {
        if (cubo.rodando) {
            cubo.theta[cubo.axis] += gShader.velocity;
        }

        // Matrizes de transformação
        let translation = translate(cubo.position[0], cubo.position[1], cubo.position[2]);
        let rx = rotateX(cubo.theta[EIXO_X_IND]);
        let ry = rotateY(cubo.theta[EIXO_Y_IND]);
        let rz = rotateZ(cubo.theta[EIXO_Z_IND]);

        // Combina as transformações
        let model = mult(translation, mult(rz, mult(ry, rx)));

        // Define a cor da cubo
        gl.uniform4fv(gShader.uMatDif, cubo.color);

        // Aplica as transformações
        gl.uniformMatrix4fv(gShader.uModel, false, flatten(model));

        // Desenha a cubo usando elementos (índices)
        gl.drawElements(gl.TRIANGLES, cubo.np, gl.UNSIGNED_SHORT, 0);
    });

    window.requestAnimationFrame(render);
}

// ========================================================
// ======================== Sphere ========================
// ========================================================
function Esfera(radius = 1.0, sectors = 64, stacks = 32) {
    this.pos = [];
    this.nor = [];
    this.indices = [];
    this.np = 0;
    this.color = vec4(1.0, 1.0, 1.0, 1.0);
    this.position = vec3(0, 0, 0);
    this.axis = EIXO_X_IND;  // Rotaciona no eixo Y por padrão
    this.theta = vec3(0, 0, 0);
    this.rodando = true;      // Começa rotacionando

    this.init = function () {
        const sectorStep = 2 * Math.PI / sectors;
        const stackStep = Math.PI / stacks;

        for (let i = 0; i <= stacks; ++i) {
            const stackAngle = Math.PI / 2 - i * stackStep;
            const xy = radius * Math.cos(stackAngle);
            const z = radius * Math.sin(stackAngle);

            for (let j = 0; j <= sectors; ++j) {
                const sectorAngle = j * sectorStep;
                const x = xy * Math.cos(sectorAngle);
                const y = xy * Math.sin(sectorAngle);

                this.pos.push(vec4(x, y, z, 1.0));
                this.nor.push(vec3(x, y, z));
            }
        }

        // Gera índices para desenho com gl.TRIANGLES
        for (let i = 0; i < stacks; ++i) {
            let k1 = i * (sectors + 1);
            let k2 = k1 + sectors + 1;

            for (let j = 0; j < sectors; ++j, ++k1, ++k2) {
                if (i != 0) {
                    this.indices.push(k1);
                    this.indices.push(k2);
                    this.indices.push(k1 + 1);
                }

                if (i != (stacks - 1)) {
                    this.indices.push(k1 + 1);
                    this.indices.push(k2);
                    this.indices.push(k2 + 1);
                }
            }
        }

        this.np = this.indices.length;
    };
}

// ========================================================
// ==================== Modelo de cubo ====================
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

function Cubo() {
    this.np  = 36;  // número de posições (vértices)
    this.pos = [];  // vetor de posições
    this.nor = [];  // vetor de normais

    this.axis = EIXO_X_IND;  // usado na animação da rotação
    this.theta = vec3(0, 0, 0);  // rotação em cada eixo
    this.rodando = false;        // pausa a animação
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
function quad (pos, nor, vert, a, b, c, d) {
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
// Shaders
var gVertexShaderSrc = `#version 300 es

in  vec4 aPosition;
in  vec3 aNormal;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uPerspective;

uniform vec4 uLuzDir;

out vec3 vNormal;
out vec3 vLuzDir;

void main() {
    mat4 modelView = uView * uModel;
    gl_Position = uPerspective * modelView * aPosition;

    vNormal = mat3(modelView) * aNormal;
    vLuzDir = mat3(uView) * uLuzDir.xyz;
}
`;

var gFragmentShaderSrc = `#version 300 es

precision highp float;  

in vec3 vNormal;
in vec3 vLuzDir;
out vec4 corSaida;

uniform vec4 uMatDif;

void main() {
    vec3 normal = normalize(vNormal);
    vec3 nvl = normalize(vLuzDir);
    float kdd = dot(normal, nvl);

    corSaida = uMatDif * 0.3; // Cor base (ambiente)
    if (kdd > 0.0) {
        corSaida += kdd * uMatDif;
    }
    corSaida.a = 1.0;
}
`;