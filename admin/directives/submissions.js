angular.module('whiteboard-admin')
.directive('wbAdminSubmissions', ['Sockets', 'filterFilter', function (Sockets, filterFilter) {
  return {
    restrict: 'A',
    require: ['wbAdminSubmissions'],
    replace: true,
    templateUrl: "./templates/submissions.html",
    controller: function ($scope, $uibModal) {
      $scope.submissions = [];
      $scope.selectedSections = [];
      $scope.sections = [];
      $scope.assignments = [];
      $scope.submissionState = 'pending';
      $scope.schoologySubmissionsMetadata = [];
      Sockets.emit('getSections');
      $scope.importSchoologySubmissions = function() {
          var taskPagesObject = $scope.selectedTasks.reduce((obj, task) => { obj[task.source] = task.page; return obj; }, {})
          data = {
              grade_item_id: $scope.grade_item_id,
              taskPagesObject: taskPagesObject,
              schoologySubmissionsMetadata: $scope.schoologySubmissionsMetadata,
          } 
          Sockets.emit('importSchoologySubmissions', data);
          return false;
      }
      $scope.getSchoologySubmissionsMetadata = function(confirmation_code) {
          //taskPagesObject = $scope.selectedTasks.reduce((obj, task) => { obj[task.source] = task.page; return obj; }, {})
          data = {
              grade_item_id: $scope.grade_item_id,
              section_ids: $scope.selectedSections, 
              confirmation_code: confirmation_code,
          } 
          Sockets.emit('getSchoologySubmissionsMetadata', data);
          return false;
      }
      $scope.confirmSchoology = function(callback) {
          var modalInstance = $uibModal.open({
            ariaLabelledBy: 'modal-title',
            ariaDescribedBy: 'modal-body',
            backdrop: true,
            windowClass: 'modal',
            templateUrl: 'templates/confirmSchoology.html',
            appendTo: undefined,
            controller: function($scope, $uibModalInstance, $log) { 
                $scope.submit = function(confirmation_code) {
                    $scope.confirmation_code = null;
                    callback(confirmation_code);
                    $uibModalInstance.dismiss('cancel');
                }
                $scope.cancel = function () {
                    $uibModalInstance.dismiss('cancel'); 
                };
            },
//            resolve: {
//                callback: function () {
//                    return $scope.getSchoologySubmissionsMetadata;
//                }
//            }
          });
      }
      $scope.getAssignmentTasks = function(assignment) {
          Sockets.emit('getAssignmentTasks', assignment);
      }
      Sockets.on('sections', function (data) {
        console.log(data);
        $scope.sections = data;
      });
      Sockets.on('assignments', function (data) {
        console.log(data);
        $scope.assignments = data;
      });
      Sockets.on('tasks', function (data) {
        console.log(data);
        //$scope.tasks = data.map( (task, i) => { return { source: task, selected: false, page: i }; } );
        $scope.tasks = data.map( (task, i) => { task.selected = false; task.page = i; return task; } );
      });
      Sockets.on('submission', function (data) {
        console.log(data);
        $scope.submissions.push(data);
      });
      Sockets.on('submissions', function (data) {
        $scope.submissions = data;
      });
      $scope.downloadSchoologySubmissions = function(confirmation_code) {
          data = {
              grade_item_id: $scope.grade_item_id,
              confirmation_code: confirmation_code,
          } 
          Sockets.emit('downloadSchoologySubmissions', data);
      }
      $scope.clearSchoologySubmissionsMetadata = function() {
          Sockets.emit('clearSchoologySubmissionsMetadata');
      }
      Sockets.on('clearSchoologySubmissionsMetadataSuccess', function (res) {
          if (res) {
              $scope.schoologySubmissionsMetadata = [];
          }
      });
      Sockets.on('schoologySubmissionsMetadata', function (data) {
        $scope.schoologySubmissionsMetadata = data;
      });
      Sockets.emit('getSubmissions', $scope.submissionState);
      $scope.getSelectedSections = function getSelectedSections() {
        return filterFilter($scope.sections, { selected: true });
      };
    
      // Watch sections for changes
      $scope.$watch('sections|filter:{selected:true}', function (kv) {
        $scope.selectedSections = kv.map(function (section) {
          return section.schoology_id;
        });
      }, true);
      // Watch sections for changes
      $scope.$watch('schoologySubmissionsMetadata|filter:{selected:true}', function (kv) {
        $scope.selectedSubmissions = kv.map(function (submissionsMetadata,i) {
          return i;
        });
      }, true);
      $scope.getSelectedSubmissions = function getSelectedSubmissions() {
        return filterFilter($scope.schoologySubmissionsMetadata, { selected: true });
      };
      $scope.$watch('tasks|filter:{selected:true}', function (tasks) {
        $scope.selectedTasks = tasks;
      }, true);
    },
    link: function(scope, element, attrs, ctrls) { 
      element.find("#process-submissions-form").bind("submit",function(ev) {
          ev.preventDefault();
      });
      element.find("#get-submissions-metadata-form").bind("submit",function(ev) {
          ev.preventDefault();
      });

    },
  }
}]);
