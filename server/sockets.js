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
      if (result === null) {
        console.log("The following socket id was not found in Redis store:");
        rooms.placeSocketId(socketId, function(err, result) {
          console.log(socketId);
          result['socketId'] = socketId;
          resolve(result);
        });
      } else {
        console.log(socketId);
        result['socketId'] = socketId;
        resolve(result);
      }
    })); 
  }
  function getAllClientData(callback) {
    io.of('/client').clients((error, clients) => {
      console.log("Here are our clients:");
      console.log(clients);
      if (error) throw error;
      Promise.all(clients.map(function(clientId) {
        return getSocketData(clientId);
      })).then(function(results) {
        //console.log(results);
        result = results.reduce((map, obj) => (map[obj['socketId']] = obj, map), {});
        //console.log(result);
        callback(result);
      });
    });
  }
  function registerCommonListeners(socket) {
    socket.on('getAssignedTask', function(){
      client.get('task', function(err, result) {
        //console.log(result);
        try {
          data = JSON.parse(result);
          socket.emit('task', data);
        } catch {
          return;
        }
      });
    });
    socket.on('getAssignedTasks', function(){
      getSocketData(socket.id).then(function(data) {
          var assignment = data.assignment;
          console.log("Getting assignment "+assignment+" for socket "+socket.id);
          request({
              method: 'GET',
              url: 'https://dev.algebra742.org:444/static/teaching_assets/assignments/'+assignment+'.json',
              transformResponse: [function (data) {
                return data;
              }]
          }, function(error, response, body) {
            console.log("assignment data");
            console.log(body);
            data = JSON.parse(body)
            api.getTasksFromSource(data, function(error, data) {
                console.log(data);
                socket.emit('tasks', data);
            });
          })  
      });
      /*
      client.hget(socket.id, 'tasks', function(err, result) {
        try {
          data = JSON.parse(result);
          socket.emit('tasks', data);
        } catch {
          return;
        }
      });
      */
    });
  }


  io.of('/admin').on('connection', function(socket) {
    registerCommonListeners(socket);
    socket.on('disconnect', function(){ });
    socket.on('getUsers', function() {
      console.log("getting api users");
      api.getApiUsers(function(err,results) { 
          users_dict = results.reduce(function(p, user) { p[user.id] = user; return p; }, {});
          socket.emit("users", users_dict)
      });
    });
    socket.on('getAllClientData', function() {
      console.log("getting socket data");
      getAllClientData(function(results) { socket.emit("allClientData", results) });
    });
    socket.on('assignRooms', function(assignments){
      console.log("assigning sockets to rooms");
      for (socketId in assignments) {
        rooms.assignRoomToSocket(io.of("/client").connected[socketId], assignments[socketId]['roomId']);
        getSocketData(socketId).then(function(data) {
            var socketId = data.socketId;
            var assignment = data.assignment;
            console.log("Getting assignment "+assignment+" for socket "+socket.id);
            request({
                method: 'GET',
                url: 'https://dev.algebra742.org:444/static/teaching_assets/assignments/'+assignment+'.json',
                transformResponse: [function (data) {
                  return data;
                }]
            }, function(error, response, body) {
              console.log("assignment data");
              console.log(body);
              data = JSON.parse(body)
              api.getTasksFromSource(data, function(error, data) {
                  console.log(data);
                  if (typeof io.of("/client").connected[socketId] !== 'undefined') {
                    io.of("/client").connected[socketId].emit('tasks', data);
                  }
              });
            })  
        });
      }
    });
    socket.on('updateAssignments', function(data) {
      console.log("assigning assignments to users");
      assignments = Object.entries(data).reduce(function(p,ua) { p[ua[0]] = ua[1].assignment; return p;}, {});
      console.log(assignments);
      //assignments = data.map(function(user) { return({ user.id: user.assignmentId}); });
      api.updateAssignments(assignments, function(err, results) { return; });
        /*
      client.hmset('assignments', assignments, function(err, result) {
        socket.emit('assignedAssignments', assignments);
      });
      */
    });
    socket.on('getTaskFromSource', function(source){
      if (source.length > 1) {
          source = source.pop();
      }
      api.getTaskFromSource(source, function(error, data) {
        socket.emit('task', data);
      });
    });
    socket.on('getTasks', function(){
      api.getTasksDataFromCollection('tasks', function(error, data) {
        socket.emit('tasks', data);
      });
    });
    socket.on('getAssignments', function(){
      assignments = ['a1','a2']
      socket.emit('assignments', assignments);
/*
      client.hmget(socket, assignmentIds, function(err, results) {
        var assignments = {};
        assignmentIds.forEach((id, i) => { assignments[id] = results[i]; });
        socket.emit('assignments', assignments);
      });
*/
/*
      client.hgetall('assignments', function(err, results) {
        socket.emit('assignments', results);
      }
*/
    });
    socket.on('viewTask', function(task_id){
      console.log(task_id);
      tasks_json = fs.readFileSync('./data/tasks.json');
      tasks = JSON.parse(tasks_json);
      task = tasks[task_id];
      socket.emit('showTask', task);
    });
    socket.on('assignTask', function(data){
      //console.log(data);
      json = JSON.stringify(data);
      client.set('tasks', json, function(err) {
        //console.log(err);
        client.get('tasks', function(err, result) {
          try {
            data = JSON.parse(result);
            io.of('/client').emit('tasks', data); // TODO: assign to specific socket
          } catch {
            return;
          }
        });
      });
    });
    socket.on('assignTasksToSockets', function(assignments){
        console.log("assigning tasks to sockets");
        //console.log(assignments);
        var assignTasksToSocket = function(socketId) {
            var socket = io.of("/client").connected[socketId];
            api.getTasksFromSource(assignments[socketId], function(error, data) {
                var tasks_json = JSON.stringify(data);
                client.hmset(socketId, ['tasks', tasks_json], function(err, result) {
                    client.hget(socketId, 'tasks', function(err, result) {
                        try {
                          data = JSON.parse(result);
                          socket.emit('tasks', data);
                        } catch {
                          return;
                        }
                    });
                });
            });
        }
        for (socketId in assignments) {
            assignTasksToSocket(socketId);
        }
    });
    socket.on('assignTasks', function(data){
      //console.log(data);
      api.getTasksFromSource(data, function(error, data) {
        json = JSON.stringify(data);
        client.set('tasks', json, function(err) {
          //console.log(err);
          client.get('tasks', function(err, result) {
            try {
              data = JSON.parse(result);
              io.of('/client').emit('tasks', data); // TODO: assign to specific socket
            } catch {
              return;
            }
          });
        });
        //socket.emit('task', data);
      });
    });
    socket.on('getSubmissions', function(){
      api.getSubmissions(function(error, data) {
        //console.log(data)
        io.of('/admin').emit('submissions', data);
        //socket.emit('confirmSubmission', data);
      });
    });
    socket.on('createFeedback', function(data){
      api.createFeedback(socket.handshake.session, data, function(error, result) {
        //console.log(data)
        io.of('/admin').emit('feedbackRedirect', result);
        //socket.emit('confirmSubmission', data);
      });
    });
  });
  io.of('/client').on('connection', function (socket) {
    console.log("connection from socket "+socket.id);
    //if ('passport' in socket.handshake.session && 'user' in socket.handshake.session.passport) {
      api.getApiUserFromSession(socket.handshake.session, function(error, data) {
        console.log("returning from getting Api user");
        if (data) {
          console.log("received data:");
          console.log(data);
          flat_data = Object.entries(data).flat().map(obj => { if (typeof obj === 'string') { return(obj); } else { return(JSON.stringify(obj)); } });
          client.hmset(socket.id, flat_data, function(err, result) {
          //client.hmset(socket.id, Object.entries(data).flat(), function(err, result) {
            rooms.placeSocket(socket, function() {
              console.log("Setting up boards for socket "+socket.id);
              rooms.setupBoards(socket, function (boards) {
                console.log("Sending boards to "+socket.id);
                socket.emit('boards', boards);
              });
              console.log("emitting client data to admin");
              getAllClientData(function(results) { io.of('/admin').emit("allClientData", results) });
            });
          });
        }
      });
    //}
 
    setInterval(function() {
      socket.emit('heartbeat');
    }, 5000);

    socket.on('heartbeat', function () {
    })
    socket.on('submit', function(data){
      //console.log(data);
      api.submit(socket.handshake.session, data, function(error, data) {
        //console.log(data)
        io.of('/admin').emit('submission', data);
        //socket.emit('confirmSubmission', data);
      });
    });
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
      console.log("new shape");
      console.log(this.room);
      socket.to(this.room).emit('shapeCreated', data);
      console.log(data);
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
        tool: data.tool,
        boardId: data.boardId,
      });
      rooms.completeShape(data, socket);
    });

    socket.on('pathCompleted', function (data) {
      socket.to(this.room).emit('shapeCompleted', {
        socketId: socket.id,
        boardId: data.boardId,
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
        boardId: data.boardId,
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
      socket.to(this.room).emit('shapeDeleted', {myid: data.myid, socketId: data.socketId, boardId: data.boardId});
    });

    socket.on('disconnect', function () {
      console.log("disconnect from socket "+socket.id);
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
    socket.on('saveBoardToApi', function(data) {
      board = rooms.getBoardStorage(rooms.getRoomId(socket), data.boardId)
      api.saveBoard(socket.handshake.session, board, data, function(err, data) {
        socket.emit('savedSuccess', data);
      });
    });
    socket.on('loadBoardFromApi', function(boardId) {
      api.getBoard(boardId, function(err, board) {
        rooms.loadBoard(socket, board['data'], function(result) {
          socket.emit('board', board);
        });
      });
    });
    socket.on('getBoardStorage', function(boardId) {
      var boardStorage = rooms.getBoardStorage(socket.room, boardId);
      socket.emit('boardStorage', {'boardId': boardId, 'shapeStorage': boardStorage});
    });
    socket.on('loadBoards', function() {
      // load assignment
      getSocketData(socket.id).then(function(data) {
          var assignment = data.assignment;
          console.log("Getting assignment "+assignment+" for socket "+socket.id);
          request({
              method: 'GET',
              url: 'https://dev.algebra742.org:444/static/teaching_assets/assignments/'+assignment+'.json',
              transformResponse: [function (data) {
                return data;
              }]
          }, function(error, response, body) {
            console.log("assignment data");
            console.log(body);
            data = JSON.parse(body);
            api.getTasksFromSource(data, function(error, data) {
                console.log("Got tasks");
                console.log(data);
                Promise.all(data.map(task => {
                    return new Promise(resolve => {
                        var board = null;
                        if (task.boards.length > 0) {
                            board = task.boards[task.boards.length-1];
                            board.task = task;
                            roomBoard = rooms.getBoardStorage(rooms.getRoomId(socket), board.id)
                            if (typeof roomBoard !== 'undefined') {
                                board.roomBoard = roomBoard;// TODO: If there is already a board with this id loaded in the room, ask the user whether to load it as a new board or use the version from the room
                            }
                            resolve(board);
                        } else {
                            rooms.getOrCreateTaskBoard(socket, task.id, function(err, result) { // FIXME: the return values of rooms methods suffer from a lack of parallelism
                                result.task = task;
                                resolve(result);
                            });
                        }
                    });
                })).then(function(results) {
                    console.log("Got boards from tasks");
                    console.log(results);
                    new Promise(resolve => {
                        roomBoards = rooms.getBoards(rooms.getRoomId(socket)) || {};
                        resolve(roomBoards);
                    }).then(function(roomBoards) {
                        console.log("Got board from room");
                        console.log(roomBoards);
                        for (let [boardId, boardStorage] of Object.entries(roomBoards)) {
                            results.push({ 'id': boardId,
                                           'data': boardStorage});
                        }
                        socket.emit('boards', results);
                    });
                });
            });
          });  
      });
    });
    socket.on('getOrCreateTaskBoard', function(taskId) {
      api.getTaskBoard(socket.handshake.session, taskId, function(err, board) {
        if (board) {
          console.log("Loading task board from API");
          console.log(board);
          rooms.loadBoard(socket, board, function(err, result) {
            socket.emit('board', board);
          });
        } else {
          console.log("Creating new task board");
          rooms.getOrCreateTaskBoard(socket, taskId, function(err, result) {
            socket.emit('board', result);
          });
        }
      });
    });
    socket.on('getLatestBoardFromApi', function(taskId) {
      api.getLatestBoard(socket.handshake.session, taskId, function(err, board) {
        rooms.loadBoard(socket, board['data'], function(result) {
          socket.emit('board', board);
        });
      });
    });
  });

  return io;

};
