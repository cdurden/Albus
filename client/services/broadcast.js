angular.module('whiteboard.services.broadcast', [])
.factory('Broadcast', function (Sockets) {

  var socketUserId;

  var getSocketId = function () {
    return socketUserId;
  };

  var saveSocketId = function (id) {
    socketUserId = id;
  };

  Sockets.emit('idRequest');

  var getBoardStorage = function (boardId) {
    Sockets.emit('getBoardStorage', boardId);
  };

  var newShape = function (myid, socketId, boardId, tool, initX, initY) {
    Sockets.emit('newShape', {
      myid: myid,
      socketId: socketId,
      boardId: boardId,
      tool: tool,
      initX: initX,
      initY: initY
    });
  };

  var editShape = function (myid, socketId, boardId, currentTool, mouseX, mouseY) {
    var data = {};
    data.boardId = boardId;
    data.mouseX = mouseX;
    data.mouseY = mouseY;
    data.myid = myid;
    data.socketId = socketId;
    data.tool = currentTool;
    Sockets.emit('editShape', data);
  };

  var finishPath = function (myid, boardId, currentTool, pathDProps) {
    Sockets.emit('pathCompleted', {
      myid: myid,
      tool: currentTool,
      boardId: boardId,
      pathDProps: pathDProps
    });
  };

  var finishCopiedPath = function (myid, boardId, currentTool, pathDProps) {
    Sockets.emit('copiedPathCompleted', {
      myid: myid,
      tool: currentTool,
      boardId: boardId,
      pathDProps: pathDProps
    });
  };

  var finishShape = function (myid, boardId, currentTool) {
    Sockets.emit('shapeCompleted', {
      myid: myid,
      boardId: boardId,
      tool: currentTool
    });
  };

  var deleteShape = function (myid, socketId, boardId) {
    Sockets.emit('deleteShape', {
      myid: myid,
      boardId: boardId,
      socketId: socketId
    })
  };

  var moveShape = function (shape, boardId, x, y) {
    var type = shape.type;
    Sockets.emit('moveShape', {
      myid: shape.myid,
      socketId: shape.socketId,
      boardId: boardId,
      x: x,
      y: y,
      attr: shape.attr(),
      pathDProps: shape.pathDProps
    });
  };

  var finishMovingShape = function (shape, boardId) {
    Sockets.emit('finishMovingShape', {
      myid: shape.myid,
      socketId: shape.socketId,
      boardId: boardId,
      attr: shape.attr()
    })
  };

  var chat = function (msg) {
    Sockets.emit('chat message', msg)
  };
  var raiseHand = function(msg) {
    Sockets.emit('raiseHand', msg)
  };
  var submit = function(msg) {
    Sockets.emit('submit', msg)
  };
  var saveBoardToApi = function (data) {
    Sockets.emit('saveBoardToApi', data)
  };
  var loadBoardFromApi = function (data) {
    Sockets.emit('loadBoardFromApi', data)
  };
  var loadBoards = function (assignment) {
    Sockets.emit('loadBoards', assignment)
  };
  var getLatestBoardFromApi = function (data) {
    Sockets.emit('getLatestBoardFromApi', data)
  };
  var getOrCreateTaskBoard = function(taskId) {
    Sockets.emit('getOrCreateTaskBoard', taskId);
  }

  return {
    getSocketId: getSocketId,
    saveSocketId: saveSocketId,
    newShape: newShape,
    editShape: editShape,
    finishPath: finishPath,
    finishCopiedPath: finishCopiedPath,
    finishShape: finishShape,
    deleteShape: deleteShape,
    finishMovingShape: finishMovingShape,
    chat: chat,
    raiseHand: raiseHand,
    submit: submit,
    moveShape: moveShape,
    saveBoardToApi: saveBoardToApi,
    loadBoardFromApi: loadBoardFromApi,
    loadBoards: loadBoards,
    getLatestBoardFromApi: getLatestBoardFromApi,
    getOrCreateTaskBoard: getOrCreateTaskBoard,
    getBoardStorage: getBoardStorage,
  };

});
