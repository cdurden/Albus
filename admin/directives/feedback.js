angular.module('whiteboard-admin')
.directive('wbAdminFeedback', ['Sockets', 'angularLoad', '$http', function (Sockets, angularLoad, $http) {
  return {
    restrict: 'A',
    require: ['wbAdminFeedback'],
    replace: true,
    scope: {},
    templateUrl: 'templates/feedback.html',
    controller: function ($scope) {
      $scope.assignments = {};
      $scope.assignments = {};
      $scope.sockets = {};
      Sockets.on('users', function (data) {
          $scope.users = Object.values(data);
      });
      Sockets.on('assignments', function (data) {
          console.log(data);
          $scope.assignments = data;
      });
      Sockets.on('tasks', function (data) {
          console.log(data);
          $scope.tasks = data;
      });
      Sockets.on('feedbackRedirect', function (data) {
          console.log(data);
      });
      /*
      Sockets.emit('getAssignments');
      Sockets.emit('getUsers');
      */
    },
    link: function(scope, element, attrs, ctrls) {
      $(element).find("#create-feedback-form").bind("submit",function(ev) {
          var users = $scope.selectedUsers;
          var assignments = $scope.selectedAssignments;
          var tasks = $scope.selectedTasks;
          ev.preventDefault();
          Sockets.emit('createFeedback', { 'users': users, 'tasks': tasks, 'assignments': assignments });
      });
      scope.$watch('selectedAssignment', function(newValue) {
        $http({
          method: 'GET',
          url: '/static/teaching_assets/assignments/'+newValue+'.dot',
          transformResponse: [function (data) {
            // Do whatever you want!
            return data;
          }]
        }).then(function success(response) {
          scope.tasks = response.data;
        });
      });
    },
  }
}]);
