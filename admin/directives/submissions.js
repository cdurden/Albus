angular.module('whiteboard-admin')
.directive('wbAdminSubmissions', ['Sockets', function (Sockets) {
  return {
    restrict: 'A',
    require: ['wbChat'],
    replace: true,
    template: 
      '<ul id="submissions">' +
      '<li ng-repeat="submission in submissions">{{submission}}</li>' +
      '</ul>' +
    link: function (scope, element, attrs, ctrls) {
      Sockets.on('submissions', function (data) {
        $scope.submissions = data;
      });
    }
  }
}]);
