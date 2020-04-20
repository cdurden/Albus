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
          $scope.users = data;
      });
      Sockets.on('assignments', function (data) {
          console.log(data);
          $scope.assignments = data;
      });
      Sockets.on('tasks', function (data) {
          console.log(data);
          $scope.tasks = data;
      });
      /*
      Sockets.emit('getAssignments');
      Sockets.emit('getUsers');
      */
    },
    link: function(scope, element, attrs, ctrls) {
      var scripts = [
          "//d3js.org/d3.v5.min.js",
          "https://unpkg.com/@hpcc-js/wasm@0.3.6/dist/index.min.js",
          "https://unpkg.com/d3-graphviz@3.0.0/build/d3-graphviz.js"
      ];
      var d3Promise = (function() {
          return scripts.reduce( async (accumulatorPromise, nextScript) => {
              return accumulatorPromise.then(() => {
                  return angularLoad.loadScript(nextScript);
              });
          }, Promise.resolve());
      })();
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
          d3Promise.then(function() {
            d3.select("#assignment-graph").graphviz()
              .renderDot(response.data);
            ev.preventDefault();
          });
        });
      });
    },
  }
}]);
