angular.module('whiteboard.services.eventhandler', [])
.factory('EventHandler', ['BoardData', 'FeedData', 'TaskData', 'ShapeBuilder', 'ShapeEditor', 'ShapeManipulation', 'Snap', function (BoardData, FeedData, TaskData, ShapeBuilder, ShapeEditor, ShapeManipulation, Snap) {

  function clearBoard() {
    BoardData.clearBoard();
  };

  function setSocketId (socketId) {
    BoardData.setSocketId(socketId);
  };

  function createShape (id, socketId, tool, x, y) {
    ShapeBuilder.newShape(id, socketId, tool, x, y);
  }

  function editShape (id, socketId, tool, x, y) {
    ShapeEditor.editShape(id, socketId, tool, x, y);
  }

  function finishShape (id, socketId, tool) {
    ShapeEditor.finishShape(id, socketId, tool);
  }

  function finishCopiedPath (id, socketId, tool, pathDProps) {
    ShapeEditor.finishCopiedPath(id, socketId, tool, pathDProps);
  }

  function deleteShape (id, socketId) {
    ShapeEditor.deleteShape(id, socketId);
  }

  function moveShape (shape, x, y) {
    ShapeManipulation.moveShape(shape.myid, shape.socketId, x, y);
  }

  function finishMovingShape (id, socketId) {
    ShapeManipulation.finishMovingShape(id, socketId);
  }

  function drawExistingPath (shape) {
    ShapeBuilder.drawExistingPath(shape);
    var currentShape = BoardData.getShapeById(shape.myid, shape.socketId);
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
  };
}]);
