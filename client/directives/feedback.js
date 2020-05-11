angular.module('whiteboard')
.directive('wbFeedback', ['AdminSockets', 'angularLoad', '$http', 'FileUploader', '$document', 'BoardData', 'Sockets', '$interpolate', function (AdminSockets, angularLoad, $http, FileUploader, $document, BoardData, Sockets, $interpolate) {
  return {
    restrict: 'A',
    require: ['wbFeedback'],
    replace: true,
    //scope: {},
    templateUrl: 'templates/feedback.html',
    controller: function ($scope) {
      $scope.boardData = BoardData.getBoardData();
      $scope.assignments = {};
      $scope.submissions = {};
      //$scope.sockets = {};
      $scope.users = [];
      $scope.student = $scope.boardData.board.user;
      $scope.draggedTemplateObject;
      $scope.feedbackUserLists = [[]];
      $scope.feedbackTemplates = [];
      $scope.feedbackTags = [];
      $scope.feedbackTemplateCollections = [];
      $scope.feedback = "";
      //$scope.feedbackTemplate = "";
      //$scope.selectedTemplate = "";
      $scope.feedbackTemplateCollection = "ScientificNotation";
      $scope.uploader = new FileUploader();

    $scope.dragoverCallback = function(index, external, type, callback) {
        $scope.logListEvent('dragged over', index, external, type);
        // Invoke callback to origin for container types.
        if (type == 'container' && !external) {
            console.log('Container being dragged contains ' + callback() + ' items');
        }
        return index < 10; // Disallow dropping in the third row.
    };
    $scope.dragstartCallback = function(event, item) {
        console.log(item.description)
        event.dataTransfer.setData('text/plain', item.description);
        $scope.draggedTemplateObject = item;
    }
    $scope.dragenterCallback = function(event) {
        console.log('received dragenter');
        event.preventDefault();
    }

    $scope.dropCallback = function(index, item, external, type) {
        $scope.logListEvent('dropped at', index, external, type);
        // Return false here to cancel drop. Return true if you insert the item yourself.
        return item;
    };
     $scope.dragendCallback = function(event) {
        $scope.logListEvent('drag ended');
        console.log(event)
        // Return false here to cancel drop. Return true if you insert the item yourself.
        return true;
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
        AdminSockets.emit('getFeedbackTemplates', $scope.feedbackTemplateCollection);
    }
    $scope.getFeedbackTemplateCollections = function() {
        AdminSockets.emit('getFeedbackTemplateCollections');
    }
    $scope.clearFeedbackForm = function() {
        $scope.feedback = '';
        $scope.feedbackTags = [];
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
      AdminSockets.on('users', function (data) {
          $scope.users = Object.values(data);
      });
      AdminSockets.on('assignments', function (data) {
          console.log(data);
          $scope.assignments = data;
      });
      AdminSockets.emit('getSubmissions');
      AdminSockets.on('submissions', function (data) {
          console.log(data);
          $scope.submissions = data;
      });
      AdminSockets.on('tasks', function (data) {
          console.log(data);
          $scope.tasks = data;
      });
      Sockets.on('feedbackCreated', function (data) {
          console.log(data);
      });
      AdminSockets.on('feedbackTemplateCollections', function (data) {
          //console.log(data);
          //templates = Object.entries(data).map( ([key, obj],i) => { obj.id = key; return(obj) });
          //console.log(templates);
          $scope.feedbackTemplateCollections = data;
      });
      AdminSockets.emit('getFeedbackTemplateCollections');
      AdminSockets.on('feedbackTemplates', function (data) {
          //console.log(data);
          templates = Object.entries(data).map( ([key, obj],i) => { obj.tag = key; return(obj) });
          console.log(templates);
          $scope.feedbackTemplates = templates;
      });
      AdminSockets.emit('getFeedbackTemplates', $scope.feedbackTemplateCollection);
      /*
      AdminSockets.emit('getAssignments');
      AdminSockets.emit('getUsers');
      */
    },
    link: function(scope, element, attrs, ctrls) {
        //element.find(".dropzone ul li").bind("drop", function(event) {
        element.find("#feedback-textarea").bind("drop", function(event) {
            event.preventDefault();
            //scope.feedbackTemplate += "\n\n"+scope.draggedTemplateObject.template;
            scope.feedback += "\n\n"+$interpolate(scope.draggedTemplateObject.template)(scope);
            scope.feedbackTags.push(scope.draggedTemplateObject.tag);
            scope.draggedTemplateObject = undefined;
            console.log("drop");
            console.log(event);
        });
        element.find("#feedback-textarea").bind("dragenter", function(event) {
            console.log("dragenter");
            console.log(event);
            event.preventDefault();
        });
        element.find("#feedback-textarea").bind("dragover", function(event) {
            event.preventDefault();
        });
      $(element).find("#create-feedback-form").bind("submit",function(ev) {
          ev.preventDefault();
          var boardId = scope.boardData.boardId;
          var board = scope.boardData.boards[boardId];
          var submission_id = board.submission_id;
          var data = { 'subject': 'Feedback on '+board.task.data.title, 'message': scope.feedback, 'feedbackTags': scope.feedbackTags };

          Sockets.emit('createFeedback', { 'submission_id': submission_id, 'data': data, 'boardId': boardId, 'background_image': board.background_image });
          return false;
      });
    },
  }
}]);
