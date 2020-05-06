angular.module('whiteboard', [
  'ui.bootstrap', //text completion
  'angularFileUpload',
  'angularLoad',
  'hmTouchEvents',
  'btford.socket-io',
  'whiteboard.services.receive',
  'whiteboard.services.broadcast',
  'whiteboard.services.shapebuilder',
  'whiteboard.services.shapeeditor',
  'whiteboard.services.shapemanipulation',
  'whiteboard.services.snap',
  'whiteboard.services.auth',
  'whiteboard.services.token',
  'whiteboard.services.sockets',
  'whiteboard.services.boarddata',
  'whiteboard.services.eventhandler',
  'whiteboard.services.inputhandler',
  'whiteboard.services.zoom',
  'whiteboard.services.leapMotion',
  'whiteboard.services.visualizer',
  'whiteboard.services.feeddata',
  'whiteboard.services.taskdata',
  'whiteboard.services.userdata',
  'whiteboard.services.messagehandler',
  'whiteboard.services.reveal',
  'whiteboard.services.screenshot',
  'ngRoute'
])
.config(['$provide', function ($provide) {
    $provide.decorator('$browser', ['$delegate', '$window', function ($delegate, $window) {
        // normal anchors
        let ignoredPattern = /^#[a-zA-Z0-9%2F\/\?].*/;
        let originalOnUrlChange = $delegate.onUrlChange;
        $delegate.onUrlChange = function (...args) {
            if (ignoredPattern.test($window.location.hash)) return;
        //    originalOnUrlChange.apply($delegate, args);
        };
        let originalUrl = $delegate.url;
        $delegate.url = function (...args) {
            if (ignoredPattern.test($window.location.hash)) return $window.location.href;
            return originalUrl.apply($delegate, args);
        };
        return $delegate;
    }]);
}]) 
.config(['$routeProvider', '$locationProvider', '$httpProvider',
  function($routeProvider, $locationProvider, $httpProvider) {
    $routeProvider
      .when('/', {
        templateUrl: './views/board.html',
        //templateUrl: 'views/board+chat.html',
        //templateUrl: 'views/slides.html',
        resolve: {
          'something': function (Sockets, EventHandler, $location) {
            EventHandler.loadBoards();
            Sockets.emit('getUsers');
            Sockets.emit('getUser');
            Sockets.emit('getActingUser');
            /*
            var roomId = Auth.generateRandomId(5);
            Sockets.emit('roomId', {roomId: roomId});
            $location.path('/' + roomId);
            Sockets.on('assignment', function(data) {
              $location.path('/' + data);
            });
            Sockets.emit('get_assignment');
            */
          }
        }
      })
      .when('/lti/', {
        templateUrl: '/views/board.html',
        //templateUrl: 'views/board+chat.html',
        resolve: {
          'somethingElse': function (Sockets, EventHandler, $location) {
            //BoardData.setBoardId($location.path().slice(1));
            EventHandler.loadBoards();
            Sockets.emit('getUsers');
            Sockets.emit('getUser');
            Sockets.emit('getActingUser');
            //Sockets.emit('roomId', {roomId: $location.path().slice(2)});
          }
        },
        //authenticate: true
      })
      .when('/slides', {
        //templateUrl: './views/board.html',
        //templateUrl: 'views/board+chat.html',
        templateUrl: 'views/slides.html',
        resolve: {
          'something': function (Sockets, EventHandler, $location) {
            /*
            var roomId = Auth.generateRandomId(5);
            Sockets.emit('roomId', {roomId: roomId});
            $location.path('/' + roomId);
            Sockets.on('assignment', function(data) {
              $location.path('/' + data);
            });
            Sockets.emit('get_assignment');
            */
          }
        }
      })
      .when('/:id', {
        templateUrl: '/views/board.html',
        //templateUrl: 'views/board+chat.html',
        resolve: {
          'somethingElse': function (Sockets, EventHandler, $location) {
            //BoardData.setBoardId($location.path().slice(1));
            EventHandler.loadBoardFromApi($location.path().slice(1));
            Sockets.emit('getUsers');
            Sockets.emit('getUser');
            Sockets.emit('getActingUser');
            //Sockets.emit('roomId', {roomId: $location.path().slice(2)});
          }
        },
        //authenticate: true
      });

    $locationProvider.html5Mode({
      enabled: true,
      requireBase: false
    });
}])
.controller('whiteboardController', ['$window', '$document', 'FileUploader','$scope', 'BoardData', 'EventHandler', function($window, $document, FileUploader, $scope, BoardData, EventHandler) {
    $scope.uploader = new FileUploader();
    $scope.uploader.onAfterAddingFile = function(item) {
        console.log("added file");
        var boardData = BoardData.getBoardData();
        var boardId = boardData.boardId;
        var board = boardData.boards[boardId];
        item.formData = [{ 'boardId': boardId, 'action': 'setBoardBackground' }];
        if (typeof board.task_id !== 'undefined') {
            item.formData[0].task_id = board.task_id;
        }
        this.uploadItem(item);
    }
    $scope.uploader.onBeforeUploadItem = function(item) {
        console.log("uploading item");
    }
    $scope.uploader.onCompleteItem = function(item) {
        console.log("uploading complete");
        EventHandler.loadBoards();
    }
    /*
    $window.addEventListener("dragover",function(e){
          e = e || event;
          if (e.target !== $document[0].body) {
            e.preventDefault();
          }
    },false);
    $window.addEventListener("drop",function(e){
          e = e || event;
          if (e.target !== $document[0].body) {
            e.preventDefault();
          }
    },false);
    */
}]);
