angular.module('whiteboard')
.directive('wbChat', ['ChatData', 'Sockets', function (ChatData, Sockets) {
  return {
    restrict: 'A',
    require: ['wbChat'],
    replace: true,
    templateUrl: './templates/chat.html',
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

  Sockets.on('chat message', function (msg) {
    ChatData.displayMessage(msg);
  })


    }
  }
}]);
