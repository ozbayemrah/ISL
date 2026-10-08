// =====================================================
// The Final Game - Emrah Ozbay
// Monochrome runner: a caveman escapes a dino. Jump over bushes with key "1"
// =====================================================

// ===== Our color system (same as style.css) =====
const COLORS = {
    bg: '#EBDECD',      // page background
    dark: '#050505',    // text, ground line
    dino: '#535353',    // caveman, dino and bushes
    mid: '#c9b8a3',     // ground details
    light: '#d9c7b0'    // clouds
};

// ===== Game settings =====
const GROUND_Y = 200;      // y position of the ground line
const GRAVITY = 0.8;       // pulls the dino down every frame
const JUMP_FORCE = -13;    // upward speed when jumping (negative = up)
const PLAYER_W = 44;
const PLAYER_H = 48;
const CHASER_W = 60;       // the dino that chases the caveman
const CHASER_H = 56;

let game;                  // holds everything about one game
let bestMeters = 0;        // best score in this session

// ===== Runs once =====
function setup() {
    let canvas = createCanvas(800, 250);
    canvas.parent('sketch-holder');
    textFont('monospace');
    game = createGame();
}

// ===== A fresh game: all values in one object =====
function createGame() {
    return {
        state: 'ready',          // 'ready', 'playing' or 'over'
        playerX: 160,
        playerY: GROUND_Y,         // the caveman's feet
        velY: 0,                 // vertical speed
        onGround: true,
        chaserX: 30,             // the dino behind the caveman
        chaserY: GROUND_Y,
        chaserVelY: 0,
        chaserOnGround: true,
        speed: 6,                // how fast the world moves left
        distance: 0,             // pixels travelled
        bushes: [],
        nextGap: 400,            // space before the next bush
        groundOffset: 0,
        clouds: [
            { x: 150, y: 50, size: 50 },
            { x: 450, y: 85, size: 40 },
            { x: 700, y: 40, size: 60 }
        ]
    };
}

// ===== Runs every frame =====
function draw() {
    background(COLORS.bg);

    if (game.state === 'playing') {
        updateGame(game);
    }
    if (game.state !== 'ready') {
        updateChaser(game);
    }

    drawClouds(game);
    drawGround(game);
    drawBushes(game);
    drawChaser(game);
    drawCaveman(game);
    drawScore(game);
    drawMessage(game);
}

// ===== All movement and rules =====
function updateGame(g) {
    // distance and speed (the game gets faster slowly)
    g.distance = g.distance + g.speed;
    g.speed = min(6 + g.distance / 3000, 13);

    // dino physics: gravity changes speed, speed changes position
    g.velY = g.velY + GRAVITY;
    g.playerY = g.playerY + g.velY;
    if (g.playerY >= GROUND_Y) {
        g.playerY = GROUND_Y;
        g.velY = 0;
        g.onGround = true;
    }

    // clouds move slower than the ground (looks far away)
    for (let c of g.clouds) {
        c.x = c.x - g.speed * 0.2;
        if (c.x < -c.size) {
            c.x = width + c.size;
            c.y = random(30, 90);
        }
    }

    // ground stripes
    g.groundOffset = (g.groundOffset + g.speed) % 40;

    // move bushes, remove the ones that left the screen
    for (let i = g.bushes.length - 1; i >= 0; i--) {
        g.bushes[i].x = g.bushes[i].x - g.speed;
        if (g.bushes[i].x + g.bushes[i].w < 0) {
            g.bushes.splice(i, 1);
        }
    }

    // spawn a new bush when the last one is far enough away
    let last = g.bushes[g.bushes.length - 1];
    if (!last || last.x < width - g.nextGap) {
        g.bushes.push({
            x: width,
            w: random(20, 40),
            h: random(25, 45)
        });
        g.nextGap = random(250, 500) + g.speed * 20;
    }

    // collision: touching any bush ends the game
    for (let b of g.bushes) {
        if (hitsBush(g, b)) {
            g.state = 'over';
            bestMeters = max(bestMeters, getMeters(g));
        }
    }
}

// ===== Rectangle overlap test (slightly smaller boxes = fair) =====
function hitsBush(g, b) {
    let playerLeft = g.playerX + 12;            // slimmer than the drawing = fair
    let playerRight = g.playerX + PLAYER_W - 12;
    let playerBottom = g.playerY;

    let bushLeft = b.x + 4;
    let bushRight = b.x + b.w - 4;
    let bushTop = GROUND_Y - b.h + 4;

    return playerRight > bushLeft && playerLeft < bushRight && playerBottom > bushTop;
}

function getMeters(g) {
    return floor(g.distance / 20);
}

// ===== The one button: start, jump, restart =====
function pressButton(g) {
    if (g.state === 'ready') {
        g.state = 'playing';
        jump(g);
    } else if (g.state === 'playing') {
        jump(g);
    } else if (g.state === 'over') {
        Object.assign(g, createGame());   // copy fresh values into this game
        g.state = 'playing';
    }
}

// ===== The dino behind the caveman =====
function updateChaser(g) {
    // gravity, same as the caveman
    g.chaserVelY = g.chaserVelY + GRAVITY;
    g.chaserY = g.chaserY + g.chaserVelY;
    if (g.chaserY >= GROUND_Y) {
        g.chaserY = GROUND_Y;
        g.chaserVelY = 0;
        g.chaserOnGround = true;
    }

    if (g.state === 'playing') {
        // creep closer and fall back a little, like it is chasing
        let targetX = 40 + sin(frameCount * 0.03) * 15;
        g.chaserX = lerp(g.chaserX, targetX, 0.05);

        // jump automatically when a bush comes close
        for (let b of g.bushes) {
            let gap = b.x - (g.chaserX + CHASER_W);
            if (gap > 0 && gap < g.speed * 7 && g.chaserOnGround) {
                g.chaserVelY = JUMP_FORCE;
                g.chaserOnGround = false;
            }
        }
    } else if (g.state === 'over') {
        // game over: the dino catches the caveman
        g.chaserX = lerp(g.chaserX, g.playerX - 45, 0.08);
    }
}

function drawChaser(g) {
    let left = g.chaserX;
    let top = g.chaserY - CHASER_H;

    // running legs
    let legBack = 14;
    let legFront = 14;
    if (g.state === 'playing' && g.chaserOnGround) {
        let step = floor(frameCount / 5) % 2;
        legBack = step === 0 ? 14 : 8;
        legFront = step === 0 ? 8 : 14;
    }

    // jaw: snapping while running, wide open when it caught him
    let jawOpen = (sin(frameCount * 0.3) + 1) * 2;
    if (g.state === 'over') {
        jawOpen = 7;
    } else if (g.state === 'ready') {
        jawOpen = 0;
    }

    noStroke();
    fill(COLORS.dino);
    triangle(left, top + 22, left + 18, top + 18, left + 18, top + 32);   // tail
    rect(left + 14, top + 18, 30, 24, 6);                                  // body
    rect(left + 34, top + 2, 26, 18, 4);                                   // head
    rect(left + 36, top + 20 + jawOpen, 22, 6, 2);                         // lower jaw
    rect(left + 40, top + 28, 8, 3);                                       // tiny arm
    rect(left + 20, top + 42, 7, legBack);                                 // back leg
    rect(left + 32, top + 42, 7, legFront);                                // front leg

    // teeth
    fill(COLORS.bg);
    for (let x = left + 44; x < left + 58; x += 5) {
        triangle(x, top + 20, x + 3, top + 20, x + 1.5, top + 23);
    }

    // eye with an angry brow
    rect(left + 48, top + 6, 5, 5);
    stroke(COLORS.dark);
    strokeWeight(2);
    line(left + 46, top + 4, left + 54, top + 7);
}

function jump(g) {
    if (g.onGround) {
        g.velY = JUMP_FORCE;
        g.onGround = false;
    }
}

// ===== Drawing =====
function drawClouds(g) {
    noStroke();
    fill(COLORS.light);
    for (let c of g.clouds) {
        ellipse(c.x, c.y, c.size, c.size * 0.6);
        ellipse(c.x - c.size * 0.4, c.y + 5, c.size * 0.7, c.size * 0.45);
        ellipse(c.x + c.size * 0.4, c.y + 5, c.size * 0.7, c.size * 0.45);
    }
}

function drawGround(g) {
    stroke(COLORS.dark);
    strokeWeight(2);
    line(0, GROUND_Y, width, GROUND_Y);

    stroke(COLORS.mid);
    for (let x = -g.groundOffset; x < width; x += 40) {
        line(x, GROUND_Y + 10, x + 12, GROUND_Y + 10);
        line(x + 22, GROUND_Y + 22, x + 28, GROUND_Y + 22);
    }
}

function drawBushes(g) {
    noStroke();
    fill(COLORS.dino);
    for (let b of g.bushes) {
        // three round blobs + flat bottom
        ellipse(b.x + b.w * 0.5, GROUND_Y - b.h / 2, b.w * 0.7, b.h);
        ellipse(b.x + b.w * 0.25, GROUND_Y - b.h * 0.35, b.w * 0.55, b.h * 0.7);
        ellipse(b.x + b.w * 0.75, GROUND_Y - b.h * 0.35, b.w * 0.55, b.h * 0.7);
        rect(b.x + b.w * 0.1, GROUND_Y - b.h * 0.3, b.w * 0.8, b.h * 0.3);
    }
}

function drawCaveman(g) {
    let cx = g.playerX + 22;          // center line of the body
    let top = g.playerY - PLAYER_H;     // top of the head

    let shoulderY = top + 17;
    let hipY = top + 30;

    // swing angles (radians) for legs and arms
    let legSwing = 0;
    let armSwing = 0;
    if (g.state === 'playing' && g.onGround) {
        legSwing = sin(frameCount * 0.35) * 0.7;   // running: swing back and forth
        armSwing = -legSwing;                      // arms move opposite to legs
    } else if (!g.onGround) {
        legSwing = 0.6;                            // in the air: legs spread
        armSwing = -1.2;                           // arms up
    }

    // hand positions (end of each arm)
    let frontHandX = cx + 2 + sin(armSwing) * 14;
    let frontHandY = shoulderY + cos(armSwing) * 14;
    let backHandX = cx + 2 - sin(armSwing) * 14;
    let backHandY = shoulderY + cos(armSwing) * 14;

    strokeCap(ROUND);
    stroke(COLORS.dino);
    strokeWeight(5);

    // 1. back arm and back leg (drawn first = behind the body)
    line(cx + 2, shoulderY, backHandX, backHandY);
    line(cx, hipY, cx - sin(legSwing) * 18, hipY + cos(legSwing) * 18);

    // 2. body
    line(cx + 2, shoulderY - 3, cx, hipY);

    // 3. fur tunic with a zigzag bottom edge
    noStroke();
    fill(COLORS.dark);
    beginShape();
    vertex(cx - 4, shoulderY - 2);
    vertex(cx + 7, shoulderY);
    vertex(cx + 8, hipY + 4);
    vertex(cx + 5, hipY + 8);
    vertex(cx + 2, hipY + 4);
    vertex(cx - 1, hipY + 8);
    vertex(cx - 4, hipY + 4);
    vertex(cx - 7, hipY + 7);
    vertex(cx - 6, shoulderY + 2);
    endShape(CLOSE);

    // fur spots
    fill(COLORS.mid);
    circle(cx + 3, shoulderY + 5, 3);
    circle(cx - 2, hipY - 2, 3);

    // 4. front leg
    stroke(COLORS.dino);
    strokeWeight(5);
    line(cx, hipY, cx + sin(legSwing) * 18, hipY + cos(legSwing) * 18);

    // 5. head with wild hair and beard
    noStroke();
    fill(COLORS.dark);
    circle(cx, top + 2, 11);           // hair blobs
    circle(cx - 4, top + 5, 10);
    circle(cx - 5, top + 10, 8);
    circle(cx + 5, top + 1, 7);

    fill(COLORS.dino);
    circle(cx + 3, top + 7, 14);       // face

    fill(COLORS.dark);
    ellipse(cx + 6, top + 12, 9, 8);   // beard

    // eye: an "x" when the game is over
    if (g.state === 'over') {
        stroke(COLORS.bg);
        strokeWeight(1.5);
        line(cx + 4, top + 3, cx + 8, top + 7);
        line(cx + 8, top + 3, cx + 4, top + 7);
    } else {
        fill(COLORS.bg);
        circle(cx + 6, top + 5, 3);
    }

    // 6. front arm holding a club
    stroke(COLORS.dino);
    strokeWeight(5);
    line(cx + 2, shoulderY, frontHandX, frontHandY);

    let clubAngle = armSwing + PI * 0.8;   // club points up and forward
    let midX = frontHandX + sin(clubAngle) * 7;
    let midY = frontHandY + cos(clubAngle) * 7;
    let endX = frontHandX + sin(clubAngle) * 17;
    let endY = frontHandY + cos(clubAngle) * 17;

    stroke(COLORS.dark);
    strokeWeight(4);
    line(frontHandX, frontHandY, midX, midY);   // thin handle
    strokeWeight(8);
    line(midX, midY, endX, endY);               // thick end
}

function drawScore(g) {
    noStroke();
    fill(COLORS.dark);
    textSize(16);
    textAlign(RIGHT);
    text('BEST ' + nf(bestMeters, 4) + '   ' + nf(getMeters(g), 4) + ' m', width - 20, 30);
}

function drawMessage(g) {
    noStroke();
    fill(COLORS.dark);
    textAlign(CENTER);

    if (g.state === 'ready') {
        textSize(18);
        text('Press 1 to start', width / 2, 110);
    } else if (g.state === 'over') {
        textSize(22);
        text('EMRAH GOT EATEN', width / 2, 100);
        textSize(14);
        text(getMeters(g) + ' m  -  press 1 to restart', width / 2, 125);
    }
}

// ===== Controls =====
function keyPressed() {
    if (key === '1') {
        pressButton(game);
        return false;
    }
}

// clicking the canvas also works (handy for testing)
function mousePressed() {
    if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
        pressButton(game);
    }
}