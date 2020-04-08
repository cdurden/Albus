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
        console.log(data);
        rooms = {};
        for (socket in data) {
          if (!(data[socket].roomId in rooms)) {
              rooms[data[socket].roomId] = [];
          }
          rooms[data[socket].roomId].push({'socket_id': socket, 'data': data[socket]});
        }
//        $scope.$apply(function() {
          $scope.rooms = rooms;
//          $scope.$emit("update_rooms", rooms);
//        });
          /*
      $scope.$on("update_rooms", function (evt, rooms) {
        console.log(rooms);
        $scope.rooms = rooms
      });
      */
      function create_sortables() {
        let rooms = {};
        let sockets = {};
        $(".roomList").each(function(i, elmt) {
          console.log("creating sortable on element:");
          console.log(elmt);
          Sortable.create(elmt, {
            group: 'rooms',
            onChange: function() {
              $('.roomList').each(function(i,room_elmt) { 
                var room=$(room_elmt).find(".room").text();
                $(room_elmt).find('span[id^=socket_id]').each(function(j,socket_elmt) {
                    sockets[$(socket_elmt).text()] = {'roomId': room };
                    // do more
                });
                var student_ids = $(room_elmt).find('span[id^=student_id]').map(function(idx, elem) {
                  return {'id': $(elem).text()};
                }).get();
            
                rooms[room] = student_ids;
              });
          
              // encode to JSON format
              var rooms_json = JSON.stringify(rooms,null,'\t');
              var sockets_json = JSON.stringify(sockets,null,'\t');
              $('#printCode').html(sockets_json);
            },
          });
        });
      }
      $scope.$watch("rooms", function (value) {//I change here
        var val = value || null;            
        if (val)
          create_sortables();
      });
        console.log(data);
        console.log(rooms);
      });
      Sockets.emit('getAllClientData');
    },
    link: function(scope, element, attrs) {
      console.log("calling link function");
        /*
      function injectLibsFromStack(callback){
          if(libs.length > 0){
      
            //grab the next item on the stack
            var nextLib = libs.shift();
            var headTag = document.getElementsByTagName('head')[0];
      
            //create a script tag with this library
            var scriptTag = document.createElement('script');
            scriptTag.src = nextLib;
      
            //when successful, inject the next script
            scriptTag.onload = function(e){
              console.log("---> loaded: " + e.target.src);
              injectLibsFromStack(callback);
            };
      
            //append the script tag to the <head></head>
            headTag.appendChild(scriptTag);
            console.log("injecting: " + nextLib);
          }
          else return callback();
      }
      */
      var sortableScripts = ["https://raw.githack.com/SortableJS/Sortable/master/Sortable.js", "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.4.1/jquery.min.js"]
      Promise.all(sortableScripts.map(function(script) {
        return(angularLoad.loadScript(script).then(function(result) {
          return result;
        }));
      })).then(function() {
        var sortables = [];
        console.log("creating sortables");
        $('#generateJSON').click(function() {
      
          let rooms = {};
          let sockets = {};
           
          $('.roomList').each(function(i,room_elmt) { 
            var room=$(room_elmt).find(".room").text();
            $(room_elmt).find('span[id^=socket_id]').each(function(j,socket_elmt) {
                sockets[$(socket_elmt).text()] = {'roomId': room };
                // do more
            });
            var student_ids = $(room_elmt).find('span[id^=student_id]').map(function(idx, elem) {
              return {'id': $(elem).text()};
            }).get();
        
            rooms[room] = student_ids;
          });
      
          // encode to JSON format
          var rooms_json = JSON.stringify(rooms,null,'\t');
          var sockets_json = JSON.stringify(sockets,null,'\t');
          $('#printCode').html(sockets_json);
          Sockets.emit('assign_sockets_to_rooms', sockets);
        });
      });
          
        /*
      injectLibsFromStack(function() {
        var sortables = [];
        console.log("creating sortables");
        $('#generateJSON').click(function() {
      
          let rooms = {};
          let sockets = {};
           
          $('.roomList').each(function(i,room_elmt) { 
            var room=$(room_elmt).find(".room").text();
            $(room_elmt).find('span[id^=socket_id]').each(function(j,socket_elmt) {
                sockets[$(socket_elmt).text()] = {'roomId': room };
                // do more
            });
            var student_ids = $(room_elmt).find('span[id^=student_id]').map(function(idx, elem) {
              return {'id': $(elem).text()};
            }).get();
        
            rooms[room] = student_ids;
          });
      
          // encode to JSON format
          var rooms_json = JSON.stringify(rooms,null,'\t');
          var sockets_json = JSON.stringify(sockets,null,'\t');
          $('#printCode').html(sockets_json);
          Sockets.emit('assign_sockets_to_rooms', sockets);
        });
      });
      */
    },
  }
}]);
