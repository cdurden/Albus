angular.module('whiteboard.services.messagehandler', [])
.factory('MessageHandler', ['ChatData', 'EventHandler', 'Broadcast', function (ChatData, EventHandler, Broadcast) {
  function chat (ev) {
      ev.preventDefault(); // prevents page reloading
      Broadcast.chat(ChatData.getInput().val());
      console.log(ChatData.getInput().val());
      ChatData.getInput().val('');
      return false;
  }
  function raiseHand (ev) {
      ev.preventDefault(); // prevents page reloading
      Broadcast.raiseHand();
      console.log("You raised your hand!");
      return false;
  }
  function submit (ev) {
      ev.preventDefault(); // prevents page reloading
      Broadcast.raiseHand();
      console.log("Submitting answers.");
      return false;
  }
  return {
      chat: chat,
      raiseHand: raiseHand,
      submit: submit,
  }
}]);
