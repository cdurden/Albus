angular.module('whiteboard', [
  'angularLoad',
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
  'whiteboard.services.chatdata',
  'whiteboard.services.taskdata',
  'whiteboard.services.messagehandler',
  'whiteboard.services.reveal',
  'ngRoute'
])
.config(['$routeProvider', '$locationProvider', '$httpProvider',
  function($routeProvider, $locationProvider, $httpProvider) {
    $routeProvider
      .when('/', {
        //templateUrl: 'views/board+chat+task.html',
        //templateUrl: 'views/board+chat.html',
        templateUrl: 'views/board.html',
        resolve: {
          'something': function (Sockets, Auth, $location) {
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
      });
      /*
      .when('/:id', {
        //templateUrl: 'views/board.html',
        templateUrl: 'views/board+chat.html',
        resolve: {
          'somethingElse': function (Sockets, $location) {
            Sockets.emit('roomId', {roomId: $location.path().slice(1)});
          }
        },
        //authenticate: true
      });
      */

    $locationProvider.html5Mode({
      enabled: true,
      requireBase: false
    });
}])
