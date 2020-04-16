angular.module('whiteboard')
.directive(['compileTemplate','BoardData',  function compileTemplate($compile, BoardData) {
    var w, h;
    var aspect_ratio;
    function calculateViewBox(dim) {
        boardRect = BoardData.getCanvas().get(0).getBoundingClientRect();
        return ({
            x: -dim.left / dim.width * w,
            y: -dim.top / dim.height * h,
            w: boardRect.width / dim.width * w,
            h: boardRect.height / dim.height * h,
        })
    }
    /*
    function handleBackgroundResize() {
        backgroundRect = document.getElementsByClass('background-image')[0].getBoundingClientRect();
        if (typeof w === 'undefined' || typeof h === 'undefined') {
            w = backgroundRect.width;
            h = backgroundRect.height;
            aspect_ratio = w/h;
        }
        dim = backgroundRect;
        viewBox = calculateViewBox(dim);
        console.log(dim)
        console.log(viewBox);
        BoardData.getBoard().setViewBox(viewBox.x, viewBox.y, viewBox.w, viewBox.h, false);
    }
    */
    return {
        link: function(scope, element, attr){
            scope.$watch("task", function(newValue) {
                var task = newValue;
                scope.task = task;
                element.html(((scope.task || {}).data || {}).background_html || "");
                //$compile(element, null, -9999)(scope);  
            });
            scope.$watch(function () { return element.find('.background-image')[0]; }, function (newValue, oldValue) {
                if (newValue !== oldValue) {
                    var handleBackgroundResize = (function(element) {
                        return(function () {
                            backgroundRect = element.getBoundingClientRect();
                            if (typeof w === 'undefined' || typeof h === 'undefined') {
                                w = backgroundRect.width;
                                h = backgroundRect.height;
                                aspect_ratio = w/h;
                            }
                            dim = backgroundRect;
                            viewBox = calculateViewBox(dim);
                            console.log(dim)
                            console.log(viewBox);
                            BoardData.getBoard().setViewBox(viewBox.x, viewBox.y, viewBox.w, viewBox.h, false);
                        });
                    })(newValue);
                    backgroundRect = newValue.getBoundingClientRect();
                    w = backgroundRect.width;
                    h = backgroundRect.height;
                    aspect_ratio = w/h;
                    new ResizeSensor(newValue, handleBackgroundResize);
                }
            });
        }
    }
}])
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
      //new ResizeSensor(document.getElementById('drawing-space'), handleBackgroundResize);
      /*
      Sockets.on('feed message', function (msg) {
        FeedData.displayMessage(msg);
      })
      */
    }
  }
}]);
