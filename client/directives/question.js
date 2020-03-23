angular.module('whiteboard')
.directive('wbQuestion', ['QuestionData', 'Broadcast', 'Receive', function (QuestionData) {
  return {
    restrict: 'A',
    require: ['wbQuestion'],
    replace: true,
    templateUrl: './templates/question.html',
      /*
      '<div class="question-container">' +
      '<button type="button" class="open-button" onclick="openForm()">Question</button>' +
      '<div id="question-popup">' +
      '<ul id="messages"></ul>' +
      '<form action="" id="question-form" class="form-container">' +
      '  <textarea placeholder="Type message..." id="m" autocomplete="off" /><button>Send</button>' +
      '<button type="button" class="cancel" onclick="closeForm()">Close</button>' +
      '</form>' +
      '</div>' +
      '</div>',
      */
    controller: function (MessageHandler) {
      this.handleEvent = function (ev) {
        MessageHandler['question'](ev);
      }
    },
    link: function (scope, element, attrs, ctrls) {
      var questionCtrl = ctrls[0];
      QuestionData.createQuestion(element);
      //QuestionData.getInput().bind('keypress', questionCtrl.handleEvent);
      //QuestionData.getSendButton().bind('click', questionCtrl.handleEvent);
      QuestionData.getForm().bind("submit",questionCtrl.handleEvent);

        /*
      $('body').on('keypress', function (ev) {
        boardCtrl.handleEvent(ev);
      });
      */

    }
  }
}]);
