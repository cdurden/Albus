angular.module('whiteboard.services.messagehandler', [])
.factory('MessageHandler', ['ChatData', 'EventHandler', 'Broadcast', function (ChatData, EventHandler, Broadcast) {
  function messageHandler (ev) {
      ev.preventDefault(); // prevents page reloading
      Broadcast.sendMessage(ChatData.getInput().value);
      console.log(ChatData.getInput().value);
      ChatData.getInput().value = '';
      return false;
  }
  return messageHandler
}]);
