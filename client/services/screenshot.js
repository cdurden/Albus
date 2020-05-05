angular.module('whiteboard.services.screenshot', [])
.factory('Screenshot', ['BoardData', '$window', function (BoardData, $window) {
var canvg;
var canvas; // Create a Canvas element.
var ctx; // For Canvas returns 2D graphic.
$window.onload = () => {
  canvas = document.createElement('canvas'); // Create a Canvas element.
  ctx = canvas.getContext('2d'); // For Canvas returns 2D graphic.
  canvg = $window.canvg; // Render SVG on Canvas.
};
function SVG2PNG(svg, callback) {
  var bp = '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">;';
  var data = bp+svg.outerHTML; // Get SVG element as HTML code.
  canvg.Canvg.fromString(ctx, data); // Render SVG on Canvas.
  callback(canvas); // Execute callback function.
}
function screenshot() {
  var svg = BoardData.getCanvas()[0];
  SVG2PNG(svg, function() {
      var theImage=document.getElementById("screenshot");
          theImage.src=canvas.toDataURL();
      theImage.onload = function() {
              var w = $window.open("");
              w.document.write(this.outerHTML);
      };
  })
}
  return {
      screenshot: screenshot,
  }
}]);
