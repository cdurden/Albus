var utils = require('./utils/util');
var client = require('./db/config');
var _ = require('underscore');

var rooms = {};
function getRoomData(roomId) {
    client.get(roomId, function (err, reply) {
      if (reply) {
        storedRoom = JSON.parse(reply);
        _.extend(rooms[roomId], storedRoom);
      } else {
        client.set(roomId, JSON.stringify({}));
        rooms[roomId] = {};
      }
      
      if (!rooms[roomId]) {
        rooms[roomId] = {};
      }
    });
}
function assignRoomToSocket(socket, roomId, callback) {
  client.hgetall(socket.id, function(err, result) {
    if (!result || typeof result.roomId === 'undefined' || socket.room != result.roomId) {
      console.log("assigning "+socket.id+" to room "+roomId)
      socket.room = roomId;
      client.hmset(socket.id, ['roomId', roomId], function(err, result) {
        socket.join(roomId);
          //socket.emit('clearBoard');
        room = getRoomData(roomId);
        room[socket.id] = {};
        socket.emit('showExisting', room);
        callback();
      });
    }
  });
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
var roomsManager = {

  getRooms: function () {
    return rooms;
  },
  
  getRoom: function (roomId) {
    return rooms[roomId];
  },
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

    client.get(roomId, function (err, reply) {
      if (reply) {
        storedRoom = JSON.parse(reply);
        _.extend(rooms[roomId], storedRoom);
      } else {
        client.set(roomId, JSON.stringify({}));
        rooms[roomId] = {};
      }
      
      if (!rooms[roomId]) {
        rooms[roomId] = {};
      }

      // add member to room based on socket id
      // console.log(rooms[roomId]);
      var socketId = socket.id;
      rooms[roomId][socketId] = {};
      socket.emit('showExisting', rooms[roomId]);
      //console.log(rooms[roomId]);
      
      var count = 0;
      for (var member in rooms[roomId]) {
        count++;
      }
      // console.log('Current room ' + roomId + ' has ' + count + ' members');
    });
  },

  addShape: function (shape, socket) {
    //console.log(socket);
    console.log(rooms);
    console.log(socket.room);
    console.log(shape.socketId);
    console.log(shape.myid);
    //it seems that the client was setting the socketId of the shape
    //rooms[socket.room][shape.socketId][shape.myid] = shape;
    //here the line has been modified to use the id of the current socket.
    rooms[socket.room][socket.id][shape.myid] = shape;
  },

  editShape: function (shape, socket) {
    console.log(rooms);
    console.log(socket.room);
    console.log(shape.socketId);
    console.log(shape.myid);
    //it seems that the client was setting the socketId of the shape
    //rooms[socket.room][shape.socketId][shape.myid]['mouseX'] = shape.mouseX;
    //rooms[socket.room][shape.socketId][shape.myid]['mouseY'] = shape.mouseY;   
    //here the line has been modified to use the id of the current socket.
    rooms[socket.room][socket.id][shape.myid]['mouseX'] = shape.mouseX;
    rooms[socket.room][socket.id][shape.myid]['mouseY'] = shape.mouseY;   
  },

  moveShape: function (shape, socket) {
    var storedShape = rooms[socket.room][shape.socketId][shape.myid];
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

  completePath: function (shape, socket) {
    rooms[socket.room][socket.id][shape.myid]['pathDProps'] = shape.pathDProps;
    client.set(socket.room, JSON.stringify(rooms[socket.room]));
  },

  completeShape: function (shape, socket) {
    if (shape.tool && shape.tool.text) {
      rooms[socket.room][socket.id][shape.myid]['tool'] = shape.tool;
    }
    client.set(socket.room, JSON.stringify(rooms[socket.room]));
  },

  deleteShape: function (shape, socket) {
    delete rooms[socket.room][shape.socketId][shape.myid];
    client.set(socket.room, JSON.stringify(rooms[socket.room])); 
  }

}

module.exports = roomsManager;
