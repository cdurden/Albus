angular.module('whiteboard')
.directive('wbToolbar', ['BoardData', 'Zoom', function (BoardData, Zoom) {
  return {
    restrict: 'A',
    replace: true,
    templateUrl: 'views/toolbar.html',
    require: ['^wbBoard', 'wbToolbar'],
    controller: function ($scope) {

      var fill = [
        '#e74c3c', 
        '#e67e22', 
        '#f1c40f', 
        '#1abc9c', 
        '#2ecc71', 
        '#3498db',
        '#9b59b6',
        '#34495e',
        '#95a5a6',
        '#ecf0f1',
      ];

      var stroke = [
        '#c0392b',
        '#d35400',
        '#f39c12',
        '#16a085',
        '#27ae60',
        '#2980b9',
        '#8e44ad',
        '#2c3e50',
        '#7f8c8d',
        '#bdc3c7',
      ];

      var thickness = [
        '10',
        '9',
        '8',
        '7',
        '6',
        '5',
        '4',
        '3',
        '2',
        '1'
      ];

      $scope.menuStructure = [
        ['Draw', ['Path', 'Line', 'Arrow', 'Rectangle', 'Circle', 'Text']], 
        ['Tool', ['Magnify', 'Eraser', 'Pan', 'Move', 'Copy']],
        ['Color', [['Fill', fill], ['Stroke', stroke], ['Thickness', thickness]]]
      ];

      
      
      $scope.$on('toggleAllSubmenu', function (ev, msg) {
        if (msg.action === 'hide') {
          $scope.$broadcast('toggleSubmenu', msg)
        }
      });

      $scope.$on('resetBackgrounds', function (ev, msg) {

        if (Array.isArray(msg.target)) {
          msg.target.forEach(function (target) {
            $scope.$broadcast('resetTargetBackground', {target: target});    
          })
        } else {
          $scope.$broadcast('resetTargetBackground', msg);
        }
      })

    },
    link: function (scope, element, attrs, ctrls) {

      scope.$on('activateMenu', function (event, action) {
        if (action === 'show') {
          element.addClass('show');
          scope.$broadcast('toggleMouseEv', action);
        } else {
          element.removeClass('show');
          scope.$broadcast('toggleMouseEv', action);
        }
      });
       
    }
  };
}])
.directive('wbMenuOpener', function () {
  return {
    restrict: 'C',
    replace: false,
    require: 'wbMenuOpener',
    scope: false,
    controller: function ($scope) {

      this.menuHandler = function (attr) {
        $scope.$emit('activateMenu', attr);
      }

    },
    link: function (scope, element, attrs, ctrl) {
      
      element.bind('mouseover mouseleave', function (ev) {
        if (ev.buttons === 0 && ev.type === 'mouseover' && (angular.element(ev.relatedTarget).is('svg') || angular.element(ev.relatedTarget)[0].raphael)) {
          ctrl.menuHandler('show');
        }
      });
    }
  };
})
.directive('wbSubmenuOpener', function () {
  return {
    restrict: 'C',
    replace: false,
    require: 'wbSubmenuOpener',
    controller: function ($scope) {

      this.submenuOpener = function (action) {
        this.submenuCloser({action: 'hide', level: action.level});
        $scope.$broadcast('toggleSubmenu', action);
      }

      this.submenuCloser = function (action) {
        $scope.$emit('toggleAllSubmenu', action);
      }

    },
    link: function (scope, element, attrs, submenuOpenerCtrl) {

      var bindMouseEv = function () {
        element.bind('mouseover mouseleave', function (ev) {
          if (ev.type === 'mouseover' && attrs.wbLevel === '2') {
            submenuOpenerCtrl.submenuOpener({action: 'show', level: '2'});
          } else if (ev.type === 'mouseover' && attrs.wbLevel === '3') {
            submenuOpenerCtrl.submenuOpener({action: 'show', level: '3'});
          } else if (ev.type === 'mouseleave' && (angular.element(ev.toElement).hasClass('lvl1') || angular.element(ev.toElement).hasClass('level-one'))) {
            submenuOpenerCtrl.submenuCloser({action: 'hide', level: '2'});
          } else if (ev.type === 'mouseleave' && (angular.element(ev.toElement).hasClass('level-three') || angular.element(ev.toElement).hasClass('lvl2'))) {
            submenuOpenerCtrl.submenuCloser({action: 'hide', level: '3'});
          } else if (ev.type === 'mouseleave' && angular.element(ev.toElement).hasClass('wb-submenu-opener')) {
            submenuOpenerCtrl.submenuCloser({action: 'hide', level: attrs.wbLevel});
          }
        });
      };

      var unbindMouseEv = function () {
        element.unbind('mouseover mouseleave');
        submenuOpenerCtrl.submenuCloser({action: 'hide', level: 'all'});
      }

      scope.$on('toggleMouseEv', function (event, action) {
        if (action === 'show') {
          element.addClass('show');
          bindMouseEv();
        } else {
          element.removeClass('show');
          unbindMouseEv();
        }
      })

    }
  };
})
.directive('wbSubmenu', function () {
  return {
    restrict: 'C',
    replace: false,
    controller: function () {

    },
    link: function (scope, element, attrs, ctrl) {

      if (attrs.wbLevel !== 3) {
        scope.$on('toggleSubmenu', function (event, msg) {
          if (msg.action === 'show') {
            if (msg.level === attrs.wbLevel) {
              element.addClass('show');
            }
          } else {
            if (msg.level === attrs.wbLevel) {
              element.removeClass('show');
            } else if (msg.level === 'all') {
              element.removeClass('show');
            }
          }
        });
      }
    }
  };
})
.directive('wbSubmenuItems', function () {
  return {
    restrict: 'C',
    replace: false,
    require: 'wbSubmenuItems',
    controller: function ($scope, BoardData) {

      $scope.setAttributeTool = function (toolName) {
        if (typeof toolName === 'string') {
          return toolName.toLowerCase();
        }
        return toolName[0];
      }

      this.setTool = function (toolName) {
        BoardData.setCurrentToolName(toolName); 
      }

      this.setColors = function (type, color) {
        if (type === 'fill') {
          BoardData.setColors(color, null); 
        } else {
          BoardData.setColors(null, color); 
        }
      } 

      this.setThickness = function (thickness) {
        BoardData.setStrokeWidth(thickness);
      }

    },
    link: function (scope, element, attrs, submenuItemsCtrl) {

      var updateIconColors = function (type, color) {
        scope.$emit('changeIconColors', {type: type, color: color});
      };

      element.bind('mouseleave', function (ev) {
        ev.stopPropagation();
        if (attrs.wbColor && (angular.element(ev.relatedTarget).is('svg') || angular.element(ev.relatedTarget)[0].raphael)) {
          submenuItemsCtrl.setColors(attrs.wbColorType, attrs.wbColor);
          scope.$emit('activateMenu', 'hide');
        } else if (attrs.wbThickness && (angular.element(ev.relatedTarget).is('svg') || angular.element(ev.relatedTarget)[0].raphael)) {
          submenuItemsCtrl.setThickness(attrs.wbThickness);
          scope.$emit('activateMenu', 'hide');
        } else if (attrs.wbTool && (angular.element(ev.relatedTarget).is('svg') || angular.element(ev.relatedTarget)[0].raphael)) {
          scope.$emit('setCursorClass', {tool: attrs.wbTool});
          submenuItemsCtrl.setTool(attrs.wbTool);
          scope.$emit('activateMenu', 'hide');
        } else if (angular.element(ev.relatedTarget).hasClass('menu') || angular.element(ev.relatedTarget).hasClass('icon')) {
          scope.$emit('toggleAllSubmenu', {action: 'hide', level: '3'});
        }
      });
    }
  };
})
.directive('wbMenuOverHandler', function () {
  return {
    restrict: 'A',
    replace: false,
    require: 'wbMenuOverHandler',
    controllerAs: 'menuOver',
    controller: function ($scope) {
      var elemWidth;

      this.storeElemWidth = function (width) {
        elemWidth = width;
      };

      this.getElemWidth = function () {
        return elemWidth;
      };

      this.calcBg = function (mouseX, leftOffset) {
        var width = this.getElemWidth();

        var bgSizes = {};
        bgSizes.overed = (mouseX - leftOffset) * 100 / this.getElemWidth();

        return bgSizes;
      };

      this.hexToRGBA = function (hex, opacity) {
        opacity = opacity || 90;

        hex = hex.replace('#','');
        r = parseInt(hex.substring(0,2), 16);
        g = parseInt(hex.substring(2,4), 16);
        b = parseInt(hex.substring(4,6), 16);

        result = 'rgba('+r+','+g+','+b+','+opacity/100+')';
        return result;
      }

    },
    link: function (scope, element, attrs, ctrl) {

      if (ctrl.getElemWidth() === undefined) {
        ctrl.storeElemWidth(element.width())
      }

      var setBg = function (el, sizes) { 
        el.css({'background': 'linear-gradient(90deg, rgba(177,102,24,0.96) ' + (sizes.overed) + '%, rgba(53,53,53,0.93) 0%)'})
      }

      var setColorBg = function (el, color, sizes) { 
        var rgbaOver = ctrl.hexToRGBA(color, 100);
        var rgbaFree = ctrl.hexToRGBA(color, 90);
        el.css({'background': 'linear-gradient(90deg,  ' + rgbaOver + ' ' + (sizes.overed) + '%, ' + rgbaFree + ' 0%)'})
      }

      element.bind('mouseover', function (ev) {
        ev.stopPropagation();
        if (angular.element(ev.currentTarget).hasClass('level-two-items')) {
          var $levelOne = angular.element(ev.currentTarget).parents('.level-one')
          scope.$emit('resetBackgrounds', {target: 'level-two-items'});
          setBg($levelOne, {overed: 100});
        } else if (angular.element(ev.currentTarget).hasClass('level-one')) {
          scope.$emit('resetBackgrounds', {target: 'level-two-items'});
        } else if (angular.element(ev.currentTarget).hasClass('color-palette')) {
          var $levelTwo = angular.element(ev.currentTarget).parents('.level-two-items')
          setBg($levelTwo, {overed: 100});
          scope.$emit('resetBackgrounds', {target: 'level-three-items'});
        } else if (angular.element(ev.currentTarget).hasClass('thickness')) {
          var $levelTwo = angular.element(ev.currentTarget).parents('.level-two-items');
          setBg($levelTwo, {overed: 100});
          scope.$emit('resetBackgrounds', {target: 'level-three-items'});
        }


      });

      element.bind('mousemove', function (ev) {
        ev.stopPropagation();

        var $el = angular.element(ev.currentTarget);
        if ($el.hasClass('level-one') || $el.hasClass('level-two-items') || $el.hasClass('thickness')) {
          var bgSizes = ctrl.calcBg(ev.clientX, $el.offset().left);
          setBg($el, bgSizes);
        } else if ($el.hasClass('color-palette')) {
          var bgSizes = ctrl.calcBg(ev.clientX, $el.offset().left);
          setColorBg($el, scope.color, bgSizes);

        }
      });

      element.bind('mouseleave', function (ev) {

        var $elTarget = angular.element(ev.currentTarget);
        var $elToElement = angular.element(ev.toElement);

        if ($elTarget.hasClass('level-two-items')) {
          if ($elToElement.is('svg') || angular.element(ev.relatedTarget)[0].raphael) {
            scope.$emit('resetBackgrounds', {target: 'all'});
          } else if ($elToElement.hasClass('wb-submenu-opener')) {
            scope.$emit('resetBackgrounds', {target: 'all'});
          } else {
            scope.$emit('resetBackgrounds', {target: 'level-two-items'});
          }
        } else if ($elTarget.hasClass('level-one')) {
          scope.$emit('resetBackgrounds', {target: 'level-one'});
        } else if ($elTarget.hasClass('color-palette') || $elTarget.hasClass('thickness')) {
          if ($elToElement.is('svg') || angular.element(ev.relatedTarget)[0].raphael) {
            scope.$emit('resetBackgrounds', {target: 'all'});
          } else if ($elToElement.hasClass('wb-submenu-opener') || $elToElement.hasClass('level-three-items')) {
            scope.$emit('resetBackgrounds', {target: ['color-palette', 'thickness']});
          } 
        }
      })

      scope.$on('resetTargetBackground', function (ev, msg) {
        if (msg.target === 'all') {
          element.hasClass('color-palette') ? setColorBg(element, scope.color, {overed: 0}) : setBg(element, {overed: 0});  
        } else if (element.hasClass('color-palette') && (msg.target === 'level-three-items' || msg.target === 'color-palette')) {
          setColorBg(element, scope.color, {overed: 0});
        } else if (element.hasClass('thickness') && (msg.target === 'level-three-items' || msg.target === 'thickness')) {
          setBg(element, {overed: 0});
        } else if (element.hasClass(msg.target)) {
          setBg(element, {overed: 0});
        }
      });

    }
  };
})
