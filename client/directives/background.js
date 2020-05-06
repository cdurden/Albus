angular.module('whiteboard')
.directive('compileTemplate',['BoardData', function compileTemplate(BoardData) {
    return {
        link: function(scope, element, attr){
            scope.$watch(watchFn, function(newBoardId, oldBoardId) {
                var board = scope.boardData.boards[newBoardId];
                element.html( (((board || {}).task || {}).data || {}).background_html || "");
            //scope.$watch("$parent.task", function(task) {
            //        element.html(((scope.$parent.task || {}).data || {}).background_html || "");
                    //eval(((scope.$parent.task || {}).data || {}).onload);
            });
        }
    }
}])
.directive('wbBackground', ['BoardData', function (BoardData) {
    var resizeSensor = null;
    var oldContainer = null;
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
    restrict: 'A',
    replace: true,
    templateUrl: './templates/background.html',
    controller: function ($scope) {
     //   var boardData = BoardData.getBoardData();
     //   $scope.board = boardData.boards[boardData.boardId];  //FIXME: this needs to be updated
    },
    //scope: {},
        link: function(scope, element, attr){
            var watchFn = function(scope) {
                return scope.boardData.boardId;
            }
            //scope.$watch("$parent.board", function(board) {
            //scope.$watch("board", function(board) {
            //scope.$watch("boardData.boardId", function(newBoardId, oldBoardId) {
            scope.$watchCollection(function () { return element.find('.background-image').toArray(); }, function (newValue, oldValue) {
                if(newValue.length>0) {
                    /*
                    scope.backgroundCleared = true;
                } else {
                    scope.backgroundCleared = false;
                }
            });
            scope.$watch("backgroundCleared", function (newValue, oldValue) {
                var container = element.find('.background-image');
                if (newValue) {
                    element.html(((scope.$parent.task || {}).data || {}).background_html || "");
                    eval(((scope.$parent.task || {}).data || {}).onload);
                } else {
                */
                    var handleBackgroundResize = (function(elmt) { return function () {
                            backgroundRect = elmt.getBoundingClientRect();
                            dim = backgroundRect;
                            viewBox = calculateViewBox(dim);
                            BoardData.getBoard().setViewBox(viewBox.x, viewBox.y, viewBox.w, viewBox.h);
                        }
                    })(container[0]);
                    //if ((resizeSensor || {}).targetElement) {
                    //    ResizeSensorApi.destroy(oldContainer);
                    //}
                    if (resizeSensor) {
                        resizeSensor.detach();
                    }
                    //((resizeSensor || {}).destroy || (() =>{}))(oldContainer); //FIXME: angular.js:15570 TypeError: Cannot read property '_isCollectionTyped' of undefined (ResizeSensor.js)
                    //var destroy = (resizeSensor || {}).destroy;
                    //((resizeSensor || {}).destroy || (() =>{}))(); //FIXME: angular.js:15570 TypeError: Cannot read property '_isCollectionTyped' of undefined (ResizeSensor.js)
                    //((resizeSensor || {}).detach || (() =>{}))(); //FIXME: angular.js:15570 TypeError: Cannot read property '_isCollectionTyped' of undefined (ResizeSensor.js)
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
                            //resizeSensor1 = resizeSensor.create(container[0], handleBackgroundResize);
                            resizeSensor = new ResizeSensor(container[0], handleBackgroundResize);
                            //resizeSensor = ResizeSensorApi.create(container[0], handleBackgroundResize);
                            //resizeSensor = new ResizeSensor(container[0], handleBackgroundResize);
                            oldContainer = container[0];
                            //rs2 = new ResizeSensor(document.getElementById("drawing-space"), handleBackgroundResize);
                        }
                        if (isImageReady(img)) {
                            console.log(angular.element(container).has(img).length);
                            img.onload();
                            handleBackgroundResize(); //FIXME: for some reason this is not called when the img is readded to the DOM a second time.
                        }
                    }
                }
            });
        }
  }
}]);
