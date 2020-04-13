angular.module('whiteboard')
.directive('wbFeed', ['FeedData', 'Sockets', function (FeedData, Sockets) {
  return {
    restrict: 'A',
    require: ['wbFeed'],
    //replace: true,
    templateUrl: './templates/feed.html',
    controller: function (MessageHandler) {
      this.handleEvent = function (ev) {
        MessageHandler['feed'](ev);
      }
    },
    link: function (scope, element, attrs, ctrls) {
      var feedCtrl = ctrls[0];
      FeedData.createFeed(element);
      FeedData.getForm().bind("submit",feedCtrl.handleEvent);
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
