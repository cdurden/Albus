var socketio = require('socket.io');
var rooms = require('./rooms');
var client = require('./db/config');
var _ = require('underscore');

module.exports = function(server) {

  var room = {};
  var board = {};

  var io = socketio.listen(server);

  io.on('connection', function (socket) {

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
      console.log(submissions);
    });
    socket.on('get_room_assignments', function(){
      room_assignments = {}
      for (room_id in rooms.getRooms()) {
        room = io.sockets.adapter.rooms[room_id];
        if (typeof(room) != 'undefined') {
          room_assignments[room_id] = {'users': Object.keys(room.sockets).map(socket => ({'user_id': socket}))}; 
        }
      }
      io.emit('room_assignments', room_assignments);
      //io.emit('room_assignments', Object.keys(rooms.getRooms()));
      console.log(room_assignments);
    });
    socket.on('set_room_assignments', function(rooms){
      room_assignments = [{'users': [{'user_id': 'asdf'}, {'user_id': 'asfaga'}]},{'users':[{'user_id': 'asdjklf'}, {'user_id': 'asfaasjlkhga'}]}];
      io.emit('room_assignments', room_assignments);
      console.log(room_assignments);
    });

  });

  return io;

};
