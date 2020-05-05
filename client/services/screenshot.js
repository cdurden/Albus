angular.module('whiteboard.services.screenshot', [])
.factory('Screenshot', ['BoardData', '$window', '$document', function (BoardData, $window, $document) {
var canvg;
var $canvas; // Create a Canvas element.
var ctx; // For Canvas returns 2D graphic.
$window.onload = () => {
  $canvas = angular.element('<canvas>'); // Create a Canvas element.
  angular.element($document[0].body).append($canvas[0]);
  ctx = $canvas[0].getContext('2d'); // For Canvas returns 2D graphic.
  canvg = $window.canvg; // Render SVG on Canvas.
};
function screenshot() {
  var paper = BoardData.getBoard();
  var backgroundImg = $document.find(".background-image img");
  paper.image(backgroundImg.attr('src'), 0, 0, backgroundImg[0].width, backgroundImg[0].height).toBack();
  var svg = BoardData.getCanvas()[0];
  //canvas.width = svg.width
  //var bp = '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">;';
  //var data = bp+svg.outerHTML; // Get SVG element as HTML code.
  var data = (new XMLSerializer()).serializeToString(svg); 
  v = canvg.Canvg.fromString(ctx, data); // Render SVG on Canvas.
  v.start();
  
  var theImage=document.getElementById("screenshot");
      theImage.src=$canvas[0].toDataURL();
  theImage.onload = function() {
          var w = $window.open("");
          w.document.write(this.outerHTML);
  };
}
  return {
      screenshot: screenshot,
  }
}]);
