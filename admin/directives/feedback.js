angular.module('whiteboard-admin')
.directive('wbAdminTaskBuilder', ['Sockets', 'LocalSockets', function (Sockets, LocalSockets) {
  return {
    restrict: 'A',
    require: ['wbAdminTaskBuilder'],
    replace: true,
    templateUrl: 'templates/task-builder.html',
    controller: function ($scope) {
      $scope.tasks = {};
      $scope.assignments = {};
      $scope.sockets = {};
      Sockets.on('allClientData', function (data) {
          $scope.sockets = data;
      });
      Sockets.on('task', function (data) {
          console.log(data);
          $scope.task = data;
          $scope.task_json = JSON.stringify(data);
      });
      Sockets.on('taskTemplates', function (data) {
          console.log(data);
          $scope.taskTemplates = data;
      });
      Sockets.emit('getAssignedTask');
      Sockets.emit('getTasks');
    },
    link: function(scope, element, attrs, ctrls) {
      $(element).find("#assign-task-form").bind("submit",function(ev) {
          ev.preventDefault();
          var assignments = {};
          for (socketId of scope.selectedSockets) {
              assignments[socketId] = scope.selectedTasks;
          }
          Sockets.emit('assignTasksToSockets', assignments);
      });
      $(element).find("#task-selector").change(function(ev) {
          ev.preventDefault();
          Sockets.emit('getTaskFromSource', $(this).val());
      });
    },
  }
}]);
