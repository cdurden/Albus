angular.module('whiteboard')
.directive('wbTasks', ['$compile', '$http', '$templateCache', 'BoardData', 'TaskData', 'Sockets', function($compile, $http, $templateCache, BoardData, TaskData, Sockets) {
  return {
    restrict: 'A',
    //require: ['^form'],
    templateUrl: './templates/tasks.html',
      /*
    scope: {
        'form': '=',
        'boards': '=',
        'setBoardIndex': '@',
    },
    */
    controller: function ($scope, InputHandler) {
      $scope.taskData = TaskData.getData();
      $scope.boards = [];
      $scope.data = {};
      Sockets.emit("getAssignedTasks");
      $scope.setBoardIndex = function(i) {
          $scope.i = i;
      }
      this.handleEvent = function (ev) {
        InputHandler[ev.type](ev);
      }
      this.requestData = function (ev) {
          ev.preventDefault(); // prevents page reloading
          Sockets.emit("getAssignedTasks");
          return false;
      };
    },
    link: function(scope, element, attrs, ctrl) {
      var boardCtrl = ctrl;
      BoardData.createBoard(element);
      var canvas = BoardData.getCanvas();
      //BoardData.getCanvas().bind('touchstart touchend touchmove mousedown mouseup mousemove dblclick', boardCtrl.handleEvent);
      canvas.bind('touchstart touchend touchmove mousedown mouseup mousemove dblclick', boardCtrl.handleEvent);
      BoardData.getCanvas().bind('click', function() {scope.$emit('activateMenu', 'hide');});
      scope.$on('setCursorClass', function (evt, msg) {
        // console.log('A')
        // var oldTool = BoardData.getCurrentTool();
        var svg = BoardData.getCanvas();

        // svg.addClass('A');
        svg.attr("class", msg.tool);
        // console.log('> ', svg.attr("class").split(' '));
      });
      scope.taskData = TaskData.getData();
      Split(['#interactive-space', '#task-space'], {
        sizes: [75, 25],
        minSize: [0, 0],
        snapOffset: 0,
        direction: 'vertical',
      })
      Split(['#drawing-space', '#feed-space'], {
        sizes: [75,25],
        minSize: [0, 0],
        snapOffset: 0,
        expandToMin: false,
        direction: 'horizontal',
      })
      Split(['#task-container', '#board-selector-container'], {
        sizes: [75,25],
        minSize: [0, 0],
        snapOffset: 0,
        expandToMin: false,
        direction: 'horizontal',
      })
      scope.i = 0;
        /*
      scope.$watch("taskData.tasks[i]", function(task) {
          scope.task = task;
      }, objectEquality=true);
      */
      scope.$watch("taskData.tasks", function(tasks) {
          scope.tasks = tasks;
          taskBoards = tasks.map((task, i) => { 
              var board = task.boards[task.boards.length-1];
              if (typeof board === 'undefined') {
                  board = BoardData.newBoard();
              }
              board.index = i;
              return(board);
          });
          BoardData.updateBoards(taskBoards);
          boards = BoardData.getBoards('index');
          for ((boardId,board) in boards) {
              scope.boards.push(board);
          }
      }, objectEquality=true);
    }
  }
}]);
