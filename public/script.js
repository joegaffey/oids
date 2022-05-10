import Matter from './lib/matter.js';
import assets from './assets.js';
import settings from './settings.js';
import Ship from './ship.js';
import Stars from './stars.js';
import asteroids from './asteroids.js';
import Utils from './utils.js';
import audio from './audio.js';


const starsCanvas = document.querySelector('#stars');
const stars = new Stars(300, starsCanvas.getContext('2d'));

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
  // Mouse = Matter.Mouse,
  // MouseConstraint = Matter.MouseConstraint,
  Query = Matter.Query,
  Bounds = Matter.Bounds;

const containerEl = document.querySelector('#matter');

// create an engine
const engine = Engine.create();
engine.timing.isFixed = false;
engine.world.gravity.y = 0;

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

///////////////////////// View mgt ////////////////////////////

let width = 0, height = 0;

function resize() {
  
  width = Math.round(window.innerWidth);
  height = Math.round(window.innerHeight); 
      
  render.canvas.width = width;
  render.canvas.height = height;
  
  render.canvas.style.width = width + 'px';
  render.canvas.style.height = height + 'px';
  
  render.options.width = width; 
  render.options.height = height;
  
  render.bounds.max.x = render.bounds.min.x + width;
  render.bounds.max.y = render.bounds.min.y + height;
  
  starsCanvas.width = width;
  starsCanvas.height = height;
  
  starsCanvas.style.width = width + 'px';
  starsCanvas.style.height = height + 'px';
  
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

////////////////////////////////  Bodies setup

const asteroidBodies = [];

for(let i = 0; i < 20; i++) {
  const body = makeAsteroid(-1000 + Math.random() * 2000,
                            -1000 + Math.random() * 2000,
                            0.1 + Math.random() * 0.1);
  asteroidBodies.push(body);
}

function makeAsteroid(x, y, size) {
  const points = Utils.scaleVerts(asteroids[Math.floor(Math.random() * asteroids.length)], size)
  const body = Bodies.fromVertices(
    x,
    y,
    points, 
    { frictionAir: settings.FICTION_AIR, angle: Math.random() * Math.PI }//, render: { sprite: { texture: assets.path + 'lunar.webp', xScale: 0.1, yScale: 0.1 }}} 
  );
  body.label = "oid";
  body.points = points;
  body.hits = 0;
  body.size = size;
  return body;
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


const ship = new Ship(engine.world, width, height / 2, 50, 50, 1.8);

// add all of the bodies to the world
Composite.add(engine.world, asteroidBodies);
Composite.add(engine.world, ship);


////////////////////////  Render/Runner init


// run the renderer
Render.run(render);

// create runner
const runner = Runner.create();
runner.isFixed = true;

// run the engine
Runner.run(runner, engine);


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
  // if(pressedKeys[88]) 
  //   ship.laserOn = true; 
  // else 
  //   ship.laserOn = false;
  
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
  Bounds.shift(render.bounds, { x: ship.position.x - width / 2, y: ship.position.y - height / 2 });
  stars.update(ship.velocity.x * 0.75, ship.velocity.y * 0.75);
});


const burnImg = new Image();
burnImg.src = 'arrow.svg';
const ctx = render.canvas.getContext('2d');  

Events.on(render, 'afterRender', () => {
  const w = Math.round(width / 2);
  const h = Math.round(height / 2);
   
  if(ship.isThrust) {
    ctx.save();
    ctx.translate(w, h);
    ctx.rotate(ship.angle + Math.PI -0.05 + Math.random() * 0.1);
    ctx.drawImage(burnImg, -10, -32, 20, 20);
    ctx.restore();
  }
  if(ship.isRight) {
    ctx.save();
    ctx.translate(w, h);
    ctx.rotate(ship.angle - Math.PI / 2 -0.025 + Math.random() * 0.05);
    ctx.drawImage(burnImg, 15, -15, 10, 10);
    ctx.restore();
  }  
  if(ship.isLeft) {
    ctx.save();
    ctx.translate(w, h);
    ctx.rotate(ship.angle + Math.PI / 2 -0.025 + Math.random() * 0.05);
    ctx.drawImage(burnImg, -25, -15, 10, 10);
    ctx.restore();
  } 
  
  updateExplosions();
  
//   ctx.beginPath();
//   ctx.lineWidth = 15;
//   ctx.strokeStyle = 'blue';

//   ctx.moveTo(0, 0);
//   ctx.lineTo(100, 100);
//   ctx.stroke();

});

////////////////////////////////////////////////////////////////

const explosions = [];
const expImg = new Image();
expImg.src = 'fireball.svg';


function updateExplosions() {
  explosions.forEach((e, i) => {
    ctx.drawImage(expImg, e.x, e.y, e.size * 10, e.size * 10);
    explosions[i].size--;
    if(explosions[i].size < 1)
      explosions.splice(i);
  });
}

Events.on(engine, 'collisionStart', (e) => {
  e.pairs.forEach((pair) => {
    if(pair.bodyA.label === 'bullet' && pair.bodyB.label === 'oid') {
      hitAsteroid(pair.bodyA, pair.bodyB);
    }
    else if(pair.bodyA.label === 'oid' && pair.bodyB.label === 'bullet') {
      hitAsteroid(pair.bodyB, pair.bodyA);
    }
  });
});

function hitAsteroid(body, oid) {
  explosions.push({ x: body.position.x - render.bounds.min.x, y: body.position.y - render.bounds.min.y, size: 2 + Math.ceil(Math.random() * 8) })
  Composite.remove(engine.world, body);
  audio.play("explode");
  
  oid.hits++;
  // console.log(oid.size)
  if(oid.size < 0.1)
    Composite.remove(engine.world, oid);
  else if(oid.hits > 2) {
    splitAsteroid(oid);
  }
}

function splitAsteroid(oid) {
  // console.log(oid)
  const pos = oid.position;
  const vel = oid.velocity;
  const size = oid.size * 0.3;
  Composite.remove(engine.world, oid);
  for(let i = 0; i < 3; i++) {
    const body = makeAsteroid(pos.x, pos.y, size);
    Composite.add(engine.world, body);
    body.velocity.x = vel.x;
    body.velocity.y = vel.y;
  }
}


// function line_intersect(x1, y1, x2, y2, x3, y3, x4, y4)
// {
//     var ua, ub, denom = (y4 - y3)*(x2 - x1) - (x4 - x3)*(y2 - y1);
//     if (denom == 0) {
//         return null;
//     }
//     ua = ((x4 - x3)*(y1 - y3) - (y4 - y3)*(x1 - x3))/denom;
//     ub = ((x2 - x1)*(y1 - y3) - (y2 - y1)*(x1 - x3))/denom;
//     return {
//         x: x1 + ua * (x2 - x1),
//         y: y1 + ua * (y2 - y1),
//         seg1: ua >= 0 && ua <= 1,
//         seg2: ub >= 0 && ub <= 1
//     };
// }

// Events.on(engine, 'afterUpdate', function() {
//   if(ship.laserOn) {
//     const bodies = Composite.allBodies(engine.world);


//     const distance = 200;
//     const x1 = ship.position.x - render.bounds.min.x;
//     const y1 = ship.position.y - render.bounds.min.y;
//     const x2 = Math.round(Math.cos(ship.angle - Math.PI / 2) * distance + x1);
//     const y2 = Math.round(Math.sin(ship.angle - Math.PI / 2) * distance + y1);

//     ctx.beginPath();
//     ctx.lineWidth = 4;
//     ctx.strokeStyle = 'red';
//     ctx.moveTo(x1, y1);
//     ctx.lineTo(x2, y2);
//     ctx.stroke();
    
//     const endPoint = { 
//       x: Math.round(Math.cos(ship.angle - Math.PI / 2) * distance + ship.position.x),
//       y: Math.round(Math.sin(ship.angle - Math.PI / 2) * distance + ship.position.y)
//     }; 
    
//     const collisions = Query.ray(bodies, ship.position, endPoint);   
   
//     collisions.forEach(c => {
      
//       let point = null;
      
//       if(c.body.label === "oid") {
//         // console.log(c)
        
//         // console.log(c.body.points.length)
//         c.body.points.forEach((p, i) => {
//           // console.log(p)
//           // console.log(i)
//           let tPoint = null;
//           if(i + 1 < c.body.points.length) {
            
//             const x1 = c.body.points[i].x + c.body.position.x;
//             const y1 = c.body.points[i].y + c.body.position.y;
//             const x2 = c.body.points[i + 1].x + c.body.position.x; 
//             const y2 = c.body.points[i + 1].y + c.body.position.y;
            
//             ctx.lineWidth = 4;
//             ctx.strokeStyle = 'yellow';
//             ctx.beginPath();
//             ctx.moveTo(x1 - render.bounds.min.x, y1 - render.bounds.min.y);
//             ctx.lineTo(x2 - render.bounds.min.x, y2 - render.bounds.min.y);
//             ctx.stroke();
            
//             tPoint = line_intersect(x1, 
//                                    y1, 
//                                    x2, 
//                                    y2, 
//                                    c.body.position.x,
//                                    c.body.position.y,
//                                    ship.position.x, 
//                                    ship.position.y);
//             if(tPoint && tPoint.seg1 || tPoint.seg2) {
//               console.log(tPoint)
//               if(!point)
//                 point = tPoint;
//             }
//           }
//         })
        
        
//         ctx.lineWidth = 4;
//         ctx.strokeStyle = 'blue';
//         ctx.beginPath();
//         ctx.moveTo(x1, y1);
//         ctx.lineTo(c.body.position.x - render.bounds.min.x, c.body.position.y - render.bounds.min.y);
//         ctx.stroke();
//         ctx.strokeStyle = 'green';
//         ctx.beginPath();
//         const cx = point.x - render.bounds.min.x;
//         const cy = point.y - render.bounds.min.y;
//         ctx.moveTo(x1, y1);
//         ctx.lineTo(c.body.position.x - render.bounds.min.x + cx, 
//                    c.body.position.x - render.bounds.min.y + cy);
//         ctx.stroke();
//       }
//     });
//   }    
// });