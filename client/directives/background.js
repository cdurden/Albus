angular.module('whiteboard')
.directive('compileTemplate','BoardData', function compileTemplate($compile, BoardData) {
    function calculateViewBox(dim) {
        boardRect = BoardData.getCanvas().getBoundingClientRect();
        return ({
            x: -dim.left / dim.width * w,
            y: -dim.top / dim.height * h,
            w: boardRect.width / dim.width * w,
            h: boardRect.height / dim.height * h,
        })
    }
    function handleBackgroundResize(newSize) {
        backgroundRect = document.getElementById('background-container').getBoundingClientRect();
        dim = backgroundRect;
        viewBox = calculateViewBox(dim);
        BoardData.getBoard().setViewBox(viewBox.x, viewBox.y, viewBox.w, viewBox.h);
    }
    return {
        link: function(scope, element, attr){
            scope.$watch("task", function(newValue) {
                var task = newValue;
                scope.task = task;
                element.html(((scope.task || {}).data || {}).background_html || "");
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
        var task = (newValues[0] || [])[newValues[1]];
        scope.task = task;
      });
      ResizeSensorApi.create(document.getElementById('background-container'), handleBackgroundResize);
      /*
      Sockets.on('feed message', function (msg) {
        FeedData.displayMessage(msg);
      })
      */
    }
  }
}]);
