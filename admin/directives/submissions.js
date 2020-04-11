angular.module('whiteboard-admin')
.directive('wbAdminSubmissions', ['Sockets', function (Sockets) {
  return {
    restrict: 'A',
    require: ['wbAdminSubmissions'],
    replace: true,
    templateUrl: "./templates/submissions.html",
    controller: function ($scope) {
      $scope.submissions = [];
      Sockets.on('submission', function (data) {
        console.log(data);
        $scope.submissions.push(data);
      });
      Sockets.on('submissions', function (data) {
        $scope.submissions = data;
      });
      Sockets.emit('submissions');
    },
  }
}]);
