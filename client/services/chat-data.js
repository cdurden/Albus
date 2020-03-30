angular.module('whiteboard.services.chatdata', [])
.factory('ChatData', function () {
  var chat;
  var form;
  var input;
  var send_button;
  function createChat (element) {
    chat = element.find('ul');
    form = element.find('form');
    input = element.find('textarea');
    send_button = element.find('button');
  }
  function getForm() {
    return form;
  }
  function getChat() {
    return chat;
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
      getChat().append(li);
  }

  return {
    createChat: createChat,
    displayMessage: displayMessage,
      /*
    setSocketId: setSocketId,
    getSocketId: getSocketId,
    */
    getChat: getChat,
    getForm: getForm,
    getInput: getInput,
    getInputMessage: getInputMessage,
  }
});
