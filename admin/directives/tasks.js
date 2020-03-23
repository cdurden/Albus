angular.module('whiteboard-admin')
.directive('wbAdminTasks', ['Sockets', function (Sockets) {
  return {
    restrict: 'A',
    require: ['wbAdminTasks'],
    replace: true,
    controller: function ($scope) {
      Sockets.on('task', function (data) {
          $scope.task = data;
      });
      Sockets.emit('get_task');
    },
    templateUrl: 'templates/room_assignments.html',
    link: function(scope, element, attrs, ctrls) {
      $(element).find("#task-form").bind("submit",function() {
          Sockets.emit('assign_task', $scope.task);
      });
    },
  }
}]);
