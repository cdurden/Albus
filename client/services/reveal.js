angular.module('whiteboard.services.reveal', [])
.factory('Reveal', ['angularLoad', function (angularLoad) {
  function getScripts() {
      return(["/static/teaching_assets/slides/reveal.js/js/reveal.js"]);
  },
  function getCSS() {
      return(["https://cdnjs.cloudflare.com/ajax/libs/reveal.js/3.6.0/css/reveal.min.css",
              "https://cdnjs.cloudflare.com/ajax/libs/reveal.js/3.6.0/css/theme/white.min.css"]);
  },
  function load(callback) {
      Promise.all(getScripts().map(function(script) {
          angularLoad.loadScript(script).then(function(result) {
              return result;
          });
      })).then(function() {
          Promise.all(getCSS().map(function(stylesheet) {
              angularLoad.loadCSS(stylesheet).then(function(result) {
                  return result;
              });
          })).then(callback);
      });
  },
  function initialize () {
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
          src: './slides/'+deck+'/chalkboard.json',
          readOnly: false,
      },
  	audio: {
        prefix: './slides/'+deck+'/audio/',
        suffix: '.webm',
        advance: 0,
        playerStyle: 'position: fixed; top: 4px; left: 25%; width: 50%; height:75px; z-index: 33;',
        playerOpacity: 0.25,
      },
      dependencies: [
        { src: './reveal.js/plugin/math/math.js', async: true },
        { src: './reveal.js-plugins/anything/anything.js' },
        { src: './reveal.js/plugin/markdown/marked.js' },
        { src: './reveal.js/plugin/markdown/markdown.js' },
        { src: './reveal_countdown/countdown.js' },
        // audio recording
    	  { src: './reveal.js-plugins/audio-slideshow/RecordRTC.js', condition: function( ) { return !!document.body.classList; } },				
    	  { src: './reveal.js-plugins/audio-slideshow/slideshow-recorder.js', condition: function( ) { return !!document.body.classList; } },				
    	  { src: './reveal.js-plugins/audio-slideshow/audio-slideshow.js', condition: function( ) { return !!document.body.classList; } },
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
  }
  return {
      initialize: initialize,
      load: load,
  }
}]);
