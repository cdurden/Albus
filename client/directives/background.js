angular.module('whiteboard')
.directive('compileTemplate', function compileTemplate($compile, $parse) {
    return {
        link: function(scope, element, attr){
            scope.$watch("task", function(newValue) {
                var task = newValue;
                scope.task = task;
                element.html(scope.task.data.background_html);
                //$compile(element, null, -9999)(scope);  
             });
        }
    }
})
.directive('wbBackground', ['Sockets', function (Sockets) {
  return {
    restrict: 'A',
    //require: ['wbFeed'],
    //replace: true,
    templateUrl: './templates/background.html',
    controller: function (MessageHandler) {
      this.handleEvent = function (ev) {
        MessageHandler['feed'](ev);
      }
    },
    scope: {},
    link: function (scope, element, attrs, ctrls) {
        /*
      var feedCtrl = ctrls[0];
      FeedData.createFeed(element);
      FeedData.getForm().bind("submit",feedCtrl.handleEvent);
      */
      scope.$watchGroup(["$parent.tasks", "$parent.i"], function(newValues) {
        var task = newValues[0][newValues[1]];
        scope.task = task;
      });
        /*
      Sockets.on('feed message', function (msg) {
        FeedData.displayMessage(msg);
      })
      */
    }
  }
}]);
