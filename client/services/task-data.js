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

  var task = {};

  function setTask(data) {
      task = {'data': data};
  }
  function getTask() {
      return task;
  }

  return {
    getShapeStorage: getShapeStorage,
    displayData: displayData,
   /* getCursor: getCursor,
    setCursor: setCursor,
    moveCursor: moveCursor,
    */
    createTask: createTask,
    setTask: setTask,
    getTask: getTask,
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
