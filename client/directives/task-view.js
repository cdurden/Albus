angular.module('whiteboard')
.directive('wbTaskView', ['$compile', '$http', '$templateCache', 'TaskData', 'Sockets', "angularLoad", function($compile, $http, $templateCache, TaskData, Sockets, angularLoad) {
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
          'task_id': scope.task.data.id,
          'data': scope.data,
      }
      Sockets.emit("submit", data);
    };
    var loader;
    scope.$watch("$parent.task", function(task) {
      scope.task = task;
      console.log("updating task");
      if (typeof task === 'undefined') {
          task = {};
      }
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
          .concat([
              task.data.scripts.reduce( async (accumulatorPromise, nextScript) => {
                  return accumulatorPromise.then(() => {
                      return angularLoad.loadScript(nextScript);
                  });
              }, Promise.resolve())
          ])
          .concat([getTemplate(task.data.template).then(function(result) {
              return(result);
          })]))
       .then(function(response) {
           element.html($compile(response.pop().data)(scope));// TODO: figure out if this is correct
       });
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
