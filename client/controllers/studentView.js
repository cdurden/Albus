angular.module('whiteboard')
.controller('studentViewModalInstanceCtrl', function ($uibModalInstance, users, $scope) {
  var $ctrl = this;
  $ctrl.users = users;
  $ctrl.scope = $scope;
  $ctrl.selected = {
    users: $ctrl.users[0]
  };

  $ctrl.ok = function () {
    $uibModalInstance.close($ctrl.selectedUser);
    $ctrl.scope.$emit('activateMenu', 'hide');
  };

  $ctrl.cancel = function () {
    $uibModalInstance.dismiss('cancel');
    $ctrl.scope.$emit('activateMenu', 'hide');
  };

  $ctrl.setSelectedUser = function($item, $model) {
      console.log($item);
      console.log($model);
      $ctrl.selectedUser = $item;
  }

})
