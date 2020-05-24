angular.module('whiteboard')
.controller('inboxesModalInstanceCtrl', function ($uibModalInstance, inboxes, $scope, EventHandler) {
  var $ctrl = this;
  $ctrl.inboxes = inboxes;
  $ctrl.scope = $scope;
  $ctrl.selected = {
    inboxes: $ctrl.inboxes[0]
  };

  $ctrl.createSubmissionBox(label) {
    EventHandler.createSubmissionBox(label);
  }
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
