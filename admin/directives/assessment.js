angular.module('whiteboard-admin')
.directive('wbAdminAssessment', ['Sockets', 'angularLoad', '$http', function (Sockets, angularLoad, $http) {
  return {
    restrict: 'A',
    require: ['wbAdminAssessment'],
    replace: true,
    scope: {},
    templateUrl: 'templates/assessment.html',
    controller: function ($scope) {
      $scope.assignments = {};
      $scope.assignments = {};
      $scope.sockets = {};
      Sockets.on('users', function (data) {
          $scope.users = Object.values(data);
      });
      /*
      Sockets.on('assignment', function (data) {
          console.log(data);
          $scope.assignment = data;
          $scope.assignment_json = JSON.stringify(data);
      });
      */
      Sockets.on('assignments', function (data) {
          console.log(data);
          $scope.assignments = data;
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
      scope.$watch('selectedAssignment', function(newValue) {
        $http({
          method: 'GET',
          url: '/static/teaching_assets/assignments/'+newValue+'.dot',
          transformResponse: [function (data) {
            // Do whatever you want!
            return data;
          }]
        }).then(function success(response) {
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
