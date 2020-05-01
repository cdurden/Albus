angular.module('whiteboard-admin')
.directive('wbAdminTasks', ['Sockets', function (Sockets) {
  return {
    restrict: 'A',
    require: ['wbAdminTasks'],
    replace: true,
    templateUrl: 'templates/tasks.html',
    controller: function ($scope, FileUploader) {
      $scope.tasks = {};
      $scope.assignments = {};
      $scope.sockets = {};
//      $scope.uploader = new FileUploader();
      Sockets.on('task', function (data) {
          console.log(data);
          $scope.task = data;
          $scope.task_json = JSON.stringify(data);
      });
      Sockets.on('tasks', function (data) {
          console.log(data);
          $scope.tasks = data;
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
