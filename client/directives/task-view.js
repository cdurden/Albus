angular.module('whiteboard')
.directive('wbTaskView', ['$compile', '$http', '$templateCache', 'BoardData', 'EventHandler', 'Sockets', "angularLoad", function($compile, $http, $templateCache, BoardData, EventHandler, Sockets, angularLoad) {
  var getTemplate = function(template) {
    var templateLoader;
    var baseUrl = './templates/';
    var templateUrl = baseUrl + template;
    templateLoader = $http.get(templateUrl, {cache: $templateCache});
    return templateLoader;
  }
  //var linker = function(scope, element, attrs, ctrls) {
  var linker = function(scope, element, attrs) {
    scope.submit = function() {
      console.log("submitting answers");
      data = {
          'task_id': BoardData.getBoardObj().task.id,
          'data': scope.data,
      }
      Sockets.emit("submit", data);
    };
    scope.$watch("$parent.board", function(board) {
      var task = angular.copy((board || {}).task);
      scope.task = task;
      if (typeof task !== 'undefined') {
          if (typeof task.data ==='undefined') {
              task.data = {};
          }
          if (typeof task.data.template === 'undefined') {
              task.data.template = "task.html";
          }
          if (typeof task.data.scripts === 'undefined') {
              task.data.scripts = [];
          }
          if (typeof task.data.css === 'undefined') {
              task.data.css = [];
          }
          scriptLoader = function() { return task.data.scripts.reduce( async (accumulatorPromise, nextScript) => { 
                  return accumulatorPromise.then(() => {
                      return angularLoad.loadScript(nextScript);             
                  });
              }, Promise.resolve());
          }
          if (task.data.preloadScripts) {
              preLoader = scriptLoader;
              postLoader = function() { return [] };
          } else {
              preLoader = function() { return [] };
              postLoader = scriptLoader;
          }
          Promise.all(
              /*
              task.data.scripts.map(function(script) {
                  return angularLoad.loadScript(script).then(function(result) {
                      return;
                  })
              })
              */
              [].concat(task.data.css.map(function(stylesheet) {
                  return angularLoad.loadCSS(stylesheet).then(function(result) {
                      return;
                  });
              }))
              .concat([preLoader()])
              .concat([getTemplate(task.data.template).then(function(result) {
                  return(result);
              })]))
           .then(function(response) {
               element.html($compile(response.pop().data)(scope));// TODO: figure out if this is correct
               postLoader().then(function(result) {
                   eval(task.data.onload || '');
               });
           });
      }
    }, objectEquality=true);
  }
  return {
    restrict: 'A',
    //require: ['^form'],
    scope: {
        'form': '=',
    },
    //replace: true,
    controller: function ($scope) {
      this.submit = function (ev) {
          ev.preventDefault(); // prevents page reloading
          Sockets.emit("submit");
          return false;
      }
    },
    link: linker,
  }
}]);
