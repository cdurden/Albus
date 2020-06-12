angular.module('whiteboard.services.dialogs', [])
.factory('Dialogs', ['BoardData', 'UserData', 'EventHandler', 'Sockets', '$rootScope', '$uibModal', '$http', 'angularLoad', '$location', function (BoardData, UserData, EventHandler, Sockets, $rootScope, $uibModal, $http, angularLoad, $location) {
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
    return(modalInstance);
  };
    
    /*
      $ctrl.toggleAnimation = function () {
        $ctrl.animationsEnabled = !$ctrl.animationsEnabled;
      };
      */
  
  function openStudentDialog() {
    return(modalInstance);
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
    var modalInstance = openDialog({
      size: 'lg',
      templateUrl: 'templates/assignments.html',
      controller: 'assignmentModalInstanceCtrl',
      resolve: {
        d3Promise: function () {
          var scripts = [
              "//d3js.org/d3.v5.min.js",
              "https://unpkg.com/@hpcc-js/wasm@0.3.6/dist/index.min.js",
              "https://unpkg.com/d3-graphviz@3.0.0/build/d3-graphviz.js"
          ];
          var d3Promise = (function() {
              return scripts.reduce( async (accumulatorPromise, nextScript) => {
                  return accumulatorPromise.then(() => {
                      return angularLoad.loadScript(nextScript);
                  });
              }, Promise.resolve());
          })();
          return d3Promise;
        },
        assignmentDot: function () {
          var assignment = UserData.getUser().assignment;
          return $http({
            method: 'GET',
            headers:{'Cache-Control': 'no-cache'},
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
            return response.data;
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
    modalInstance.rendered.then(function() {
          var assignment = UserData.getUser().assignment;
          return $http({
            method: 'GET',
            url: '/static/teaching_assets/assignments/'+assignment+'.dot',
          }).then(function success(response) {
            d3.select("#assignment-graph").graphviz()
              .renderDot(response.data);
          });
function interactive() {

    nodes = d3.selectAll('.node,.edge');
    nodes
        .on("click", function () {
            var title = d3.select(this).selectAll('title').text().trim();
            var text = d3.select(this).selectAll('text').text();
            var id = d3.select(this).attr('id');
            var url = d3.select(this).attr('url');
            $location.url(url);
        });
}
    })
  }

  return {
      openStudentDialog: openStudentDialog,
      openInboxesDialog: openInboxesDialog,
      openAssignmentsDialog: openAssignmentsDialog,
  }
}]);
