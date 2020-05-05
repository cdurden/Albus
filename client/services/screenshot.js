angular.module('whiteboard.services.screenshot', [])
.factory('Screenshot', ['BoardData', '$window', function (BoardData, $window) {
function SVG2PNG(svg, callback) {
  var canvas = document.createElement('canvas'); // Create a Canvas element.
  var ctx = canvas.getContext('2d'); // For Canvas returns 2D graphic.
  var data = svg.outerHTML; // Get SVG element as HTML code.
  $window.canvg(canvas, data); // Render SVG on Canvas.
  callback(canvas); // Execute callback function.
}
function screenshot() {
  svg = BoardData.getCanvas()[0];
  SVG2PNG(svg, function(canvas) {
      var theImage=document.getElementById("toImage");
          theImage.src=canvas.toDataURL();
      theImage.onload(function() {
              var w = window.open("");
              w.document.write(theImage.outerHTML);
      });
  })
}
  return {
      screenshot: screenshot,
  }
}]);
