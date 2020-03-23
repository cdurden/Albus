angular.module('whiteboard')
.directive('wbBoard', ['BoardData', 'Broadcast', 'Receive', 'LeapMotion', function (BoardData) {
  return {
    restrict: 'A',
    require: ['wbBoard'],
    replace: true,
    template: 
      '<div id="board-container">' +
      '   <div wb-toolbar></div>' +
      '   <div wb-layers></div>' +
      '</div>',
    controller: function (InputHandler) {
      this.handleEvent = function (ev) {
        InputHandler[ev.type](ev);
      }
      this.submenuCloser = function (action) {
        // console.log('close?')
        $scope.$emit('toggleAllSubmenu', action);
      }
    },
    link: function (scope, element, attrs, ctrls) {
      var boardCtrl = ctrls[0];
      BoardData.createBoard(element);
      BoardData.getCanvas().bind('touchstart touchend touchmove mousedown mouseup mousemove dblclick', boardCtrl.handleEvent);
      BoardData.getCanvas().bind('click', boardCtrl.submenuCloser({action: 'hide', level: '2'}));

      $('body').on('keypress', function (ev) {
        boardCtrl.handleEvent(ev);
      });

      scope.$on('setCursorClass', function (evt, msg) {
        // console.log('A')
        // var oldTool = BoardData.getCurrentTool();
        var svg = BoardData.getCanvas();

        // svg.addClass('A');
        svg.attr("class", msg.tool);
        // console.log('> ', svg.attr("class").split(' '));
      });
   
    }
  }
}]);
