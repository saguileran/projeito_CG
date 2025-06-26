# Robot Survive

Developed by [Sebastian Aguilera Novoa](http://saguileran.co/) for the Introduction to Computer Graphics course (MAC5744), IME, USP, First Semester 2025.

## Overview

**Robot Survive** is a 3D WebGL game where you control a robot exploring a procedurally generated city, avoiding collisions with unpredictable cars. The objective is to survive as long as possible while your health (HP) decreases upon each collision. The game features dynamic lighting (day/night cycle), realistic physics (gravity, jumping), and a fully interactive first-person camera.

### Game Objective 

The main objective of Robot Survive is to explore the city and avoid crashing into moving cars for as long as possible. As you navigate the environment, you must use your reflexes and spatial awareness to dodge cars that move along the streets. Each time you collide with a car, your health (HP) decreases. The game ends when your HP reaches zero.

A visible clock at the top of the screen tracks the passage of time, simulating a full day and night cycle. Your survival time is measured by this clock. The HP bar, also displayed on the screen, shows your current health percentage. Both overlays are styled for clarity and immersion.

### User Interaction

You interact with the game using standard first-person controls: move with the keyboard (W, A, S, D), jump with the spacebar, and look around with the mouse. Click on the canvas to activate the camera and start the game. Try to survive as long as possible without letting your HP run out!

<p align="center">
  <video src="assets/images/videos/example.mp4" controls width="80%">
    Your browser does not support the video tag.
  </video>
  <br>
  <em>Figure: Example gameplay video of Robot Survive.</em>
</p>

## Features

- **First-Person Camera:** Move with WASD keys and look around with the mouse. The camera is always positioned at the robot's head for an immersive experience.
- **Dynamic City:** The city is generated with blocks of buildings and streets. Cars move along the streets with random properties (size, color, speed).
- **Robot Character:** The robot is modeled with cylinders and spheres, with articulated body parts (head, body, arms, legs, antenna).
- **Physics & Gravity:** Jump with the spacebar. Gravity can be adjusted, allowing for floating or realistic jumps.
- **Elastic Collisions:** Collisions with houses prevent entry, while collisions with cars are elastic and reduce HP.
- **Day/Night Cycle:** The sun's position and environmental lighting change smoothly over a 24-hour clock.
- **Textured Environment:** Buildings, cars, ground, and the robot use a variety of textures for visual richness.
- **UI Overlays:** Health bar (HP), timer, and start game overlay, all styled with CSS.

## Getting Started

### How to Run

For best performance, run a local server in the project root directory. However, you can also open `index.html` in your browser to start the game but this will not import sucessfully the textures.

### Controls

- **Move:** W, A, S, D
- **Jump:** Spacebar
- **Look:** Mouse (click on the canvas to activate pointer lock)
- **Sprint:** Shift (hold)

## Project Structure

- `index.html` — Main HTML file
- `assets/` — Contains textures and CSS
  - `css/styles.css` — All UI and overlay styles
  - `images/` — Textures for buildings, cars, ground, and robot
  - `js/` — Modular JavaScript files:
    - `main.js` / `main_testing.js` — Main game loop and rendering
    - `objects.js` — Object and robot definitions
    - `mouse.js` — Camera and input handling
    - `config.js` — Configuration and constants
    - `shaders.js` — WebGL shaders
    - `...` — Other supporting scripts

## Technical Details

### Scene Objects

All scene components are modeled with primitive solids (spheres, cubes, cylinders):
- **Sun:** Distant light source
- **Ground:** The floor of the scene
- **Cars:** Moving cubes with random properties
- **Buildings:** Grid of block houses, customizable in size and layout
- **Robot:** Articulated model with head, body, arms, legs, and antenna

### Textures

Textures are organized in `assets/images/`:
- `building/` — House textures
- `car/` — Car textures (metal, aluminum, etc.)
- `floor/` — Ground textures (concrete, street)
- `simple/` — Robot, sun, and auxiliary textures

### Lighting

Implements the full Phong illumination model (ambient, diffuse, specular) for realistic lighting effects. The sun's position and intensity vary with the in-game clock.

### Physics

- **Gravity:** Adjustable; affects jumping and falling
- **Elastic Collisions:** With cars (reflects velocity, reduces HP)
- **Collision Detection:** Prevents entering buildings; handles edge cases at corners and borders

## Known Issues

- The robot model itself does not yet detect collisions; only the camera does, so the robot can visually pass through obstacles.
- In some corner cases, the camera may get stuck and require jumping to escape.
- If a car spawns on top of the player at game start, an immediate collision may occur.
- For very slow cars, collisions may not always reduce HP as expected.
- The HP bar and clock may not be in the right position because it setup for particular screen resolution.
- When collision with the cars the camera can look inside the car.


## Future Improvements

- Implement robot collision detection with cars and buildings (not just the camera).
- Animate the sun to orbit the scene, creating more realistic dynamic lighting.
- Infinite city: Regenerate city blocks as the player moves to simulate an endless world.
- Synchronize the robot's rotation and jumping animations with the camera movement.
- Add more physics to the game: random walk, wind, inertia, friction, etc.  
- Improve cars design: create each car a set of cubes to give a more realistic shape.
- Add sound effects and background music (advanced).
- Improve AI for cars and add new types of obstacles (advanced).

## References

Much of the code is adapted and extended from the official [course lectures](https://panda.ime.usp.br/introcg/static/introcg/) for Introduction to Computer Graphics at IME-USP.