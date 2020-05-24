angular.module('whiteboard.services.dialogs', [])
.factory('Dialogs', ['BoardData', 'UserData', 'Sockets', '$rootScope', '$uibModal', function (BoardData, UserData, Sockets, $rootScope, $uibModal) {
  openDialog = function (params) {
    var parentElem = params.parentSelector ? 
      angular.element($document[0].querySelector(parentSelector)) : undefined;
    var modalInstance = $uibModal.open({
      //animation: $ctrl.animationsEnabled,
      ariaLabelledBy: 'modal-title',
      ariaDescribedBy: 'modal-body',
      templateUrl: params.templateUrl,
      controller: params.controller,
      controllerAs: '$ctrl',
      size: params.size,
      appendTo: parentElem,
      resolve: params.resolve,
    });
    modalInstance.result.then(params.success);
  };
    
    /*
      $ctrl.toggleAnimation = function () {
        $ctrl.animationsEnabled = !$ctrl.animationsEnabled;
      };
      */
  
  function openStudentDialog() {
    openDialog({
      size: 'lg',
      templateUrl: 'templates/viewAs.html',
      controller: 'studentViewModalInstanceCtrl',
      resolve: {
        users: function () {
          return Object.values(UserData.getUsers());
        }
      },
      success: function (selectedUser) {
          //$ctrl.selected = selectedUser;
          Sockets.emit("actAsUser", selectedUser);
          //console.log('Modal dismissed at: ' + new Date());
      },
    });
  }
  function openInboxesDialog() {
    openDialog({
      size: 'lg',
      templateUrl: 'templates/inboxes.html',
      controller: 'inboxesModalInstanceCtrl',
      resolve: {
        inboxes: function () {
          return UserData.getInboxes();
        }
      },
      success: function (selectedInbox) {
          $rootScope.mode = 'submissions';
          $rootScope.resource = selectedInbox;
          EventHandler.getSubmissionsReceived(selectedInbox);
          BoardData.setActiveBoardIndex('submissionBoardIndex');
      },
    });
  }
  function openAssignmentsDialog() {
    openDialog({
      size: 'lg',
      templateUrl: 'templates/assignments.html',
      controller: 'assignmentModalInstanceCtrl',
      resolve: {
        assignments: function () {
          return UserData.getAssignments();
        }
      },
      success: function (selectedAssignment) {
      },
    });
  }

  return {
      openStudentDialog: openStudentDialog,
      openInboxesDialog: openInboxesDialog,
      openAssignmentsDialog: openAssignmentsDialog,
  }
}]);
