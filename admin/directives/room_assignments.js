angular.module('whiteboard-admin')
.directive('wbAdminRoomAssignments', ['Sockets', function (Sockets) {
  return {
    restrict: 'A',
    require: ['wbAdminRoomAssignments'],
    replace: true,
    controller: function ($scope) {
      Sockets.on('room_assignments', function (data) {
        $scope.users = data;
      });
      Sockets.emit('get_room_assignments');
    },
    templateUrl: 'templates/room_assignments.html',
  }
}]);
