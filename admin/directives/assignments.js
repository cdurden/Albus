angular.module('whiteboard-admin')
.directive('wbAdminAssignments', ['Sockets', 'angularLoad', function (Sockets, angularLoad) {
  return {
    restrict: 'A',
    require: ['wbAdminAssignments'],
    replace: true,
    scope: {},
    templateUrl: 'templates/assignments.html',
    controller: function ($scope) {
      $scope.assignments = {};
      $scope.users = [];
      Sockets.on('assignments', function (data) {
        console.log(data);
        for (assignment of data) {
            $scope.assignments[assignment] = $scope.assignments[assignment] || [] 
        }
      });
      Sockets.on('users', function (data) {
        console.log(data);
        $scope.users = data;
        for (const [userId, user] of Object.entries(data)) {
          if (!(user.assignment in $scope.assignments)) {
              $scope.assignments[user.assignment] = [];
          }
          $scope.assignments[user.assignment].push(user);
        }
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
        function updateAssignments() {
          $('.assignmentList').each(function(i,assignmentElmt) { 
            var assignmentId=$(assignmentElmt).find(".assignment").text();
            $(assignmentElmt).find('span[id^=userId]').each(function(j,userElmt) {
                //var userIdStr = $(userElmt).text();
                var userId = parseInt($(userElmt).text());
                $scope.users[userId]['assignment'] = assignmentId; //FIXME: use a getter/setter method that preserves type
            });
          });
        }
        function createSortables() {
          //var assignments = {};
          $(".assignmentList").each(function(i, elmt) {
            console.log("creating sortable on element:");
            console.log(elmt);
            Sortable.create(elmt, {
              group: 'assignments',
              onChange: function() {
                updateAssignments();
                var usersJSON = JSON.stringify($scope.users,null,'\t');
                $('#printCode').html(usersJSON);
              },
            });
            $('#generateJSON').click(function() {
              Sockets.emit('updateAssignments', $scope.users);
            });
          });
        }
        $scope.$watch("assignments", function (value) {//I change here
          var val = value || null;            
          if (val)
            loadSortableJS(createSortables);
          updateAssignments();
          var usersJSON = JSON.stringify($scope.users,null,'\t');
          $('#printCode').html(usersJSON);
          //let assignments = {};
          //let users = {};
        });
        console.log(data);
        console.log(assignments);
      });
      Sockets.emit('getUsers');
      Sockets.emit('getAssignments');
    },
    link: function(scope, element, attrs) {
      console.log("calling link function");
    },
  }
}]);
