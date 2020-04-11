angular.module('whiteboard')
.directive('wbTask', ['$compile', '$http', '$templateCache', 'TaskData', 'Sockets', function($compile, $http, $templateCache, TaskData, Sockets) {
  var getTemplate = function(template) {
    var templateLoader;
    var baseUrl = './templates/';
    var templateUrl = baseUrl + template;
    templateLoader = $http.get(templateUrl, {cache: $templateCache});
    return templateLoader;
  }
  //var linker = function(scope, element, attrs, ctrls) {
  var linker = function(scope, element, attrs) {
    //scope.form = ctrls[0];
    Split(['#task-container', '#board-container'], {
      sizes: [25, 75],
      minSize: [0, 300],
      direction: 'vertical',
    })
    scope.submit = function() {
      console.log("submitting answers");
      data = {
          'task_id': scope.task.data.id,
          'data': scope.form.data,
      }
      Sockets.emit("submit", data);
    };
    var loader;
    scope.$watch("task.data", function(data) {
      console.log("updating task");
      if (typeof data.data.template === 'undefined') {
          loader = getTemplate("task.html");
      } else {
          loader = getTemplate(data.data.template);
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
    //require: ['^form'],
    scope: {
        'form': '=',
    }
    replace: true,
    controller: function ($scope) {
      $scope.task = TaskData.getTask();
      $scope.data = {};
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
