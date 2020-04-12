angular.module('whiteboard.services.messagehandler', [])
.factory('MessageHandler', ['FeedData', 'EventHandler', 'Broadcast', function (FeedData, EventHandler, Broadcast) {
  function feed (ev) {
      ev.preventDefault(); // prevents page reloading
      Broadcast.feed(FeedData.getInputMessage());
      console.log(FeedData.getInputMessage());
      FeedData.getInput().val('');
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
      feed: feed,
      raiseHand: raiseHand,
      submit: submit,
  }
}]);
