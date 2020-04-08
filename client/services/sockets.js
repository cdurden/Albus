angular.module('whiteboard.services.sockets', [])
.factory('Sockets', function (socketFactory) {
  var myIoSocket = io('/client',{'path': '/socket.io'});

  mySocket = socketFactory({
    ioSocket: myIoSocket
  });

  return mySocket;
});
