angular.module('whiteboard-admin')
.directive('wbAdminAssignments', ['Sockets', 'angularLoad', '$http', function (Sockets, angularLoad, $http) {
  return {
    restrict: 'A',
    require: ['wbAdminAssignments'],
    replace: true,
    templateUrl: 'templates/assignments.html',
    controller: function ($scope) {
      $scope.assignments = {};
      $scope.assignments = {};
      $scope.sockets = {};
      Sockets.on('allClientData', function (data) {
          $scope.sockets = data;
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
      Sockets.emit('getAssignments');
    },
    link: function(scope, element, attrs, ctrls) {
      var script = "https://unpkg.com/d3-graphviz@3.0.0/build/d3-graphviz.js";
      var d3Promise = angularLoad.loadScript(script);
      $(element).find("#assign-assignment-form").bind("submit",function(ev) {
          ev.preventDefault();
          var assignments = {};
          for (socketId of scope.selectedSockets) {
              assignments[socketId] = scope.selectedAssignments;
          }
          Sockets.emit('assignAssignmentsToSockets', assignments);
      });
      $(element).find("#assignment-selector").change(function(ev) {
        $http({
          method: 'GET',
          url: '/static/teaching_assets/assignments/'+$(this).val()+'.dot',
          transformResponse: [function (data) {
            // Do whatever you want!
            return data;
          }]
        }).then(function success(data) {
          d3Promise.then(function() {
            d3.select("#assignment-graph").graphviz()
              .renderDot(data);
            ev.preventDefault();
          });
        });
      });
    },
  }
}]);
