import Matter from "./lib/matter.js";
import assets from "./assets.js";
import settings from "./settings.js";
import Utils from "./utils.js";
import audio from "./audio.js";


/**
 * Creates a simple ship setup.
 * @method ship
 * @param {number} xx
 * @param {number} yy
 * @param {number} width
 * @param {number} height
 * @return {composite} A new ship
 */
const Ship = function (world, xx, yy, width, height) {
  const Body = Matter.Body,
    Bodies = Matter.Bodies,
    Vector = Matter.Vector;
  
  const verts = [{"x":0,"y":20},{"x":0,"y":15},{"x":5,"y":15},{"x":5,"y":5},{"x":8,"y":0},{"x":12,"y":0},{"x":12,"y":5},{"x":15,"y":12},{"x":20,"y":15},{"x":20,"y":20},{"x":15,"y":18},{"x":10,"y":15},{"x":5,"y":20}];
    
  const ship = Bodies.fromVertices(xx, yy, Utils.scaleVerts(verts, 1.8), { 
    label: 'ship',
    frictionAir: settings.FICTION_AIR,
    render: {
      sprite: {
        texture: assets.path + 'ship.png',
        xScale: 2,
        yScale: 2,
      }
    }
  });
  ship.tForce = 0.0002;
  ship.rForce = 0.002;
  ship.world = world;
  
  // @ToDo Make different textures for the ship rockets
  // ship.makeTextures = () => {
  //   const i = new Image();
  //   i.src = assets.path + 'ship.png';
  //   const ctx = new Canvas().getContext('2d');    
  // };
  
  ship.thrust = () => {
    const forceVector = Vector.rotate({x: 0, y: -ship.tForce}, ship.angle);
    Body.applyForce(ship, {x: ship.position.x, y: ship.position.y}, forceVector);
    ship.isThrust = true;
    audio.play("rocket", 0.5, 0.5);
  };
  
  ship.left = () => {
    ship.torque -= ship.rForce;
    ship.isLeft = true;
    audio.play("rocket", 2, 0.2);
  };
  
  ship.right = () => {
    ship.torque += ship.rForce;
    ship.isRight = true;
    audio.play("rocket", 2, 0.2);
  };
  
  ship.stopRocket = () => {
    audio.stop("rocket");
  }
  
  ship.laser = () => {
    ship.laserOn = true;
  }
  
  const bullets = [];
  const fireForce = 0.02;  
  const cooldown = 150;
  let lastShot = Date.now();
  
  ship.shoot = (world) => {
    if (Date.now() - lastShot < cooldown) {
      return;
    }
    
    audio.play("shoot");
    
    // move the bullet away from the player a bit
    const {x: bx, y: by} = ship.position;
    const x = bx + (Math.cos(ship.angle - Math.PI / 2) * 20);
    const y = by + (Math.sin(ship.angle - Math.PI / 2) * 20);

    const bullet = Matter.Bodies.circle(
      x, y, 3, {
        frictionAir: 0,
        density: 0.01,
        render: {fillStyle: "yellow"},
      },
    );
    bullet.label = "bullet";
        
    bullets.push(bullet);
    Matter.Composite.add(ship.world, bullet);
    Matter.Body.applyForce(
      bullet, ship.position, {
        x: Math.cos(ship.angle - Math.PI / 2) * fireForce, 
        y: Math.sin(ship.angle - Math.PI / 2) * fireForce,
      },
    );
    lastShot = Date.now();
  }
  
  return ship;
};


export default Ship;