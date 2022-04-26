import assets from './assets.js';

const settings = {
  // Game settings
  LOAD_RATIO: 30,
  CONTAINER_OPTIONS: {
    wireframes: false,
    gravity: {x: 0, y: 0},
    frictionAir: 0,
    hasBounds: true,
    background: 'transparent',
    wireframeBackground: 'transparent',
  },
  FICTION_AIR: 0.001,
  SCREEN_RATIO: 1.333,
};

export default settings;