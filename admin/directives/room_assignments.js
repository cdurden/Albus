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
    },
  }
}]);
