angular.module('whiteboard-admin')
.directive('wbAdminSubmissions', ['Sockets', function (Sockets) {
  return {
    restrict: 'A',
    require: ['wbAdminSubmissions'],
    replace: true,
    templateUrl: "./templates/submissions.html",
    controller: function ($scope) {
      $scope.submissions = [];
      $scope.submissionState = 'pending';
      Sockets.emit('getSections');
      $scope.getAssignmentTasks = function(assignment) {
          Sockets.emit('getAssignmentTasks', assignment);
      }
      Sockets.on('assignments', function (data) {
        console.log(data);
        $scope.assignments = data;
      });
      Sockets.on('tasks', function (data) {
        console.log(data);
        $scope.tasks = data;
      });
      Sockets.on('submission', function (data) {
        console.log(data);
        $scope.submissions.push(data);
      });
      Sockets.on('submissions', function (data) {
        $scope.submissions = data;
      });
      Sockets.emit('getSubmissions', $scope.submissionState);
    },
  }
}]);
