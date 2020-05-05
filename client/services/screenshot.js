angular.module('whiteboard.services.screenshot', [])
.factory('Screenshot', ['BoardData', '$window', '$document', function (BoardData, $window, $document) {
var canvg;
var $canvas; // Create a Canvas element.
var ctx; // For Canvas returns 2D graphic.
$window.onload = () => {
  $canvas = angular.element('<canvas>'); // Create a Canvas element.
  //angular.element($document[0].body).append($canvas[0]);
  ctx = $canvas[0].getContext('2d'); // For Canvas returns 2D graphic.
  canvg = $window.canvg; // Render SVG on Canvas.
};
function screenshot() {
  var board = BoardData.getBoard();
  var canvas = BoardData.getCanvas()[0];
  var box = canvas.getAttribute('viewBox');
  let [x, y, w, h] = box.split(/\s+|,/);
  var backgroundImg = $document.find(".background-image img");
  //paper.image(backgroundImg.attr('src'), 0, 0, backgroundImg[0].width, backgroundImg[0].height).toBack();
  var svg = BoardData.getCanvas()[0];
  //var box = svg.getAttribute('viewBox');
  //let [x, y, w, h] = box.split(/\s+|,/);
  var paper = Raphael($document.find("#screenshot-container")[0]);
  paper.canvas = canvas.cloneNode(true);
  w = backgroundImg[0].naturalWidth;
  h = backgroundImg[0].naturalHeight;
  paper.setViewBox(0, 0, w, h, true);
  paper.image(backgroundImg.attr('src'), 0,0,w,h).toBack();
  //canvas.width = svg.width
  //var bp = '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">;';
  //var data = bp+svg.outerHTML; // Get SVG element as HTML code.
  var data = (new XMLSerializer()).serializeToString(svg); 
  v = canvg.Canvg.fromString(ctx, data); // Render SVG on Canvas.
  v.start();
  var theImage=document.getElementById("screenshot");
  theImage.onload = function() {
          var w = $window.open("");
          w.document.write(this.outerHTML);
  };
  setTimeout(function() {
      theImage.src=$canvas[0].toDataURL();
  }, 1000);
  
}
  return {
      screenshot: screenshot,
  }
}]);
