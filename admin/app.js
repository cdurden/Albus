// Declare app level module which depends on filters, and services
angular.module('whiteboard-admin', ['whiteboard.services.sockets', 'ngRoute']).config(['$routeProvider', '$locationProvider', '$httpProvider',
  function($routeProvider, $locationProvider, $httpProvider) {
    $routeProvider
      .when('/admin', {
        templateUrl: 'views/admin.html',
        resolve: {
          'something': function (Sockets) {
            Sockets.emit('suggestions');
          }
        }
      });

    $locationProvider.html5Mode({
      enabled: true,
      requireBase: false
    });
}]);

