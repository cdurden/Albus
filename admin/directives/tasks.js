angular.module('whiteboard-admin')
.directive('wbAdminTasks', ['Sockets', function (Sockets) {
  return {
    restrict: 'A',
    require: ['wbAdminTasks'],
    replace: true,
    templateUrl: 'templates/tasks.html',
    controller: function ($scope) {
      Sockets.on('task', function (data) {
          console.log(data);
          $scope.task = data;
      });
      Sockets.emit('get_task');
    },
    link: function(scope, element, attrs, ctrls) {
      $(element).find("#assign-task-form").bind("submit",function(ev) {
          ev.preventDefault();
          Sockets.emit('assign_task', scope.task);
      });
    },
  }
}]);
