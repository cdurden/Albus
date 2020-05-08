var utils = require('./utils/util');
var client = require('./db/config');
var _ = require('underscore');

var rooms = {};
var taskBoards = {};
function generateRandomId(length) {
  var id = "";
  var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < length; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return id;
}
var roomAssignmentMethods = {
    'default': function(user) {
        return new Promise( resolve => { 
            client.hget('roomAssignments', user, function(err, roomId) {
                resolve(roomId || utils.generateRandomId(5));
            });
        });
    }
}
function getRoomAssignment(user) {
    console.log("Getting room assignment for user "+user);
    return new Promise( resolve => {
        client.hget(user, 'roomId', function(err, roomId) {
            if (roomId && roomId.length===5) {
                console.log("Got roomId "+roomId+" from Redis server");
                resolve(roomId);
            } else {
                client.hget('roomAssignmentMethod', function(err, method) {
                    if (typeof method === 'undefined') {
                        method = 'default';
                    }
                    roomAssignmentMethods[method](user).then(function(newRoomId) {
                        console.log("Got roomId "+newRoomId+" using assignment method "+method);
                        resolve(newRoomId)
                    });
                });
            }
        });
    });
}
function assignRoomToUser(user, roomId) {
    console.log("Placing user in room");
    return new Promise(resolve => {
        if (typeof roomId === 'undefined') {
            getRoomAssignment(user).then(function(roomId) {
                client.hmset(user, ['roomId', roomId], function(err, res) {
                    resolve(res);
                });
            });
        } else {
            client.hmset(user, ['roomId', roomId], function(err, res) {
                resolve(res);
            });
        }
    });
}

function getUserFromSocket(socket) {
    return(socket.handshake.session.passport.user);
}
function getActingUserFromSocket(socket) {
    var user = socket.handshake.session.actingAsUser;
    //if (typeof user === 'undefined') {
    if (!user) {
        user = getUserFromSocket(socket);
    }
    console.log("Got acting user: "+user);
    return(user);
}
function getUserFromSocketId(socketId) {
    return new Promise(resolve => {
        client.hget(socketId, 'user', function(err, user) {
            resolve(user);
        });
    });
}
function getActingUserFromSocketId(socketId) {
    return new Promise(resolve => {
        client.hget(socketId, 'actingAsUser', function(err, actingAsUser) {
            //if (typeof actingAsUser === 'undefined') {
            if (!actingAsUser) {
                getUserFromSocketId(socketId).then(function(user) {
                    console.log("Got acting user: "+user);
                    if (typeof user === 'undefined') {
                        console.log("WARNING: This is the last fallback to get user information. Since this failed, user assignments will not be tied to this socket. This could mean that you did not call setSocketUser when making the socket connection.");
                    }
                    resolve(user);
                });
            } else {
                console.log("Got acting user: "+actingAsUser);
                resolve(actingAsUser);
            }
        });
    });
}


/*
function assignRoomToSocketId(socketId, roomId, callback) {
  console.log("Setting room of "+socketId+" to "+roomId)
  client.hmset(socketId, ['roomId', roomId], function(err, res) {
    client.hgetall(socketId, function(err, result) {
      callback && callback(null, result);
    });
  });
}
*/
function assignRoomToSocketId(socketId, roomId) {
    return new Promise( resolve => {
        var roomIdPromise;
        roomIdPromise = new Promise( resolveRoomId => {
            if (typeof roomId !== 'undefined') {
                resolveRoomId(roomId);
            } else {
                getActingUserFromSocketId(socketId).then(function(user) {
                    getRoomAssignment(user).then(function(roomId) {
                        resolveRoomId(roomId);
                    });
                });
            }
        });
        roomIdPromise.then(function(roomId) {
            client.hmset(socketId, ['roomId', roomId], function(err, res) {
                if (res) {
                    resolve(roomId);
                } else {
                    resolve(res);
                }
            });
        });
    });
}
function assignRoomToSocket(socket, roomId) {
    return assignRoomToSocketId(socket.id, roomId).then(function(roomId) {
        socket.room = roomId;
        socket.join(roomId);
    });
}
/*
function assignRoomToSocket(socket, roomId, callback) {
  if (typeof socket === 'undefined') {
      console.log("Received undefined socket, cannot assign to roomt");
      return;
  }
  console.log("Assigning "+socket.id+" to room "+roomId)
  client.hmset(socket.id, ['roomId', roomId], function(err, res) {
    socket.room = roomId;
    socket.join(roomId);
    client.hgetall(socket.id, function(err, result) {
      callback && callback(null, result);
    });
  });
}
function placeSocket(socket, callback) {
  placeSocketId(socket.id).then(function(roomId) {
    assignRoomToSocket(socket, roomId, callback);
  })
}
function placeSocketId(socketId, callback) {
  return new Promise( resolve => {
      console.log("placing socket");
      getUserFromSocketId(socketId).then(function(user) {
          getRoomAssignment(user).then(function(roomId) {
              assignRoomToSocketId(socketId, roomId);
              resolve(roomId);
          });
      });
  });
  */
    /*
  client.hgetall(socketId, function(err, result) {
    console.log(result);
    var roomId;
    if (result !== null && 'roomId' in result) {
      roomId = result['roomId'];
    } else {
      roomId = utils.generateRandomId(5);
    }
    assignRoomToSocketId(socketId, roomId, callback);
  });
}
  */
function getBoard(roomId, boardId) {
    return((rooms[roomId] || {})[boardId]);
}
function getBoardStorage(roomId, boardId) {
    return((rooms[roomId] || {})[boardId]);
}
function getBoards(roomId) {
    return(rooms[roomId]);
}
function setupRoom(socket, callback) {
    roomId = socket.room;
    rooms[roomId] = {};
    callback && callback(rooms[roomId]);
}
function setupBoard(socket, boardId, callback) {
    if (typeof rooms[socket.room] === 'undefined') {
      setupRoom(socket);
    }
    client.hget(roomId, boardId, function (err, reply) {
      if (typeof rooms[roomId] === 'undefined') {
          setupRoom(socket)
      }
      if (!rooms[roomId][boardId]) {
        rooms[roomId][boardId] = {};
      }
      if (reply) {
        storedBoard = JSON.parse(reply);
        _.extend(rooms[roomId][boardId], storedBoard);
      } else {
        client.hmset(roomId, boardId, JSON.stringify({})); 
        rooms[roomId][boardId] = {};
      }
      console.log("Node.js process board data");
      console.log(rooms[roomId][boardId]);
      console.log("Setting up board "+boardId+" for socket "+socket.id);
      console.log("Redis board data");
      console.log(reply);
      
      if (typeof rooms[roomId][boardId][socket.id] === 'undefined') {
          rooms[roomId][boardId][socket.id] = {};
      }
      callback(rooms[roomId][boardId]);
    });
}
function getTaskBoard(roomId, taskId) {
    return new Promise(resolve => {
        client.hget('taskBoards', roomId+taskId, function(err, boardId) {
            resolve(boardId);
        });
    });
}
function setTaskBoard(roomId, taskId, boardId) {
    return new Promise(resolve => {
        client.hmset('taskBoards', [roomId+taskId, boardId], function(err, res) {
            resolve(res);
        });
    });
}
function setupBoards(socket, callback) {
  var boards = [];
  for (boardId in rooms[socket.room]) {
    setupBoard(socket, boardId, function(board) {
      boards.push(board);
    })
  }
  callback && callback(boards)
}
function loadBoard(socket, board, callback) {
  roomId = socket.room;
  boardId = board.boardId;
  if (typeof rooms[roomId] === 'undefined') {
      setupRoom(socket);
  }
  rooms[roomId][boardId] = board['shapeStorage'];
  client.hmset(roomId, boardId, JSON.stringify(board['shapeStorage'])); 
  if (board.task_id) {
      setTaskBoard(roomId, board.task_id, boardId).then(function() {
          callback(null, board);
      });
  } else {
      callback(null, board);
  }
}
function getOrCreateTaskBoard(socket, taskId, callback) {
  var boardId;
  roomId = socket.room;
  if (typeof rooms[roomId] === 'undefined') {
      setupRoom(socket);
  }
  //if (typeof taskBoards[roomId][taskId] === 'undefined') {
  getTaskBoard(roomId, taskId).then(function(boardId) {
      var setTaskBoardPromise;
      if (!boardId) { //FIXME: check this correctly
          boardId = generateRandomId(5);
    //console.log("Task board for roomId "+roomId+" and taskId "+taskId+" does not exist. Creating it.");
          setTaskBoardPromise = setTaskBoard(roomId, taskId, boardId).then(function(res) {
              return(res);
          });
   //taskBoards[roomId][taskId] = boardId;
   //   } else {
   //     boardId = taskBoards[roomId][taskId];
        //console.log("Task board for roomId "+roomId+" and taskId "+taskId+" is "+boardId);
      } else {
          setTaskBoardPromise = Promise.resolve(boardId);
      }
      setTaskBoardPromise.then(function() {
          console.log("Task board for roomId "+roomId+" and taskId "+taskId+" is "+boardId);
          if (typeof rooms[roomId][boardId] !== 'undefined') {
              callback(null, {
                  'task': { 'id': taskId },
                  'boardId': boardId,
                  'shapeStorage': rooms[roomId][boardId],
              });
          } else {
              setupBoard(socket, boardId, function(result) {
                  callback(null, {
                      'task': { 'id': taskId },
                      'boardId': boardId,
                      'shapeStorage': result,
                  });
              });
          }
      });
  });
}
var roomsManager = {

  getRoomId: function (socket) {
    return socket.room;
  },
  getRooms: function () {
    return rooms;
  },
  
  getRoom: function (roomId) {
    return rooms[roomId];
  },
  getBoards: getBoards,
  setupBoards: setupBoards,

  getBoard: getBoard,
  getBoardStorage: getBoardStorage,
  loadBoard: loadBoard,
  getOrCreateTaskBoard: getOrCreateTaskBoard,

    /*
  placeSocketId: placeSocketId,
  placeSocket: placeSocket,
  */
  getRoomAssignment: getRoomAssignment,
  assignRoomToUser: assignRoomToUser,
  assignRoomToSocket: assignRoomToSocket,
  assignRoomToSocketId: assignRoomToSocketId,

  addShape: function (shape, socket) {
    new Promise(resolve => {
      if (typeof ((rooms[socket.room] || {})[shape.boardId] || {})[socket.id] === 'undefined') {
        setupBoard(socket, shape.boardId, function() {
    //it seems that the client was setting the socketId of the shape
    //rooms[socket.room][boardId][shape.socketId][shape.myid] = shape;
    //here the line has been modified to use the id of the current socket.
          resolve();
        })
      } else {
        resolve();
      }
    }).then(function() {
      rooms[socket.room][shape.boardId][socket.id][shape.myid] = shape;
    });
    console.log("Adding shape to room, socket, board:");
    console.log(socket.room);
    console.log(shape.socketId);
    console.log(shape.boardId);
  },

  editShape: function (shape, socket) {
    new Promise(resolve => {
      if (typeof ((rooms[socket.room] || {})[shape.boardId] || {})[socket.id] === 'undefined') {
        setupBoard(socket, shape.boardId, function() {
    //it seems that the client was setting the socketId of the shape
    //rooms[socket.room][boardId][shape.socketId][shape.myid] = shape;
    //here the line has been modified to use the id of the current socket.
          resolve();
        })
      } else {
        resolve();
      }
    }).then(function() {
      //if ( typeof rooms[socket.room][shape.boardId][socket.id][shape.myid] === 'undefined' ) {
      if (typeof (((rooms[socket.room] || {})[shape.boardId] || {})[socket.id] || {})[shape.myid] === 'undefined') {
          return;
      }
      rooms[socket.room][shape.boardId][socket.id][shape.myid]['mouseX'] = shape.mouseX;
      rooms[socket.room][shape.boardId][socket.id][shape.myid]['mouseY'] = shape.mouseY;   
    });
    console.log(rooms);
    console.log(socket.room);
    console.log(shape.socketId);
    console.log(shape.myid);
  },

  moveShape: function (shape, socket) {
    new Promise(resolve => {
      if (typeof ((rooms[socket.room] || {})[shape.boardId] || {})[socket.id] === 'undefined') {
        setupBoard(socket, shape.boardId, function() {
          resolve();
        })
      } else {
        resolve();
      }
    }).then(function() {
      if (typeof (((rooms[socket.room] || {})[shape.boardId] || {})[socket.id] || {})[shape.myid] === 'undefined') {
          return;
      }
      var storedShape = rooms[socket.room][shape.boardId][shape.socketId][shape.myid];
      if (shape.attr.r) {
        storedShape.initX = shape.attr.cx;
        storedShape.initY = shape.attr.cy;
        storedShape.mouseX = shape.attr.cx + shape.attr.r;
        storedShape.mouseY = shape.attr.cy;
      } else if (shape.attr.width) {
        storedShape.initX = shape.attr.x;
        storedShape.initY = shape.attr.y;
        storedShape.mouseX = shape.attr.x + shape.attr.width;
        storedShape.mouseY = shape.attr.y + shape.attr.height;
      } else if (shape.attr.text) {
        storedShape.initX = shape.attr.x;
        storedShape.initY = shape.attr.y;
      } else {
        if (shape.pathDProps) {
          storedShape.pathDProps = shape.pathDProps;
        } else {
          var path = shape.attr.path;
          storedShape.initX = path[0][1];
          storedShape.initY = path[0][2];
          storedShape.mouseX = path[1][1];
          storedShape.mouseY = path[1][2];
        }
      }
    });
  },

  completePath: function (shape, socket) {
    new Promise(resolve => {
      if (typeof ((rooms[socket.room] || {})[shape.boardId] || {})[socket.id] === 'undefined') {
        setupBoard(socket, shape.boardId, function() {
          resolve();
        })
      } else {
        resolve();
      }
    }).then(function() {
      if (typeof (((rooms[socket.room] || {})[shape.boardId] || {})[socket.id] || {})[shape.myid] === 'undefined') {
          return;
      }
      rooms[socket.room][shape.boardId][socket.id][shape.myid]['pathDProps'] = shape.pathDProps;
      //client.set(socket.room, JSON.stringify(rooms[socket.room][boardId]));
      client.hmset(socket.room, shape.boardId, JSON.stringify(rooms[socket.room][shape.boardId]));
    });
  },

  completeShape: function (shape, socket) {
    new Promise(resolve => {
      if (typeof ((rooms[socket.room] || {})[shape.boardId] || {})[socket.id] === 'undefined') {
        setupBoard(socket, shape.boardId, function() {
          resolve();
        })
      } else {
        resolve();
      }
    }).then(function() {
      if (typeof (((rooms[socket.room] || {})[shape.boardId] || {})[socket.id] || {})[shape.myid] === 'undefined') {
          return;
      }
      if (shape.tool && shape.tool.text) {
        rooms[socket.room][shape.boardId][socket.id][shape.myid]['tool'] = shape.tool;
      }
      //client.set(socket.room, JSON.stringify(rooms[socket.room][boardId]));
      client.hmset(socket.room, shape.boardId, JSON.stringify(rooms[socket.room][shape.boardId]));
    });
  },

  deleteShape: function (shape, socket) {
    new Promise(resolve => {
      if (typeof ((rooms[socket.room] || {})[shape.boardId] || {})[socket.id] === 'undefined') {
        setupBoard(socket, shape.boardId, function() {
          resolve();
        })
      } else {
        resolve();
      }
    }).then(function() {
      if (typeof (((rooms[socket.room] || {})[shape.boardId] || {})[socket.id] || {})[shape.myid] === 'undefined') {
          return; //FIXME: add some warning messages to figure out why this is happening
      }
      console.log("deleting shape "+shape.myid);
      console.log("roomId: "+socket.room);
      console.log("boardId: "+shape.boardId);
      console.log("socketId: "+shape.socketId);
      console.log(rooms);
      console.log(rooms[socket.room][shape.boardId][shape.socketId]);
      delete rooms[socket.room][shape.boardId][shape.socketId][shape.myid];
      //client.set(socket.room, JSON.stringify(rooms[socket.room][shape.boardId])); 
      client.hmset(socket.room, shape.boardId, JSON.stringify(rooms[socket.room][shape.boardId])); 
    });
  }

}

module.exports = roomsManager;
