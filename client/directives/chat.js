angular.module('whiteboard')
.directive('wbChat', ['ChatData', 'Broadcast', 'Receive', function (ChatData) {
  return {
    restrict: 'A',
    require: ['wbChat'],
    replace: true,
    template: 
      '<div class="chat-container">' +
      '<button type="button" class="open-button" onclick="openForm()">Chat</button>' +
      '<div id="chat-popup">' +
      '<ul id="messages"></ul>' +
      '<form action="" id="chat-form" class="form-container">' +
      '  <textarea placeholder="Type message..." id="m" autocomplete="off" /><button>Send</button>' +
      '<button type="button" class="cancel" onclick="closeForm()">Close</button>' +
      '</form>' +
      '</div>' +
      '</div>',
    controller: function (MessageHandler) {
      this.handleEvent = function (ev) {
        MessageHandler['chat'](ev);
      }
    },
    link: function (scope, element, attrs, ctrls) {
      var chatCtrl = ctrls[0];
      ChatData.createChat(element);
      //ChatData.getInput().bind('keypress', chatCtrl.handleEvent);
      //ChatData.getSendButton().bind('click', chatCtrl.handleEvent);
      ChatData.getForm().bind("submit",chatCtrl.handleEvent);

        /*
      $('body').on('keypress', function (ev) {
        boardCtrl.handleEvent(ev);
      });
      */

    }
  }
}]);
