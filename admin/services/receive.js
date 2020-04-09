angular.module('whiteboard.admin.services.receive', [])
.factory('Receive', function (Sockets, EventHandler) {
  Sockets.on('tasks', function (data) {
    console.log(data);
//    EventHandler.setTask(data);
  })

  return {};

});
