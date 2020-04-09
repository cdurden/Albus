angular.module('whiteboard')
.directive('wbTask', ['TaskData', 'Sockets', function (TaskData, Sockets) {
  var getTemplate = function(template) {
    var templateLoader,
    baseUrl = './templates/',
    var templateUrl = baseUrl + template;
    templateLoader = $http.get(templateUrl, {cache: $templateCache});
    return templateLoader;
  }
  var linker = function(scope, element, attrs) {
    var loader = getTemplate(scope.task.template);
    var promise = loader.success(function(html) {
        element.html(html);
    }).then(function (response) {
        element.replaceWith($compile(element.html())(scope));
    });
  }
  return {
    restrict: 'A',
    require: ['wbTask'],
    replace: true,
    controller: function ($scope) {
      $scope.task = TaskData.getTask();
      Sockets.emit("getTask");
      this.requestData = function (ev) {
          ev.preventDefault(); // prevents page reloading
          Sockets.emit("getTask");
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
      */
    }
  }
}]);
