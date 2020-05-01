angular.module('whiteboard-admin', [
    'angularFileUpload',
    'angularLoad',
    'btford.socket-io',
    'whiteboard.admin.services.sockets',
    'whiteboard.admin.services.receive',
    'ngRoute'
])
    .config(['$routeProvider', '$locationProvider', '$httpProvider',
  function($routeProvider, $locationProvider, $httpProvider) {
    $routeProvider
      .when('/admin/', {
          //template: '<div wb-admin-submissions></div>',
          //template: '<div wb-admin-submissions></div><div wb-admin-room-assignments></div>',
          templateUrl: '/admin/views/admin.html',
/*        resolve: {
          'something': function (Sockets) {
            console.log('requesting suggestions');
            Sockets.emit('suggestions');
          }
        }
          */
      }).otherwise({ redirectTo: 'admin' }); ;

    $locationProvider.html5Mode({
      enabled: true,
      requireBase: false
    });
}])
.controller('wbAdminController', function($scope, FileUploader) {
    $scope.uploader = new FileUploader();
})
.run([
  '$rootScope',
  function($rootScope) {
    // see what's going on when the route tries to change
    $rootScope.$on('$routeChangeStart', function(event, next, current) {
      // next is an object that is the route that we are starting to go to
      // current is an object that is the route where we are currently
      //var currentPath = current.originalPath;
      var nextPath = next.originalPath;

      console.log('Starting to go to %s', nextPath);
    });
  }
]);

