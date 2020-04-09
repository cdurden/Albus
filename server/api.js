var request = require('request').defaults({ rejectUnauthorized: false }) // TODO: remove option
var https = require('https');
const agent = new https.Agent({  
    rejectUnauthorized: false
});
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
    headers : { "Authorization" : "Bearer " + auth.api_auth_token },
    agent: agent,
  },
    function(error, response, body) {
    if (!error && response.statusCode == 200) {
      data = JSON.parse(body)
      callback(null, data);
    } else {
      console.log(error);
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
function getTasks(callback) {
  request({
      url: `${scheme}://${host}:${port}/api/tasks/snow-qm:inequalities:.*/`,
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
function getTask(collection, task, callback) {
  console.log("Getting API user based on lti_user_id: "+lti_user_id);
  request({
    url: `${scheme}://${host}:${port}/api/task/${collection}/${task}`,
    headers : { "Authorization" : "Bearer " + auth.api_auth_token },
    agent: agent,
  },
    function(error, response, body) {
    if (!error && response.statusCode == 200) {
      data = JSON.parse(body)
      callback(null, data);
    } else {
      console.log(error);
      callback(error, null);
    }
  });
}
module.exports = {
    getApiUsers: getApiUsers,
    getApiUserFromSession: getApiUserFromSession,
    getTask: getTask,
    getTasks: getTasks,
}
