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
module.exports = function(server) {

  var room = {};
  var board = {};

  var io = socketio.listen(server);

  io.on('connection', function (socket) {
    if ('passport' in socket.handshake.session && 'user' in socket.handshake.session.passport) {
      api.getApiUserFromSession(socket.handshake.session, function(error, data) {
          console.log(data);
          //client.hmset(socket.id, Object.entries(body_json['data'][0]).flat());
      });
    }
    console.log("does the socket have an id?");
    //console.log(socket);
    console.log(socket.id);
    rooms.placeSocket(socket);
 
    setInterval(function() {
      socket.emit('heartbeat');
    }, 5000);

    socket.on('heartbeat', function () {
    })

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
    });

    socket.on('chat message', function(msg){
      io.emit('chat message', msg);
      console.log(msg);
    });

    socket.on('submissions', function(){
      submissions = ['asdf', 'asfaga'];
      socket.emit('submissions', submissions);
    });
    socket.on('get_student_assignments', function(){
      socket_assignments = {} 
      for (room_id in rooms.getRooms()) {
        room = io.sockets.adapter.rooms[room_id];
        if (typeof(room) != 'undefined') {
          socket_assignments[room_id] = Object.keys(room.sockets)
        }
      }
      console.log(socket_assignments);
      function get_student_data_by_socket(socket, callback) {
        keys = ['id', 'firstname', 'lastname'];
        get_data_by_socket(socket, keys, callback);
      }
      async.transform(socket_assignments, function (obj, val, key, callback) {
        async.map(val, get_student_data_by_socket, function(err, results) {
          obj[key] = results;
          callback();
});
      }, function (err, result) {
        socket.emit('student_assignments', result);
      });
    });
    socket.on('get_socket_data', function() {
      console.log("getting socket data");
      io.clients((error, clients) => {
        console.log(clients);
        if (error) throw error;
        async.map(clients, function(client_id, callback) {
          client.hgetall(client_id, function(err, results) {
            callback(err,[client_id, results]);
          });
        },
        function(err, results) {
            result = results.reduce((map, obj) => (map[obj[0]] = obj[1], map), {});
            //result = new Map(results.map(obj => [obj.key, obj.val]));
            console.log(results);
            console.log(result);
            socket.emit('socket_data', result);
        });
      });
    });
    socket.on('assign_sockets_to_rooms', function(assignments){
      console.log("assigning sockets to rooms");
      console.log(assignments);
      for (socket_id in assignments) {
        callback = (function(socket_id) {
          return(function(err, result) { rooms.placeSocket(io.sockets.connected[socket_id]);});
        })(socket_id);
        client.hmset(socket_id, ['roomId', assignments[socket_id]['roomId']], callback);
        //hmsetAsync(socket, 'roomId', assignments[socket]).then(hmgetAsync, socket, 'roomId').then(function(result) {io.emit('assignment', result)}).catch(console.error);
        //rooms.placeSocket(socket);
      }
    });
    socket.on('get_task', function(){
      client.get('task', function(err, result) {
        console.log(result);
        socket.emit('task', result);
      });
    });
    socket.on('get-snow-qm-task', function(data){
      console.log("getting snow-qm task");
      console.log(data['collection']);
      console.log(data['task']);
      request({
        url: "https://dev.algebra742.org:444/api/snow-qm-task/"+data['collection']+"/"+data['task'],
        headers : { "Authorization" : "Bearer " + auth.token },
        //qs: { 'collection_id': data['collection_id'], 'task_id': data['task_id'] },
        //json: true
      },
      function(error, response, body) {
        if (!error && response.statusCode == 200) {
          console.log("received 200 status for snow-qm response");
          socket.emit('snow-qm-task', {'html': body, 'collection': data['collection'], 'task': data['task']});
        } else {
          console.log(response.statusCode);
          console.log(error);
          console.log(body);
        }
      });
    });
    socket.on('get_tasks', function(){
      tasks_json = fs.readFileSync('./data/tasks.json');
      tasks = JSON.parse(tasks_json);
      console.log(tasks);
      socket.emit('tasks', tasks);
    });
    socket.on('view_task', function(task_id){
      console.log(task_id);
      tasks_json = fs.readFileSync('./data/tasks.json');
      tasks = JSON.parse(tasks_json);
      task = tasks[task_id];
      socket.emit('show_task', task);
    });
    socket.on('assign_task', function(data){
      console.log(data);
      client.set('task', data, function(err) {
        console.log(err);
        client.get('task', function(err, result) {
          console.log(result);
          io.emit('task', result);
        });
      });
    });

  });

  return io;

};
