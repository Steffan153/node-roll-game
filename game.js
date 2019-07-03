const express = require('express');
const app = express();
const port = process.env.PORT || 8080;
const http = require('http').Server(app);
const io = require('socket.io')(http);

let players = [];
let round = 0;

app.use(express.static(__dirname + '/public'));
app.get('/', (req, res) => res.sendFile(__dirname + '/public/game.html'));

http.listen(port, () => console.log('port ' + port));

io.on('connection', socket => {
  let user;
  socket.on('new player', (id, player) => {
    user = {
      name: player,
      id,
      round,
      roll: null,
      winner: false
    };
    players.push(user);
    io.emit('players', players);
  });
  socket.on('roll', function() {
    user.roll = Math.floor(Math.random() * 1000) + 1;
    if (players.length > 0) {
      let ready = 0; 
      let top = 0;
      let win = 0;
      players.forEach((player, i) => {
        player.winner = false;
        if (player.roll) {
          ready++;
          if (player.roll && player.roll > top) {
            win = i;
            top = player.roll;
          }
        }
      });
      players[win].winner = true;
      io.emit('players', players);
      if (ready >= players.length) {
        io.emit('inplay', 'Round #' + round + ', winner is ' + players[win].name);
        round++;
        players.forEach((player, index) => {
          player.winner = false;
          player.roll = null;
          player.round = round;
        });
      }
    }
  });
  socket.on('disconnect', (reason) => {
    console.log(reason);
    if (!user || !user.id) return;
    players.splice(players.findIndex(el => el.id == user.id), 1);
    io.emit('players', players); 
  });
  io.emit('players', players);
});