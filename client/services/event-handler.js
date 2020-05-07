angular.module('whiteboard.services.eventhandler', [])
.factory('EventHandler', ['BoardData', 'FeedData', 'TaskData', 'ShapeBuilder', 'ShapeEditor', 'ShapeManipulation', 'Snap', 'Broadcast', 'Screenshot', function (BoardData, FeedData, TaskData, ShapeBuilder, ShapeEditor, ShapeManipulation, Snap, Broadcast, Screenshot) {

  function clearBoard() {
    //shapeStorage = {};
    BoardData.getCanvas() && BoardData.getCanvas().empty();
  }
  function saveBoardToApi(boardId) {
    var board = BoardData.getBoardObj(boardId);
    data = {
        'taskId': board.task.id,
        'boardId': board.id,
    };
    Broadcast.saveBoardToApi(data);
    /*
    Broadcast.saveBoardToApi(BoardData.getBoardObj(boardId));
    */
  }
  function loadBoard(id) {
    if (id !== BoardData.getBoardId()) {
        clearBoard();
    }
    BoardData.setBoardById(id); //FIXME: this is probably not needed here
    if (BoardData.getBoardObj(id).needsUpdate) {
        Broadcast.getBoardStorage(id);
    } else {
        BoardData.getBoardData().boardId = id;
        drawBoard();
    }
  }

  function loadBoards(assignment) {
    Broadcast.loadBoards(assignment);
  }
  function loadSubmissions() {
    Broadcast.loadSubmissions();
  }
  function loadBoardFromApi(id) {
    Broadcast.loadBoardFromApi(id);
  }


  function setSocketId (socketId) {
    BoardData.setSocketId(socketId);
  };

  function createShape (id, socketId, boardId, tool, x, y) {
    if (BoardData.getBoardId() === boardId) {
      ShapeBuilder.newShape(id, socketId, boardId, tool, x, y);
    } else {
      BoardData.getBoardObj(boardId).needsUpdate = true;
      //BoardData.pushToStorage(id, socketId, boardId, { 'myid': id, 'socketId': socketId, 'boardId': boardId, 'tool': tool, 'initX': x, 'initY': y });
    }
  }

  function editShape (id, socketId, boardId, tool, x, y) {
    if (BoardData.getBoardId() === boardId) {
      ShapeEditor.editShape(id, socketId, boardId, tool, x, y);
    } else {
      BoardData.getBoardObj(boardId).needsUpdate = true;
      //BoardData.getBoardObj(boardId).shapeStorage[socketId][id]['mouseX'] = x;
      //BoardData.getBoardObj(boardId).shapeStorage[socketId][id]['mouseY'] = y;
    }
  }

  function finishShape (id, socketId, boardId, tool) {
    if (BoardData.getBoardId() === boardId) {
      ShapeEditor.finishShape(id, socketId, boardId, tool);
    } else {
      BoardData.getBoardObj(boardId).needsUpdate = true;
      //BoardData.getBoardObj(boardId).shapeStorage[socketId][id]['tool'] = tool;
    }
  }

  function finishCopiedPath (id, socketId, boardId, tool, pathDProps) {
    if (BoardData.getBoardId() === boardId) {
      ShapeEditor.finishCopiedPath(id, socketId, boardId, tool, pathDProps);
    } else {
      BoardData.getBoardObj(boardId).needsUpdate = true;
    }
  }

  function deleteShape (id, socketId, boardId) {
    if (BoardData.getBoardId() === boardId) {
      ShapeEditor.deleteShape(id, socketId, boardId);
    } else {
      BoardData.getBoardObj(boardId).needsUpdate = true;
    }
  }

  function moveShape (shape, x, y) {
    if (BoardData.getBoardId() === boardId) {
      ShapeManipulation.moveShape(shape.myid, shape.socketId, shape.boardId, x, y);
    } else {
      BoardData.getBoardObj(boardId).needsUpdate = true;
    }
  }

  function finishMovingShape (id, socketId, boardId) {
    if (BoardData.getBoardId() === boardId) {
      ShapeManipulation.finishMovingShape(id, socketId, boardId);
    } else {
      BoardData.getBoardObj(boardId).needsUpdate = true;
    }
  }

  function drawExistingPath (shape) {
    ShapeBuilder.drawExistingPath(shape);
    var currentShape = BoardData.getShapeById(shape.myid, shape.socketId, shape.boardId);
    ShapeManipulation.pathSmoother(currentShape);
  }

  function cursor (screenPosition) {
    var cursor = BoardData.getCursor() || BoardData.setCursor();
    BoardData.moveCursor(screenPosition);
  }

  function grabShape (screenPosition) {
    var x = Math.floor(screenPosition[0]);
    var y = Math.floor(screenPosition[1]);

    var currentEditorShape;

    currentEditorShape = BoardData.getEditorShape();

    if (!currentEditorShape) {
      var shape = BoardData.getBoard().getElementByPoint(x, y);
      if (shape) {
        BoardData.setEditorShape(shape);
        currentEditorShape = BoardData.getEditorShape();
      }
    } else {
      moveShape(currentEditorShape, x, y);
    }
  }

  function displayMessage(msg) {
      var li = document.createElement("li");
      var t = document.createTextNode(msg);
      li.appendChild(t);
      FeedData.getFeed().append(li);
  }
  function setTask(data) {
      TaskData.setTask(data);
  }
  function setTasks(data) {
      TaskData.setTasks(data);
      BoardData.joinTasksToBoards(data)
  }
  function addBoard(data) {
    BoardData.addBoard(data);
  };
  function updateBoards(boards) {
    BoardData.updateBoards(boards);
    BoardData.joinTasksToBoards(TaskData.getTasks());
  };
  function setTaskBoard(boardId, taskId) {
    BoardData.setTaskBoard(boardId, taskId);
  };
  function resetBoards() {
    BoardData.resetBoards();
  };
  function updateBoardStorage(boardId, shapeStorage) {
    BoardData.updateBoardStorage(boardId, shapeStorage);
    if (BoardData.getBoardId() == boardId) {
        drawBoard();
    }
  };
    /*
  function drawBoard() {
    clearBoard();
    data = BoardData.getBoardObj().data;
    for (socketId in data) {
      if (Object.keys(data[socketId]).length) {
        for (id in data[socketId]) {
          var thisShape = data[socketId][id];
          if (thisShape.tool.name === 'path') {
            drawExistingPath(thisShape);
          } else if (thisShape.initX && thisShape.initY) {
            createShape(id, socketId, thisShape.boardId, thisShape.tool, thisShape.initX, thisShape.initY);
            if (thisShape.tool.name !== 'text') {
              editShape(id, socketId, thisShape.boardId, thisShape.tool, thisShape.mouseX, thisShape.mouseY);
            }
            finishShape(thisShape.myid, thisShape.socketId, thisShape.boardId, thisShape.tool);
          }
        }
      }
    }
  };
  */
  function drawBoard() {
    clearBoard();
    shapeStorage = BoardData.getBoardObj().shapeStorage;
    for (socketId in shapeStorage) {
      if (Object.keys(shapeStorage[socketId]).length) {
        for (id in shapeStorage[socketId]) {
          var thisShape = shapeStorage[socketId][id];
          if (thisShape.tool.name === 'path') {
            drawExistingPath(thisShape);
          } else if (thisShape.initX && thisShape.initY) {
            createShape(id, socketId, thisShape.boardId, thisShape.tool, thisShape.initX, thisShape.initY);
            if (thisShape.tool.name !== 'text') {
              editShape(id, socketId, thisShape.boardId, thisShape.tool, thisShape.mouseX, thisShape.mouseY);
            }
            finishShape(thisShape.myid, thisShape.socketId, thisShape.boardId, thisShape.tool);
          }
        }
      }
    }
  };

  function screenshot() {
      Screenshot.screenshot();
  }
  var activateNav = function() {
    var $canvas = BoardData.getCanvas();
    var $container = $canvas.parent();
    $container.css("pointer-events", "none");
    $container.children().css("pointer-events", "none");
  }
  var activateDraw = function() {
    var $canvas = BoardData.getCanvas();
    var $container = $canvas.parent();
    $container.css("pointer-events", "all");
    $container.children().css("pointer-events", "all");
  }

  return {
    cursor: cursor,
    setSocketId: setSocketId,
    createShape: createShape,
    editShape: editShape,
    finishShape: finishShape,
    finishCopiedPath: finishCopiedPath,
    deleteShape: deleteShape,
    moveShape: moveShape,
    finishMovingShape: finishMovingShape,
    drawExistingPath: drawExistingPath,
    grabShape: grabShape,
    displayMessage: displayMessage,
    setTask: setTask,
    setTasks: setTasks,
    clearBoard: clearBoard,
    addBoard: addBoard,
    drawBoard: drawBoard,
    updateBoardStorage: updateBoardStorage,
    updateBoards: updateBoards,
    loadBoard: loadBoard,
    loadBoardFromApi: loadBoardFromApi,
    loadBoards: loadBoards,
    saveBoardToApi: saveBoardToApi,
    screenshot: screenshot,
    activateNav: activateNav,
    activateDraw: activateDraw,
    loadSubmissions: loadSubmissions,
  };
}]);
