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
  'whiteboard.services.dialogs',
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
    function userPromiseMaker(Sockets, BoardData, UserData, $location) {
      return new Promise(resolve => {
          Promise.all([
              new Promise(resolveUser => {
                      Sockets.on('user', function(user) {
                      BoardData.setSocketId(user.lti_user_id);
                      UserData.setUser(user);
                      resolveUser(user);
                  })
              }),
              new Promise(resolveUsers => {
                  Sockets.on('users', function(users) {
                      UserData.setUsers(users);
                      resolveUsers(users);
                  })
              }),
              new Promise(resolveActingUser => {
                  Sockets.on('actingAsUser', function(actingAsUser) {
                      UserData.setActingUser(actingAsUser);
                      resolveActingUser(actingAsUser);
                  });
              }),
          ]).then(function(results) {
              resolve(UserData.getDataObject());
          });
          Sockets.emit('getUser');
          Sockets.emit('getUsers');
          Sockets.emit('getActingUser');
      });
  }
      /*
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
          'socket': function(Sockets, EventHandler) {
              Sockets.on('socketId', function (data) {
                EventHandler.setSocketId(data.socketId);
              });
              Sockets.emit('idRequest');
          }
        });

        return originalWhen.call($routeProvider, path, route);
    };
    */
    $routeProvider
      .when('/', {
        templateUrl: './views/board.html',
        controller: 'whiteboardController',
        resolve: {
          'userData': userPromiseMaker,
          'mode': function() {
              return('free');
          },
          'resource': function () {
            return(undefined);
          }
        }
      })
      .when('/lti/', { //FIXME: Is this route necessary?
        templateUrl: '/views/board.html',
        controller: 'whiteboardController',
        //templateUrl: 'views/board+chat.html',
        resolve: {
          'somethingElse': function (Sockets, EventHandler, $location) {
            //BoardData.setBoardId($location.path().slice(1));
            EventHandler.getAssignmentBoards();
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
        controller: 'whiteboardController',
        resolve: {
          'userData': userPromiseMaker,
          'mode': function () {
            return('board')
          },
          'resource': function ($location) {
            return($location.path().slice(7));
          }
        },
      })
      .when('/submissions', {
        templateUrl: './views/board.html',
        controller: 'whiteboardController',
        resolve: {
          'userData': userPromiseMaker,
          'mode': function () {
            return('submissions');
          },
          'resource': function($location) {
            return('');
          }
        }
      })
      .when('/submissions/:id', {
        templateUrl: './views/board.html',
        controller: 'whiteboardController',
        resolve: {
          'userData': userPromiseMaker,
          'mode': function () {
            return('submissions');
          },
          'resource': function($location) {
            return($location.path().slice(13));
          }
        }
      })
      .when('/assignment/:id', {
        templateUrl: './views/board.html',
        controller: 'whiteboardController',
        resolve: {
          'userData': userPromiseMaker,
          'mode': function () {
            return('assignment')
          },
          'resource': function ($location) {
            return($location.path().slice(12));
          },
        }
      })
      .when('/feedback/:id', {
        templateUrl: './views/board.html',
        controller: 'whiteboardController',
        resolve: {
          'userData': userPromiseMaker,
          'mode': function () {
            return('feedback')
          },
          'resource': function ($location) {
            return($location.path().slice(10));
          },
        }
      })
      .when('/slides', {
        templateUrl: 'views/slides.html',
        controller: 'whiteboardController',
        resolve: {
          'userData': function () {
              return(undefined);
          },
          'mode': function () {
              return('slides');
          },
          'resource': function($location) {
              return(undefined);
          }
        }
      });

    $locationProvider.html5Mode({
      enabled: true,
      requireBase: false
    });
}])
.controller('mainController', ['$scope', 'InputHandler', function($scope, InputHandler) {
    $scope.handleKeydown = function(ev) {
        InputHandler['keydown'](ev);
    }
}])
.controller('whiteboardController', ['$window', '$document', 'FileUploader','$scope', 'BoardData', 'InputHandler', 'Sockets', 'Receive', 'EventHandler', 'userData', 'mode', 'resource', function($window, $document, FileUploader, $scope, BoardData, InputHandler, Sockets, Receive, EventHandler, userData, mode, resource) {
//.controller('whiteboardController', ['$window', '$document', 'FileUploader','$scope', 'BoardData', 'EventHandler', 'mode', 'resource', function($window, $document, FileUploader, $scope, BoardData, EventHandler, mode, resource) {
    $scope.userData = userData;
    $scope.mode = mode;
    EventHandler.getInboxes();
    EventHandler.getAssignmentsReceived();
    if ($scope.mode === 'free') {
        BoardData.setActiveBoardIndex('freeBoardIndex');
        EventHandler.getRoomBoards();
        Sockets.on('actingAsUser', function(actingAsUser) {
            EventHandler.getFeedbackReceived(); //FIXME: this is requesting extra data
        });
    }
    if ($scope.mode === 'assignment') {
        if (resource) {
            $scope.assignment = resource;
        } else {
            $scope.assignment = userData.user.assignment;
        } 
        BoardData.setActiveBoardIndex('assignmentBoardIndex');
        EventHandler.getAssignmentBoards($scope.assignment);
        Sockets.on('actingAsUser', function(actingAsUser) {
            EventHandler.getAssignmentBoards($scope.assignment);
            EventHandler.getFeedbackReceived(); //FIXME: this is requesting extra data
        });
    }
    if ($scope.mode === 'board') {
        $scope.board = resource;
        EventHandler.getBoardFromApi($scope.board);
        Sockets.on('actingAsUser', function(actingAsUser) {
            EventHandler.getBoardFromApi($scope.board);
            //EventHandler.getFeedbackReceived();
        });
        BoardData.setActiveBoardIndex(undefined);
    }
    if ($scope.mode === 'submissions') {
        $scope.submission_state = resource;
        EventHandler.getSubmissionsReceived($scope.submission_state);
        BoardData.setActiveBoardIndex('submissionBoardIndex');
        //EventHandler.getFeedback(board_ids);
        //EventHandler.getFeedback();
    }
    if ($scope.mode === 'feedback') {
        $scope.feedback = resource;
        EventHandler.getFeedback($scope.feedback);
        BoardData.setActiveBoardIndex('feedbackBoardIndex');
    }
    console.log("Mode: "+$scope.mode);
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
        EventHandler.getBoardFromApi(item.boardId);
    }
}]);
