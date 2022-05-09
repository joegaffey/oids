import Matter from './lib/matter.js';
import assets from './assets.js';
import settings from './settings.js';
import Ship from './ship.js';
import Stars from './stars.js';
import asteroids from './asteroids.js';
import Utils from './utils.js';
import audio from './audio.js';

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
  body.label = "oid";
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
  if(pressedKeys[88]) 
    ship.laserOn = true; 
  else 
    ship.laserOn = false;
  
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
      exlodeBody(pair.bodyA);
    }
    else if(pair.bodyA.label === 'oid' && pair.bodyB.label === 'bullet') {
      exlodeBody(pair.bodyB);
    }
  });
});

function exlodeBody(body) {
  explosions.push({ x: body.position.x - render.bounds.min.x, y: body.position.y - render.bounds.min.y, size: 2 + Math.ceil(Math.random() * 8) })
  Composite.remove(engine.world, body);
  audio.play("explode");
}


function line_intersect(x1, y1, x2, y2, x3, y3, x4, y4)
{
    var ua, ub, denom = (y4 - y3)*(x2 - x1) - (x4 - x3)*(y2 - y1);
    if (denom == 0) {
        return null;
    }
    ua = ((x4 - x3)*(y1 - y3) - (y4 - y3)*(x1 - x3))/denom;
    ub = ((x2 - x1)*(y1 - y3) - (y2 - y1)*(x1 - x3))/denom;
    return {
        x: x1 + ua * (x2 - x1),
        y: y1 + ua * (y2 - y1),
        seg1: ua >= 0 && ua <= 1,
        seg2: ub >= 0 && ub <= 1
    };
}

Events.on(engine, 'afterUpdate', function() {
  if(ship.laserOn) {
    const bodies = Composite.allBodies(engine.world);


    const distance = 200;
    const x1 = ship.position.x - render.bounds.min.x;
    const y1 = ship.position.y - render.bounds.min.y;
    const x2 = Math.round(Math.cos(ship.angle - Math.PI / 2) * distance + x1);
    const y2 = Math.round(Math.sin(ship.angle - Math.PI / 2) * distance + y1);

    ctx.beginPath();
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'red';
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    
    const endPoint = { 
      x: Math.round(Math.cos(ship.angle - Math.PI / 2) * distance + ship.position.x),
      y: Math.round(Math.sin(ship.angle - Math.PI / 2) * distance + ship.position.y)
    }; 
    
    const collisions = Query.ray(bodies, ship.position, endPoint);   
   
    collisions.forEach(c => {
      
      let point = null;
      
      if(c.body.label === "oid") {
        console.log(c)
        
        // console.log(c.body.points.length)
        c.body.points.forEach((p, i) => {
          // console.log(p)
          // console.log(i)
          let tPoint = null;
          if(i + 1 < c.body.points.length) {
            
            const x1 = c.body.points[i].x + c.body.position.x;
            const y1 = c.body.points[i].y + c.body.position.y;
            const x2 = c.body.points[i + 1].x + c.body.position.x; 
            const y2 = c.body.points[i + 1].y + c.body.position.y;
            
            ctx.lineWidth = 4;
            ctx.strokeStyle = 'yellow';
            ctx.beginPath();
            ctx.moveTo(x1 - render.bounds.min.x, y1 - render.bounds.min.y);
            ctx.lineTo(x2 - render.bounds.min.x, y2 - render.bounds.min.y);
            ctx.stroke();
            
            tPoint = line_intersect(x1, 
                                   y1, 
                                   x2, 
                                   y2, 
                                   c.body.position.x,
                                   c.body.position.y,
                                   ship.position.x, 
                                   ship.position.y);
            if(tPoint && tPoint.seg1 || tPoint.seg2) {
              console.log(tPoint)
              if(!point)
                point = tPoint;
            }
          }
        })
        
        
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'blue';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(c.body.position.x - render.bounds.min.x, c.body.position.y - render.bounds.min.y);
        ctx.stroke();
        ctx.strokeStyle = 'green';
        ctx.beginPath();
        const cx = point.x - render.bounds.min.x;
        const cy = point.y - render.bounds.min.y;
        ctx.moveTo(x1, y1);
        ctx.lineTo(c.body.position.x - render.bounds.min.x + cx, 
                   c.body.position.x - render.bounds.min.y + cy);
        ctx.stroke();
      }
    });
  }    
});