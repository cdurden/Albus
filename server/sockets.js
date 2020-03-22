var socketio = require('socket.io');
var rooms = require('./rooms');
var users = require('./users');
var client = require('./db/config');
var request = require('request');
var _ = require('underscore');
var auth = require('./auth');
var async = require('async');

module.exports = function(server) {

  var room = {};
  var board = {};

  var io = socketio.listen(server);

  io.on('connection', function (socket) {
    if ('passport' in socket.handshake.session && 'user' in socket.handshake.session.passport) {
      lti_user_id = socket.handshake.session.passport.user;
      request({
        url: "https://dev.algebra742.org:444/api/users/",
        headers : { "Authorization" : "Bearer " + auth.token },
        qs: { 'lti_user_id': lti_user_id },
        //json: true
      },
        function(error, response, body) {
        if (!error && response.statusCode == 200) {
          console.log(lti_user_id);
          console.log(auth.token);
          console.log(body);
          body_json = JSON.parse(body)
          if ('data' in body_json && body_json['data'].length == 1) {
            console.log(body_json['data'][0]);
            console.log(Object.entries(body_json['data'][0]));
            client.hmset(socket.id, Object.entries(body_json['data'][0]).flat());
          }
        } else {
          console.log(lti_user_id);
          console.log(socket.handshake.session);
          console.log(socket.handshake.session.id);
          console.log(response.statusCode);
          console.log(error);
          console.log(body);
        }
      });
    }
    
    setInterval(function() {
      socket.emit('heartbeat');
    }, 5000);

    socket.on('heartbeat', function () {
    })

    socket.on('idRequest', function () {
      socket.emit('socketId', {socketId: socket.id});
    });

    socket.on('roomId', function (data) {
      rooms.addMember(socket, data.roomId);
    });

    socket.on('newShape', function (data) {
      socket.to(this.room).emit('shapeCreated', data);
      rooms.addShape(data, socket);
    });

    socket.on('editShape', function (data) {
      socket.to(this.room).emit('shapeEdited', data);
      if (data.tool.name !== 'text') {
        rooms.editShape(data, socket);
      }
    });

    socket.on('shapeCompleted', function (data) {
      socket.to(this.room).emit('shapeCompleted', {
        socketId: socket.id,
        myid: data.myid,
        tool: data.tool
      });
      rooms.completeShape(data, socket);
    });

    socket.on('pathCompleted', function (data) {
      socket.to(this.room).emit('shapeCompleted', {
        socketId: socket.id,
        myid: data.myid,
        tool: data.tool
      });
      rooms.completePath(data, socket);
    });

    socket.on('copiedPathCompleted', function (data) {
      socket.to(this.room).emit('copiedPathCompleted', {
        socketId: socket.id,
        myid: data.myid,
        tool: data.tool,
        pathDProps: data.pathDProps
      });
      rooms.completePath(data, socket);
    })

    socket.on('moveShape', function (data) {
      rooms.moveShape(data, socket);
      socket.to(this.room).emit('shapeMoved', data);
    });

    socket.on('finishMovingShape', function (data) {
      rooms.completeShape(data, socket);
      socket.to(this.room).emit('shapeFinishedMoving', data);
    });

    socket.on('deleteShape', function (data) {
      rooms.deleteShape(data, socket);
      socket.to(this.room).emit('shapeDeleted', {myid: data.myid, socketId: data.socketId});
    });

    socket.on('disconnect', function () {
    });

    socket.on('chat message', function(msg){
      io.emit('chat message', msg);
      console.log(msg);
    });

    socket.on('submissions', function(){
      submissions = ['asdf', 'asfaga'];
      io.emit('submissions', submissions);
    });
    socket.on('get_room_assignments', function(){
      socket_assignments = {} 
      for (room_id in rooms.getRooms()) {
        room = io.sockets.adapter.rooms[room_id];
        if (typeof(room) != 'undefined') {
          socket_assignments[room_id] = Object.keys(room.sockets)
        }
      }
      function get_user_data_by_socket(socket, callback) {
        keys = ['id', 'firstname', 'lastname'];
        client.hmget(socket, keys, function(err, results) {
          var user_data = {};
          keys.forEach((elmt, i) => { user_data[elmt] = results[i]; });
          callback(err, user_data);
        });
      }
      async.transform(socket_assignments, function (obj, val, key, callback) {
        setImmediate(function () {
          obj[key] = async.map(val, get_user_data_by_socket);
          callback();
        })
      }, function (err, result) {
        io.emit('room_assignments', result);
      });
    });
    socket.on('get_users', function() {
        request({hostname: "https://localhost:444/api/users", json: true}, function(err, res, body) { io.emit('users', body) });
    });
    socket.on('set_room_assignments', function(rooms){
      room_assignments = [{'users': [{'user_id': 'asdf'}, {'user_id': 'asfaga'}]},{'users':[{'user_id': 'asdjklf'}, {'user_id': 'asfaasjlkhga'}]}];
      io.emit('room_assignments', room_assignments);
      console.log(room_assignments);
    });

  });

  return io;

};
