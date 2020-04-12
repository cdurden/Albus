var scrolled = false;
function updateScroll(){
    if(!scrolled){
        var element = document.getElementById("messages");
        element.scrollTop = element.scrollHeight;
    }
}
$("#messages").on('scroll', function(){
    if (scrollTop == scrollHeight) { scrolled = false; } else { scrolled=true; }
});
function openFeedForm() {
    document.getElementById("feed-popup").style.display = "block";
}
function closeFeedForm() {
    document.getElementById("feed-popup").style.display = "none";
}
function toggleFeedForm() {
  var x = document.getElementById("feed-popup");
  var btn = document.getElementById("feed-toggle-button");
  if (x.style.display === "none") {
    x.style.display = "block";
    //btn.innerHTML = "Hide feed";
  } else {
    x.style.display = "none";
    //btn.innerHTML = "Show feed";
  }
}
