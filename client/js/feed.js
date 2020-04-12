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
function openChatForm() {
    document.getElementById("chat-popup").style.display = "block";
}
function closeChatForm() {
    document.getElementById("chat-popup").style.display = "none";
}
function toggleChatForm() {
  var x = document.getElementById("chat-popup");
  var btn = document.getElementById("chat-toggle-button");
  if (x.style.display === "none") {
    x.style.display = "block";
    //btn.innerHTML = "Hide chat";
  } else {
    x.style.display = "none";
    //btn.innerHTML = "Show chat";
  }
}
