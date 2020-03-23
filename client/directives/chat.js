angular.module('whiteboard')
.directive('wbChat', ['ChatData', 'Broadcast', 'Receive', function (ChatData) {
  return {
    restrict: 'A',
    require: ['wbChat'],
    replace: true,
    template: 
      '<div id="chat-container">' +
      '<script>' +
      'function openForm() {' +
      '      document.getElementById("myForm").style.display = "block";' +
      '}' +
      'function closeForm() {' +
      '      document.getElementById("myForm").style.display = "none";' +
      '}' +
      '</script>' +
      '<div id="chat-popup">' +
      '<div id="messages-container">' +
      '<ul id="messages"></ul>' +
      '</div>' +
      '<form action="">' +
      '      <input id="m" autocomplete="off" /><button>Send</button>' +
      '    </form>' +
      '</div>' +
      '<button type="button" class="btn cancel" onclick="closeForm()">Close</button>' +
      '</div>',
    controller: function (MessageHandler) {
      this.handleEvent = function (ev) {
        MessageHandler(ev);
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
