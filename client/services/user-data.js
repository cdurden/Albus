angular.module('whiteboard.services.userdata', [])
.factory('UserData', function () {
  var data = {};
  data.users = [];

  function setActingUser(user) {
      data.actingAsUser = user;
  }
  function getActingUser(user) {
      data.actingAsUser = user;
  }
  function setUsers(users) {
      data.users = users;
  }
  function getInboxes() {
      return data.user.inboxes;
  }
  function getAssignmentsReceived() {
      return data.user.assignments_received;
  }
  function getUsers() {
      return data.users;
  }
  function setUser(user) {
      data.user = user;
  }
  function getUser() {
      return(data.user);
  }
  function getDataObject() {
      return data;
  }

  return {
    setUser: setUser,
    getUser: getUser,
    setUsers: setUsers,
    getUsers: getUsers,
    getDataObject: getDataObject,
    setActingUser: setActingUser,
    getActingUser: getActingUser,
    getInboxes: getInboxes,
    getAssignmentsReceived: getAssignmentsReceived,
  }
});
