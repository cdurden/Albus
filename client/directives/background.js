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
    function isImageReady(img) {
        if (!img.complete) {
            return false;
        }
        if (img.naturalWidth === 0) {
            return false;
        }
        return true;
    }
    return {
        link: function(scope, element, attr){
            //scope.$watch("$parent.board", function(board) {
            //    element.html((((board || {}).task || {}).data || {}).background_html || "");
            scope.$watch("$parent.task", function(task) {
                element.html("");
            });
            scope.$watch(function () { return element.find('.background-image')[0]; }, function (newValue, oldValue) {
                if (element.find('.background-image').length==0) {
                    element.html(((task || {}).data || {}).background_html || "");
                    eval(((task || {}).data || {}).onload);
                } else {
                    const handleBackgroundResize = ((elmt) => { return function () {
                            backgroundRect = elmt.getBoundingClientRect();
                            dim = backgroundRect;
                            viewBox = calculateViewBox(dim);
                            BoardData.getBoard().setViewBox(viewBox.x, viewBox.y, viewBox.w, viewBox.h);
                        }
                    })(newValue[0]);
                    //((rs1 || {}).detach || (() =>{}))(oldValue); //FIXME: angular.js:15570 TypeError: Cannot read property '_isCollectionTyped' of undefined (ResizeSensor.js)
                    var img = element.find("img")[0];
                    $pinchZoom = element.parents('pinch-zoom');
                    $pinchZoom.change(handleBackgroundResize);
                    $pinchZoom.dblclick(function(ev) {
                        ev.currentTarget.scaleTo(2, {
                          // Transform origin. Can be a number, or string percent, eg "50%"
                          originX: 0,
                          originY: 0,
                          // Should the transform origin be relative to the container, or content?
                          relativeTo: 'content',
                          // Fire a 'change' event if values are different to current values
                          allowChangeEvent: true,
                        });
                    });
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
                            //((rs2 || {}).detach || (() =>{}))();
                            //ResizeSensorApi.create(newValue, handleBackgroundResize);
                            rs1 = new ResizeSensor(newValue[0], handleBackgroundResize);
                            //rs2 = new ResizeSensor(document.getElementById("drawing-space"), handleBackgroundResize);
                        }
                        if (isImageReady(img)) {
                            console.log(angular.element(newValue[0]).has(img).length);
                            img.onload();
                            handleBackgroundResize(); //FIXME: for some reason this is not called when the img is readded to the DOM a second time.
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
