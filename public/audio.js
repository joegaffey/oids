import assets from "./assets.js";

const audio = {};
audio.context = new AudioContext();

//https://sfxr.me/#7BMHBGQz2SDrJkWVcTT5NR57VkeK89oP9azXS3qCUCFGts7TjYuJiuGGuJ4HD8FVb1HVQZ8JJeoAqsnGRHT28hhZE2t3ykwofwKBMMKzuh21hfMASyhAF81VH
// Alt rocket 

//https://sfxr.me/#57uBnWac5Rm6wd7SPKxVKC2PvcLVeRGRdyAC5szhErMUAtkGuet3Df4b52yenphXojG65cM79npuysMzw5GBcjaZQVZE3WcnVxZuxuCqeg7bMB2KU3CeUUoHZ
const shoot = new Audio(assets.path + "laserShoot.wav");
shoot.volume = 0.15;

audio.sounds = {
  rocket: { 
    loop: true,
    play: (pitch, volume) => {
      rocket(volume * 0.1);
      noise.start();
    },
    stop: () => {
      noise.stop();
    }
  },
  shoot: { play: () => { shoot.play(); }}
};

audio.play = function (sound, pitch, volume) {
  if(!audio.sounds[sound].loop || !audio.sounds[sound].isPlaying) {
    audio.sounds[sound].isPlaying = true;
    audio.sounds[sound].play(pitch, volume);
  }
};

audio.stop = function (sound) { 
  if(audio.sounds[sound].loop && audio.sounds[sound].isPlaying) {
    if(audio.sounds[sound].stop)
      audio.sounds[sound].stop();
    audio.sounds[sound].isPlaying = false;
  }
}

function rocket(gain) {
  noise = make_buffer(fill_hihat, {});
  noise.loop = true;

  var filter1 = audio.context.createBiquadFilter();
  filter1.type = "bandpass";
  filter1.frequency.value = 500;
  filter1.Q.value = 1;
  noise.connect(filter1);

  gain1 = audio.context.createGain();
  gain1.gain.value = gain;
  filter1.connect(gain1);
  gain1.connect(audio.context.destination);
}

//Code from https://www.redblobgames.com/x/1618-webaudio/

function adsr(T, a, d, s, r, sustain) {
  var gain = audio.context.createGain();
  function set(v, t) {
    gain.gain.linearRampToValueAtTime(v, T + t);
  }
  set(0.0, -T);
  set(0.0, 0);
  set(0.1, a); // set(1, a);
  set(sustain, a + d);
  set(sustain, a + d + s);
  set(0.0, a + d + s + r);
  return gain;
}

const frequency = 1200; // 1000;
const offset = 0.06; // 0.2;

audio.init = function () {
  if (!audio.context) audio.context = new AudioContext();
};

var noise, constant, drive, gain1, gain2, gain3;

function rotor(brush, rotor, freq) {
  noise = make_buffer(fill_hihat, {});
  noise.loop = true;

  var filter1 = audio.context.createBiquadFilter();
  filter1.type = "bandpass";
  filter1.frequency.value = 4000;
  filter1.Q.value = 1;
  noise.connect(filter1);

  gain1 = audio.context.createGain();
  gain1.gain.value = brush;
  filter1.connect(gain1);

  constant = make_buffer(fill_one, {});
  constant.loop = true;
  gain2 = audio.context.createGain();
  gain2.gain.value = rotor;
  constant.connect(gain2);

  gain3 = audio.context.createGain();
  gain3.gain.value = 0;
  gain1.connect(gain3);
  gain2.connect(gain3);

  drive = make_buffer(fill_phasor_power, { power: 4, freq: freq });
  drive.loop = true;
  drive.connect(gain3.gain);

  gain3.connect(audio.context.destination);
  audio.record(gain3);
}

function fill_one(t, env, state) {
  return 1.0;
}

function fill_phasor_power(t, env, state) {
  var phase = (t * env.freq) % 1.0;
  return Math.pow(phase, env.power);
}

function rate(rate) {
  if (noise) noise.playbackRate.value = rate;
  if (drive) drive.playbackRate.value = rate;
  if (constant) drive.playbackRate.value = rate;
}

audio.engine = {};
audio.engine.restart = function () {
  audio.engine.stop();
  audio.engine.start();
};
audio.engine.stop = function () {
  if (noise) noise.stop();
  if (drive) drive.stop();
  if (constant) constant.stop();
};
audio.engine.start = function () {
  audio.engine.stop();
  rotor(0.5, 0.2, 20);
  noise.start();
  drive.start();
  constant.start();
};
audio.engine.power = function (power) {
  rate(power);
  gain(power / 20);
};

function gain(level) {
  if (gain1) gain1.gain.value = level * 0.5;
  if (gain2) gain2.gain.value = level * 0.2;
}

// audio.thump = function() {
//   drum(fill_thump, {a: 0.2, d: 0.1, s: 0.3, r: 0.2, sustain: 0.5});
// }

// audio.snare = function() {
//   drum(fill_snare, {a: 0, d: 0, s: 0, r: 0.25, sustain: 1});
// }

// audio.hihat = function() {
//   drum(fill_hihat, {a: 0.02, d: 0.03, s: 0, r: 0.15, sustain: 0.03});
// }

// audio.openHihat = function() {
//   drum(fill_hihat, {a: 0.0, d: 0.0, s: 0.15, r: 0.2, sustain: 0.8});
// }

function make_buffer(fill, env) {
  var count = audio.context.sampleRate * 2;
  var buffer = audio.context.createBuffer(1, count, audio.context.sampleRate);

  var data = buffer.getChannelData(0 /* channel */);
  var state = {};
  var prev_random = 0.0;
  for (var i = 0; i < count; i++) {
    var t = i / audio.context.sampleRate;
    data[i] = fill(t, env, state);
  }

  var source = audio.context.createBufferSource();
  source.buffer = buffer;
  return source;
}

// function fill_thump(t, env, state) {
//     var frequency = 60;
//     return  Math.sin(frequency * Math.PI * 2 * Math.pow(t, env.s));
// }

// function fill_snare(t, env, state) {
//     var prev_random = state.prev_random || 0;
//     var next_random = Math.random() * 2 - 1;
//     var curr_random = (prev_random + next_random) / 2;
//     prev_random = next_random;

//     return Math.sin(120 * Math.pow(t, 0.05) * 2 * Math.PI) +
//         0.5 * curr_random;
// }

function fill_hihat(t, env, state) {
  var prev_random = state.prev_random || 0;
  var next_random = Math.random() * 2 - 1;
  var curr = (3 * next_random - prev_random) / 2;
  prev_random = next_random;
  return curr;
}

// function drum(fill, env) {
//     var source = make_buffer(fill, env);
//     var gain = adsr(audio.context.currentTime, env.a, env.d, env.s, env.r, env.sustain);
//     source.connect(gain);
//     gain.connect(audio.context.destination);
//     source.start();
// }

//https://sonoport.github.io/synthesising-sounds-webaudio.html
audio.kick = function (gain) {
  if (!audio.context) return;
  var audioContext = audio.context;
  var osc = audio.context.createOscillator();
  var osc2 = audio.context.createOscillator();
  var gainOsc = audio.context.createGain();
  var gainOsc2 = audio.context.createGain();

  osc.type = "triangle";
  osc2.type = "sine";

  gainOsc.gain.setValueAtTime(gain, audio.context.currentTime);
  gainOsc.gain.exponentialRampToValueAtTime(
    0.001,
    audio.context.currentTime + 0.5
  );

  gainOsc2.gain.setValueAtTime(gain, audio.context.currentTime);
  gainOsc2.gain.exponentialRampToValueAtTime(
    0.001,
    audio.context.currentTime + 0.5
  );

  osc.frequency.setValueAtTime(120, audio.context.currentTime);
  osc.frequency.exponentialRampToValueAtTime(
    0.001,
    audio.context.currentTime + 0.5
  );

  osc2.frequency.setValueAtTime(50, audio.context.currentTime);
  osc2.frequency.exponentialRampToValueAtTime(
    0.001,
    audio.context.currentTime + 0.5
  );

  osc.connect(gainOsc);
  osc2.connect(gainOsc2);
  gainOsc.connect(audio.context.destination);
  gainOsc2.connect(audio.context.destination);

  audio.record(gainOsc);
  audio.record(gainOsc2);

  osc.start(audio.context.currentTime);
  osc2.start(audio.context.currentTime);

  osc.stop(audio.context.currentTime + 0.5);
  osc2.stop(audio.context.currentTime + 0.5);
};

export default audio;
