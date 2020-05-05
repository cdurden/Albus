var socketio = require('socket.io');
var rooms = require('./rooms');
var api = require('./api');
var assets = require('./assets');
var fs = require('fs');
var users = require('./users');
var client = require('./db/config');
var request = require('request');
var _ = require('underscore');
var auth = require('./auth');
var async = require('async');
const { promisify } = require("util");
module.exports = function(server, session) {

  var room = {};
  var board = {};

  var io = socketio.listen(server);
  var sharedsession = require("express-socket.io-session");
  io.of('/client').use(sharedsession(session, {
      autoSave:true
  }));
  io.of('/admin').use(sharedsession(session, {
      autoSave:true
  }));
  io.of('/client').use((socket, next) => {
      console.log("Got packet");
      console.log(socket.handshake.session);
      if ('passport' in socket.handshake.session && 'user' in socket.handshake.session.passport) { 
          next();
      } else {
          next(new Error('Socket not authenticated'));
          //next();
      }
  });

  // IMPORTANT: this must be called as soom as the connection is established to that information about the user can be used to control the socket
  function setSocketUser(socketId, user) {
      return new Promise((resolve) => {
          client.hmset(socketId, ['user', user], function(err, result) {
              resolve(result);
          });
      });
  }
  function getSocketData(socketId) {
    return new Promise((resolve) => client.hgetall(socketId, function(err, result) {
      if (result === null) {
        console.log("The following socket id was not found in Redis store:");
        // FIXME: Is this where we want to do this?
        rooms.assignRoomToSocketId(socketId).then(function(roomId) {
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
  function saveBoardToApi(socket, data) {
    return new Promise(resolve => {
      shapeStorage = rooms.getBoardStorage(rooms.getRoomId(socket), data.boardId);
      console.log("Getting shapeStorage for saveBoardToApi handler");
      console.log(shapeStorage);
      api.saveBoard(socket.handshake.session, shapeStorage, data, undefined, function(err, data) {
          console.log("Board saved");
          console.log(data);
          resolve(data);
      });
    });
  }
  function actAsUser(socket, lti_user_id) {
      var session = socket.handshake.session;
      return new Promise( (resolve) => {
          api.getApiUser(session.passport.user, function(error, api_user) {
              if(api_user.role === 'teacher') {
                  session.actingAsUser = lti_user_id
                  session.save();
                  client.hmset(socket.id, ['actingAsUser', lti_user_id], function(err, result) {
                      if (result) {
                          resolve(true);
                      }
                  });
              } else {
                  resolve(false);
              }
          });
      });
  }
  function loadBoards(socket) {
    getSocketData(socket.id).then(function(data) {
        assets.getAssignmentObject(data.assignment).then(function(assignmentData) {
            var taskObjectsPromise = assets.getTaskObjects(assignmentData, false);
        
            //api.getActingApiUserFromSession(socket.handshake.session, function(error, user) {
            api.getTaskBoardsFromSource(socket.handshake.session, assignmentData, function(error, tasks) {
              console.log("Got tasks");
              console.log(tasks);
              if (tasks) {
                Promise.all(tasks.map((task, i) => {
                    return new Promise(resolve => {
                        var board = null;
                        if (task.boards.length > 0) {
                            board = task.boards[task.boards.length-1];
                            board.i = i;
                            board.id = board.boardId;
                            board.task_id = task.id;
                            roomBoard = rooms.getBoardStorage(rooms.getRoomId(socket), board.id)
                            if (typeof roomBoard !== 'undefined') {
                                board.roomBoard = roomBoard;// TODO: If there is already a board with this id loaded in the room, ask the user whether to load it as a new board or use the version from the room
                            }
                            rooms.loadBoard(socket, board, function() {
                                resolve(board);
                            });
                        } else {
                            rooms.getOrCreateTaskBoard(socket, task.id, function(err, board) { // FIXME: the return values of rooms methods suffer from a lack of parallelism
                                board.task_id = task.id;
                                board.i = i;
                                resolve(board);
                            });
                        }
                    });
                })).then(function(boards) {
                    console.log("Got boards from tasks");
                    console.log(boards);
                    new Promise(resolve => {
                        roomBoards = rooms.getBoards(rooms.getRoomId(socket)) || {};
                        resolve(roomBoards);
                    }).then(function(roomBoards) {
                        var ids = boards.map(board => { return board.id });
                        console.log("Got board from room");
                        console.log(roomBoards);
                        for (let [boardId, boardStorage] of Object.entries(roomBoards)) {
                            if (!ids.includes(boardId)) {
                                boards.push({
                                    'i': boards.length,
                                    'id': boardId,
                                    'data': boardStorage,
                                    'shapeStorage': boardStorage,
                                });
                            }
                        }
                        console.log("emitting boards");
                        console.log(boards);
                        socket.emit('boards', boards);
                        taskObjectsPromise.then(function(taskObjects) {
                            tasksObj = tasks.reduce(function(obj, task) { task.data = taskObjects[task.source].data; obj[task.id] = task; return obj; }, {});
                            socket.emit('tasks', tasksObj);
                        });
                    });
                });
              }
            });
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
    socket.on('getUser', function () {
      if (typeof socket.handshake.session === 'undefined') {
        return;
      }
      var user = socket.handshake.session.passport.user;
      api.getApiUser(user, function(error, data) {
        socket.emit('user', data);
      });
    });
    socket.on('getActingUser', function () {
      if (typeof socket.handshake.session === 'undefined') {
        return;
      }
      api.getActingApiUserFromSession(socket.handshake.session, function(error, data) {
          socket.emit('actingAsUser', data);
      });
    });
    socket.on('getUsers', function() {
      console.log("getting api users");
      api.getApiUsers(function(err,results) { 
          users_dict = results.reduce(function(p, user) { p[user.id] = user; return p; }, {});
          socket.emit("users", users_dict)
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
              try {
                data = JSON.parse(body);
              } catch (e) {
                data = [];
              }
              api.getTasksFromSource(data, function(error, data) {
                  console.log(data);
                  if (typeof io.of("/client").connected[socketId] !== 'undefined') {
                    loadBoards(io.of("/client").connected[socketId]); //FIXME: just inform the client of the update, and handle loading the boards on the client side
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
    socket.on('getTasksFromSource', function(taskSrcList){
        api.getTasksFromSource(taskSrcList, function(error, data) {
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
    });
    socket.on('getFeedbackTemplates', function(collection){
        request({
            method: 'GET',
            url: 'https://dev.algebra742.org:444/static/teaching_assets/feedback/'+collection+'.json',
            transformResponse: [function (data) {
              return data;
            }]
        }, function(error, response, body) {
            if(!error && response.statusCode == 200) {
              data = JSON.parse(body);
            } else {
              data = {};
            }
            socket.emit('feedbackTemplates', data);
        });
    });
    socket.on('getAssignmentTasks', function(assignment){
        request({
            method: 'GET',
            url: 'https://dev.algebra742.org:444/static/teaching_assets/assignments/'+assignment+'.json',
            transformResponse: [function (data) {
              return data;
            }]
        }, function(error, response, body) {
            console.log("assignment data");
            console.log(body);
            if(!error && response.statusCode == 200) {
              data = JSON.parse(body);
            } else {
              data = [];
            }
            api.getTasksFromSource(data, function(error, tasks) {
                socket.emit('tasks', data);
            });
        });
    });
    socket.on('getAssignments', function(){
      assignments = ['ProductRule','QuotientRule','NegativeExponents','CorrectProductRule','CorrectQuotientRule','CorrectNegativeExponents','CorrectExponentRuleMistakesAdvanced']
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
/*    socket.on('assignTask', function(data){
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
    */
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
      /*
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
    */
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
    console.log("Handling client connection from socket "+socket.id);
      console.log(socket.handshake.session);
    //if ('passport' in socket.handshake.session && 'user' in socket.handshake.session.passport) {
      if (typeof socket.handshake.session === 'undefined') {
          return;
      }
      var user = socket.handshake.session.passport.user;
      setSocketUser(socket.id, user);
      api.getApiUser(user, function(error, data) {
          console.log("returning from getting Api user");
          if (data) {
              console.log("received data:");
              console.log(data);
              flat_data = Object.entries(data).flat().map(obj => { if (typeof obj === 'string') { return(obj); } else { return(JSON.stringify(obj)); } });
              client.hmset(socket.id, flat_data, function(err, result) {
              //client.hmset(socket.id, Object.entries(data).flat(), function(err, result) {
                  rooms.assignRoomToUser(user).then(function() {
                      rooms.assignRoomToSocket(socket).then(function(roomId) {
                          console.log("Setting up boards for socket "+socket.id);
                          //loadBoards(socket);
                            /*
                          rooms.setupBoards(socket, function (boards) {
                            console.log("Sending boards to "+socket.id);
                            socket.emit('boards', boards);
                          });
                          */
                          console.log("emitting client data to admin");
                          getAllClientData(function(results) { io.of('/admin').emit("allClientData", results) });
                      });
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
      saveBoardToApi(socket, data).then(function(board) {
          console.log(board);
          data.board_id = board[0].id; //FIXME: why is board an array?
          api.submit(socket.handshake.session, data, function(error, data) {
            console.log(data)
            io.of('/admin').emit('submission', data);
            //socket.emit('confirmSubmission', data);
          });
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

    socket.on('actAsUser', function (data) {
      actAsUser(socket, data.lti_user_id).then(function(success) {
          if (success) {
              console.log("Acting as user");
              console.log(socket.handshake.session.actingAsUser);
              console.log("Reassigning room to socket");
              rooms.assignRoomToSocket(socket);
              api.getActingApiUserFromSession(socket.handshake.session, function(error, data) {
                  socket.emit('actingAsUser', data);
              });
              loadBoards(socket);
          }
      });
    });
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
      saveBoardToApi(socket, data.boardId).then(function() {
          socket.emit('saved');
      });
    });
    socket.on('loadBoardFromApi', function(boardId) {
      api.getBoard(boardId, function(err, board) {
        if (typeof board.id === 'undefined') {
            board = {
                'boardId': boardId,
                'data': {}
            }
        }
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
      loadBoards(socket);
      // load assignment
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
