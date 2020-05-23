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
      $scope.templateContext = {};
      $scope.draggedTemplateObject;
      $scope.feedbackUserLists = [[]];
      $scope.feedbackTemplates = [];
      $scope.feedbackTemplateCollections = [];
      //$scope.feedback = "";
      //$scope.file_attachments = [];
      //$scope.feedback_tags = [];
      //$scope.grade;
      //$scope.feedbackTemplate = "";
      //$scope.selectedTemplate = "";
      $scope.feedbackTemplateCollection = "PythagoreanTheorem";
      $scope.uploader = new FileUploader();
        $scope.gradeSubmission = function() {
          //var board = $scope.boardData.boards[$scope.boardData.boardId];
          //var submission_id = ((board || {}).submission || {}).id;
          AdminSockets.emit('gradeSubmission', { 'submission_id': $scope.submission.id, 'grade': $scope.submission.grade });
        }

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
    $scope.getFeedback = function() {
        AdminSockets.emit('getFeedback');
    }
    AdminSockets.on('feedbackList', function(feedbackList) {
        BoardData.updateFeedback(feedbackList);
        BoardData.joinFeedbackToBoards();
    });
    $scope.getFeedbackTemplates = function() {
        AdminSockets.emit('getFeedbackTemplates', $scope.feedbackTemplateCollection);
    }
    $scope.getFeedbackTemplateCollections = function() {
        AdminSockets.emit('getFeedbackTemplateCollections');
    }
    $scope.clearFeedbackForm = function() {
      var boardId = $scope.boardData.boardId;
      var board = $scope.boardData.boards[boardId];
      var taskSource = ((board || {}).task || {}).source;
      var data = {
            'subject': 'Feedback on '+(((board || {}).task || {}).data || {}).title,
            'message': '',
            'feedback_tags': [],
            'file_attachments': [],
            'attachments': []
        };
      $scope.feedback = { 'submission_id': ((board || {}).submission || {}).id, 'data': data, 'boardId': boardId, 'background_image': (board || {}).background_image, 'taskSource': taskSource }         
      //$scope.grade = undefined;
        //$scope.feedback = '';
        //$scope.message = '';
        //$scope.feedback_tags = [];
        //$scope.file_attachments = [];
    }
    $scope.clearFeedbackForm();  //
    $scope.getFeedback();  //

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

    $scope.$watch('boardData.boardId', function(model) {
        var board = $scope.boardData.boards[$scope.boardData.boardId];
        if (typeof (board || {}).submission !== 'undefined') {
            $scope.submissionBoard = board;
            $scope.submission = board.submission;
            var nFeedback = (board.feedbackList || []).length
            if (nFeedback > 0 && $scope.showFeedbackBoard) {
                $scope.boardData.boardId = board.feedbackList[nFeedback-1].board.boardId;
            }
        }
        $scope.clearFeedbackForm();
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
          //console.log(templates);
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
            scope.templateContext.student = scope.boardData.boards[scope.boardData.boardId].user; //FIXME: Setup the template context (e.g. in a service) so that it is updated appropriately. 
            /*
            if (scope.feedback.length > 0) {
                scope.feedback += "\n\n";
            }
            scope.feedback += $interpolate(scope.draggedTemplateObject.template)(scope.templateContext);
            */
            if (scope.feedback.data.message.length > 0) {
                scope.feedback.data.message += "\n\n";
            }
            scope.feedback.data.message += $interpolate(scope.draggedTemplateObject.template)(scope.templateContext);
            scope.feedback.data.feedback_tags.push(scope.feedbackTemplateCollection+":"+scope.draggedTemplateObject.tag);
            scope.feedback.data.file_attachments = [].concat(scope.feedback.data.file_attachments, scope.draggedTemplateObject.file_attachments || []);
            scope.feedback.data.attachments = [].concat(scope.feedback.data.attachments, scope.draggedTemplateObject.attachments || []);
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
          /*
          var boardId = scope.boardData.boardId;
          var board = scope.boardData.boards[boardId];
          var submission_id = board.submission_id;
 { 'submission_id': submission_id, 'data': scope.feedback.data, 'boardId': boardId, 'background_image': board.background_image, 'taskSource': taskSource }         var taskSource = board.task.source;
 */
          //var data = { 'subject': 'Feedback on '+board.task.data.title, 'message': scope.message, 'feedback_tags': scope.feedback_tags, 'file_attachments': scope.file_attachments };

          //if ( typeof scope.feedback.id === 'undefined' ) {
          if ( scope.feedback.id ) {
              Sockets.emit('editFeedback', scope.feedback);
          } else {
              Sockets.emit('createFeedback', scope.feedback);//{ 'submission_id': submission_id, 'data': scope.feedback.data, 'boardId': boardId, 'background_image': board.background_image, 'taskSource': taskSource });
          }
          scope.clearFeedbackForm();
          return false;
      });
    },
  }
}]);
