var request = require('request');
var auth = require('./auth');
var scheme = "https";
var host = "localhost";
var port = 444;
function getSocketUser(socket) {
    return(socket.handshake.session.passport.user);
}
function getSessionUser(session) {
    return(session.passport.user);
}
function getApiUserFromSession(session, callback) {
  var lti_user_id = getSessionUser(session);
  console.log("Getting API user based on lti_user_id: "+lti_user_id);
  request({
    url: `${scheme}://${host}:${port}/api/user/${lti_user_id}`,
    headers : { "Authorization" : "Bearer " + auth.token },
  },
    function(error, response, body) {
    if (!error && response.statusCode == 200) {
      body_json = JSON.parse(body)
      if ('data' in body_json) {
        callback(null, body_json['data']);
      }
    } else {
      callback(error, null);
    }
  });
}
function getApiUsers(socket, callback) {
  request({
    url: `${scheme}://${host}:${port}/api/users/`,
    headers : { "Authorization" : "Bearer " + auth.token },
    qs: { 'user': getSocketUser(socket), 'auth_scheme': 'lti' },
  },
    function(error, response, body) {
    if (!error && response.statusCode == 200) {
      body_json = JSON.parse(body)
      if ('data' in body_json) {
        callback(null, body_json['data']);
      }
    } else {
      callback(error, null);
    }
  });
}
module.exports = {
    getApiUsers: getApiUsers,
    getApiUserFromSession: getApiUserFromSession,
}
