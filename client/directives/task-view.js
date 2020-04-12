angular.module('whiteboard')
.directive('wbTaskView', ['$compile', '$http', '$templateCache', 'TaskData', 'Sockets', function($compile, $http, $templateCache, TaskData, Sockets) {
  var getTemplate = function(template) {
    var templateLoader;
    var baseUrl = './templates/';
    var templateUrl = baseUrl + template;
    templateLoader = $http.get(templateUrl, {cache: $templateCache});
    return templateLoader;
  }
  //var linker = function(scope, element, attrs, ctrls) {
  var linker = function(scope, element, attrs) {
    scope.submit = function() {
      console.log("submitting answers");
      data = {
          'task_id': scope.task.data.id,
          'data': scope.data,
      }
      Sockets.emit("submit", data);
    };
    var loader;
    scope.$watch("$parent.task", function(task) {
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
  return {
    restrict: 'A',
    //require: ['^form'],
    scope: {
        'form': '=',
    },
    //replace: true,
    controller: function ($scope) {
      this.submit = function (ev) {
          ev.preventDefault(); // prevents page reloading
          Sockets.emit("submit");
          return false;
      }
    },
    link: linker,
  }
}]);
