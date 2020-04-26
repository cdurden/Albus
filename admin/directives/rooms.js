angular.module('whiteboard-admin')
.directive('wbAdminRoomAssignments', ['Sockets', 'angularLoad', function (Sockets, angularLoad) {
  return {
    restrict: 'A',
    require: ['wbAdminRoomAssignments'],
    replace: true,
    templateUrl: 'templates/rooms.html',
    controller: function ($scope) {
      $scope.rooms = {}
      Sockets.on('allClientData', function (data) {
        rooms = {};
        $scope.sockets = data;
        for (socketId in data) {
          if (!(data[socketId].roomId in rooms)) {
              rooms[data[socketId].roomId] = [];
          }
          rooms[data[socketId].roomId].push({'socketId': socketId, 'data': data[socketId]});
        }
        $scope.rooms = rooms;
      });
      Sockets.emit('getAllClientData');
    },
    link: function(scope, element, attrs) {
      function loadSortableJS(callback) {
        var sortableScripts = ["https://raw.githack.com/SortableJS/Sortable/master/Sortable.js", "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.4.1/jquery.min.js"]
        Promise.all(sortableScripts.map(function(script) {
          return(angularLoad.loadScript(script).then(function(result) {
            return result;
          }));
        })).then(function() {
          callback();
        });
      }
      function updateRooms() {
        $('.roomList').each(function(i,roomElmt) { 
          var roomId=$(roomElmt).find(".room").text();
          $(roomElmt).find('span[id^=socketId]').each(function(j,socketElmt) {
              scope.sockets[$(socketElmt).text()]['roomId'] = roomId;
          });
        });
      }
      function createSortables() {
        $(".roomList").each(function(i, elmt) {
          console.log("creating sortable on element:");
          console.log(elmt);
          Sortable.create(elmt, {
            group: 'rooms',
            onChange: function() {
              updateRooms();
              var socketsJSON = JSON.stringify(scope.sockets,null,'\t');
              $('#roomsJSON').html(socketsJSON);
            },
          });
        });
      }
      element.find('#assignRoomsButton').click(function() {
         Sockets.emit('assignRooms', scope.sockets);
      });
      console.log("calling link function");
      scope.$watch("rooms", function (value) {
        var val = value || null;            
        if (val)
          loadSortableJS(createSortables);
        updateRooms();
        var socketsJSON = JSON.stringify(scope.sockets,null,'\t');
        element.find('#printCode').html(socketsJSON);
      }, true);
    },
  }
}]);
