angular.module('whiteboard.services.boarddata', [])
.factory('BoardData', ['Broadcast', function (Broadcast) {
  //svgWidth/Height are the width and height of the DOM element
  var svgWidth = 1500; //sizeX
  var svgHeight = 1000; //sizeY
  //offsetX/Y measure the top-left point of the viewbox
  var offsetX = 0;
  var offsetY = 0;
  //scalingFactor is the level of zooming relative to the start
  var scalingFactor = 1;
  var taskId;
  var boardId;
  var board;
  var boards;
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
    var container = element.find("#drawing-space")[0];
    ResizeSensorApi.create(container, function() {});

    board = Raphael(container);
    board.setViewBox(0, 0, svgWidth, svgHeight, true);
    board.canvas.setAttribute('preserveAspectRatio', 'none');

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

  function handleWindowResize (newPageSize) {
    svgWidth = newPageSize.width;
    svgHeight = newPageSize.height;

    viewBoxWidth = svgWidth * scalingFactor;
    viewBoxHeight = svgHeight * scalingFactor;
    var offset = getOffset();
    board.setViewBox(offset.x, offset.y, viewBoxWidth, viewBoxHeight, true);
  }

  function getBoard () {
    return board;
  }

  function getCursor () {
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

  function pushToStorage (id, socketId, shape) {
    if (!shapeStorage[socketId]) {
      shapeStorage[socketId] = {};
    }
    shapeStorage[socketId][id] = shape;
  }

  function getShapeById (id, socketId) {
    return shapeStorage[socketId][id];
  }

  function getCurrentShape () {
    return currentShape;
  }

  function setCurrentShape (id) {
    currentShape = shapeStorage[socketId][id];
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

  function getShapeStorage () {
    return shapeStorage;
  }

  function setStrokeWidth (width) {
    tool['stroke-width'] = width;
  }

  function getStrokeWidth () {
    return tool['stroke-width'];
  }
  function clearBoard() {
    shapeStorage = {};
    getCanvas() && getCanvas().empty();
  }
  function drawBoard() {
    clearBoard();
    data = getBoardObj(boardId).data;
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
  }
  function setBoards(data) {
      boards = data;
  }
  function getBoards(sortKey = 'index') {
      return(boards.sort(function(a,b) { return a[sortKey]-b[sortKey] }));
  }
  function addBoard(board) {
      boards[board.id] = board;
  }
  function newBoard() {
      var boardId = generateRandomId(5);
      addBoard({'id': boardId, 'shapeStorage': {}})
  }
  function updateBoards(boards) {
    for (board of boards) {
      boards[board.id] = board;
    }
  }
  function setBoard(newBoardId) {
      boards[boardId].shapeStorage = shapeStorage;
      board = boards[newBoardId];
      boardId = newBoardId;
      shapeStorage = board.shapeStorage;
  }
  function getBoardObj(id) {
      return(boards[id]);
  }
  function saveBoardToApi() {
    data = {};
    data.taskId = taskId;
    data.boardId = boardId;
    Broadcast.saveBoardToApi(boards[boardId]);
  }
  function loadBoardFromApi(id) {
    Broadcast.loadBoardFromApi(id);
  }
  function getLatestBoardFromApi(taskId) {
    Broadcast.getLatestBoardFromApi(taskId);
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
    getBoard: getBoard,
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
    clearBoard: clearBoard,
    handleWindowResize: handleWindowResize,
    saveBoardToApi: saveBoardToApi,
    loadBoardFromApi: loadBoardFromApi,
    getLatestBoardFromApi: getLatestBoardFromApi,
    setTaskId: setTaskId,
    setBoardId: setBoardId,
    getBoardObj: getBoardObj,
    setBoards: setBoards,
    getBoards: getBoards,
    addBoard: addBoard,
    setBoardData: setBoardData,
  }
}]);
