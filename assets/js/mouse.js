// mouse.js - First-person camera that activates on click

// Camera state
var camera = {
    eye: vec3(0, 1.8, 5),       // Initial position
    at: vec3(0, 1.8, 0),        // Looking at origin
    up: vec3(0, 1, 0),          // World up
    sensitivity: 0.002,
    movementSpeed: 0.02,
    pitch: 0,
    yaw: Math.PI,               // Facing -Z initially
    active: false,              // Becomes true after first click

    // Physics properties
    velocityY: 0,               // Vertical velocity
    isJumping: false,
    gravity: -0.005,            // Gravity strength
    jumpForce: 0.15,            // Initial jump velocity
    groundHeight: 1.8,           // Normal standing height
};

// Mouse state
var mouse = {
    prevX: 0,
    prevY: 0
};

/**
 * Initializes mouse controls
 * @param {HTMLCanvasElement} canvas - WebGL canvas
 * @param {function} updateViewCallback - Called when view changes
 */
function initMouseControls(canvas, updateViewCallback) {
    // Click handler to activate camera
    canvas.addEventListener('click', () => {
        if (!camera.active) {
            camera.active = true;
            mouse.prevX = canvas.width / 2;
            mouse.prevY = canvas.height / 2;
            
            // Request pointer lock
            canvas.requestPointerLock = canvas.requestPointerLock || 
                                      canvas.mozRequestPointerLock || 
                                      document.webkitRequestPointerLock;
            canvas.requestPointerLock();
            
            canvas.style.cursor = 'none';
        }
    });

    // Mouse move handler (only active after click)
    document.addEventListener('mousemove', (e) => {
        if (!camera.active) return;
        
        const dx = e.movementX || e.mozMovementX || e.webkitMovementX || 0;
        const dy = e.movementY || e.mozMovementY || e.webkitMovementY || 0;

        // Update rotation angles
        camera.yaw -= dx * camera.sensitivity;
        camera.pitch -= dy * camera.sensitivity;

        // Clamp pitch to prevent over-rotation
        camera.pitch = Math.max(-Math.PI/2 + 0.1, 
                       Math.min(Math.PI/2 - 0.1, camera.pitch));

        // Update look direction
        updateLookDirection();
        updateViewCallback();
    });

    // Handle pointer lock change
    document.addEventListener('pointerlockchange', lockChange, false);
    document.addEventListener('mozpointerlockchange', lockChange, false);
    document.addEventListener('webkitpointerlockchange', lockChange, false);

    function lockChange() {
        if (document.pointerLockElement !== canvas &&
            document.mozPointerLockElement !== canvas &&
            document.webkitPointerLockElement !== canvas) {
            camera.active = false;
            canvas.style.cursor = 'default';
        }
    }
}

/**
 * Updates the camera's look-at point
 */
function updateLookDirection() {
    const dir = vec3(
        Math.sin(camera.yaw) * Math.cos(camera.pitch),
        Math.sin(camera.pitch),
        Math.cos(camera.yaw) * Math.cos(camera.pitch));
    camera.at = add(camera.eye, dir);

    camera.at = vec3(
        camera.eye[0] + dir[0],
        camera.eye[1] + dir[1],  // Maintain same vertical offset
        camera.eye[2] + dir[2]
    );
}

/**
 * Updates camera position based on keyboard input
 * @param {Object} keys - Current key states {w,a,s,d}
 * @param {function} updateViewCallback - Called when view changes
 */
function updateCameraPosition(keys, updateViewCallback) {
    if (!camera.active) return;

    // Jumping
    if (keys[' '] && !camera.isJumping) {  // Spacebar to jump
        camera.velocityY = camera.jumpForce;
        camera.isJumping = true;
    }

    // Apply gravity
    camera.velocityY += camera.gravity;
    camera.eye[1] += camera.velocityY;
    
    // Check if landed
    if (camera.eye[1] <= camera.groundHeight) {
        camera.eye[1] = camera.groundHeight;
        camera.velocityY = 0;
        camera.isJumping = false;
    }
    
    // Horizontal movement
    const forward = vec3(
        Math.sin(camera.yaw),
        0,  // Keep movement horizontal
        Math.cos(camera.yaw)
    );
    normalize(forward, forward);

    const right = cross(forward, camera.up);
    normalize(right, right);

    let moveDir = vec3(0, 0, 0);

    if (keys['w']) moveDir = add(moveDir, forward);
    if (keys['s']) moveDir = subtract(moveDir, forward);
    if (keys['a']) moveDir = subtract(moveDir, right);
    if (keys['d']) moveDir = add(moveDir, right);
    
    if (keys['shift']) camera.movementSpeed = 0.02*5;
    else camera.movementSpeed = 0.02;

    if (length(moveDir) > 0) {
        normalize(moveDir, moveDir);
        const moveAmount = mult(camera.movementSpeed, moveDir);
        camera.eye = add(camera.eye, moveAmount);
    }
    
    // Update look-at point to maintain proper height relationship
    updateLookDirection();
    updateViewCallback();
}

/**
 * @returns {mat4} The current view matrix
 */
function getViewMatrix() {
    return lookAt(camera.eye, camera.at, camera.up);
}
