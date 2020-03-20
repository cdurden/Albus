angular.module('whiteboard.services.sockets', [])
.factory('Sockets', function (socketFactory) {
  var myIoSocket = io.connect({'path': BASE_HREF+'socket.io');

  mySocket = socketFactory({
    ioSocket: myIoSocket
  });

  return mySocket;
});
