angular.module('whiteboard-admin')
.directive('wbAdminFeedback', ['Sockets', 'angularLoad', function (Sockets, angularLoad) {
  return {
    restrict: 'A',
    require: ['wbAdminFeedback'],
    replace: true,
    templateUrl: 'templates/feedback.html',
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
        $scope.$watch("assignments", function (value) {//I change here
          var val = value || null;            
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
