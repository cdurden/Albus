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
      //FeedData.getInput().bind('keypress', feedCtrl.handleEvent);
      //FeedData.getSendButton().bind('click', feedCtrl.handleEvent);
      FeedData.getForm().bind("submit",feedCtrl.handleEvent);

        /*
      $('body').on('keypress', function (ev) {
        boardCtrl.handleEvent(ev);
      });
      */

  Sockets.on('feed message', function (msg) {
    FeedData.displayMessage(msg);
  })


    }
  }
}]);
