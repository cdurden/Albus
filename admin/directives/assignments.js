angular.module('whiteboard-admin')
.directive('wbAdminAssignments', ['Sockets', 'angularLoad', function (Sockets, angularLoad) {
  return {
    restrict: 'A',
    require: ['wbAdminAssignments'],
    replace: true,
    templateUrl: 'templates/assignments.html',
    controller: function ($scope) {
      $scope.assignments = {};
      $scope.users = [];
      Sockets.on('users', function (data) {
        console.log(data);
        assignments = {};
        $scope.users = data;
        for (user in data) {
          if (!(user.assignment in assignments)) {
              assignments[user.assignment] = [];
          }
          assignments[user.assignment].push(user);
        }
        $scope.assignments = assignments;
        function loadSortableJS(callback) {
          var sortableScripts = ["https://raw.githack.com/SortableJS/Sortable/master/Sortable.js", "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.4.1/jquery.min.js"]
          Promise.all(sortableScripts.map(function(script) {
            return(angularLoad.loadScript(script).then(function(result) {
              return result;
            }));
          })).then(function() {
            callback();
          });
        }
        function updateAssignments() {
          $('.assignmentList').each(function(i,assignmentElmt) { 
            var assignmentId=$(assignmentElmt).find(".assignment").text();
            $(assignmentElmt).find('span[id^=userId]').each(function(j,userElmt) {
                $scope.users[$(userElmt).text()]['assignmentId'] = assignmentId;
                // do more
            });
            //assignments[assignmentId] = users;
          });
        }
        function createSortables() {
          //var assignments = {};
          $(".assignmentList").each(function(i, elmt) {
            console.log("creating sortable on element:");
            console.log(elmt);
            Sortable.create(elmt, {
              group: 'assignments',
              onChange: function() {
                updateAssignments();
                var usersJSON = JSON.stringify($scope.users,null,'\t');
                $('#printCode').html(usersJSON);
              },
            });
            $('#generateJSON').click(function() {
              Sockets.emit('assignAssignments', $scope.users);
            });
          });
        }
        $scope.$watch("assignments", function (value) {//I change here
          var val = value || null;            
          if (val)
            loadSortableJS(createSortables);
          updateAssignments();
          var usersJSON = JSON.stringify($scope.users,null,'\t');
          $('#printCode').html(usersJSON);
          //let assignments = {};
          //let users = {};
        });
        console.log(data);
        console.log(assignments);
      });
      Sockets.emit('getUsers');
    },
    link: function(scope, element, attrs) {
      console.log("calling link function");
        /*
      function injectLibsFromStack(callback){
          if(libs.length > 0){
      
            //grab the next item on the stack
            var nextLib = libs.shift();
            var headTag = document.getElementsByTagName('head')[0];
      
            //create a script tag with this library
            var scriptTag = document.createElement('script');
            scriptTag.src = nextLib;
      
            //when successful, inject the next script
            scriptTag.onload = function(e){
              console.log("---> loaded: " + e.target.src);
              injectLibsFromStack(callback);
            };
      
            //append the script tag to the <head></head>
            headTag.appendChild(scriptTag);
            console.log("injecting: " + nextLib);
          }
          else return callback();
      }
      */
          
        /*
      injectLibsFromStack(function() {
        var sortables = [];
        console.log("creating sortables");
        $('#generateJSON').click(function() {
      
          let assignments = {};
          let users = {};
           
          $('.assignmentList').each(function(i,assignment_elmt) { 
            var assignment=$(assignment_elmt).find(".assignment").text();
            $(assignment_elmt).find('span[id^=user_id]').each(function(j,user_elmt) {
                users[$(user_elmt).text()] = {'assignmentId': assignment };
                // do more
            });
            var student_ids = $(assignment_elmt).find('span[id^=student_id]').map(function(idx, elem) {
              return {'id': $(elem).text()};
            }).get();
        
            assignments[assignment] = student_ids;
          });
      
          // encode to JSON format
          var assignments_json = JSON.stringify(assignments,null,'\t');
          var users_json = JSON.stringify(users,null,'\t');
          $('#printCode').html(users_json);
          Sockets.emit('assign_users_to_assignments', users);
        });
      });
      */
    },
  }
}]);
