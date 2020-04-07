angular.module('whiteboard.services.reveal', [])
.factory('Reveal', ['angularLoad', 'BoardData', function (angularLoad, BoardData) {
  var print = false;
  function setPrintingPdf(print_) {
      print = print_;
  }
  function isPrintingPdf() {
      return(print);
  }
  function getSlidesBaseHref() {
      return("/static/teaching_assets/slides/");
  }
  function getScripts() {
      if (isPrintingPdf()) {
          return([getSlidesBaseHref()+"./js/reveal.js"]);
      } else {
          return([getSlidesBaseHref()+"./reveal.js/js/reveal.js"]);
      }
  }
  function getCSS() {
      stylesheets = ["https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css",
              "https://cdnjs.cloudflare.com/ajax/libs/reveal.js/3.6.0/css/reveal.min.css",
              "https://cdnjs.cloudflare.com/ajax/libs/reveal.js/3.6.0/css/theme/white.min.css"];
      if (isPrintingPdf()) {
          stylesheets = stylesheets.concat(getSlidesBaseHref()+"./styles/pdf.css");
      }
      return(stylesheets)
  }
  function load(callback) {
      Promise.all(getScripts().map(function(script) {
          return angularLoad.loadScript(script).then(function(result) {
              return result;
          });
      })).then(function() {
          Promise.all(getCSS().map(function(stylesheet) {
              return angularLoad.loadCSS(stylesheet).then(function(result) {
                  return result;
              });
          })).then(callback);
      });
  }
  function initialize (callback) {
    Reveal.initialize({
      math: {
        mathjax: 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.0/MathJax.js',
        config: 'TeX-AMS_HTML-full', // See http://docs.mathjax.org/en/latest/config-files.html
        // pass other options into `MathJax.Hub.Config()`
        TeX: { Macros: { RR: "{\\bf R}" } },
        tex2jax: {
          //inlineMath: [ ["\\(","\\)"] ],
          inlineMath: [ ['$','$'], ["\\(","\\)"] ],
          displayMath: [ ['$$','$$'], ["\\[","\\]"] ],
          processEscapes: true
        },
      },
      broadcast: {
        secret: '$2a$05$hhgakVn1DWBfgfSwMihABeYToIBEiQGJ.ONa.HWEiNGNI6mxFCy8S',
        // Configure RTCMultiConnection
        connection: {
          socketURL: 'https://revealjs-broadcast.herokuapp.com/',
          session: {
          audio: true,
          video: true,
          oneway: true
          },
        },
      }, 
      countdown: { defaultTime: 300, autostart: "yes" },
      keyboard: {
        8: function() { RevealChalkboard.reset() },    // reset chalkboard data on current slide when 'BACKSPACE' is pressed
        67: function() { RevealChalkboard.toggleNotesCanvas() },    // toggle notes canvas when 'c' is pressed
        68: function() { RevealChalkboard.download() }, // downlad recorded chalkboard drawing when 'd' is pressed
        82: function() { Recorder.toggleRecording(); }, // press 'r' to start/stop recording
        90: function() { Recorder.downloadZip(); },     // press 'z' to download zip containing audio files
      },
      anything: [ 
        {
          className: "question", 
        }
      ],
      chalkboard: {
          src: getSlidesBaseHref()+'./slides/'+deck+'/chalkboard.json',
          readOnly: false,
      },
  	audio: {
        prefix: getSlidesBaseHref()+'./slides/'+deck+'/audio/',
        suffix: '.webm',
        advance: 0,
        playerStyle: 'position: fixed; top: 4px; left: 25%; width: 50%; height:75px; z-index: 33;',
        playerOpacity: 0.25,
      },
      dependencies: [
        { src: getSlidesBaseHref()+'./reveal.js/plugin/math/math.js', async: true },
        { src: getSlidesBaseHref()+'./reveal.js-plugins/anything/anything.js' },
        { src: getSlidesBaseHref()+'./reveal.js/plugin/markdown/marked.js' },
        { src: getSlidesBaseHref()+'./reveal.js/plugin/markdown/markdown.js' },
        { src: getSlidesBaseHref()+'./reveal_countdown/countdown.js' },
        // audio recording
    	  { src: getSlidesBaseHref()+'./reveal.js-plugins/audio-slideshow/RecordRTC.js', condition: function( ) { return !!document.body.classList; } },				
    	  { src: getSlidesBaseHref()+'./reveal.js-plugins/audio-slideshow/slideshow-recorder.js', condition: function( ) { return !!document.body.classList; } },				
    	  { src: getSlidesBaseHref()+'./reveal.js-plugins/audio-slideshow/audio-slideshow.js', condition: function( ) { return !!document.body.classList; } },
        // broadcasting audio/video
        /*
        { src: './reveal.js-plugins/broadcast/RTCMultiConnection.min.js'},
        { src: './reveal.js-plugins/broadcast/socket.io.js'},
        { src: './reveal.js-plugins/broadcast/bCrypt.js'},
        { src: './reveal.js-plugins/broadcast/broadcast.js'},
        { src: './reveal.js/plugin/highlight/highlight.js' },
        { src: '/static/js/reveal.js/plugin/notes/notes.js', async: true },
        */
      ],
      hash: true,
      loop: false,
      //transition: Reveal.getQueryHash().transition || 'none',
    });
    callback();
  }
  function onWindowResize() {
      const promise = new Promise((resolve, reject) => {
          Reveal.layout();
          resolve();
      }).then(function () {
          var slides = document.querySelector( '.reveal .slides' );
          var slides_rect = slides.getBoundingClientRect();
          var board_container = document.getElementById('board-container');
          var board_container_rect = board_container.getBoundingClientRect();
          var scale = {
              x: board_container_rect.width/slides_rect.width,
              y: board_container_rect.height/slides_rect.height
          }
          var offset = {
              x: -scale.x*slides_rect.left,
              y: -scale.y*slides_rect.top,
          }
          /*
          BoardData.setOffset(offset);
          var newPageSize = {
              //width: window.innerWidth,
              //height: window.innerHeight
              width: svgDims.width*board_container_rect.width/slides_rect.width,
              height: svgDims.height*board_container_rect.height/slides_rect.height,
          }
          */
          //var scale = slides_rect.width / board_container_rect.width;
          //BoardData.setZoomScale(scale);
          //BoardData.setZoomScale(Reveal.getScale());
          //BoardData.handleWindowResize(svgDims);
          var viewBoxWidth = scale*window.innerWidth;
          var viewBoxHeight = scale*window.innerHeight;
          BoardData.getBoard().setViewBox(offset.x, offset.y, viewBoxWidth, viewBoxHeight); 
      });
  }
  function replaceWindowResizeEventListener() {
      window.removeEventListener("resize", Reveal.onWindowResize);
      window.addEventListener("resize", onWindowResize);
  }
  return {
      initialize: initialize,
      replaceWindowResizeEventListener: replaceWindowResizeEventListener,
      load: load,
      getSlidesBaseHref: getSlidesBaseHref,
      setPrintingPdf: setPrintingPdf
  }
}]);
