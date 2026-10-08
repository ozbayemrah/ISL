// =====================================================
// Landscape p5.js - Emrah Ozbay
// 2x2 grid of scenes: following shape, particles,
// hover timer, moving clouds and ground
// =====================================================

// ===== Variables =====
let angle = 0;          // shared rotation for all shapes
let shapeColor;         // set in setup()
let spinSpeed = 2;      // degrees per frame
let paused = false;     // spacebar toggles this

let cells = [];         // the 4 grid cells
let clouds = [];        // shared clouds (drawn in every cell)
let groundOffset = 0;   // makes the ground stripes move

const COLS = 2;
const ROWS = 2;
const GROUND_HEIGHT = 40;

// ===== Runs once at the start =====
function setup() {
    let canvas = createCanvas(800, 500);
    canvas.parent('sketch-holder');
    angleMode(DEGREES);
    shapeColor = color('#535353');

    // create the grid cells
    let cellW = width / COLS;
    let cellH = height / ROWS;

    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            cells.push({
                x: col * cellW,         // top-left corner on the canvas
                y: row * cellH,
                w: cellW,
                h: cellH,
                posX: cellW / 2,        // shape position inside the cell
                posY: cellH / 2,
                particles: [],          // each cell has its own trail
                isInside: false,        // is the mouse in this cell?
                enterTime: 0            // when did the mouse enter?
            });
        }
    }

    // create the clouds
    for (let i = 0; i < 3; i++) {
        clouds.push({
            x: random(cellW),
            y: random(20, 70),
            size: random(35, 55),
            speed: random(0.2, 0.6)
        });
    }
}

// ===== Runs every frame =====
function draw() {
    background('#EBDECD');

    let shapeNumber = floor(millis() / 1000) % 4;

    moveClouds();
    groundOffset = (groundOffset + 1) % 40;

    for (let cell of cells) {
        drawCell(cell, shapeNumber);
    }

    if (!paused) {
        angle = angle + spinSpeed;
    }

    // small mouse circle
    fill('#535353');
    noStroke();
    circle(mouseX, mouseY, 10);

    // info text
    fill('#050505');
    textSize(14);
    textAlign(LEFT);
    text('Speed: ' + spinSpeed, 10, 20);
    if (paused) {
        text('PAUSED', 10, 40);
    }
}

// ===== One grid cell: landscape, trail, shape, timer =====
function drawCell(cell, shapeNumber) {
    // mouse position inside this cell
    let localX = mouseX - cell.x;
    let localY = mouseY - cell.y;
    let inside = localX >= 0 && localX < cell.w && localY >= 0 && localY < cell.h;

    // mouse just entered: start the timer
    if (inside && !cell.isInside) {
        cell.enterTime = millis();
    }
    cell.isInside = inside;

    // follow the mouse when inside, glide back to the center when outside
    let targetX = inside ? localX : cell.w / 2;
    let targetY = inside ? localY : cell.h / 2;
    cell.posX = lerp(cell.posX, targetX, 0.1);
    cell.posY = lerp(cell.posY, targetY, 0.1);

    push();
    translate(cell.x, cell.y);   // from here on, 0,0 = this cell's corner

    // clip: nothing is drawn outside this cell
    drawingContext.beginPath();
    drawingContext.rect(0, 0, cell.w, cell.h);
    drawingContext.clip();

    drawLandscape(cell);
    updateParticles(cell);

    // rotating shape
    push();
    translate(cell.posX, cell.posY);
    rotate(angle);
    if (mouseIsPressed && inside) {
        scale(1.5);
    }
    drawShape(shapeNumber);
    pop();

    drawTimer(cell);

    // cell border: dark when active
    noFill();
    strokeWeight(2);
    stroke(inside ? '#050505' : '#c9b8a3');
    rect(0, 0, cell.w, cell.h);

    pop();
}

// ===== Sky, clouds and ground =====
function drawLandscape(cell) {
    let groundY = cell.h - GROUND_HEIGHT;

    // sky
    noStroke();
    fill('#BFE3F2');
    rect(0, 0, cell.w, cell.h);

    // clouds: three overlapping ellipses each
    fill(255);
    for (let c of clouds) {
        ellipse(c.x, c.y, c.size, c.size * 0.6);
        ellipse(c.x - c.size * 0.4, c.y + 5, c.size * 0.7, c.size * 0.45);
        ellipse(c.x + c.size * 0.4, c.y + 5, c.size * 0.7, c.size * 0.45);
    }

    // ground
    fill('#8BC34A');
    rect(0, groundY, cell.w, GROUND_HEIGHT);

    // ground top line
    stroke('#558B2F');
    strokeWeight(2);
    line(0, groundY, cell.w, groundY);

    // moving stripes (start further left each frame = moving left)
    for (let x = -groundOffset; x < cell.w; x += 40) {
        line(x, groundY + 12, x + 15, groundY + 12);
        line(x + 20, groundY + 26, x + 30, groundY + 26);
    }
}

// ===== Move clouds, wrap around at the edge =====
function moveClouds() {
    let cellW = width / COLS;
    for (let c of clouds) {
        c.x = c.x + c.speed;
        if (c.x > cellW + c.size) {
            c.x = -c.size;
            c.y = random(20, 70);
        }
    }
}

// ===== Hover timer (top-right of each cell) =====
function drawTimer(cell) {
    let seconds = 0;
    if (cell.isInside) {
        seconds = (millis() - cell.enterTime) / 1000;
    }

    noStroke();
    fill('#050505');
    textSize(16);
    textAlign(RIGHT);
    text(nf(seconds, 1, 1) + ' s', cell.w - 10, 22);
}

// ===== Draws one shape, centered on 0,0 =====
function drawShape(n) {
    rectMode(CENTER);   // only affects this shape (we are inside push/pop)
    fill(shapeColor);
    noStroke();

    if (n === 0) {
        rect(0, 0, 100, 60);
    } else if (n === 1) {
        ellipse(0, 0, 80, 50);
    } else if (n === 2) {
        stroke(shapeColor);
        strokeWeight(4);
        line(-60, 0, 60, 0);
    } else {
        triangle(-50, 35, 0, -35, 50, 35);
    }
}

// ===== Particle trail for one cell =====
function updateParticles(cell) {
    cell.particles.push({
        x: cell.posX,
        y: cell.posY,
        speedX: random(-1, 1),
        speedY: random(-1, 1),
        size: random(5, 12),
        life: 255
    });

    for (let i = cell.particles.length - 1; i >= 0; i--) {
        let p = cell.particles[i];

        p.x = p.x + p.speedX;
        p.y = p.y + p.speedY;
        p.life = p.life - 5;

        noStroke();
        fill(red(shapeColor), green(shapeColor), blue(shapeColor), p.life);
        circle(p.x, p.y, p.size);

        if (p.life <= 0) {
            cell.particles.splice(i, 1);
        }
    }
}

// ===== Mouse click: random color =====
function mousePressed() {
    shapeColor = color(random(255), random(255), random(255));
}

// ===== Keys: space = pause, arrows = speed =====
function keyPressed() {
    if (key === ' ') {
        paused = !paused;
        return false;
    } else if (keyCode === UP_ARROW) {
        spinSpeed = spinSpeed + 1;
        return false;
    } else if (keyCode === DOWN_ARROW) {
        spinSpeed = spinSpeed - 1;
        return false;
    }
}
/* // =====================================================
// Landscape p5.js - Emrah Ozbay
// =====================================================

// ===== Variables =====
let angle = 0;          // current rotation
let posX = 300;         // shape's current position
let posY = 200;
let shapeColor;         // set in setup()
let spinSpeed = 2;      // degrees per frame
let paused = false;     // spacebar toggles this
let particles = [];     // list of trail particles

// ===== Runs once at the start =====
function setup() {
    let canvas = createCanvas(600, 400);
    canvas.parent('sketch-holder');
    angleMode(DEGREES);
    rectMode(CENTER);
    shapeColor = color('#535353');
}

// ===== Runs every frame =====
function draw() {
    background('#EBDECD');

    // which shape: changes every second (0, 1, 2, 3, 0...)
    let shapeNumber = floor(millis() / 1000) % 4;

    // smooth follow: move 10% closer to the mouse each frame
    posX = lerp(posX, mouseX, 0.1);
    posY = lerp(posY, mouseY, 0.1);

    // particles first, so they appear behind the shape
    updateParticles();

    // rotating shape
    push();
    translate(posX, posY);
    rotate(angle);
    if (mouseIsPressed) {
        scale(1.5);
    }
    drawShape(shapeNumber);
    pop();

    if (!paused) {
        angle = angle + spinSpeed;
    }

    // small mouse circle
    fill('#535353');
    noStroke();
    circle(mouseX, mouseY, 10);

    // info text
    fill('#050505');
    textSize(14);
    text('Speed: ' + spinSpeed, 10, 20);
    if (paused) {
        text('PAUSED', 10, 40);
    }
}

// ===== Draws one shape, centered on 0,0 =====
function drawShape(n) {
    fill(shapeColor);
    noStroke();

    if (n === 0) {
        rect(0, 0, 100, 60);
    } else if (n === 1) {
        ellipse(0, 0, 80, 50);
    } else if (n === 2) {
        stroke(shapeColor);
        strokeWeight(4);
        line(-60, 0, 60, 0);
    } else {
        triangle(-50, 35, 0, -35, 50, 35);
    }
}

// ===== Particle trail =====
function updateParticles() {
    // create a new particle at the shape's position
    particles.push({
        x: posX,
        y: posY,
        speedX: random(-1, 1),
        speedY: random(-1, 1),
        size: random(5, 12),
        life: 255
    });

    // move, draw and age every particle (backwards loop)
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];

        p.x = p.x + p.speedX;
        p.y = p.y + p.speedY;
        p.life = p.life - 5;

        noStroke();
        fill(red(shapeColor), green(shapeColor), blue(shapeColor), p.life);
        circle(p.x, p.y, p.size);

        // remove dead particles
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

// ===== Mouse click: random color =====
function mousePressed() {
    shapeColor = color(random(255), random(255), random(255));
}

// ===== Keys: space = pause, arrows = speed =====
function keyPressed() {
    if (key === ' ') {
        paused = !paused;
        return false;
    } else if (keyCode === UP_ARROW) {
        spinSpeed = spinSpeed + 1;
        return false;
    } else if (keyCode === DOWN_ARROW) {
        spinSpeed = spinSpeed - 1;
        return false;
    }
} */
/* // ===== Variables =====
let angle = 0;
let posX = 300;
let posY = 200;
let shapeColor;        // empty for now, set in setup()
let spinSpeed = 2;
let paused = false;    // true or false

// ===== Runs once =====
function setup() {
    let canvas = createCanvas(600, 400);
    canvas.parent('sketch-holder');
    angleMode(DEGREES);
    rectMode(CENTER);
    shapeColor = color('#535353');
}

// ===== Runs every frame =====
function draw() {
    background('#EBDECD');

    let shapeNumber = floor(millis() / 1000) % 4;

    posX = lerp(posX, mouseX, 0.1);
    posY = lerp(posY, mouseY, 0.1);

    push();
    translate(posX, posY);
    rotate(angle);
    if (mouseIsPressed) {
        scale(1.5);    // 150% size while the mouse is held down
    }
    drawShape(shapeNumber);
    pop();

    if (!paused) {
        angle = angle + spinSpeed;
    }

    // mouse circle
    fill('#535353');
    noStroke();
    circle(mouseX, mouseY, 10);

    // info text
    fill('#050505');
    textSize(14);
    text('Speed: ' + spinSpeed, 10, 20);
    if (paused) {
        text('PAUSED', 10, 40);
    }
}

// ===== Draws one shape =====
function drawShape(n) {
    fill(shapeColor);
    noStroke();

    if (n === 0) {
        rect(0, 0, 100, 60);
    } else if (n === 1) {
        ellipse(0, 0, 80, 50);
    } else if (n === 2) {
        stroke(shapeColor);
        strokeWeight(4);
        line(-60, 0, 60, 0);
    } else {
        triangle(-50, 35, 0, -35, 50, 35);
    }
}

// ===== Runs once on every mouse click =====
function mousePressed() {
    shapeColor = color(random(255), random(255), random(255));
}

// ===== Runs once on every key press =====
function keyPressed() {
    if (key === ' ') {
        paused = !paused;
        return false;   // stop the page from scrolling on spacebar
    } else if (keyCode === UP_ARROW) {
        spinSpeed = spinSpeed + 1;
        return false;
    } else if (keyCode === DOWN_ARROW) {
        spinSpeed = spinSpeed - 1;
        return false;
    }
} */
/* function setup() {
    let canvas = createCanvas(600, 400);
    canvas.parent('sketch-holder');
}

function draw() {
    background('#EBDECD');

    fill('#535353');
    noStroke();
    circle(mouseX, mouseY, 40);
} */
/* let angle = 0;   // current rotation, grows every frame

function setup() {
    let canvas = createCanvas(600, 400);
    canvas.parent('sketch-holder');
    angleMode(DEGREES);   // use degrees (0–360) instead of radians
    rectMode(CENTER);     // rect x,y = its center, not its top-left corner
}

function draw() {
    background('#EBDECD');

    // Which shape? Changes every 1000 ms (1 second): 0, 1, 2, 3, 0, 1...
    let shapeNumber = floor(millis() / 1000) % 4;

    push();
    translate(width / 2, height / 2);   // move the origin to the canvas center
    rotate(angle);                      // rotate everything drawn after this
    drawShape(shapeNumber);
    pop();

    angle = angle + 2;   // spin speed: 2 degrees per frame

    // mouse follower stays
    fill('#535353');
    noStroke();
    circle(mouseX, mouseY, 20);
}

// Our own function: draws one shape, chosen by number
function drawShape(n) {
    fill('#535353');
    noStroke();

    if (n === 0) {
        rect(0, 0, 100, 60);
    } else if (n === 1) {
        ellipse(0, 0, 80, 50);
    } else if (n === 2) {
        stroke('#535353');
        strokeWeight(4);
        line(-60, 0, 60, 0);
    } else {
        triangle(-50, 35, 0, -35, 50, 35);
    }
} */
/* // ===== Variables (top of the file, outside any function) =====
let angle = 0;    // current rotation
let posX = 300;   // shape's current position
let posY = 200;

// ===== Runs once at the start =====
function setup() {
    let canvas = createCanvas(600, 400);
    canvas.parent('sketch-holder');
    angleMode(DEGREES);
    rectMode(CENTER);
}

// ===== Runs every frame =====
function draw() {
    background('#EBDECD');

    // which shape: changes every second
    let shapeNumber = floor(millis() / 1000) % 4;

    // move 10% closer to the mouse each frame
    posX = lerp(posX, mouseX, 0.1);
    posY = lerp(posY, mouseY, 0.1);

    // draw the rotating shape at its position
    push();
    translate(posX, posY);
    rotate(angle);
    drawShape(shapeNumber);
    pop();

    angle = angle + 2;

    // small mouse circle
    fill('#535353');
    noStroke();
    circle(mouseX, mouseY, 10);
}

// ===== Our own function: draws one shape =====
function drawShape(n) {
    fill('#535353');
    noStroke();

    if (n === 0) {
        rect(0, 0, 100, 60);
    } else if (n === 1) {
        ellipse(0, 0, 80, 50);
    } else if (n === 2) {
        stroke('#535353');
        strokeWeight(4);
        line(-60, 0, 60, 0);
    } else {
        triangle(-50, 35, 0, -35, 50, 35);
    }
} */