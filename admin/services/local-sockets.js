angular.module('whiteboard.admin.services.localsockets', [])
.factory('LocalSockets', function (socketFactory) {
  var myIoSocket = io('http://localhost',{'path': '/socket.io'});

  mySocket = socketFactory({
    ioSocket: myIoSocket
  });

  return mySocket;
});
