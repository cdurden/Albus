angular.module('whiteboard')
.directive('wbBoard', ['BoardData', 'EventHandler', 'Receive','$document', function (BoardData, EventHandler, Receive, $document) {
  return {
    restrict: 'A',
    require: ['wbBoard'],
    replace: true,
    templateUrl: './templates/board.html',
    controller: function (InputHandler) {
      this.handleEvent = function (ev) {
        InputHandler[ev.type](ev);
      }
    },
    link: function (scope, element, attrs, ctrls) {
      $("#board-container").on('touchstart', function (e) { e.preventDefault(); });
      var boardCtrl = ctrls[0];
        /*
      BoardData.createBoard(element);
      EventHandler.activateNav();
      */
      /*
      BoardData.getCanvas().bind('touchstart touchend touchmove mousedown mouseup mousemove dblclick', boardCtrl.handleEvent);
      BoardData.getCanvas().bind('click', function() {scope.$emit('activateMenu', 'hide');});
      scope.$on('setCursorClass', function (evt, msg) {
        // console.log('A')
        // var oldTool = BoardData.getCurrentTool();
        var svg = BoardData.getCanvas();

        // svg.addClass('A');
        svg.attr("class", msg.tool);
        // console.log('> ', svg.attr("class").split(' '));
      });
      */

      $('body').on('keypress', function (ev) {
        boardCtrl.handleEvent(ev);
      });
      $document.keydown(function (ev) {
        boardCtrl.handleEvent(ev);
      });
    }
  }
}]);
