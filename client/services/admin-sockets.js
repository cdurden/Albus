angular.module('whiteboard.services.adminsockets', [])
.factory('AdminSockets', function (socketFactory) {
  var myIoSocket = io('/admin',{'path': '/socket.io'});

  mySocket = socketFactory({
    ioSocket: myIoSocket
  });

  return mySocket;
});
