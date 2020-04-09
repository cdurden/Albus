var socketio = require('socket.io');
var rooms = require('./rooms');
var api = require('./api');
var fs = require('fs');
var users = require('./users');
var client = require('./db/config');
var request = require('request');
var _ = require('underscore');
var auth = require('./auth');
var async = require('async');
const { promisify } = require("util");
module.exports = function(server) {

  var room = {};
  var board = {};

  var io = socketio.listen(server);

  function getSocketData(socketId) {
    return new Promise((resolve) => client.hgetall(socketId, function(err, result) {
      console.log(result);
      result['socketId'] = socketId
      resolve(result);
    })); 
  }
  function getAllClientData(callback) {
    io.of('/client').clients((error, clients) => {
      console.log(clients);
      if (error) throw error;
      Promise.all(clients.map(function(clientId) {
        return getSocketData(clientId);
      })).then(function(results) {
        console.log(results);
        result = results.reduce((map, obj) => (map[obj['socketId']] = obj, map), {});
        //console.log(result);
        callback(result);
      });
    });
  }
  function registerCommonListeners(socket) {
    socket.on('getAssignedTask', function(){
      client.get('task', function(err, result) {
        console.log(result);
        try {
          data = JSON.parse(result);
          socket.emit('task', data);
        } catch {
          return;
        }
      });
    });
  }


  io.of('/admin').on('connection', function(socket) {
    registerCommonListeners(socket);
    socket.on('disconnect', function(){ });
    socket.on('submissions', function(){
      submissions = ['asdf', 'asfaga'];
      socket.emit('submissions', submissions);
    });
    socket.on('getAllClientData', function() {
      console.log("getting socket data");
      getAllClientData(function(results) { socket.emit("allClientData", results) });
    });
    socket.on('assignRooms', function(assignments){
      console.log("assigning sockets to rooms");
      console.log(assignments);
      for (socketId in assignments) {
        rooms.assignRoomToSocket(io.of('/client').sockets.connected[socketId], assignments[socketId]);
      }
    });
    socket.on('getTaskFromSource', function(source){
      api.getTaskFromSource(source, function(error, data) {
        socket.emit('task', data);
      });
    });
    socket.on('getTasks', function(){
      api.getTasks(function(error, data) {
        socket.emit('tasks', data);
      });
    });
    socket.on('viewTask', function(task_id){
      console.log(task_id);
      tasks_json = fs.readFileSync('./data/tasks.json');
      tasks = JSON.parse(tasks_json);
      task = tasks[task_id];
      socket.emit('showTask', task);
    });
    socket.on('assignTask', function(data){
      console.log(data);
      json = JSON.stringify(data);
      client.set('task', json, function(err) {
        console.log(err);
        client.get('task', function(err, result) {
          console.log(result);
          //io.emit('task', result); // TODO: assign to specific socket
        });
      });
    });
  });
  io.of('/client').on('connection', function (socket) {
    if ('passport' in socket.handshake.session && 'user' in socket.handshake.session.passport) {
      api.getApiUserFromSession(socket.handshake.session, function(error, data) {
        console.log(data);
        client.hmset(socket.id, Object.entries(data).flat());
      });
    }
    rooms.placeSocket(socket, function() {
      console.log("emitting client data to admin");
      getAllClientData(function(results) { io.of('/admin').emit("allClientData", results) });
    });
 
    setInterval(function() {
      socket.emit('heartbeat');
    }, 5000);

    socket.on('heartbeat', function () {
    })
    socket.on('getTask', function(){
      client.get('task', function(err, result) {
        api.getTask(result, function(error, data) {
          socket.emit('task', data);
        });
      });
    });

    registerCommonListeners(socket);
    socket.on('idRequest', function () {
      socket.emit('socketId', {socketId: socket.id});
    });

/*
    socket.on('roomId', function (data) {
      rooms.addMember(socket, data.roomId);
    });
    socket.on('get_assignment', function (data) {
    });
*/

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
      getAllClientData(function(results) { io.of('/admin').emit("allClientData", results) });
    });

      // ----------------- 
      /*
const getAsync = promisify(client.get).bind(client);
const setAsync = promisify(client.set).bind(client);
const hmgetAsync = promisify(client.hmget).bind(client);
const hmsetAsync = promisify(client.hmset).bind(client);

function get_data_by_socket(socket, keys, callback) {
  client.hmget(socket, keys, function(err, results) {
    var student_data = {};
    keys.forEach((elmt, i) => { student_data[elmt] = results[i]; });
    callback(err, student_data);
  });
}
function get_all_data_by_socket(socket, callback) {
  client.hgetall(socket, function(err, results) {
    var data = {};
    keys.forEach((elmt, i) => { student_data[elmt] = results[i]; });
    callback(err, student_data);
  });
}
      */
    socket.on('chat message', function(msg){
      io.of('/client').emit('chat message', msg);
      console.log(msg);
    });

  });

  return io;

};
