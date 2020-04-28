angular.module('whiteboard')
.directive('wbTasks', ['$compile', '$http', '$templateCache', 'BoardData', 'EventHandler', 'Sockets', function($compile, $http, $templateCache, BoardData, EventHandler, Sockets) {
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
      //$scope.taskData = TaskData.getData();
      //$scope.boards = BoardData.getBoards();
      $scope.boardData = BoardData.getBoardData();
      //BoardData.loadBoard(Object.keys($scope.boards)[0]);
      //$scope.taskBoards = BoardData.getTaskBoards();
      //$scope.boards = [];
      //$scope.data = {};
      //Sockets.emit("getAssignedTasks");
      EventHandler.loadBoards();
      $scope.setBoardId = function(id) {
          $scope.boardId = id;
          EventHandler.loadBoard(id);
          //BoardData.setBoardById(id);
      }
      $scope.setBoardIndex = function(i) {
          $scope.i = i;
          for (let [boardId, board] of Object.entries($scope.boardData.boards)) {
              if (board.i === i) {
                  $scope.setBoardId(boardId);
              }
          }
      }
      $scope.submit = function() { //FIXME: this should not be here
          data = {
              'boardId': BoardData.getBoardId(),
              'taskId': BoardData.getBoardObj().task.id,
              'data': {},
          }
          Sockets.emit("submit", data);
      }
      this.handleEvent = function (ev) {
        InputHandler[ev.type](ev);
      }
    },
    link: function(scope, element, attrs, ctrl) {
        var controlsNext = element.find('.navigate-right');
        var controlsPrev = element.find('.navigate-left');
	function addEventListeners() {

		eventsAreBound = true;

		// Listen to both touch and click events, in case the device
		// supports both
		var pointerEvents = [ 'touchstart', 'click' ];

		// Only support touch for Android, fixes double navigations in
		// stock browser
		//if( UA.match( /android/gi ) ) {
		//	pointerEvents = [ 'touchstart' ];
		//}

		pointerEvents.forEach( function( eventName ) {
			angular.forEach(controlsPrev, function( el ) { angular.element(el).on( eventName, onNavigatePrevClicked, false ); } );
			angular.forEach(controlsNext, function( el ) { angular.element(el).on( eventName, onNavigateNextClicked, false ); } );
		} );

	}
	function navigateNext() {
        if (i<Object.keys($scope.boardData.boards).length) {
            $scope.setBoardIndex($scope.i+1);
        }
    }
	function navigatePrev() {
        if (i>0) {
            $scope.setBoardIndex($scope.i-1);
        }
    }
	function onNavigatePrevClicked( event ) { event.preventDefault(); onUserInput(); navigatePrev(); }
	function onNavigateNextClicked( event ) { event.preventDefault(); onUserInput(); navigateNext(); }
    addEventListeners();

      var boardCtrl = ctrl;
      BoardData.createBoard(element.find('#board-container'));
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
      //scope.taskData = TaskData.getData();
        /*
      Split(['#interactive-space', '#task-space'], {
        sizes: [75, 25],
        minSize: [0, 0],
        snapOffset: 0,
        direction: 'vertical',
      })
      Split(['#drawing-space', '#feed-space'], {
        sizes: [100,0],
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
      */
      scope.$watch("boardData.boards[boardData.boardId].task", function(task) {
        scope.task = task;
      }, true);
        /*
      scope.$watch("taskData.tasks", function(tasks) {
          tasks.forEach((task, i) => { 
            BoardData.getOrCreateTaskBoard(task.id);
          });
      });
      */
    }
  }
}]);
