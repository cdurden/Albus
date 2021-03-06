angular.module('whiteboard.services.taskdata', [])
.factory('TaskData', function () {
  //svgWidth/Height are the width and height of the DOM element
  var taskWidth = 1500; //sizeX
  var taskHeight = 1000; //sizeY
  //offsetX/Y measure the top-left point of the viewbox
  var offsetX = 0;
  var offsetY = 0;
  //scalingFactor is the level of zooming relative to the start
  var scalingFactor = 1;

  var task;
  var form;
  var input;
  var send_button;
  //canvasMarginX/Y are the left and top margin of the SVG in the browser
  var taskMarginX; //canvasX
  var taskMarginY; //canvasY
  var socketId;

  function createTask (element) {

    //ResizeSensorApi.create(document.getElementsByClassName('app-container')[0], handleWindowResize);

    task = element.find('#task-data-container');
    form = element.find('form');
    input = element.find('input');
    submit_button = element.find('#task-submit-button');
  }
  function displayData(data) {
      console.log(data);
      getTask().text(data);
      MathJax.typeset();
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

  function getForm() {
    return form;
  }
  function getTask() {
    return task;
  }
  function getInput() {
    return input;
  }
  function getSubmitButton() {
    return submit_button;
  }
/*
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
  */

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

    /*
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
  */

  function getShapeStorage () {
    return shapeStorage;
  }

    /*
  function setStrokeWidth (width) {
    tool['stroke-width'] = width;
  }

  function getStrokeWidth () {
    return tool['stroke-width'];
  }
  */

  return {
    getShapeStorage: getShapeStorage,
    displayData: displayData,
   /* getCursor: getCursor,
    setCursor: setCursor,
    moveCursor: moveCursor,
    */
    createTask: createTask,
      /*
    getCurrentShape: getCurrentShape,
    getShapeById: getShapeById,
    getCurrentTool: getCurrentTool,
    generateShapeId: generateShapeId,
    getCurrentShapeId: getCurrentShapeId,
    setColors: setColors,
    setZoomScale: setZoomScale,
    getZoomScale: getZoomScale,
    getCanvas: getCanvas,
    */
    setSocketId: setSocketId,
    getSocketId: getSocketId,
      /*
    setCurrentToolName: setCurrentToolName,
    */
    getTask: getTask,
    getForm: getForm,
    getInput: getInput,
    getSubmitButton: getSubmitButton,
      /*
    getScalingFactor: getScalingFactor,
    getOffset: getOffset,
    getCanvasMargin: getCanvasMargin,
    */
    pushToStorage: pushToStorage,
      /*
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
    getStrokeWidth: getStrokeWidth
    */
  }
});
