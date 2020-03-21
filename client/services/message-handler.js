angular.module('whiteboard.services.messagehandler', [])
.factory('MessageHandler', ['ChatData', 'EventHandler', 'Broadcast', function (ChatData, EventHandler, Broadcast) {
  function messageHandler (ev) {
      ev.preventDefault(); // prevents page reloading
      Broadcast.sendMessage(ChatData.getInput().val());
      console.log(ChatData.getInput().val());
      ChatData.getInput().val('');
      return false;
  }
  return messageHandler
}]);
