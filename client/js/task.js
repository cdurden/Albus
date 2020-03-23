function openTaskForm() {
      document.getElementById("task-popup").style.display = "block";
}
function closeTaskForm() {
      document.getElementById("task-popup").style.display = "none";
}
function toggleTaskForm() {
  var x = document.getElementById("task-popup");
  var btn = document.getElementById("task-toggle-button");
  if (x.style.display === "none") {
    x.style.display = "block";
    btn.innerHTML = "Hide task";
  } else {
    x.style.display = "none";
    btn.innerHTML = "Show task";
  }
}
