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

  var getBoardStorage = function (boardId) {
    Sockets.emit('getBoardStorage', boardId);
  };
  var getFeedback = function (board_ids) {
    Sockets.emit('getFeedback', board_ids);
  };
  var getFeedbackById = function (feedback_id) {
    Sockets.emit('getFeedbackById', feedback_id);
  };
  var getFeedbackReceived = function (board_ids) {
    Sockets.emit('getFeedbackReceived', board_ids);
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
  var getBoardFromApi = function (data) {
    Sockets.emit('getBoardFromApi', data)
  };
    /*
  var getBoards = function (assignment) {
    Sockets.emit('getBoards', assignment)
  };
  */
  var getAssignmentBoards = function (assignment) {
    Sockets.emit('getAssignmentBoards', assignment)
  };
  var getRoomBoards = function () {
    Sockets.emit('getRoomBoards')
  };
  var getSubmissions = function (state) {
    Sockets.emit('getSubmissions', state)
  };
  var getSubmissionsReceived = function (state) {
    Sockets.emit('getSubmissionsReceived', state)
  };
    /*
  var getFeedback = function (feedback) {
    Sockets.emit('getFeedback', feedback)
  };
  */
  var getLatestBoardFromApi = function (data) {
    Sockets.emit('getLatestBoardFromApi', data)
  };
  var getOrCreateTaskBoard = function(taskId) {
    Sockets.emit('getOrCreateTaskBoard', taskId);
  }
  function getInboxes() {
    Sockets.emit('getInboxes');
  };
  function getAssignmentsReceived() {
    Sockets.emit('getAssignmentsReceived');
  };
  function createSubmissionBox(label) {
    Sockets.emit('createSubmissionBox', label);
  };
  function getSubmissionBox(box_id) {
    Sockets.emit('getSubmissionBox', box_id);
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
    getBoardFromApi: getBoardFromApi,
    //getBoards: getBoards,
    getAssignmentBoards: getAssignmentBoards,
    getRoomBoards: getRoomBoards,
    getSubmissions: getSubmissions,
    getSubmissionsReceived: getSubmissionsReceived,
    //getFeedback: getFeedback,
    getLatestBoardFromApi: getLatestBoardFromApi,
    getOrCreateTaskBoard: getOrCreateTaskBoard,
    getBoardStorage: getBoardStorage,
    getFeedback: getFeedback,
    getFeedbackReceived: getFeedbackReceived,
    getInboxes: getInboxes,
    getAssignmentsReceived: getAssignmentsReceived,
    createSubmissionBox: createSubmissionBox,
    getSubmissionBox: getSubmissionBox,
    getFeedbackById: getFeedbackById,
  };

});
