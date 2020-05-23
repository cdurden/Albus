angular.module('whiteboard.services.visualizer', [])
.factory('Visualizer', ['BoardData', function (BoardData) {
  var selectionGlow;
  var selected;
  function visualizeSelection (selection) {
    var board = BoardData.getBoardElmt();
    var scale = BoardData.getZoomScale()
    if (!selection || !(selection === selected)) {
      if (selectionGlow) {
        selectionGlow.remove();
        selectionGlow.clear();
        selected = null;
      }
    }
    if (selection && (!selectionGlow || selectionGlow.items.length === 0)) {
      selected = selection;
      selectionGlow = selection.glow({
        'color': 'blue',
        'width': 10 * scale
      });
    }
  }

  function clearSelection () {
    if (selectionGlow) {
      selectionGlow.remove();
      selectionGlow.clear();
      selected = null;
    }
  }

  var displayedSnaps;
  function visualizeSnaps (snaps, closest) {
    var board = BoardData.getBoardElmt();
    var scale = BoardData.getZoomScale();
    if (!displayedSnaps) {
      displayedSnaps = BoardData.getBoardElmt().set();
    } else {
      displayedSnaps.remove();
      displayedSnaps.clear();
    }
    for (var snap in snaps) {
      if (snaps[snap] === closest) {
        displayedSnaps.push(board.circle(snaps[snap].x, snaps[snap].y, 5 * scale).attr({'stroke': 'red', 'stroke-width': 1 * scale}));
      } else {
        displayedSnaps.push(board.circle(snaps[snap].x, snaps[snap].y, 3.5 * scale).attr({'stroke': 'green', 'stroke-width': 1 * scale}));
      }
    }
  }

  function clearSnaps () {
    if (displayedSnaps) {
      displayedSnaps.remove();
      displayedSnaps.clear();
    }
  }

  return {
    visualizeSelection: visualizeSelection,
    visualizeSnaps: visualizeSnaps,
    clearSelection: clearSelection,
    clearSnaps: clearSnaps
  }
}]);
