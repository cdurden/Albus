angular.module('whiteboard')
.directive('slideshow', ['$compile', 'Sockets', 'Reveal', 'BoardData', function($compile, Sockets, Reveal, BoardData) {
  return {
      controller: ["$scope", "$location", "$http", "$routeParams", function($scope, $location, $http, $routeParams) {
      $scope.slides = [];
      //hash_parts = $location.hash().split("/");
      Reveal.setPrintingPdf( ( /print-pdf/gi ).test( window.location.search ) );
      hash_parts = window.location.hash.substr(1).split("%2F");
      deck = hash_parts[0] ? hash_parts[0] : hash_parts[1];
      //deck = "EfficientlySolvingInequalities";
      console.log(deck);
      $http({
        method: 'GET',
        url: Reveal.getSlidesBaseHref()+"./decks/"+deck+".json"
      }).then(function success(response) {
          console.log(response);
          if (typeof(response.data.collection) !== 'undefined') {
            $scope.collection = response.data.collection
            $scope.slides = response.data.slides;
          } else {
            $scope.slides = response.data;
          }
          console.log($scope.slides);
      }, function error(response) {
          console.error(response);
      });
    }],
    link: function(scope, elem, attrs) {
      // the following is handled by the snow-qm-task directive for now
      /*
      Sockets.on('output', function(data) {
          console.log("output received");
          output(data);
      });
      */
      elem.addClass('slides');
      scope.$watch('slides', function(slides) {
        console.log(slides);
        if (slides.length) {
          console.log("updating slides");
          for (var i = 0; i < scope.slides.length; i++) {
            var section = angular.element("<section>");
            var steps = scope.slides[i];
    
            if (steps.length == 1) {
              if (typeof(scope.collection) !== 'undefined') {
                  steps[0] = scope.collection+"/"+steps[0];
              }
              if (steps[0].split('.').length == 1) {
                  steps[0] = steps[0]+".html";
              }
              if (steps[0].split('.').pop() === "md") {
                console.log("slide "+steps[0]+" has markdown");
                section.attr("id", steps[0]);
                section.attr("data-markdown", '');
                section.attr("data-separator", '^---$');
                div = angular.element("<div>");
                div.attr('my-include', "'/static/teaching_assets/slides/slides/"+steps[0]+"'");
                //div.html(slideLoadFailedHtml(steps[0]));
                  /*
                section.attr("id", steps[0]);
                section.attr("data-markdown", '');
                section.attr("data-separator", '^---$');
                script = angular.element("<script>");
                script.attr('type', 'text/template');
                script.attr('my-include', "'./slides/"+steps[0]+"'");
                section.append(script);
                */
                section.append(div);
              } else {
                section.attr('my-include', "'/static/teaching_assets/slides/slides/"+steps[0]+"'");
                section.attr("id", steps[0]);
                //section.html(slideLoadFailedHtml(steps[0]));
              }
                  /*
              section.attr('ng-include', "'./slides/"+steps[0]+".html?raw=true'");
              section.attr("id", steps[0]);
              section.attr("data-markdown", '');
              section.attr("data-separator", '^---$');
              */
              $compile(section)(scope);
            } else {
              console.log(steps.length);
              for (var j = 0; j < steps.length; j++) {
                var subSection = angular.element("<section>");
                if (typeof(scope.collection) !== 'undefined') {
                    steps[j] = scope.collection+"/"+steps[j];
                }
                if (steps[j].split('.').length == 1) {
                    steps[j] = steps[j]+".html";
                }
                if (steps[j].split('.').pop() === "md") {
                  console.log("slide "+steps[j]+" has markdown");
                  subSection.attr("id", steps[j]);
                  subSection.attr("data-markdown", '');
                  subSection.attr("data-separator", '^---$');
                  div = angular.element("<div>");
                  div.attr('my-include', "'/static/teaching_assets/slides/slides/"+steps[j]+"'");
                  //div.html(slideLoadFailedHtml(steps[0]));
                  /*
                  script = angular.element("<script>");
                  script.attr('type', 'text/template');
                  script.attr('ng-include', "'./slides/"+steps[j]+"'");
                  */
                  //subSection.append(script);
                  //div.append(script);
                  subSection.append(div);
                } else {
                  console.log("slide "+steps[j]+" has html");
                  subSection.attr('my-include', "'/static/teaching_assets/slides/slides/"+steps[j]+"'");
                  //subSection.html(slideLoadFailedHtml(steps[0]));
                  subSection.attr("id", steps[j]);
                }
                //if (j < steps.length - 1)
                //  subSection.attr('data-autoslide', '1000');
                  /*
                subSection.attr("data-markdown", '');
                subSection.attr("data-separator", '^---$');
                subSection.attr("ng-include", "'./slides/"+steps[j]+".html?raw=true'");
                subSection.attr("id", steps[j]);
                */
                section.append(subSection);
              }
              $compile(section)(scope);
            }
            elem.append(section);
          }
          Reveal.load(Reveal.initialize);
        }
      });
    }
  };
}]);
