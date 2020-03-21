// Declare app level module which depends on filters, and services
angular.module('whiteboard-admin', ['whiteboard.services.sockets', 'ngRoute']).config(['$routeProvider', '$locationProvider', '$httpProvider',
  function($routeProvider, $locationProvider, $httpProvider) {
    $routeProvider
      .when('/admin', {
          //template: '<div wb-admin-submissions></div>',
          template: 'Testing!<div wb-admin-submissions></div>',
        //  templateUrl: '/admin/views/admin.html',
        resolve: {
          'something': function (Sockets) {
            console.log('requesting suggestions');
            Sockets.emit('suggestions');
          }
        }
      }).otherwise({ redirectTo: 'admin' }); ;

    $locationProvider.html5Mode({
      enabled: true,
      requireBase: false
    });
}]).run(function(Sockets) {
  // This is effectively part of the main method initialization code
  console.log("starting whiteboard-admin");
  Sockets.emit('suggestions');
});

