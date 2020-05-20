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

function getUserIdFromSocket(socket) {
    return(socket.handshake.session.passport.user);
}
function getActingUserFromSocket(socket) {
    var userId = socket.handshake.session.actingAsUser;
    //if (typeof user === 'undefined') {
    if (!userId) {
        userId = getUserIdFromSocket(socket);
    }
    console.log("Got acting user: "+userId);
    return(userId);
}
function getUserIdFromSocketId(socketId) {
    return new Promise(resolve => {
        client.hget(socketId, 'userId', function(err, userId) {
            resolve(userId);
        });
    });
}
function getActingUserFromSocketId(socketId) {
    return new Promise(resolve => {
        client.hget(socketId, 'actingAsUser', function(err, actingAsUser) {
            //if (typeof actingAsUser === 'undefined') {
            if (!actingAsUser) {
                getUserIdFromSocketId(socketId).then(function(user) {
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
async function getBoard(roomId, boardId) {
    console.log("Getting board "+boardId+" from room "+roomId);
    return new Promise(resolve => {
        var board = (rooms[roomId] || {})[boardId];
        if (board) {
            console.log("Got board from node storage");
            resolve(board);
        } else {
            loadBoardFromRedis(roomId, boardId, function(board) {
                console.log("Got board from Redis");
                resolve(board);
            });
        }
    });
}
/*
async function getBoardStorage(roomId, boardId) {
    return new Promise(resolve => {
        board = (rooms[roomId] || {})[boardId]
        if (board) {
            resolve(board)
        } else {
            //setupBoard(roomId, boardId, function(shapeStorage) {
            loadBoardFromRedis(roomId, boardId, function(board) {
                //resolve(shapeStorage);
                resolve(board);
            });
        }
    });
}
*/
function getBoards(roomId) {
    return(rooms[roomId]);
}
function prepareRoom(roomId) {
    rooms[roomId] = {};
    return(rooms[roomId]);
}
function loadBoardFromRedis(roomId, boardId, callback) {
    if (typeof rooms[roomId] === 'undefined') {
      prepareRoom(roomId);
    }
    console.log("Loading board "+boardId+" in room "+roomId+" from redis");
    client.hget(roomId, boardId, function (err, reply) {
      if (typeof rooms[roomId] === 'undefined') {
          prepareRoom(roomId)
      }
      if (!rooms[roomId][boardId]) {
        rooms[roomId][boardId] = {};
      }
      if (reply) {
        storedBoard = JSON.parse(reply);
        //rooms[roomId][boardId].shapeStorage = storedBoard;
        rooms[roomId][boardId] = storedBoard;
        //_.extend(rooms[roomId][boardId].shapeStorage, storedBoard.shapeStorage);
          //callback && callback(rooms[roomId][boardId]);
          callback && callback(rooms[roomId][boardId]);
      } else {
          callback && callback(false);
      }
    });
}
function prepareBoard(roomId, boardId) {
    if (typeof rooms[roomId] === 'undefined') {
        prepareRoom(roomId);
    }
    if (typeof rooms[roomId][boardId] === 'undefined') {
        rooms[roomId][boardId] = { 
            'boardId': boardId,
            'shapeStorage': {}
        };
    }
    return(rooms[roomId][boardId])
}

function prepareBoardForSocket(socket, boardId) {
    var userId = getUserIdFromSocket(socket);
    //setupBoard(socket.room, boardId, function(shapeStorage) {
    //loadBoardFromRedis(socket.room, boardId, function(board) {
    console.log("Preparing board "+boardId+" for socket");
    var board = (rooms[socket.room] || {})[boardId];
    if (typeof board === 'undefined') {
        board = prepareBoard(socket.room, boardId);
    }
    if (typeof board.shapeStorage === 'undefined') { // FIXME: This should be unnecessary
        board.shapeStorage = {};
    }
    if (typeof board.shapeStorage[userId] === 'undefined') { //FIXME: this should always be true
        board.shapeStorage[userId] = {};
    }
    console.log("board prepared");
    console.log(board);
    return(board);
}
//function getTaskBoard(roomId, task_id) {
function getTaskBoard(roomId, taskSource) {
    console.log("Trying to get a task board from node process");
    return new Promise(resolve => {
        //client.hget('taskBoards', roomId+task_id, function(err, boardId) {
        client.get(roomId+taskSource, function(err, boardId) {
            if (boardId) {
                console.log("Board "+boardId+" registered with task "+taskSource+" in room "+roomId);
                console.log("Getting registered board");
                getBoard(roomId, boardId).then(function(board) {
                    console.log("Got board "+boardId);
                    resolve(board);
                });
            } else {
                console.log("Board not registered with task "+taskSource+" in room "+roomId);
                resolve(undefined);
            }
        });
    });
}
function registerTaskBoard(roomId, taskSource, boardId) {
    return new Promise(resolve => {
        //client.hmset('taskBoardMap', [roomId+task_id, boardId], function(err, res) {
        client.set(roomId+taskSource, boardId, function(err, res) {
            resolve(res);
        });
    });
}
/*
function setTaskBoard(roomId, task_id, boardId) {
    return new Promise(resolve => {
        client.hmset('taskBoards', [roomId+task_id, boardId], function(err, res) {
            resolve(res);
        });
    });
}
*/
/*
function setupBoards(socket, callback) {
  var boards = [];
  for (boardId in rooms[socket.room]) {
    prepareBoardForSocket(socket, boardId, function(board) { // Can I just do setupBoard here?
      boards.push(board);
    })
  }
  callback && callback(boards)
}
*/
function loadBoard(roomId, board, callback) {
  //roomId = socket.room;
  boardId = board.boardId;
  if (typeof rooms[roomId] === 'undefined') {
      //prepareRoom(socket.room);
      prepareRoom(roomId);
  }
  //rooms[roomId][boardId] = board['shapeStorage'];
  rooms[roomId][boardId] = board;
  //client.hmset(roomId, boardId, JSON.stringify(board['shapeStorage'])); 
  client.hmset(roomId, boardId, JSON.stringify(board), function() {
      callback && callback(board);
  }); 

    /* We don't need this if we store the taskSource in the board object
  if (board.task_id) {
      setTaskBoard(roomId, board.task_id, boardId).then(function() {
          callback(null, board);
      });
  } else {
      callback(null, board);
  }
  */
}
//function getOrCreateTaskBoard(socket, task_id, callback) {
function getOrCreateTaskBoard(socket, taskSource, callback) {
  var roomId = socket.room;
  if (typeof rooms[roomId] === 'undefined') {
      prepareRoom(socket.room);
  }
  //if (typeof taskBoards[roomId][task_id] === 'undefined') {
  //getTaskBoard(roomId, task_id).then(function(boardId) {
  getTaskBoard(roomId, taskSource).then(function(board) {
      //var setTaskBoardPromise;
      var boardId;
      var registeredTaskBoardPromise;
      if (board) { // task board already exists, return promise resolve to it.  FIXME: check this correctly
          console.log("Task board "+board.boardId+" exists in node");
          registeredTaskBoardPromise = Promise.resolve(board);
      } else { // task board not found in local DB.
          // create a task board and register it
          boardId = generateRandomId(5);
          console.log("Generating a new task board with boardId "+boardId);
          registeredTaskBoardPromise = new Promise(resolve => {
              board = prepareBoard(roomId, boardId);
              //resolve(shapeStorage);
              //board.taskSource = taskSource;
              board.task = { 'source': taskSource };
              registerTaskBoard(roomId, taskSource, board.boardId).then(function() { 
                  resolve(board)
              });
          });
      }
    //console.log("Task board for roomId "+roomId+" and task_id "+task_id+" does not exist. Creating it.");
          //setTaskBoardPromise = setTaskBoard(roomId, task_id, boardId).then(function(res) {
   //taskBoards[roomId][task_id] = boardId;
   //   } else {
   //     boardId = taskBoards[roomId][task_id];
        //console.log("Task board for roomId "+roomId+" and task_id "+task_id+" is "+boardId);
      //setTaskBoardPromise.then(function() {
      registeredTaskBoardPromise.then(function(board) {
          console.log("Task board "+board.boardId+" registered with "+taskSource+". Setting it up for socket");
          board = prepareBoardForSocket(socket, board.boardId)
          console.log("Task board "+board.boardId+" registered and setup for socket");
          callback(null, board);
      });
          /*
          console.log("Task board for roomId "+roomId+" and taskSource "+taskSource+" is "+board.boardId);
          if (typeof rooms[roomId][board.boardId] !== 'undefined') {
              callback(board)
          } else {
              prepareBoardForSocket(socket, boardId, function(board) {
                  callback(null, board);
              });
          }
      });
              */
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
  //setupBoards: setupBoards,

  getBoard: getBoard,
  //getBoardStorage: getBoardStorage,
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
    var userId = getUserIdFromSocket(socket);
//    new Promise(resolve => {
      if (typeof (((rooms[socket.room] || {})[shape.boardId] || {}).shapeStorage || {})[userId] === 'undefined') {
        prepareBoardForSocket(socket, shape.boardId);//, function() {
      }
    //it seems that the client was setting the socketId of the shape
    //rooms[socket.room][boardId][shape.socketId][shape.myid] = shape;
    //here the line has been modified to use the id of the current socket.
//          resolve();
//        })
//      } else {
//        resolve();
//      }
//    }).then(function() {
      rooms[socket.room][shape.boardId].shapeStorage[userId][shape.myid] = shape;
    //});
    console.log("Adding shape to room, socket, board:");
    console.log(socket.room);
    console.log(shape.socketId);
    console.log(shape.boardId);
  },

  editShape: function (shape, socket) {
    var userId = getUserIdFromSocket(socket);
    //new Promise(resolve => {
      //if (typeof ((rooms[socket.room] || {})[shape.boardId] || {}).shapeStorage[socket.id] === 'undefined') {
      if (typeof (((rooms[socket.room] || {})[shape.boardId] || {}).shapeStorage || {})[userId] === 'undefined') {
        prepareBoardForSocket(socket, shape.boardId);
      }
         // , function() {
    //it seems that the client was setting the socketId of the shape
    //rooms[socket.room][boardId][shape.socketId][shape.myid] = shape;
    //here the line has been modified to use the id of the current socket.
     //     resolve();
     //   })
     // } else {
     //   resolve();
     // }
    //}).then(function() {
      //if ( typeof rooms[socket.room][shape.boardId][socket.id][shape.myid] === 'undefined' ) {
      if (typeof rooms[socket.room][shape.boardId].shapeStorage[userId][shape.myid] === 'undefined') {
          return;
      }
      rooms[socket.room][shape.boardId].shapeStorage[userId][shape.myid]['mouseX'] = shape.mouseX;
      rooms[socket.room][shape.boardId].shapeStorage[userId][shape.myid]['mouseY'] = shape.mouseY;   
    //});
    console.log(rooms);
    console.log(socket.room);
    console.log(shape.socketId);
    console.log(shape.myid);
  },

  moveShape: function (shape, socket) {
    var userId = getUserIdFromSocket(socket);
  //  new Promise(resolve => {
      //if (typeof ((rooms[socket.room] || {})[shape.boardId] || {}).shapeStorage[socket.id] === 'undefined') {
      if (typeof (((rooms[socket.room] || {})[shape.boardId] || {}).shapeStorage || {})[userId] === 'undefined') {
        prepareBoardForSocket(socket, shape.boardId);//, function() {
      }
//          resolve();
//        })
//      } else {
//        resolve();
//      }
//    }).then(function() {
      if (typeof rooms[socket.room][shape.boardId].shapeStorage[userId][shape.myid] === 'undefined') {
          return;
      }
      var storedShape = rooms[socket.room][shape.boardId].shapeStorage[shape.socketId][shape.myid];
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
//    });
  },

  completePath: function (shape, socket) {
    var userId = getUserIdFromSocket(socket);
//    new Promise(resolve => {
      //if (typeof ((rooms[socket.room] || {})[shape.boardId] || {}).shapeStorage[socket.id] === 'undefined') {
      if (typeof (((rooms[socket.room] || {})[shape.boardId] || {}).shapeStorage || {})[userId] === 'undefined') {
        prepareBoardForSocket(socket, shape.boardId);//, function() {
      }
//          resolve();
//        })
//      } else {
//        resolve();
//      }
//    }).then(function() {
      if (typeof (((rooms[socket.room] || {})[shape.boardId] || {}).shapeStorage[userId] || {})[shape.myid] === 'undefined') {
          return;
      }
      rooms[socket.room][shape.boardId].shapeStorage[userId][shape.myid]['pathDProps'] = shape.pathDProps;
      //client.set(socket.room, JSON.stringify(rooms[socket.room][boardId]));
      client.hmset(socket.room, shape.boardId, JSON.stringify(rooms[socket.room][shape.boardId]));
    //});
  },

  completeShape: function (shape, socket) {
    var userId = getUserIdFromSocket(socket);
//    new Promise(resolve => {
      //if (typeof ((rooms[socket.room] || {})[shape.boardId] || {}).shapeStorage[socket.id] === 'undefined') {
      if (typeof (((rooms[socket.room] || {})[shape.boardId] || {}).shapeStorage || {})[userId] === 'undefined') {
        prepareBoardForSocket(socket, shape.boardId);//, function() {
      }
//          resolve();
//        })
//      } else {
//        resolve();
//      }
//    }).then(function() {
      if (typeof rooms[socket.room][shape.boardId].shapeStorage[userId][shape.myid] === 'undefined') {
          return;
      }
      if (shape.tool && shape.tool.text) {
        rooms[socket.room][shape.boardId].shapeStorage[userId][shape.myid]['tool'] = shape.tool;
      }
      //client.set(socket.room, JSON.stringify(rooms[socket.room][boardId]));
      client.hmset(socket.room, shape.boardId, JSON.stringify(rooms[socket.room][shape.boardId]));
//    });
  },

  deleteShape: function (shape, socket) {
    var userId = getUserIdFromSocket(socket);
//    new Promise(resolve => {
      //if (typeof ((rooms[socket.room] || {})[shape.boardId] || {}).shapeStorage[socket.id] === 'undefined') {
      if (typeof (((rooms[socket.room] || {})[shape.boardId] || {}).shapeStorage || {})[userId] === 'undefined') {
        prepareBoardForSocket(socket, shape.boardId);//, function() {
      }
//          resolve();
//        })
//      } else {
//        resolve();
//      }
//    }).then(function() {
      if (typeof (((rooms[socket.room] || {})[shape.boardId] || {}).shapeStorage[userId] || {})[shape.myid] === 'undefined') {
          return; //FIXME: add some warning messages to figure out why this is happening
      }
      console.log("deleting shape "+shape.myid);
      console.log("roomId: "+socket.room);
      console.log("boardId: "+shape.boardId);
      console.log("socketId: "+shape.socketId);
      console.log(rooms);
      console.log(rooms[socket.room][shape.boardId].shapeStorage[shape.socketId]);
      delete rooms[socket.room][shape.boardId].shapeStorage[shape.socketId][shape.myid];
      //client.set(socket.room, JSON.stringify(rooms[socket.room][shape.boardId])); 
      client.hmset(socket.room, shape.boardId, JSON.stringify(rooms[socket.room][shape.boardId])); 
//    });
  }

}

module.exports = roomsManager;
