angular.module('whiteboard')
.controller('inboxesModalInstanceCtrl', function ($uibModalInstance, inboxes, $scope) {
  var $ctrl = this;
  $ctrl.inboxes = inboxes;
  $ctrl.scope = $scope;
  $ctrl.selected = {
    inboxes: $ctrl.inboxes[0]
  };

  $ctrl.ok = function () {
    $uibModalInstance.close($ctrl.selectedInbox);
    $ctrl.scope.$emit('activateMenu', 'hide');
  };

  $ctrl.cancel = function () {
    $uibModalInstance.dismiss('cancel');
    $ctrl.scope.$emit('activateMenu', 'hide');
  };

  $ctrl.setSelectedInbox = function($item, $model) {
      console.log($item);
      console.log($model);
      $ctrl.selectedInbox = $item;
  }

})
