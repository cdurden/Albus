app.controller('adminCtrl', ['$scope','Sockets', function($scope, Sockets) {

  // Socket listeners
  // ================

  Sockets.on('submissions', function (data) {
    $scope.submissions = data;
  });
}]);
