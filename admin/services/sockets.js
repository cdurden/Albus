angular.module('whiteboard.admin.services.sockets', [])
.factory('Sockets', function (socketFactory) {
  var myIoSocket = io('/admin',{'path': '/socket.io'});

  mySocket = socketFactory({
    ioSocket: myIoSocket
  });

  return mySocket;
});
