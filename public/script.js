import Matter from './lib/matter.js';
import assets from './assets.js';
import settings from './settings.js';
import Ship from './ship.js';
import Stars from './stars.js';
import asteroids from './asteroids.js';
import Utils from './utils.js';

// https://blog.bullgare.com/2019/03/simple-way-to-detect-browsers-fps-via-js/
let fps;
let times = [];
function fpsLoop() {
  window.requestAnimationFrame(() => {
    const now = performance.now();
    while (times.length > 0 && times[0] <= now - 1000) {
      times.shift();
    }
    times.push(now);
    fps = times.length;
    fpsLoop();
  });
}
fpsLoop();

// module aliases
const Engine = Matter.Engine,
  Render = Matter.Render,
  Runner = Matter.Runner,
  Bodies = Matter.Bodies,
  Body = Matter.Body,
  Composite = Matter.Composite,
  Composites = Matter.Composites,
  Vector = Matter.Vector,
  Events = Matter.Events,
  Mouse = Matter.Mouse,
  MouseConstraint = Matter.MouseConstraint,
  Bounds = Matter.Bounds;

const containerEl = document.querySelector('#matter');

// create an engine
const engine = Engine.create();
engine.timing.isFixed = false;

// Calculate and set physics rate
setInterval(() => {
  if(fps > 75) // Why 75? Seems to work best
    engine.timing.timeScale = Math.round(75 / fps * 100) / 100;
  else 
    engine.timing.timeScale = 1;
}, 1000);

const render = Render.create({
  element: containerEl,
  engine: engine,
  options: settings.CONTAINER_OPTIONS
});

const asteroidBodies = [];

for(let i = 0; i < 20; i++) {
  const points = Utils.scaleVerts(asteroids[Math.floor(Math.random() * asteroids.length)], 0.1 + Math.random() * 0.1)
  const body = Bodies.fromVertices(
    -1000 + Math.random() * 2000,
    -1000 + Math.random() * 2000,
    points, 
    { frictionAir: settings.FICTION_AIR, angle: Math.random() * Math.PI }//, render: { sprite: { texture: assets.path + 'lunar.webp', xScale: 0.1, yScale: 0.1 }}} 
  );
  body.points = points;
  // console.log(body)
  asteroidBodies.push(body);
}


// const lunarTexture = new Image();
// lunarTexture.crossOrigin = 'anonymous';
// lunarTexture.onload = (e) => {
//   asteroidBodies.forEach((body, i) => {
//     const points = Utils.shiftVerts(body.points, 50);
//     body.render.sprite.texture = Utils.getClippedImg(points, lunarTexture, 10, 10);
//     body.render.sprite.xOffset = 0.5;
//     body.render.sprite.yOffset = 0.5;
//   });
// };
// lunarTexture.src = assets.path + 'lunar.webp';


engine.world.gravity.y = 0;

const ship = new Ship(engine.world, 400, 300, 50, 50);

// add all of the bodies to the world
Composite.add(engine.world, asteroidBodies);
Composite.add(engine.world, ship);

// run the renderer
Render.run(render);

// create runner
const runner = Runner.create();
runner.isFixed = true;

// run the engine
Runner.run(runner, engine);

const starsCanvas = document.querySelector('#stars')
const stars = new Stars(300, starsCanvas.getContext('2d'));

///////////////////////// View mgt ////////////////////////////


function resize() {
  let w, h;
  if (window.innerWidth >= window.innerHeight * settings.SCREEN_RATIO) {
    w = window.innerHeight * settings.SCREEN_RATIO;
    h = window.innerHeight;
  } 
  else {
    w = window.innerWidth;
    h = window.innerWidth / settings.SCREEN_RATIO;
  }
  render.canvas.style.width = w + 'px';
  render.canvas.style.height = h + 'px';
  
  starsCanvas.width = w;
  starsCanvas.height = h;
  
  stars.init();
}

document.addEventListener('visibilitychange', event => {
  if (document.visibilityState === 'visible') {
  } else {
    // @TODO Add pause
  }
})

window.onresize = resize;
resize();

//////////////////// Input /////////////////////////////////////

const pressedKeys = [];
window.onkeyup = (e) => {
  pressedKeys[e.keyCode] = false;
};

window.onkeydown = (e) => {
  e.preventDefault();
  pressedKeys[e.keyCode] = true;
};

const thrustButton = document.querySelector('#thrust');
const shootButton = document.querySelector('#shoot');
const leftButton = document.querySelector('#left');
const rightButton = document.querySelector('#right');

Events.on(runner, 'beforeTick', (event) => {
  if(pressedKeys[87] || pressedKeys[38] || thrustButton.on) { ship.thrust(); } else { ship.isThrust = false; };
  if(pressedKeys[65] || pressedKeys[37] || leftButton.on) { ship.left(); } else { ship.isLeft = false; };
  if(pressedKeys[68] || pressedKeys[39] || rightButton.on) { ship.right(); } else { ship.isRight = false; };
  if(pressedKeys[90] || pressedKeys[75] || shootButton.on) { ship.shoot(engine.world); };
  
  if(!ship.isThrust && !ship.isLeft && !ship.isRight)
    ship.stopRocket();
});

function setupButton(el) {
  el.addEventListener("touchstart", (e) => { e.preventDefault(); el.on = true; });
  el.addEventListener("touchmove",  (e) => { e.preventDefault(); el.on = true; });
  el.addEventListener("touchend",  (e) => { e.preventDefault(); el.on = false; });
  el.addEventListener("touchcancel",  (e) => { e.preventDefault(); el.on = false; });
}

document.body.addEventListener("touchstart", () => { 
  if(!document.body.touched) {
    document.querySelectorAll('.control').forEach(el => {
      setupButton(el);
      el.style.display = 'block';
    });
    document.body.touched = true;
  }    
});


/////////////////////////////////


Events.on(render, 'beforeRender', () => {
  Bounds.shift(render.bounds, { x: ship.position.x - 400, y: ship.position.y - 300 });
  stars.update(ship.velocity.x, ship.velocity.y);
});


const burnImg = new Image();
burnImg.src = 'arrow.svg';
const ctx = render.canvas.getContext('2d');  

Events.on(render, 'afterRender', () => {
  if(ship.isThrust) {
    ctx.save();
    ctx.translate(400, 300);
    ctx.rotate(ship.angle + Math.PI -0.05 + Math.random() * 0.1);
    ctx.drawImage(burnImg, -10, -32, 20, 20);
    ctx.restore();
  }
  if(ship.isRight) {
    ctx.save();
    ctx.translate(400, 300);
    ctx.rotate(ship.angle - Math.PI / 2 -0.025 + Math.random() * 0.05);
    ctx.drawImage(burnImg, 15, -15, 10, 10);
    ctx.restore();
  }  
  if(ship.isLeft) {
    ctx.save();
    ctx.translate(400, 300);
    ctx.rotate(ship.angle + Math.PI / 2 -0.025 + Math.random() * 0.05);
    ctx.drawImage(burnImg, -25, -15, 10, 10);
    ctx.restore();
  } 
});