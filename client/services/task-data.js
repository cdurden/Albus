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
      task = data;
  }
  function getTask() {
      return task;
  }

  return {
    setTask: setTask,
    getTask: getTask,
  }
});
