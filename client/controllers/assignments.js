angular.module('whiteboard')
.controller("assignmentModalInstanceCtrl", function ($uibModalInstance, assignmentDot, d3Promise, $scope, EventHandler) {
 // d3Promise.then(function() {
    d3.select("#assignment-graph").graphviz()
      .renderDot(assignmentDot);
 // });
  var $ctrl = this;
  $ctrl.assignmentDot = assignmentDot;
  $ctrl.scope = $scope;
/*
  $ctrl.selected = {
    assignmentDot: $ctrl.assignmentDot[0]
  };
*/

  $ctrl.ok = function () {
    $uibModalInstance.close($ctrl.selectedAssignment);
    $ctrl.scope.$emit('activateMenu', 'hide');
  };

  $ctrl.cancel = function () {
    $uibModalInstance.dismiss('cancel');
    $ctrl.scope.$emit('activateMenu', 'hide');
  };

/*
  $ctrl.setSelectedAssignment = function($item, $model) {
      console.log($item);
      console.log($model);
      $ctrl.selectedAssignment = $item;
  }
*/

})
