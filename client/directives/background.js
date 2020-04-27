angular.module('whiteboard')
.directive('compileTemplate',['BoardData', function compileTemplate(BoardData) {
    var rs1 = null;
    var rs2 = null;
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
    return {
        link: function(scope, element, attr){
            //scope.$watch("$parent.board", function(board) {
            //    element.html((((board || {}).task || {}).data || {}).background_html || "");
            scope.$watch("$parent.task", function(task) {
                element.html(((task || {}).data || {}).background_html || "");
            });
            scope.$watch(function () { return element.find('.background-image')[0]; }, function (newValue, oldValue) {
                if (newValue !== oldValue) {
                    var handleBackgroundResize = (function(element) {
                        return(function () {
                            backgroundRect = element.getBoundingClientRect();
                            /*
                            if (typeof w === 'undefined' || typeof h === 'undefined') {
                                w = backgroundRect.width;
                                h = backgroundRect.height;
                                aspect_ratio = w/h;
                            }
                            */
                            dim = backgroundRect;
                            viewBox = calculateViewBox(dim);
                            //console.log(dim)
                            //console.log(viewBox);
                            BoardData.getBoard().setViewBox(viewBox.x, viewBox.y, viewBox.w, viewBox.h);
                        });
                    })(newValue);
                    var img = element.find("img")[0];
                    if (typeof img !== 'undefined') {
                        img.onload = function() {
                            w = img.naturalWidth;
                            h = img.naturalHeight;
                            aspect_ratio = w/h;
                            canvas = BoardData.getCanvas().get(0)
                            boardRect = canvas.getBoundingClientRect();
                            viewBox = calculateViewBox(boardRect);
                            BoardData.getBoard().setViewBox(viewBox.x, viewBox.y, viewBox.w, viewBox.h, false);
                            //backgroundRect = this.getBoundingClientRect();
                            //w = backgroundRect.width;
                            //h = backgroundRect.height;
                            ((rs1 || {}).detach || (() =>{}))();
                            ((rs2 || {}).detach || (() =>{}))();
                            rs1 = new ResizeSensor(newValue, handleBackgroundResize);
                            rs2 = new ResizeSensor(document.getElementById("drawing-space"), handleBackgroundResize);
                        }
                    }
                }
            });
        }
    }
}])
.directive('wbBackground', ['Sockets', function (Sockets) {
  return {
    restrict: 'A',
    replace: true,
    templateUrl: './templates/background.html',
    controller: function (MessageHandler) {
      this.handleEvent = function (ev) {
        MessageHandler['feed'](ev);
      }
    },
    scope: {},
  }
}]);
