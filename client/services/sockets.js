angular.module('whiteboard.services.sockets', [])
.factory('Sockets', function (socketFactory) {
  var myIoSocket = io.connect();

  mySocket = socketFactory({
    ioSocket: myIoSocket
  });

  return mySocket;
});
/*
angular.module('whiteboard.services.sockets', [])
.factory('Sockets',// Sockets);
//Sockets.$inject = ['$rootScope', 'socketFactory'];
function (socketFactory) {//Sockets($rootScope, socketFactory) {
  //var myIoSocket = io.connect({'path': $rootScope.BASE_HREF+'socket.io'});
  var myIoSocket = io.connect({'path': 'socket.io'});

  mySocket = socketFactory({
    ioSocket: myIoSocket
  });

  return mySocket;
a});
*/
