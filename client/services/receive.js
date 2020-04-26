angular.module('whiteboard.services.receive', [])
.factory('Receive', function (Sockets, EventHandler) {
  Sockets.on('showExisting', function (data) {
    console.log("show existing");
    console.log(data);
    for (socketId in data) {
      if (Object.keys(data[socketId]).length) {
        for (id in data[socketId]) {
          var thisShape = data[socketId][id];
          if (thisShape.tool.name === 'path') {
            EventHandler.drawExistingPath(thisShape);
          } else if (thisShape.initX && thisShape.initY) {
            EventHandler.createShape(id, socketId, thisShape.tool, thisShape.initX, thisShape.initY);
            if (thisShape.tool.name !== 'text') {
              EventHandler.editShape(id, socketId, thisShape.tool, thisShape.mouseX, thisShape.mouseY);
            }
            EventHandler.finishShape(thisShape.myid, thisShape.socketId, thisShape.tool);
          }
        }
      }
    }
  });
  Sockets.on('boardStorage', function (data) {
    console.log("got board storage");
    console.log(data);
    EventHandler.updateBoardStorage(data.boardId, data.shapeStorage);
  });
  Sockets.on('board', function (data) {
    console.log("got board");
    console.log(data);
    EventHandler.addBoard(data);
  });
  Sockets.on('boards', function (boards) {
    for (board in boards) {
      EventHandler.addBoard(boards[board]);
    }
  });
  Sockets.on('taskBoards', function (taskBoards) {
    for (taskId in taskBoards) {
      EventHandler.setTaskBoard(taskBoards[taskId], taskId);
    }
  });
  Sockets.on('clearBoard', function (data) {
    "clearing the board";
    EventHandler.clearBoard();
  });

  Sockets.on('heartbeat', function () {
    Sockets.emit('heartbeat');
  })

  Sockets.on('socketId', function (data) {
    EventHandler.setSocketId(data.socketId);
  });

  Sockets.on('shapeEdited', function (data) {
    EventHandler.editShape(data.myid, data.socketId, data.boardId, data.tool, data.mouseX, data.mouseY);
  });

  Sockets.on('shapeCompleted', function (data) {
    EventHandler.finishShape(data.myid, data.socketId, data.boardId, data.tool);
  });

  Sockets.on('copiedPathCompleted', function (data) {
    EventHandler.finishCopiedPath(data.myid, data.socketId, data.boardId, data.tool, data.pathDProps);
  });

  Sockets.on('shapeCreated', function (data) {
    EventHandler.createShape(data.myid, data.socketId, data.boardId, data.tool, data.initX, data.initY);
  });

  Sockets.on('shapeMoved', function (data) {
    EventHandler.moveShape(data, data.x, data.y);
  });

  Sockets.on('shapeFinishedMoving', function (data) {
    EventHandler.finishMovingShape(data.myid, data.socketId, data.boardId);
  });

  Sockets.on('shapeDeleted', function (data) {
    EventHandler.deleteShape(data.myid, data.socketId, data.boardId);
  });

    /*
  Sockets.on('chat message', function (msg) {
    EventHandler.displayMessage(msg);
  })
  */
  Sockets.on('tasks', function (data) {
    console.log(data);
    EventHandler.setTasks(data);
  })
  Sockets.on('submissionConfirmation', function (data) {
    console.log(data);
    EventHandler.confirmTaskSubmission(data);
  })

  return {};

});
