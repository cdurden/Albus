angular.module('whiteboard')
.directive('wbTask', ['TaskData', 'Sockets', function (TaskData, Sockets) {
  return {
    restrict: 'A',
    require: ['wbTask'],
    replace: true,
    templateUrl: './templates/task.html',
    controller: function () {
      Sockets.emit("get_task");
      this.requestData = function (ev) {
          ev.preventDefault(); // prevents page reloading
          Sockets.emit("get_task");
          return false;
      };
      this.submit = function (ev) {
          ev.preventDefault(); // prevents page reloading
          Sockets.emit("submit");
          return false;
      }
    },
    link: function (scope, element, attrs, ctrls) {
      var taskCtrl = ctrls[0];
      TaskData.createTask(element);
      //TaskData.getInput().bind('keypress', taskCtrl.handleEvent);
      //TaskData.getSendButton().bind('click', taskCtrl.handleEvent);
      TaskData.getSubmitButton().bind("click", taskCtrl.submit);

        /*
      $('body').on('keypress', function (ev) {
        boardCtrl.handleEvent(ev);
      });
      */
      Sockets.on('task', function (data) {
        console.log(data);
        TaskData.displayData(data);
      })
      Sockets.on('submission_confirmation', function (data) {
        console.log(data);
        TaskData.confirmSubmission(data);
      })
    }
  }
}]);
