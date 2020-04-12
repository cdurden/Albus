angular.module('whiteboard')
.directive('wbBoard', ['BoardData', 'Broadcast', 'Receive', 'LeapMotion', function (BoardData) {
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
      Split(['#interactive-space', '#task-container'], {
        sizes: [75, 25],
        minSize: [200, 200],
        direction: 'vertical',
      })
      Split(['#drawing-space', '#feed-container'], {
        sizes: [75,25],
        minSize: [200, 200],
        direction: 'horizontal',
      })
      $("#board-container").on('touchstart', function (e) { e.preventDefault(); });
      var boardCtrl = ctrls[0];
        /*
      BoardData.setOffset({
          x: $(".reveal").find(".slides").offset().left,
          y: $(".reveal").find(".slides").offset().top,
      });
      */
      BoardData.createBoard(element);
      BoardData.getCanvas().bind('touchstart touchend touchmove mousedown mouseup mousemove dblclick', boardCtrl.handleEvent);
      BoardData.getCanvas().bind('click', function() {scope.$emit('activateMenu', 'hide');});

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
