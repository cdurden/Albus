angular.module('whiteboard', [
  'ui.bootstrap', //text completion
  'dndLists',
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
  'whiteboard.services.adminsockets',
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
    var originalWhen = $routeProvider.when;

    $routeProvider.when = function(path, route) {
        route.resolve || (route.resolve = {});
        angular.extend(route.resolve, {
          'user': function (Sockets, EventHandler, $location) {
                return new Promise(resolve => {
                Sockets.emit('getUser');
                Sockets.emit('getUsers');
                Sockets.emit('getActingUser');
                Sockets.on('user', function(user) {
                    resolve(user);
                })
            })
          }
        });

        return originalWhen.call($routeProvider, path, route);
    };
    $routeProvider
      .when('/', {
        templateUrl: './views/board.html',
        resolve: {
          'mode': function(Sockets, EventHandler, $location) {
              EventHandler.loadBoards();
              return('assignment');
          }
        }
      })
      .when('/lti/', { //FIXME: Is this route necessary?
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
      .when('/board/:id', {
        templateUrl: '/views/board.html',
        resolve: {
          'mode': function (Sockets, EventHandler, $location) {
            EventHandler.loadBoardFromApi($location.path().slice(2));
            return('board')
          },
          'board': function (Sockets, EventHandler, $location) {
            return($location.path().slice(2));
          }
        },
      })
      .when('/submissions', {
        templateUrl: './views/board.html',
        resolve: {
          'mode': function (Sockets, EventHandler, $location) {
            EventHandler.loadSubmissions();
            return('submissions');
          }
        }
      })
      .when('/assignment/:id', {
        templateUrl: './views/board.html',
        resolve: {
          'mode': function (Sockets, EventHandler, $location) {
            EventHandler.loadBoards($location.path().slice(12));
            return('assignment')
          },
          'assignment': function (Sockets, EventHandler, $location) {
            return($location.path().slice(12));
          },
        }
      })
      .when('/slides', {
        templateUrl: 'views/slides.html',
        resolve: {
          'mode': function (Sockets, EventHandler, $location) {
              return('slides');
          }
        }
      });

    $locationProvider.html5Mode({
      enabled: true,
      requireBase: false
    });
}])
.controller('whiteboardController', ['$window', '$document', 'FileUploader','$scope', 'BoardData', 'EventHandler', function($window, $document, FileUploader, $scope, BoardData, EventHandler) {
    $scope.user = $scope.$resolve.user;
    $scope.mode = $scope.$resolve.mode;
    if ($scope.mode === 'assignment') {
        if ($scope.resolve.assignment) {
            $scope.assignment = $scope.resolve.assignment;
        } else {
            $scope.assignment = $scope.user.assignment;
        } 
    }
    if ($scope.mode === 'board') {
        $scope.board = $scope.$resolve.board;
    }
    $scope.uploader = new FileUploader();
    $scope.uploader.onAfterAddingFile = function(item) {
        console.log("added file");
        var boardData = BoardData.getBoardData();
        var boardId = boardData.boardId;
        var board = boardData.boards[boardId];
        //item.formData = [{ 'boardId': boardId, 'action': 'setBoardBackground' }];
        item.formData = [{ 'boardId': boardId, 'action': 'submit' }];
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
}]);
