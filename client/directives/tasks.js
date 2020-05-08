angular.module('whiteboard')
.directive('wbTasks', ['$compile', '$http', '$templateCache', 'BoardData', 'EventHandler', 'Sockets', 'FileUploader', '$document', '$window', function($compile, $http, $templateCache, BoardData, EventHandler, Sockets, FileUploader, $document, $window) {
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
      $scope.maxBoardSelectorSize = 10;
      $scope.numBoards = 0;
      $scope.boardData = BoardData.getBoardData();
      $scope.i = 0;
      $scope.uploader = new FileUploader();
      //angular.element($document[0].body).attr("nv-file-drop",true).attr("uploader","uploader").attr("options", "{url: '/upload', 'autoUpload': true}");
      //BoardData.loadBoard(Object.keys($scope.boards)[0]);
      //$scope.taskBoards = BoardData.getTaskBoards();
      //$scope.boards = [];
      //$scope.data = {};
      //Sockets.emit("getAssignedTasks");
      //EventHandler.loadBoards();
        /*
      $scope.setBoardId = function(id) {
          BoardData.setBoardById(id);
          $scope.boardData.boardId = id;
          EventHandler.loadBoard(id);
      }
      */
      $scope.boardIndexChanges = function() {
          $scope.setBoardIndex($scope.boardIndex);
      }
      $scope.setBoardIndex = function(i, $event) {
          boardId = $scope.boardData.boardIdsList[i-1];
          $scope.boardData.boardId = boardId;
          $event && $event.preventDefault() && $event.stopPropagation();
          return(false);
      }
      $scope.navigateNext = function($event) {
          if ($scope.i<Object.keys($scope.boardData.boards).length-1) {
              $scope.setBoardIndex($scope.i+1);
          }
          $event && $event.preventDefault() && $event.stopPropagation();
          return(false);
      }
      $scope.navigatePrev = function($event) {
          if ($scope.i>0) {
              $scope.setBoardIndex($scope.i-1);
          }
          $event && $event.preventDefault() && $event.stopPropagation();
          return(false);
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
        element.on('touchstart', function (e) { e.preventDefault(); });
        element.on('touchmove', function (e) { e.preventDefault(); });
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
			angular.forEach(controlsPrev, function( el ) { angular.element(el).on( eventName, onNavigatePrevClicked ); } );
			angular.forEach(controlsNext, function( el ) { angular.element(el).on( eventName, onNavigateNextClicked ); } );
		} );

	}
	function onNavigatePrevClicked( event ) { event.preventDefault(); navigatePrev(); }
	function onNavigateNextClicked( event ) { event.preventDefault(); navigateNext(); }

      var boardCtrl = ctrl;
      BoardData.createBoard(element.find('#board-container'));
      EventHandler.activateNav();
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
      Split(['#drawing-space', '#feed-space'], {
        sizes: [50,50],
        minSize: [0, 0],
        snapOffset: 0,
        expandToMin: false,
        direction: 'horizontal',
      })
      //scope.taskData = TaskData.getData();
        /*
      Split(['#interactive-space', '#task-space'], {
        sizes: [75, 25],
        minSize: [0, 0],
        snapOffset: 0,
        direction: 'vertical',
      })
      Split(['#task-container', '#board-selector-container'], {
        sizes: [75,25],
        minSize: [0, 0],
        snapOffset: 0,
        expandToMin: false,
        direction: 'horizontal',
      })
      */
      scope.$watchCollection(function(scope) { return Object.values(scope.boardData.boards).concat([scope.boardData.boardId]); }, function() {
        scope.board = scope.boardData.boards[scope.boardData.boardId];
        scope.numBoards = scope.boardData.boardIdsList.length
        if (scope.numBoards > 0 && typeof scope.boardIndex === 'undefined') {
            scope.boardIndex = 1;
        }
        if (typeof scope.boardData.boardId !== 'undefined' ) {
            EventHandler.loadBoard(scope.boardData.boardId);
        }
          /*
        scope.setBoardIndex(scope.i) || scope.setBoardIndex(0);
        scope.board = board;
        scope.task = (board || {}).task;
        */
      });
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
