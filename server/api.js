var request = require('request').defaults({ rejectUnauthorized: false }) // TODO: remove option
//const { createProxyMiddleware } = require('http-proxy-middleware');
var rooms = require('./rooms');
var fs = require('fs');

var auth = require('./auth');
var settings = require('./settings');
var scheme = settings.api_scheme;
var port = settings.api_port;
var host = settings.api_host;
if (scheme === 'https') {
    var http = require('https');
} else {
    var http = require('http');
}
const agent = new http.Agent({  
    rejectUnauthorized: false
});
//var proxy = httpProxy.createProxyServer({'target': `${scheme}://${host}:${port}`});

/*
const proxy_filter = function (path, req) {
  return path.match('^/upload') && (req.method === 'POST') && (req.body.action === 'setBoardBackground');
};
*/
/*
const proxy_filter = function (path, req) {
  return path.match('^/upload') && (req.method === 'POST');
};

const proxy_options = {
  target: scheme+"://"+host+":"+port,
  pathRewrite: {
    '^/upload': '/api/boards/', // Host path & target path conversion
  },
  onError(err, req, res) {
    res.writeHead(500, {
      'Content-Type': 'text/plain',
    });
    res.end('Something went wrong. And we are reporting a custom error message.' + err);
  },
  onProxyReq(proxyReq, req, res) {
    console.log("Proxying request");
    if (req.method == 'POST' && req.body) {
      // Add req.body logic here if needed....

      var boardId = req.body.boardId;
      console.dir(req.body);
      console.dir(req.files);
      console.log(req.method);
      var task_id = req.body.task_id;

      // Remove body-parser body object from the request
      if (req.body) delete req.body;

      // Make any needed POST parameter changes
      let body = new Object();

      //console.log("Getting roomId from request object: "+req.roomId);
      shapeStorage = rooms.getBoardStorage(req.roomId, boardId);
      data_json = JSON.stringify(shapeStorage);
      console.log(data_json);
      body.data_json = data_json;
       
//      proxyReq.socket.pause();
//      rooms.getRoomAssignment(req.session.passport.user).then(function(roomId) {
//        console.log("Got roomId: "+roomId);
//        console.log("Setting body data to shapeStorage for roomId "+roomId+" and boardId "+boardId);
//        shapeStorage = rooms.getBoardStorage(roomId, boardId);
//        console.log(shapeStorage);
//        data_json = JSON.stringify(shapeStorage);
//        console.log(data_json);
//        body.data_json = data_json;
//        console.log(body.data_json);
//        proxyReq.socket.resume();
//      }).catch((err) => {
//        console.error(err);
//        res.sendStatus(500);
//      });
      body.boardId = boardId;
      if (typeof task_id !== 'undefined') {
          body.task_id = task_id;
      }
      body.lti_user_id = req.session.passport.user;
      console.log("Set lti_user_id on body to "+body.lti_user_id);

      // URI encode JSON object
      body = Object.keys(body)
        .map(function (key) {
          return encodeURIComponent(key) + '=' + encodeURIComponent(body[key]);
        })
        .join('&');

      // Update header
      proxyReq.setHeader("Authorization", "Bearer " + auth.api_auth_token );
      //proxyReq.setHeader('content-type', 'multipart/form-data');
      proxyReq.setHeader('content-length', body.length);

      // Write out body changes to the proxyReq stream
      proxyReq.write(body);
      proxyReq.end();
    }
  },
};
const uploadProxy = createProxyMiddleware(proxy_filter, proxy_options);
*/

function getSessionUser(session) {
    return(session.passport.user);
}
/*
function uploadHandler(req, res) {
    var url =`${scheme}://${host}:${port}/api/upload`;
    console.log("Handling file upload by proxying the request to "+url);
    proxy.web(req, res, { target: url, ignorePath: true }, function(e) { console.log("Received error while proxying."); console.log(e); })
}
*/

async function uploadHandler(creq, cres, next){
    //var user = creq.session.passport.user;
    var user = await getActingSessionUser(creq.session);
    console.log("User "+user+" requested to upload a file");
    creq.files.file;
    var boardId = creq.body.boardId;
    var action = creq.body.action;
    if (action === 'setBoardBackground') {
        var FormData = require("form-data");
        var formData = new FormData();
        var boardId = creq.body.boardId;
        var lti_user_id = user
        //var shapeStorage = rooms.getBoardStorage(creq.roomId, boardId);
        rooms.getBoardStorage(creq.roomId, boardId).then(function(shapeStorage) {
            var shapeStorage_json = JSON.stringify(shapeStorage);
            console.log("shapeStorage: "+data_json);
            console.log("boardId: "+boardId);
            console.log("lti_user_id: "+lti_user_id);
            console.log("file: "+creq.files.file.tempFilePath);
            /*
            formData.append('lti_user_id', lti_user_id);
            formData.append('boardId', boardId);
            if (typeof creq.body.task_id !== 'undefined') {
                formData.append('task_id', creq.body.task_id);
            }
            formData.append('data_json', data_json);
            console.log(file);
            //formData.append('file', fs.createReadStream(file.tempFilePath), { filename: file.filename, contentType: file.mimetype, knownLength: file.size} );
            var options = { filename: file.name, contentType: file.mimetype, knownLength: file.size}
            console.log(options);
            formData.append('file', fs.createReadStream(file.tempFilePath), options);
            */
            var file = creq.files.file;
            var formData = {
                'lti_user_id': lti_user_id,
                'boardId': boardId,
                'shapeStorage_json': shapeStorage_json,
                'file': fs.createReadStream(file.tempFilePath),
            }
            if (typeof creq.body.task_id !== 'undefined') {
                formData['task_id'] = creq.body.task_id;
            }
    
            //var url =`${scheme}://${host}:${port}/api/upload`;
            var url =`${scheme}://${host}:${port}/api/boards/`;
            request.post(url, { "headers": { "Authorization" : "Bearer " + auth.api_auth_token }, formData: formData}, function(err, res, body){
                cres.send(res);
            });
        });
    }
}

/*
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
*/
async function getActingSessionUser(session) {
    return new Promise( (resolve) => {
        if (typeof session.actingAsUser !== 'undefined') {
            console.log("Session says acting user is "+session.actingAsUser+". Checking if authorized.");
            getApiUser(getSessionUser(session), function(error, api_user) {
                if (!error) {
                    if(api_user.role === 'teacher') {
                        resolve(session.actingAsUser);
                    } else {
                        resolve(((session || {}).passport || {}).user);
                    }
                } else {
                    resolve(null);
                }
            });
        } else {
          console.log(((session || {}).passport || {}));
          resolve(((session || {}).passport || {}).user);
        }
    });
}
async function getBoards(callback) {
  console.log("Getting all boards from API");
  request({
      url: `${scheme}://${host}:${port}/api/boards`,
    headers : { "Authorization" : "Bearer " + auth.api_auth_token },
  },
    function(error, response, body) {
    if (!error && response.statusCode == 200) {
      //console.log(body);
      boards = JSON.parse(body)
      callback(null, boards);
    } else {
      console.log("Error getting board: "+error);
      callback(error, null);
    }
  });
}
async function getBoard(session, boardId, callback) {
  var lti_user_id = await getActingSessionUser(session);
  console.log("Getting board with id "+boardId+" for user "+lti_user_id);
  request({
      url: `${scheme}://${host}:${port}/api/user/${lti_user_id}/board/${boardId}`,
    headers : { "Authorization" : "Bearer " + auth.api_auth_token },
      //json: data, //FIXME: this looks undefined
  },
    function(error, response, body) {
    if (!error && response.statusCode == 200) {
      console.log(body);
      callback(null, body);
    } else {
      console.log("Error getting board: "+error);
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
async function saveBoard(session, data, backgroundImage, callback) {
  lti_user_id = await getActingSessionUser(session);
  console.log(Object.keys(data.shapeStorage));
  console.log("Saving board for lti_user_id: "+lti_user_id);
  shapeStorage_json = JSON.stringify(data.shapeStorage);
  console.log("shapeStorage is "+shapeStorage_json.length+" bytes");
  data = { 
      'lti_user_id': lti_user_id, 
      'task_id': data.taskId,
      'boardId': data.boardId,
      'background_image': backgroundImage,
      'shapeStorage_json': shapeStorage_json,
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
      //console.log(response)
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
        callback(response.statusCode,null);
      } else {
        console.log("Error getting API user");
        console.log(error);
        callback(error, null);
      }
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
async function getTaskBoardsFromSource(session, sources, callback) {
  var lti_user_id = await getActingSessionUser(session);
  request({
    url: `${scheme}://${host}:${port}/api/tasks/source/boards/`,
    headers : { "Authorization" : "Bearer " + auth.api_auth_token },
    agent: agent,
    useQuerystring: true,
    qs: {
        'source': sources,
        'lti_user_id': lti_user_id,
    },
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
    getApiUser: getApiUser,
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
    getTaskBoardsFromSource: getTaskBoardsFromSource,
    saveBoard: saveBoard,
    getLatestBoard: getLatestBoard,
    getTaskBoard: getTaskBoard,
    updateAssignments: updateAssignments,
    createFeedback: createFeedback,
    getFeedback: getFeedback,
    getBoard: getBoard,
    getBoards: getBoards,
    //actAsUser: actAsUser,
    uploadHandler: uploadHandler,
//    uploadProxy: uploadProxy,
}
