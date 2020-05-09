angular.module('whiteboard.services.broadcast', [])
.factory('Broadcast', function (Sockets) {

  var socketUserId;

  var getSocketId = function () {
    return socketUserId;
  };

  var saveSocketId = function (id) {
    socketUserId = id;
  };

 // Sockets.emit('idRequest');

  var newShape = function (myid, socketId, tool, initX, initY) {
    Sockets.emit('newShape', {
      myid: myid,
      socketId: socketId,
      tool: tool,
      initX: initX,
      initY: initY
    });
  };

  var editShape = function (myid, socketId, currentTool, mouseX, mouseY) {
    var data = {};
    data.mouseX = mouseX;
    data.mouseY = mouseY;
    data.myid = myid;
    data.socketId = socketId;
    data.tool = currentTool;
    Sockets.emit('editShape', data);
  };

  var finishPath = function (myid, currentTool, pathDProps) {
    Sockets.emit('pathCompleted', {
      myid: myid,
      tool: currentTool,
      pathDProps: pathDProps
    });
  };

  var finishCopiedPath = function (myid, currentTool, pathDProps) {
    Sockets.emit('copiedPathCompleted', {
      myid: myid,
      tool: currentTool,
      pathDProps: pathDProps
    });
  };

  var finishShape = function (myid, currentTool) {
    Sockets.emit('shapeCompleted', {
      myid: myid,
      tool: currentTool
    });
  };

  var deleteShape = function (myid, socketId) {
    Sockets.emit('deleteShape', {
      myid: myid,
      socketId: socketId
    })
  };

  var moveShape = function (shape, x, y) {
    var type = shape.type;
    Sockets.emit('moveShape', {
      myid: shape.myid,
      socketId: shape.socketId,
      x: x,
      y: y,
      attr: shape.attr(),
      pathDProps: shape.pathDProps
    });
  };

  var finishMovingShape = function (shape) {
    Sockets.emit('finishMovingShape', {
      myid: shape.myid,
      socketId: shape.socketId,
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
  var loadSubmissions = function (assignment) {
    Sockets.emit('loadSubmissions', assignment)
  };
  var loadFeedback = function (feedback) {
    Sockets.emit('loadFeedback', feedback)
  };
  var getLatestBoardFromApi = function (data) {
    Sockets.emit('getLatestBoardFromApi', data)
  };

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
    loadSubmissions: loadSubmissions,
    loadFeedback: loadFeedback,
    getLatestBoardFromApi: getLatestBoardFromApi,
    getOrCreateTaskBoard: getOrCreateTaskBoard,
    getBoardStorage: getBoardStorage,
  };

});
