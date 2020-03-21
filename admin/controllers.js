app.controller('adminCtrl', [$scope, function($scope, socket) {

  // Socket listeners
  // ================

  socket.on('submissions', function (data) {
    $scope.submissions = data;
  });
}]);
