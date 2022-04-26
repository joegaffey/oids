const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");

const io = new Server(server, {
  cors: {
    origin: [process.env.CLIENT_ORIGIN],
    methods: ['GET'],
    credentials: true
  }
});

app.use(express.static('public'));

const players = {};
const trackPlayerCounts = new Array(1000).fill(0, 0, 1000);

app.get('/players', (req, res) => {
  res.send(players);
});

io.on('connection', (socket) => {
  console.log('Player connected ' + socket.id);
  
  socket.on('update', (msg) => {
    socket.to('room' + msg.track).emit('update', msg);
  });
  
  socket.on('newPlayer', (msg) => {
    if(players[socket.id])
      return;
    msg.id = socket.id;
    socket.join('room' + msg.track);
    trackPlayerCounts[msg.track]++;
    msg.gridPosition = trackPlayerCounts[msg.track] - 1;
    players[socket.id] = msg;
    io.to('room' + msg.track).emit('players', players);
  });
  
  socket.on('disconnect', () => {
    if(players[socket.id])
      trackPlayerCounts[players[socket.id].track]--;
    delete players[socket.id];
    console.log('Player disconnected ' + socket.id);
    socket.broadcast.emit('playerExit', socket.id);
  });
});

server.listen(3000, () => {
  console.log('Listening on 3000');
});