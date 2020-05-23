angular.module('whiteboard.services.boarddata', [])
.factory('BoardData', ['Broadcast', '$rootScope', function (Broadcast, $rootScope) {
  //svgWidth/Height are the width and height of the DOM element
  var svgWidth = 1500; //sizeX
  var svgHeight = 1000; //sizeY
  //offsetX/Y measure the top-left point of the viewbox
  var offsetX = 0;
  var offsetY = 0;
  //scalingFactor is the level of zooming relative to the start
  var scalingFactor = 1;
  var taskId;
  //var boardId;
  var board;
  var boards = {};
  var boardData = {'boards': boards, boardIndexObject: {}, feedbackList: [], 'submissions': [], 'assignmentBoards': {}, 'freeBoards': {}};
  var boardIdsObject = {};
  var taskBoards = {};
  var $canvas;
  //canvasMarginX/Y are the left and top margin of the SVG in the browser
  var canvasMarginX; //canvasX
  var canvasMarginY; //canvasY
  //viewBoxWidth/Height are needed for zooming
  var viewBoxWidth;// = svgWidth;
  var viewBoxHeight;// = svgHeight;
  var cursor;
  var shapeStorage = {};
  var currentShape;
  var currentShapeId;
  var editorShape;
  var socketId;

  var tool = {
    name: 'path',
    'stroke-width': 3,
    colors: {
      fill: 'transparent',
      stroke: '#000000'
    }
  };
  function getBoardData() {
      return boardData;
  }
  function generateRandomId(length) {
    var id = "";
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < length; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return id;
  }
  function createBoard (element) {
    //var container = element[0];
    //ResizeSensorApi.create(document.getElementsByClassName('app-container')[0], handleWindowResize);
    //ResizeSensorApi.create(container, handleWindowResize);
    //var container = element.find("#drawing-space")[0];
    //ResizeSensorApi.create(container, function() {});

    //board = Raphael(container);
    boardElmt = Raphael(element[0]);
    boardElmt.setViewBox(0, 0, svgWidth, svgHeight, true);
    boardElmt.canvas.setAttribute('preserveAspectRatio', 'none');

    $canvas = element.find('svg');
    canvasMarginX = $canvas.position().left;
    canvasMarginY = $canvas.position().top;
    //canvasMarginX = $canvas.offset().left; // TODO: see if this has negative consequences relative to the previous two lines
    //canvasMarginY = $canvas.offset().top;
  }
  function setCanvasMargins(x, y) {
    canvasMarginX = x; // TODO: see if this has negative consequences relative to the previous two lines
    canvasMarginY = y;
  }

    /*
  function handleWindowResize (newPageSize) {
    svgWidth = newPageSize.width;
    svgHeight = newPageSize.height;

    viewBoxWidth = svgWidth * scalingFactor;
    viewBoxHeight = svgHeight * scalingFactor;
    var offset = getOffset();
    board.setViewBox(offset.x, offset.y, viewBoxWidth, viewBoxHeight, true);
  }
  */

  function getBoardElmt() {
    return boardElmt;
  }
  function getBoardId () {
    return boardData.boardId;
  }

  function getCursor() {
    return cursor;
  }

  function setCursor () {
    cursor = board.circle(window.innerWidth / 2, window.innerHeight / 2, 5);
    return cursor;
  }

  function moveCursor (screenPosition) {
    cursor.attr({
      cx: Math.floor(screenPosition[0]),
      cy: Math.floor(screenPosition[1])
    })
  }

  function setEditorShape (shape) {
    editorShape = shape;
  }

  function unsetEditorShape () {
    editorShape = null;
  }

  function getEditorShape () {
    return editorShape;
  }

  function getViewBoxDims () {
    return {
      width: viewBoxWidth,
      height: viewBoxHeight
    };
  }

  function setViewBoxDims (newViewBoxDims) {
    viewBoxWidth = newViewBoxDims.width;
    viewBoxHeight = newViewBoxDims.height;
  }

  function getOriginalDims () {
    return {
      width: svgWidth,
      height: svgHeight
    };
  }

  function getCanvasMargin () {
    return {
      x: canvasMarginX,
      y: canvasMarginY
    };
  }

  function getScalingFactor () {
    return scalingFactor;
  }

  function getOffset () {
    return {
      x: offsetX,
      y: offsetY
    }
  }

  function setOffset (newOffset) {
    offsetX = newOffset.x;
    offsetY = newOffset.y;
  }

  function getCanvas () {
    return $canvas;
  }

  function setSocketId (id) {
    socketId = id;
  }

  function getSocketId () {
    return socketId;
  }
  function getShapeStorage(boardId) {
    var _shapeStorage;
    if (typeof boardId === 'undefined') {
        boardId = boardData.boardId;
    }
    if (typeof boards[boardId] === 'undefined') {
        _shapeStorage = shapeStorage;
    } else {
      if (!boards[boardId].shapeStorage) {
        boards[boardId].shapeStorage = {};
      }
      _shapeStorage = boards[boardId].shapeStorage
    }
    return(_shapeStorage);
  }


  function pushToStorage (id, socketId, boardId, shape) {
    var _shapeStorage = getShapeStorage(boardId);
    if (typeof _shapeStorage[socketId] === 'undefined') {
      _shapeStorage[socketId] = {};
    }
    _shapeStorage[socketId][id] = shape;
  }

  function getShapeById (id, socketId, boardId) {
    //var _shapeStorage = getShapeStorage(boardId);
    var _shapeStorage = getShapeStorage(); //This is to enable loading copied boards without having to rewrite the boardId data. FIXME: It makes sense to remove the boardId property that is added to each shape.
    return _shapeStorage[socketId][id];
  }
  function removeShape (shape) {
    var _shapeStorage = getShapeStorage(boardData.boardId);
    if (shape.socketId !== null && shape.id !== null) {
      delete _shapeStorage[shape.socketId][shape.id];
    }
  }

  function getCurrentShape () {
    return currentShape;
  }

  function setCurrentShape (id) {
    var _shapeStorage = getShapeStorage(boardData.boardId);
    currentShape = _shapeStorage[socketId][id];
  }

  function unsetCurrentShape () {
    currentShape = null;
  }

  function getCurrentShapeId () {
    return currentShapeId;
  }

  function generateShapeId () {
    currentShapeId = Raphael._oid;
    return currentShapeId;
  }

  function getCurrentTool () {
    return tool;
  }

  function setCurrentToolName (name) {
    tool.name = name;
  }

  function setColors (fill, stroke) {
    fill = fill || tool.colors.fill;
    stroke = stroke || tool.colors.stroke;
    
    tool.colors.fill = fill;
    tool.colors.stroke = stroke; 
  }

  function setZoomScale (scale) {
    scalingFactor = 1 / scale;
  };

  function getZoomScale () {
    return scalingFactor;
  }

    /*
  function getShapeStorage () {
    return boards[boardId].shapeStorage;
  }
  */

  function setStrokeWidth (width) {
    tool['stroke-width'] = width;
  }

  function getStrokeWidth () {
    return tool['stroke-width'];
  }
  function getBoards(sortKey = 'index') {
      //boards.sort(function(a,b) { return a[sortKey]-b[sortKey] })
      return(boards);
  }
  function addBoard(newBoard) {
      boards[newBoard.id] = newBoard;
      return newBoard;
  }
    /*
  function setTaskBoard(boardId, taskId) {
      taskBoards[taskId] = boardId;
  }
  function getTaskBoards() {
      return taskBoards;
  }
  */
  function newBoard() {
      var boardId = generateRandomId(5);
      return addBoard({'id': boardId, 'shapeStorage': {}});
  }
  function updateFeedback(feedbackList) {
    boardData.feedbackList = feedbackList;
  }
  function updateBoards(newBoards) {
    var board;
    for (board of newBoards) {
        boards[board.boardId] = board;
        /*
        if (typeof boardData.boardId === 'undefined') {
            if (board.i == 0) {
                $rootScope.$apply(function() {
                    boardData.boardId = board.boardId;
                });
            }
        }
        */
        /*
        boardData.boardIdsList.push(board.boardId);
        */
        if (typeof board.id !== 'undefined') {
            boardIdsObject[board.id] = board.boardId;
        }
    }
      /*
    for (let [boardId,board] of Object.entries(boards)){
        if (!boardData.boardIdsList.includes(board.boardId)) {
            if (boardId = boardData.boardId) {
                boardData.boardId = undefined;
            }
            delete boards[boardId]; //FIXME: prompt user to save changes
        }
    }
    */
  }
  function setSubmissionsReceived(submissions) {
      var boards = submissions.map(submission => { submission.board.submission = submission; return submission.board; });
      updateBoards(boards);
      boardData.submissions = submissions;
      boardData.boardIndexObject['submissionBoardIndex'] = [];
      for (board of boards) {
        boardData.boardIndexObject['submissionBoardIndex'].push(board.boardId);
      }
  }
  function updateFreeBoards(boards) {
    boardData.freeBoards = [].concat(boardData.freeBoards, boards);
    boardData.boardIndexObject['freeBoardIndex'] = [];
    for (board of boards) {
      boardData.boardIndexObject['freeBoardIndex'].push(board.boardId);
    }
    updateBoards(boards);
  }
  function updateAssignmentBoards(data) {
    boardData.assignmentBoards[data.assignment] = data.boards;
    updateBoards(data.boards);

    boardData.boardIndexObject['assignmentBoardIndex'] = [];
    for (board of data.boards) {
      boardData.boardIndexObject['assignmentBoardIndex'].push(board.boardId);
    }
    //boardData.activeBoardIndex = [];
  }
  function setActiveBoardIndex(boardIndex) {
      boardData.activeBoardIndex = boardIndex;
  }
  function updateBoardStorage(_boardId, shapeStorage) {
      boards[_boardId].shapeStorage = shapeStorage;
      boardData.boardId = _boardId;
  }
  function setBoardById(newBoardId) {
      if (typeof boards[boardData.boardId] !== 'undefined') {
          if (typeof boards[boardData.boardId].shapeStorage === 'undefined') {
              boards[boardData.boardId].shapeStorage = {};
          }
          //boards[boardId].shapeStorage = Object.assign(boards[boardId].shapeStorage, shapeStorage);
      }
      boardData.boardId = newBoardId;
      //callback && callback();
      //shapeStorage = boards[newBoardId].shapeStorage;
  }
  function getBoardObj(id) {
      if (typeof id === 'undefined') {
          id = boardData.boardId;
      }
      return(boards[id]);
  }
  function joinFeedbackToBoards() {
      var feedbackList = boardData.feedbackList
      var board_id;
      var board;
      for (feedbackObj of feedbackList) {
          board_id = feedbackObj.submission.board_id;
          board = boardData.boards[boardIdsObject[board_id]];
          if (typeof board !== 'undefined') {
              if (typeof board.feedback === 'undefined') {
                  board.feedback = [];
              }
              board.feedback.push(feedbackObj)
          }
      }
  }
  function joinTasksToBoards(tasks) {
      for(let [boardId, boardObj] of Object.entries(boards)) {
          //boardObj.task = tasks[boardObj.task_id];
          if (typeof (boardObj.task || {}).source !== 'undefined' && typeof tasks[boardObj.task.source] !== 'undefined') {
              boardObj.task = tasks[boardObj.task.source];
          }
      }
  }
    /*
  function getOrCreateTaskBoard(taskId) {
    if (typeof taskBoards[taskId] === 'undefined') {
      Broadcast.getOrCreateTaskBoard(taskId); // FIXME: need to set the boardId based on the response
    } else {
      setBoardById(taskBoards[taskId]);
    }
  }
  function getLatestBoardFromApi(taskId) {
    Broadcast.getLatestBoardFromApi(taskId);
  }
  */
  function getActiveBoardNumber() {
      return boardData.activeBoardNumber;
  }
  function setActiveBoardNumber(i, $event) {
      boardData.activeBoardNumber = i;
      boardData.boardId = boardData.boardIndexObject[boardData.activeBoardIndex][i-1];
      $event && $event.preventDefault() && $event.stopPropagation();
      return(false);
  }


  return {
    getShapeStorage: getShapeStorage,
    getCursor: getCursor,
    setCursor: setCursor,
    moveCursor: moveCursor,
    createBoard: createBoard,
    getCurrentShape: getCurrentShape,
    getShapeById: getShapeById,
    getCurrentTool: getCurrentTool,
    generateShapeId: generateShapeId,
    getCurrentShapeId: getCurrentShapeId,
    setColors: setColors,
    setZoomScale: setZoomScale,
    getZoomScale: getZoomScale,
    getCanvas: getCanvas,
    setSocketId: setSocketId,
    getSocketId: getSocketId,
    setCurrentToolName: setCurrentToolName,
    getBoardElmt: getBoardElmt,
    getScalingFactor: getScalingFactor,
    getOffset: getOffset,
    getCanvasMargin: getCanvasMargin,
    pushToStorage: pushToStorage,
    setCurrentShape: setCurrentShape,
    unsetCurrentShape: unsetCurrentShape,
    getViewBoxDims: getViewBoxDims,
    setViewBoxDims: setViewBoxDims,
    setOffset: setOffset,
    getOriginalDims: getOriginalDims,
    setEditorShape: setEditorShape,
    unsetEditorShape: unsetEditorShape,
    getEditorShape: getEditorShape,
    setStrokeWidth: setStrokeWidth,
    getStrokeWidth: getStrokeWidth,
    //clearBoard: clearBoard,
    //handleWindowResize: handleWindowResize,
    //saveBoardToApi: saveBoardToApi,
    //loadBoardFromApi: loadBoardFromApi,
    //loadBoard: loadBoard,
    //getLatestBoardFromApi: getLatestBoardFromApi,
    setBoardById: setBoardById,
    getBoardObj: getBoardObj,
    getBoards: getBoards,
    getBoardId: getBoardId,
    addBoard: addBoard,
    newBoard: newBoard,
    updateFreeBoards: updateFreeBoards,
    updateAssignmentBoards: updateAssignmentBoards,
    //getOrCreateTaskBoard: getOrCreateTaskBoard,
    //getTaskBoards: getTaskBoards,
    updateBoardStorage: updateBoardStorage,
    //loadBoards: loadBoards,
    getBoardData: getBoardData,
    joinTasksToBoards: joinTasksToBoards,
    removeShape: removeShape,
    setActiveBoardNumber: setActiveBoardNumber,
    getActiveBoardNumber: getActiveBoardNumber,
    updateFeedback: updateFeedback,
    joinFeedbackToBoards: joinFeedbackToBoards,
    setSubmissionsReceived: setSubmissionsReceived,
    setActiveBoardIndex: setActiveBoardIndex,
  }
}]);
