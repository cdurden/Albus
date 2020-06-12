angular.module('whiteboard.services.dialogs', [])
.factory('Dialogs', ['BoardData', 'UserData', 'EventHandler', 'Sockets', '$rootScope', '$uibModal', '$http', function (BoardData, UserData, EventHandler, Sockets, $rootScope, $uibModal, $http) {
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
          $rootScope.resource = selectedInbox.id;
          EventHandler.getSubmissionBox(selectedInbox.id);
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
          var assignment = UserData.getUser().assignment;
          return $http({
            method: 'GET',
            url: '/static/teaching_assets/assignments/'+assignment+'.dot',
/*
            transformResponse: [function (data) {
                tasks = JSON.parse(data);
                var dotSrcLines = ['digraph {'];
                for (var i=1; i<tasks.length;i++) {
                    if (i==1) {
                        dotSrcLines.push('"'+tasks[i-1]+'";')
                    }
                    dotSrcLines.push('"'+tasks[i]+'";')
                    dotSrcLines.push('"'+tasks[i-1]+'" -> "'+tasks[i]+'";')
                }
                dotSrcLines.push('}');
                return({ data: dotSrcLines.join("\r") });
              // Do whatever you want!
            }]
*/
          }).then(function success(response) {
            d3Promise.then(function() {
              d3.select("#assignment-graph").graphviz()
                .renderDot(response.data);
            });
          });
        }
      },
      success: function (selectedAssignment) {
          $rootScope.mode = 'assignment';
          $rootScope.resource = selectedAssignment.source;
          EventHandler.getAssignmentBoards(selectedAssignment.source);
          BoardData.setActiveBoardIndex('assignmentBoardIndex');
      },
    });
  }

  return {
      openStudentDialog: openStudentDialog,
      openInboxesDialog: openInboxesDialog,
      openAssignmentsDialog: openAssignmentsDialog,
  }
}]);
