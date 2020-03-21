function adminCtrl($scope, socket) {

  // Socket listeners
  // ================

  socket.on('submissions', function (data) {
    $scope.submissions = data;
  });
}
