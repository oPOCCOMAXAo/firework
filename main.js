"use strict";
window.addEventListener("DOMContentLoaded", main, true);
window.addEventListener("keypress", onkeypress, true);

var PI2 = Math.PI * 2;
var WIDTH = window.innerWidth;
var HEIGHT = window.innerHeight;
var HALF_FADING_TIME = 1200;
var STEP_TIME = 15;
var dt = STEP_TIME * 0.001;
var STEP_FADING_VALUE = 1 - Math.log(2) / HALF_FADING_TIME * STEP_TIME;//Math.pow(2, -STEP_TIME / HALF_FADING_TIME);
var FADING_RECT_COLOR = "rgba(0,0,0," + Math.sqrt(1 - STEP_FADING_VALUE) + ")";
console.log(STEP_FADING_VALUE, FADING_RECT_COLOR);
var RATIO = WIDTH / HEIGHT;
var IMG_WIDTH = 1000;
var IMG_HEIGHT = IMG_WIDTH * RATIO;
var MIN_ALPHA = 0.3;
var G = new V2(0, 50);
var INIT_SPEED = 220;

var timer;
var fades = 0;
var reqFrame = null;
/**
 * @type {Particle[]}
 */
var particles = [];

/** @type HTMLCanvasElement */
var $canvas;
/** @type CanvasRenderingContext2D */
var $context;

function drawImage() {
    if (fades > 0) {
        fades--;
        // fading
        $context.beginPath();
        $context.moveTo(0, 0);
        $context.lineTo(WIDTH, 0);
        $context.lineTo(WIDTH, HEIGHT);
        $context.lineTo(0, HEIGHT);
        $context.closePath();
        $context.fillStyle = FADING_RECT_COLOR;
        $context.fill();
    }
    // pts
    particles.forEach(function (part) {
        $context.beginPath();
        $context.arc(part.x, part.y, part.m, 0, PI2, true);
        $context.closePath();
        $context.fillStyle = arr2rgba(part.color);
        $context.fill();
        //$context.putImageData(new ImageData(part.color, 1, 1), part.x, part.y);
    });
    reqFrame = window.requestAnimationFrame(drawImage);
}

function onkeypress(e) {
    switch (e.keyCode) {
        case 32:
            launch();
            break;
    }
    return false;
}

function main() {
    $canvas = document.createElement("canvas");
    $canvas.style.position = "absolute";
    $canvas.style.top = 0;
    $canvas.style.left = 0;
    document.body.appendChild($canvas);
    $canvas.width = IMG_WIDTH;
    $canvas.height = IMG_HEIGHT;
    $context = $canvas.getContext("2d");
    //$context.scale(WIDTH / IMG_WIDTH, HEIGHT / IMG_HEIGHT);
    setTimeout(function () {
        $canvas.width = WIDTH;
        $canvas.height = HEIGHT;
    }, 0);
    //$context.lineWidth = 1;
    timer = setInterval(step, STEP_TIME);
    reqFrame = window.requestAnimationFrame(drawImage);
}
/**
 * @param x
 * @param y
 * @constructor
 */
function V2(x, y) {
    this.x = x;
    this.y = y;
}
/**
 * @param v2 {V2}
 * @return {V2}
 * */
V2.prototype.Sadd = function (v2) {
    this.x += v2.x;
    this.y += v2.y;
    return this;
};
/**
 * @param v2 {V2}
 * @return {V2}
 * */
V2.prototype.Ssub = function (v2) {
    this.x -= v2.x;
    this.y -= v2.y;
    return this;
};
/**
 * @param c {Number}
 * @return {V2}
 * */
V2.prototype.mulC = function (c) {
    return new V2(this.x * c, this.y * c);
};
/**
 * @return {Number}
 * */
V2.prototype.abs = function () {
    return Math.hypot(this.x, this.y);
};
/**
 * @param ro
 * @param phi
 * @return {V2}
 */
V2.fromPolar = function (ro, phi) {
    return new V2(ro * Math.cos(phi), ro * Math.sin(phi));
};
/** @return {V2} */
V2.null = function () {
    return new V2(0, 0);
};

/**
 * @param x
 * @param y
 * @param m
 * @param color
 * @constructor
 */
function Particle(x, y, m, color) {
    this.x = x;
    this.y = y;
    this.m = m;
    this.color = color;
    this.v = V2.null();
}
Particle.prototype = Object.create(V2.prototype);

function RNDColor() {
    var res = [0, 0, 0, 0];
    var bits = 50;
    var rnd = Math.round(Math.random() * Math.pow(2, bits));
    var part;
    while (rnd > 0) {
        part = rnd % 3;
        rnd /= 3;
        res[part]++;
    }
    res[3] = 1.0;
    var max = Math.max.apply(null, res);
    for (var i = 0; i < 3; i++)
        res[i] = Math.round(res[i] * 255 / max);
    return res;
}

function arr2rgba(arr) {
    return "rgba(" + arr[0] + "," + arr[1] + "," + arr[2] + "," + arr[3].toFixed(2) + ")";
}

function launch() {
    var corner = Math.random() > 0.5 ? 1 : 0;
    var t = new Particle(corner * WIDTH, HEIGHT, Math.pow(Math.random(), 30) * 25 + 3, RNDColor());
    t.v = V2.fromPolar(INIT_SPEED, -Math.PI * (0.50 + 0.25 * Math.random() * (corner * 2 - 1)));
    particles.push(t);
}
/**
 * @param particle {Particle}
 */
function burst(particle) {
    debugger;
    if (particle.m <= 2) return;
    var n = particle.m * 5;
    if (n < 5) n = 5;
    if (n > 12) n = 12;
    var dm = particle.m / n * 4;
    var v = particle.v.abs();
    var dphi = PI2 / n;
    var phi0 = PI2 * Math.random();
    particle.color[3] = 1;
    while (n-- > 0) {
        var t = new Particle(particle.x, particle.y, dm, Array.from(particle.color));
        t.v = V2.fromPolar(v, phi0 + dphi * n).Sadd(particle.v);
        particles.push(t);
    }
}

function step() {
    fades++;
    particles.forEach(function (particle, index) {
        particle.Sadd(particle.v.mulC(dt));
        particle.v.Sadd(G.mulC(dt));
        particle.color[3] *= STEP_FADING_VALUE;
        if (particle.color[3] < MIN_ALPHA) {
            particles.splice(index, 1);
            burst(particle);
        }
    });
}