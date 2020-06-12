angular.module('whiteboard')
.controller("assignmentModalInstanceController", function ($scope) {
  var $ctrl = this;
  $ctrl.assignments = assignments;
  $ctrl.scope = $scope;
  $ctrl.selected = {
    assignments: $ctrl.assignments[0]
  };

  $ctrl.ok = function () {
    $uibModalInstance.close($ctrl.selectedAssignment);
    $ctrl.scope.$emit('activateMenu', 'hide');
  };

  $ctrl.cancel = function () {
    $uibModalInstance.dismiss('cancel');
    $ctrl.scope.$emit('activateMenu', 'hide');
  };

  $ctrl.setSelectedAssignment = function($item, $model) {
      console.log($item);
      console.log($model);
      $ctrl.selectedAssignment = $item;
  }

})
