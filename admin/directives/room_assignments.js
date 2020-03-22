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
    link: function(scope, element, attrs) {
      console.log("calling link function");
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
              injectLibFromStack(callback);
            };
      
            //append the script tag to the <head></head>
            headTag.appendChild(scriptTag);
            console.log("injecting: " + nextLib);
          }
          else return callback();
      }
      var libs = ["https://raw.githack.com/SortableJS/Sortable/master/Sortable.js", "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.4.1/jquery.min.js"]
      injectLibsFromStack(function() {
        Sortable.create(productList, {
          group: "sorting",
          sort: true
        });
        $('#generateJSON').click(function() {
      
          let data = {};
      
          var titles = $('span[id^=title]').map(function(idx, elem) {
            return $(elem).text();
          }).get();
      
          data['products'] = titles;
      
          // encode to JSON format
          var products_json = JSON.stringify(data,null,'\t');
          $('#printCode').html(products_json);
        });
      });
    },
  }
}]);
