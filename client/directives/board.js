angular.module('whiteboard')
.directive('wbBoard', ['BoardData', 'EventHandler', 'Receive','$document', function (BoardData, EventHandler, Receive, $document) {
  return {
    restrict: 'A',
    require: ['wbBoard'],
    replace: true,
    templateUrl: './templates/board.html',
    controller: function ($scope, InputHandler) {
      this.handleEvent = function (ev) {
        InputHandler[ev.type](ev);
      }
      $scope.handleEvent = function(ev) {
        InputHandler[ev.type](ev);
      };
      this.handleKeydown = function(ev) {
        InputHandler['keydown'](ev);
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
      $document.on('keydown', function (ev) {
        boardCtrl.handleKeydown(ev);
      });
    }
  }
}]);
