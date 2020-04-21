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
function getBoard(session, board_id, callback) {
  console.log("Getting latest board for lti_user_id: "+data.lti_user_id);
  request({
      url: `${scheme}://${host}:${port}/api/board/${board_id}`,
    headers : { "Authorization" : "Bearer " + auth.token },
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
function getLatestBoard(session, data, callback) {
  data = { 
      'task_id': data.taskId,
  };
  data.lti_user_id = getSessionUser(session);
  console.log("Getting latest board for lti_user_id: "+data.lti_user_id);
  request({
      url: `${scheme}://${host}:${port}/api/board/`,
    headers : { "Authorization" : "Bearer " + auth.token },
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
function saveBoard(session, board, data, callback) {
  lti_user_id = getSessionUser(session);
  console.log(Object.keys(board));
  console.log("Saving board for lti_user_id: "+lti_user_id);
  data = { 
      'lti_user_id': lti_user_id, 
      'task_id': data.taskId,
      'id': data.boardId,
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
function createFeedback(session, data, callback) {
  data.lti_user_id = getSessionUser(session);
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
function submit(session, data, callback) {
  data.lti_user_id = getSessionUser(session);
  console.log("Submitting a task response for lti_user_id: "+data.lti_user_id);
  request.post(`${scheme}://${host}:${port}/api/task/${data.task_id}/submissions/`, {
    headers : { "Authorization" : "Bearer " + auth.api_auth_token },
    agent: agent,
    json: data,
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
  });
}
function getSubmissions(callback) {
  request({
      url: `${scheme}://${host}:${port}/api/submissions/`,
    headers : { "Authorization" : "Bearer " + auth.token },
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
      if (!error) {
        console.log("Response status code: "+response.statusCode);
        //console.log(body);
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
    headers : { "Authorization" : "Bearer " + auth.token },
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
    headers : { "Authorization" : "Bearer " + auth.token },
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
    updateAssignments: updateAssignments,
    createFeedback: createFeedback,
    getFeedback: getFeedback,
}
