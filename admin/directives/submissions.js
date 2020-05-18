angular.module('whiteboard-admin')
.directive('wbAdminSubmissions', ['Sockets', 'filterFilter', function (Sockets, filterFilter) {
  return {
    restrict: 'A',
    require: ['wbAdminSubmissions'],
    replace: true,
    templateUrl: "./templates/submissions.html",
    controller: function ($scope) {
      $scope.submissions = [];
      $scope.selectedSections = [];
      $scope.sections = [];
      $scope.assignments = [];
      $scope.submissionState = 'pending';
      Sockets.emit('getSections');
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
        $scope.tasks = data.map( (task, i) => { return { source: task, selected: false, page: i }; } );
      });
      Sockets.on('submission', function (data) {
        console.log(data);
        $scope.submissions.push(data);
      });
      Sockets.on('submissions', function (data) {
        $scope.submissions = data;
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
      $scope.$watch('tasks|filter:{selected:true}', function (tasks) {
        $scope.selectedTasks = tasks;
      }, true);
    },
    link: function(scope, element, attrs, ctrls) { 
      element.find("#import-submissions-form").bind("submit",function(ev) {
          ev.preventDefault();
          taskPagesObject = scope.selectedTasks.reduce((obj, task) => { obj[task.source] = task.page; return obj; }, {})
          importParameters = {
              section_ids: scope.selectedSections, 
              grade_item_id: scope.grade_item_id,
              taskPagesObject: taskPagesObject,
          } 
          //Sockets.emit('importSubmissions', importParameters);
          return false;
      });

    },
  }
}]);
