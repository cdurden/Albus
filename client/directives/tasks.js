angular.module('whiteboard')
.directive('wbTasks', ['$compile', '$http', '$templateCache', 'TaskData', 'Sockets', function($compile, $http, $templateCache, TaskData, Sockets) {
  return {
    restrict: 'A',
    //require: ['^form'],
    templateUrl: './templates/tasks.html',
    scope: {
        'form': '=',
    },
    controller: function ($scope) {
      $scope.tasks = TaskData.getTasks();
      $scope.data = {};
      Sockets.emit("getAssignedTasks");
      this.requestData = function (ev) {
          ev.preventDefault(); // prevents page reloading
          Sockets.emit("getAssignedTasks");
          return false;
      };
    },
    link: function(scope, element, attrs) {
      var scope.taskData = TaskData.getData();
      Split(['#task-container', '#task-selector-container'], {
        sizes: [75,25],
        minSize: [0, 0],
        snapOffset: 0,
        expandToMin: false,
        direction: 'horizontal',
      })
      scope.i = 0;
      scope.$watch("taskData[tasks][i]", function(task) {
        scope.task = task;
        console.log("updating task");
        if (typeof task === 'undefined' || typeof task.template === 'undefined') {
            loader = getTemplate("task.html");
        } else {
            loader = getTemplate(task.template);
        }
        var promise = loader.then(function(response) {
         element.html($compile(response.data)(scope));// TODO: figure out if this is correct
        });
      }, objectEquality=true);
    }
  }
}]);
