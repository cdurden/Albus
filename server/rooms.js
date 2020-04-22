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

function assignRoomToSocket(socket, roomId, callback) {
  if (socket.room != roomId) {
    console.log("assigning "+socket.id+" to room "+roomId)
    client.hmset(socket.id, ['roomId', roomId], function(err, result) {
      socket.room = roomId;
      socket.join(roomId);
      socket.emit('clearBoard');
      setupBoards(socket, function (boards) {
        console.log("Sending boards to "+socket.id);
        socket.emit('boards', boards);
        socket.emit('taskBoards', taskBoards);
        callback && callback();
      });
    });
  }
}
function placeSocket(socket, callback) {
  console.log("placing socket");
  client.hgetall(socket.id, function(err, result) {
    console.log(result);
    var roomId;
    if (result !== null && 'roomId' in result) {
      roomId = result['roomId'];
    } else {
      roomId = utils.generateRandomId(5);
    }
    if (socket.room != roomId) {
      assignRoomToSocket(socket, roomId, callback);
    }
  });
}
function getBoard(roomId, boardId) {
    return(rooms[roomId][boardId]);
}
function setupRoom(socket, callback) {
    roomId = socket.room;
    rooms[roomId] = {};
    callback && callback(rooms[roomId]);
}
function setupBoard(socket, boardId, callback) {
    setupRoom(socket, callback);
    client.hget(roomId, boardId, function (err, reply) {
      if (typeof rooms[roomId] === 'undefined') {
          setupRoom(socket)
      }
      if (reply) {
        storedBoard = JSON.parse(reply);
        _.extend(rooms[roomId][boardId], storedBoard);
      } else {
        //client.set(roomId, JSON.stringify({}));
        client.hmset(roomId, boardId, JSON.stringify({})); 
        rooms[roomId][boardId] = {};
      }
      console.log("Setting up board for socket "+socket.id);
      console.log("Redis board data");
      console.log(reply);
      
      if (!rooms[roomId][boardId]) {
        rooms[roomId][boardId] = {};
      }
      rooms[roomId][boardId][socket.id] = {};
      console.log("Application board data");
      console.log(rooms[roomId][boardId]);
      callback(rooms[roomId][boardId]);
    });
}
function setupBoards(socket, callback) {
  var boards = [];
  if (typeof rooms[socket.room] === 'undefined') {
      setupRoom(socket);
  }
  for (boardId in rooms[socket.room]) {
    setupBoards(socket, boardId, function(board) {
      boards.push(board);
    })
  }
  callback && callback(boards)
}
function loadBoard(socket, board, callback) {
  roomId = socket.room;
  if (typeof rooms[roomId] === 'undefined') {
      setupRoom(socket);
  }
  rooms[roomId][board.id] = board['data'];
  if (board.task_id) {
      if (typeof taskBoards[roomId] === 'undefined') {
          taskBoards[roomId] = {};
      }
      taskBoards[roomId][board.task_id] = board.id
  }
  setupBoard(socket, board.id, callback);
}
function createTaskBoard(socket, taskId, callback) {
  roomId = socket.room;
  boardId = generateRandomId(5);
  rooms[roomId][boardId] = {};
  if (typeof taskBoards[roomId] === 'undefined') {
    taskBoards[roomId] = {};
  }
  setupBoard(socket, boardId, callback);
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

  getBoard: getBoard,
  loadBoard: loadBoard,

  placeSocket: placeSocket,
  assignRoomToSocket: assignRoomToSocket,

  
  addMember: function (socket, roomId) {

    // ensure there isn't double counting of roomIds in client side ('/roomId' and 'roomId' emit separately)
    if (roomId[0] === '/') {
      roomId = roomId.slice(1);
    }

    socket.room = roomId;
    socket.join(roomId);

    if (!rooms[roomId]) {
      rooms[roomId] = {};
    }

    client.hget(roomId, function (err, reply) {
      if (reply) {
        storedRoom = JSON.parse(reply);
        _.extend(rooms[roomId], storedRoom);
      } else {
        //client.set(roomId, JSON.stringify({}));
        //client.hmset(roomId, boardId, JSON.stringify({}));
        rooms[roomId] = {};
      }
      
      if (!rooms[roomId]) {
        rooms[roomId] = {};
      }

      // add member to room based on socket id
      // console.log(rooms[roomId]);
      var socketId = socket.id;
      rooms[roomId][socketId] = {};
      console.log("Sending showExisting to "+roomId);
      socket.emit('showExisting', rooms[roomId]);
      //console.log(rooms[roomId]);
      
      var count = 0;
      for (var member in rooms[roomId]) {
        count++;
      }
      // console.log('Current room ' + roomId + ' has ' + count + ' members');
    });
  },

  addShape: function (shape, socket, boardId) {
    //console.log(socket);
    console.log("Adding shape to room, socket, board:");
    console.log(socket.room);
    console.log(shape.socketId);
    console.log(boardId);
    //it seems that the client was setting the socketId of the shape
    //rooms[socket.room][boardId][shape.socketId][shape.myid] = shape;
    //here the line has been modified to use the id of the current socket.
    rooms[socket.room][boardId][socket.id][shape.myid] = shape;
  },

  editShape: function (shape, socket, boardId) {
    console.log(rooms);
    console.log(socket.room);
    console.log(shape.socketId);
    console.log(shape.myid);
    //it seems that the client was setting the socketId of the shape
    //rooms[socket.room][boardId][shape.socketId][shape.myid]['mouseX'] = shape.mouseX;
    //rooms[socket.room][boardId][shape.socketId][shape.myid]['mouseY'] = shape.mouseY;   
    //here the line has been modified to use the id of the current socket.
    rooms[socket.room][boardId][socket.id][shape.myid]['mouseX'] = shape.mouseX;
    rooms[socket.room][boardId][socket.id][shape.myid]['mouseY'] = shape.mouseY;   
  },

  moveShape: function (shape, socket, boardId) {
    var storedShape = rooms[socket.room][boardId][shape.socketId][shape.myid];
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
  },

  completePath: function (shape, socket, boardId) {
    rooms[socket.room][boardId][socket.id][shape.myid]['pathDProps'] = shape.pathDProps;
    //client.set(socket.room, JSON.stringify(rooms[socket.room][boardId]));
    client.hmset(socket.room, boardId, JSON.stringify(rooms[socket.room][boardId]));
  },

  completeShape: function (shape, socket, boardId) {
    if (shape.tool && shape.tool.text) {
      rooms[socket.room][boardId][socket.id][shape.myid]['tool'] = shape.tool;
    }
    //client.set(socket.room, JSON.stringify(rooms[socket.room][boardId]));
    client.hmset(socket.room, boardId, JSON.stringify(rooms[socket.room][boardId]));
  },

  deleteShape: function (shape, socket, boardId) {
    console.log("deleting shape "+shape.myid);
    console.log("roomId: "+socket.room);
    console.log("socketId: "+shape.socketId);
    console.log(rooms);
    console.log(rooms[socket.room][boardId][shape.socketId]);
    delete rooms[socket.room][boardId][shape.socketId][shape.myid];
    //client.set(socket.room, JSON.stringify(rooms[socket.room][boardId])); 
    client.hmset(socket.room, boardId, JSON.stringify(rooms[socket.room][boardId])); 
  }

}

module.exports = roomsManager;
