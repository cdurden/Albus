angular.module('whiteboard')
.directive('wbTask', ['$compile', '$http', '$templateCache', 'TaskData', 'Sockets', function($compile, $http, $templateCache, TaskData, Sockets) {
  var getTemplate = function(template) {
    var templateLoader;
    var baseUrl = './templates/';
    var templateUrl = baseUrl + template;
    templateLoader = $http.get(templateUrl, {cache: $templateCache});
    return templateLoader;
  }
  var linker = function(scope, element, attrs) {
    var loader;
    scope.$watch("task.data", function(data) {
      console.log("updating task");
      if (typeof data.template === 'undefined') {
          loader = getTemplate("task.html");
      } else {
          loader = getTemplate(data.template);
      }
      var promise = loader.then(function(response) {
      //    element.html(html);
      //}).then(function (response) {
          //element.replaceWith($compile(element.html())(scope));
          element.html($compile(response.data)(scope));// TODO: figure out if this is correct
      });
    });
  }
  return {
    restrict: 'A',
    require: ['wbTask'],
    replace: true,
    controller: function ($scope) {
      $scope.task = TaskData.getTask();
      Sockets.emit("getAssignedTask");
      this.requestData = function (ev) {
          ev.preventDefault(); // prevents page reloading
          Sockets.emit("getAssignedTask");
          return false;
      };
      this.submit = function (ev) {
          ev.preventDefault(); // prevents page reloading
          Sockets.emit("submit");
          return false;
      }
    },
    link: linker,
      /*
      function (scope, element, attrs, ctrls) {
      var taskCtrl = ctrls[0];
      TaskData.createTask(element);
      //TaskData.getInput().bind('keypress', taskCtrl.handleEvent);
      //TaskData.getSendButton().bind('click', taskCtrl.handleEvent);
      TaskData.getSubmitButton().bind("click", taskCtrl.submit);
      */

        /*
      $('body').on('keypress', function (ev) {
        boardCtrl.handleEvent(ev);
      });
      */
      /*
      Sockets.on('task', function (data) {
        console.log(data);
        TaskData.displayData(data);
      })
      Sockets.on('submissionConfirmation', function (data) {
        console.log(data);
        TaskData.confirmSubmission(data);
      })
    }
      */
  }
}]);
