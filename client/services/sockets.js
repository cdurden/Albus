angular.module('whiteboard.services.sockets', [])
.factory('Sockets', Sockets);
Sockets.$inject = ['$rootScope', 'socketFactory'];
function Sockets($rootScope, socketFactory) {
  var myIoSocket = io.connect({'path': $rootScope.BASE_HREF+'socket.io'});

  mySocket = socketFactory({
    ioSocket: myIoSocket
  });

  return mySocket;
}
