angular.module('whiteboard')
.directive('wbTask', ['TaskData', 'Broadcast', 'Receive', function (TaskData) {
  return {
    restrict: 'A',
    require: ['wbTask'],
    replace: true,
    templateUrl: './templates/task.html',
      /*
      '<div class="task-container">' +
      '<button type="button" class="open-button" onclick="openForm()">Task</button>' +
      '<div id="task-popup">' +
      '<ul id="messages"></ul>' +
      '<form action="" id="task-form" class="form-container">' +
      '  <textarea placeholder="Type message..." id="m" autocomplete="off" /><button>Send</button>' +
      '<button type="button" class="cancel" onclick="closeForm()">Close</button>' +
      '</form>' +
      '</div>' +
      '</div>',
      */
    controller: function (MessageHandler) {
      this.handleEvent = function (ev) {
        MessageHandler['task'](ev);
      }
    },
    link: function (scope, element, attrs, ctrls) {
      var taskCtrl = ctrls[0];
      TaskData.createTask(element);
      //TaskData.getInput().bind('keypress', taskCtrl.handleEvent);
      //TaskData.getSendButton().bind('click', taskCtrl.handleEvent);
      TaskData.getForm().bind("submit",taskCtrl.handleEvent);

        /*
      $('body').on('keypress', function (ev) {
        boardCtrl.handleEvent(ev);
      });
      */

    }
  }
}]);
