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
      //$scope.sockets = {};
      $scope.users = {};
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
          ev.preventDefault();
          var users = scope.selectedUsers;
          var assignments = scope.selectedAssignments;
          var tasks = scope.selectedTasks;
          Sockets.emit('createFeedback', { 'users': users, 'tasks': tasks, 'assignments': assignments });
          return false;
      });
      scope.$watch('selectedAssignment', function(newValue) {
        Sockets.emit('getAssignmentTasks', newValue);
          /*
        $http({
          method: 'GET',
          url: '/static/teaching_assets/assignments/'+newValue+'.json',
          transformResponse: [function (data) {
            // Do whatever you want!
            return data;
          }]
        }).then(function success(response) {
            Sockets.emit('getTasksFromSource', response.data);
          //scope.tasks = response.data;
        });
        */
      });
    },
  }
}]);
