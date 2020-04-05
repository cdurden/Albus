angular.module('whiteboard')
.directive("myInclude", function() {
  return {
    restrict: 'CAE',
    scope: {
      src: '=',
      myInclude: '='
    },
    transclude:true,
    link: function(scope, iElement, iAttrs, controller) {
      scope.$on("$includeContentError", function(event, args){
        scope.loadFailed=true;
       });
      scope.$on("$includeContentLoaded", function(event, args){
        scope.loadFailed=false;
      });
    },
    template: "<div ng-include='myInclude||src'></div><div ng-show='loadFailed' ng-transclude/>"
  };
});
