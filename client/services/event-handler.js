angular.module('whiteboard.services.eventhandler', [])
.factory('EventHandler', ['BoardData', 'FeedData', 'TaskData', 'ShapeBuilder', 'ShapeEditor', 'ShapeManipulation', 'Snap', function (BoardData, FeedData, TaskData, ShapeBuilder, ShapeEditor, ShapeManipulation, Snap) {

  function clearBoard() {
    BoardData.clearBoard();
  };

  function setSocketId (socketId) {
    BoardData.setSocketId(socketId);
  };

  function createShape (id, socketId, boardId, tool, x, y) {
    ShapeBuilder.newShape(id, socketId, boardId, tool, x, y);
  }

  function editShape (id, socketId, boardId, tool, x, y) {
    ShapeEditor.editShape(id, socketId, boardId, tool, x, y);
  }

  function finishShape (id, socketId, boardId, tool) {
    ShapeEditor.finishShape(id, socketId, boardId, tool);
  }

  function finishCopiedPath (id, socketId, boardId, tool, pathDProps) {
    ShapeEditor.finishCopiedPath(id, socketId, boardId, tool, pathDProps);
  }

  function deleteShape (id, socketId, boardId) {
    ShapeEditor.deleteShape(id, socketId, boardId);
  }

  function moveShape (shape, x, y) {
    ShapeManipulation.moveShape(shape.myid, shape.socketId, shape.boardId, x, y);
  }

  function finishMovingShape (id, socketId, boardId) {
    ShapeManipulation.finishMovingShape(id, socketId, boardId);
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
  }
  function addBoard(data) {
    BoardData.addBoard(data);
  };
  function setTaskBoard(boardId, taskId) {
    BoardData.setTaskBoard(boardId, taskId);
  };
  function resetBoards() {
    BoardData.resetBoards();
  };
  function drawBoard() {
    BoardData.clearBoard();
    shapeStorage = BoardData.getBoardObj().shapeStorage;
    for (socketId in shapeStorage) {
      if (Object.keys(shapeStorage[socketId]).length) {
        for (id in shapeStorage[socketId]) {
          var thisShape = shapeStorage[socketId][id];
          if (thisShape.tool.name === 'path') {
            drawExistingPath(thisShape);
          } else if (thisShape.initX && thisShape.initY) {
            createShape(id, socketId, thisShape.tool, thisShape.initX, thisShape.initY);
            if (thisShape.tool.name !== 'text') {
              editShape(id, socketId, thisShape.tool, thisShape.mouseX, thisShape.mouseY);
            }
            finishShape(thisShape.myid, thisShape.socketId, thisShape.tool);
          }
        }
      }
    }
  };

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
  };
}]);
