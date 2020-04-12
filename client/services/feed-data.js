angular.module('whiteboard.services.feeddata', [])
.factory('FeedData', function () {
  var feed;
  var form;
  var input;
  var send_button;
  function createFeed (element) {
    feed = element.find('ul');
    form = element.find('form');
    input = element.find('textarea');
    send_button = element.find('button');
  }
  function getForm() {
    return form;
  }
  function getFeed() {
    return feed;
  }
  function getInput() {
    return input;
  }
  function getInputMessage() {
    var input = getInput();
    message = input.val();
    return message;
  }
  function getSendButton() {
    return send_button;
  }
    /*
  function setSocketId (id) {
    socketId = id;
  }
  function getSocketId () {
    return socketId;
  }
  */
  function displayMessage(msg) {
      var li = document.createElement("li");
      var t = document.createTextNode(msg);
      li.appendChild(t);
      getFeed().append(li);
  }

  return {
    createFeed: createFeed,
    displayMessage: displayMessage,
      /*
    setSocketId: setSocketId,
    getSocketId: getSocketId,
    */
    getFeed: getFeed,
    getForm: getForm,
    getInput: getInput,
    getInputMessage: getInputMessage,
  }
});
