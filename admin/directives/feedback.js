angular.module('whiteboard-admin')
.directive('wbAdminFeedback', ['Sockets', 'angularLoad', '$http', 'FileUploader' , function (Sockets, angularLoad, $http, FileUploader) {
  return {
    restrict: 'A',
    require: ['wbAdminFeedback'],
    replace: true,
    scope: {},
    templateUrl: 'templates/feedback.html',
    controller: function ($scope) {
      $scope.assignments = {};
      //$scope.sockets = {};
      $scope.users = [];
      $scope.feedbackUserLists = [[]];
      $scope.feedbackTemplates = {};
      $scope.uploader = new FileUploader();

    $scope.dragoverCallback = function(index, external, type, callback) {
        $scope.logListEvent('dragged over', index, external, type);
        // Invoke callback to origin for container types.
        if (type == 'container' && !external) {
            console.log('Container being dragged contains ' + callback() + ' items');
        }
        return index < 10; // Disallow dropping in the third row.
    };

    $scope.dropCallback = function(index, item, external, type) {
        $scope.logListEvent('dropped at', index, external, type);
        // Return false here to cancel drop. Return true if you insert the item yourself.
        return item;
    };

    $scope.logEvent = function(message) {
        console.log(message);
    };

    $scope.logListEvent = function(action, index, external, type) {
        var message = external ? 'External ' : '';
        message += type + ' element was ' + action + ' position ' + index;
        console.log(message);
    };
    $scope.getFeedbackTemplates = function() {
        Sockets.emit('getFeedbackTemplates', $scope.feedbackTemplateCollection);
    }

    // Initialize model
    $scope.model = [[], []];
    var id = 10;
    angular.forEach(['all', 'move', 'copy', 'link', 'copyLink', 'copyMove'], function(effect, i) {
      var container = {items: [], effectAllowed: effect};
      for (var k = 0; k < 7; ++k) {
        container.items.push({label: effect + ' ' + id++, effectAllowed: effect});
      }
      $scope.model[i % $scope.model.length].push(container);
    });

    $scope.$watch('model', function(model) {
        $scope.modelAsJson = angular.toJson(model, true);
    }, true);
      Sockets.on('users', function (data) {
          $scope.users = Object.values(data);
      });
      Sockets.on('assignments', function (data) {
          console.log(data);
          $scope.assignments = data;
      });
      Sockets.on('tasks', function (data) {
          console.log(data);
          $scope.tasks = data;
      });
      Sockets.on('feedbackRedirect', function (data) {
          console.log(data);
      });
      Sockets.on('feedbackTemplates', function (data) {
          console.log(data);
          $scope.feedbackTemplates = data;
      });
      Sockets.emit('getFeedbackTemplates', $scope.feedbackTemplateCollection);
      Sockets.emit('getFeedback');
      Sockets.on('feedbackList', function (data) {
          console.log(data);
          $scope.feedbackList = data;
      });
      /*
      Sockets.emit('getAssignments');
      Sockets.emit('getUsers');
      */
    },
    link: function(scope, element, attrs, ctrls) {
      $(element).find("#create-feedback-form").bind("submit",function(ev) {
          ev.preventDefault();
          var users = scope.selectedUsers;
          var assignments = scope.selectedAssignments;
          var tasks = scope.selectedTasks;
          Sockets.emit('createFeedback', { 'users': users, 'tasks': tasks, 'assignments': assignments });
          return false;
      });
      scope.$watch('selectedAssignment', function(newValue) {
        Sockets.emit('getAssignmentTasks', newValue);
          /*
        $http({
          method: 'GET',
          url: '/static/teaching_assets/assignments/'+newValue+'.json',
          transformResponse: [function (data) {
            // Do whatever you want!
            return data;
          }]
        }).then(function success(response) {
            Sockets.emit('getTasksFromSource', response.data);
          //scope.tasks = response.data;
        });
        */
      });
    },
  }
}]);
