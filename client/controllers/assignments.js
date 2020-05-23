angular.module('whiteboard')
.controller("assignmentDialogController", function ($scope) {
      var params = $scope.$resolve.params;
      
      $scope.name = params.name;
      $scope.age = params.age;
      
      $scope.cancel = function () {
         $scope.$dismiss();
      };

      $scope.ok = function () {
         var retObj = {
            name: $scope.name,
            age: $scope.age,
            profession: "Car Mechanic",
            yearsOfExp: 3
         };
         $scope.$close(retObj);
      };
});
