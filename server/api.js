var request = require('request').defaults({ rejectUnauthorized: false }) // TODO: remove option
var https = require('https');
const agent = new https.Agent({  
    rejectUnauthorized: false
});
var auth = require('./auth');
var scheme = "https";
var host = "localhost";
var port = 444;
function getSessionUser(session) {
    return(session.passport.user);
}
//function getActingSessionUser(session) {
//    return(session.actingAsUser);
//}
function actAsUser(session, lti_user_id) {
    return new Promise( (resolve) => {
        getApiUser(getSessionUser(session), function(error, api_user) {
            if(api_user.role === 'teacher') {
                session.actingAsUser = lti_user_id
                session.save();
                resolve(true);
            } else {
                resolve(false);
            }
        });
    });
}
async function getActingSessionUser(session) {
    return new Promise( (resolve) => {
        console.log("Session says acting user is "+session.actingAsUser+". Checking if authorized.");
        if (typeof session.actingAsUser !== 'undefined') {
            getApiUser(getSessionUser(session), function(error, api_user) {
                if(api_user.role === 'teacher') {
                    resolve(session.actingAsUser);
                } else {
                    resolve(((session || {}).passport || {}).user);
                }
            });
        } else {
          console.log(((session || {}).passport || {}));
          resolve(((session || {}).passport || {}).user);
        }
    });
}
function getBoard(boardId, callback) {
  console.log("Getting board with id "+boardId);
  request({
      url: `${scheme}://${host}:${port}/api/board/${boardId}`,
    headers : { "Authorization" : "Bearer " + auth.api_auth_token },
      json: data,
  },
    function(error, response, body) {
    if (!error && response.statusCode == 200) {
      console.log(body);
      callback(null, body);
    } else {
      callback(error, null);
    }
  });
}
function getTaskBoard(session, taskId, callback) {
  console.log("Getting latest board for lti_user_id: "+data.lti_user_id+" and task_id "+taskId);
  request({
      url: `${scheme}://${host}:${port}/api/task/${taskId}/board/`,
    headers : { "Authorization" : "Bearer " + auth.api_auth_token },
  },
    function(error, response, body) {
    if (!error && response.statusCode == 200) {
      console.log(body);
      callback(null, body);
    } else {
      callback(error, null);
    }
  });
}
async function getLatestBoard(session, taskId, callback) {
  console.log("Getting latest board for lti_user_id: "+data.lti_user_id+" and task_id "+taskId);
  data = { 
      'task_id': taskId,
  };
  data.lti_user_id = await getActingSessionUser(session);
  request({
      url: `${scheme}://${host}:${port}/api/board/`,
    headers : { "Authorization" : "Bearer " + auth.api_auth_token },
      json: data,
  },
    function(error, response, body) {
    if (!error && response.statusCode == 200) {
      console.log(body);
      //console.log(typeof(body));
      //data = JSON.parse(body)
      //console.log(data);
      callback(null, body);
    } else {
      callback(error, null);
    }
  });
}
function updateAssignments(assignments, callback) {
  console.log("Updating assignments");
  data = { 
      'assignments': assignments, 
  };
  request.post(`${scheme}://${host}:${port}/api/assignments/`,
    {
      headers : { 
        "Authorization" : "Bearer " + auth.api_auth_token,
      },
      agent: agent,
      json: data,
    },
    function(error, response, body) {
      if (!error && response.statusCode == 201) {
        callback(null, body);
      } else {
        console.log(error);
        callback(error, null);
      }
    }
  );
}
async function saveBoard(session, board, data, callback) {
  lti_user_id = await getActingSessionUser(session);
  console.log(Object.keys(board));
  console.log("Saving board for lti_user_id: "+lti_user_id);
  data = { 
      'lti_user_id': lti_user_id, 
      'task_id': data.taskId,
      'boardId': data.boardId,
      'data': board,
  };
  request.post(`${scheme}://${host}:${port}/api/boards/`,
    {
      headers : { 
        "Authorization" : "Bearer " + auth.api_auth_token,
//        "Content-Type" : "application/json",
      },
      agent: agent,
      json: data,
      /*
    json: true,
    body: { 'lti_user_id': lti_user_id, 
            'task_id': data.taskId,
            'data': board,
    },
    */
    },
    function(error, response, body) {
      //console.log(response)
      if (!error && response.statusCode == 201) {
        //console.log(body)
        //data = JSON.parse(body)
        callback(null, body);
      } else {
        console.log(error);
        callback(error, null);
      }
    }
  );
}
function getFeedback(callback) {
  request.get(`${scheme}://${host}:${port}/api/feedback/`,
    {
      headers : { 
        "Authorization" : "Bearer " + auth.api_auth_token,
      },
      agent: agent,
      json: data,
    },
    function(error, response, body) {
      if (!error && response.statusCode == 201) {
        callback(null, body);
      } else {
        console.log(error);
        callback(error, null);
      }
    }
  );
}
async function createFeedback(session, data, callback) {
  data.lti_user_id = await getActingSessionUser(session);
  request.post(`${scheme}://${host}:${port}/api/feedback/`,
    {
      headers : { 
        "Authorization" : "Bearer " + auth.api_auth_token,
//        "Content-Type" : "application/json",
      },
      agent: agent,
      json: data,
      /*
    json: true,
    body: { 'lti_user_id': lti_user_id, 
            'task_id': data.taskId,
            'data': board,
    },
    */
    },
    function(error, response, body) {
      console.log(response)
      if (!error && response.statusCode == 201) {
        console.log(body)
        //data = JSON.parse(body)
        callback(null, body);
      } else {
        console.log(error);
        callback(error, null);
      }
    }
  );
}
async function submit(session, data, callback) {
  data.task_id = data.taskId;
  data.lti_user_id = await getActingSessionUser(session);
  console.log("Submitting a task response for lti_user_id: "+data.lti_user_id);
  request.post(`${scheme}://${host}:${port}/api/task/${data.task_id}/submissions/`, {
    headers : { "Authorization" : "Bearer " + auth.api_auth_token },
    agent: agent,
    json: data,
  },
  function(error, response, body) {
    //console.log(response)
    if (!error && response.statusCode == 201) {
      //console.log(body)
      //data = JSON.parse(body)
      callback(null, body);
    } else {
      console.log(error);
      callback(error, null);
    }
  });
}
function getSubmissions(callback) {
  request({
      url: `${scheme}://${host}:${port}/api/submissions/`,
    headers : { "Authorization" : "Bearer " + auth.api_auth_token },
  },
    function(error, response, body) {
    if (!error && response.statusCode == 200) {
      data = JSON.parse(body)
      callback(null, data);
    } else {
      callback(error, null);
    }
  });
}
async function getApiUserFromSession(session, callback) {
    return await getApiUser(getSessionUser(session), callback);
}
async function getActingApiUserFromSession(session, callback) {
    return await getApiUser(await getActingSessionUser(session), callback);
}
async function getApiUser(lti_user_id, callback) {
  //var lti_user_id = await getActingSessionUser(session);
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
      if (!error) {
        console.log("Response status code: "+response.statusCode);
      } else {
        console.log("Error getting API user");
        console.log(error);
      }
      callback(error, null);
    }
  });
}
function getApiUsers(callback) {
  request({
    url: `${scheme}://${host}:${port}/api/users/`,
    headers : { "Authorization" : "Bearer " + auth.api_auth_token },
  },
    function(error, response, body) {
    if (!error && response.statusCode == 200) {
      data = JSON.parse(body);
      callback(null, data);
    } else {
      callback(error, null);
    }
  });
}
function getTasksDataFromCollection(collection, callback) {
  request({
      url: `${scheme}://${host}:${port}/api/tasks/data/snow-qm:${collection}:.*/`,
    headers : { "Authorization" : "Bearer " + auth.api_auth_token },
  },
    function(error, response, body) {
    if (!error && response.statusCode == 200) {
      data = JSON.parse(body)
      callback(null, data);
    } else {
      callback(error, null);
    }
  });
}
function getTask(task_id, callback) {
  request({
    url: `${scheme}://${host}:${port}/api/task/${task_id}`,
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
function getTasks(task_ids, callback) {
  if (task_ids) {
      qs = {'task_id': task_ids};
  } else {
      qs = {};
  }
  request({
    url: `${scheme}://${host}:${port}/api/tasks/`,
    headers : { "Authorization" : "Bearer " + auth.api_auth_token },
    agent: agent,
    qs: qs,
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
/*
function getClientTasksFromSource(session, sources, callback) {
  request({
    url: `${scheme}://${host}:${port}/api/tasks/source/`,
    headers : { "Authorization" : "Bearer " + auth.api_auth_token },
    agent: agent,
    useQuerystring: true,
    qs: {'source': sources},
  },
  function(error, response, body) {
    if (!error && response.statusCode == 200) {
      console.log(body);
      data = JSON.parse(body)
      callback(null, data);
    } else {
      console.log(error);
      callback(error, null);
    }
  });
}
*/
function getTasksFromSource(sources, callback) {
  request({
    url: `${scheme}://${host}:${port}/api/tasks/source/`,
    headers : { "Authorization" : "Bearer " + auth.api_auth_token },
    agent: agent,
    useQuerystring: true,
    qs: {'source': sources},
  },
  function(error, response, body) {
    if (!error && response.statusCode == 200) {
      console.log(body);
      data = JSON.parse(body)
      callback(null, data);
    } else {
      console.log(error);
      callback(error, null);
    }
  });
}
function getTaskFromSource(source, callback) {
  request({
    url: `${scheme}://${host}:${port}/api/task/source/${source}/`,
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
    getActingApiUserFromSession: getActingApiUserFromSession,
    getApiUserFromSession: getApiUserFromSession,
    getTask: getTask,
    getTaskFromSource: getTaskFromSource,
    getTasks: getTasks,
    submit: submit,
    getSubmissions: getSubmissions,
    getTasksDataFromCollection: getTasksDataFromCollection,
    getTasksFromSource: getTasksFromSource,
    saveBoard: saveBoard,
    getLatestBoard: getLatestBoard,
    getTaskBoard: getTaskBoard,
    updateAssignments: updateAssignments,
    createFeedback: createFeedback,
    getFeedback: getFeedback,
    getBoard: getBoard,
    actAsUser: actAsUser,
}
