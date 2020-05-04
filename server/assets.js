var request = require('request').defaults({ rejectUnauthorized: false }) // TODO: remove option
//var https = require('https');
var https = require('http');
const agent = new https.Agent({  
    rejectUnauthorized: false
});
//var auth = require('./auth');
/*
var scheme = "https";
var port = 444;
*/
var settings = require('./settings');
var scheme = settings.assets_scheme;
var port = settings.assets_port;
var host = settings.assets_host;
var path = settings.assets_path;
if (scheme === 'https') {
    var http = require('https');
} else {
    var http = require('http');
}
const agent = new http.Agent({  
    rejectUnauthorized: false
});

function getAssignmentObject(assignment) {
    return new Promise( resolve => {
        request({
            method: 'GET',
            url: `${scheme}://${host}:${port}${path}/assignments/${assignment}.json`,
        }, function(error, response, body) {
            console.log("Assignment data for assignment "+assignment);
            /*
            console.log(response);
            console.log(error);
            */
            console.log(body);
            if(!error && response.statusCode == 200) {
              data = JSON.parse(body);
            } else {
              data = [];
            }
            resolve(data);
        });
    });
}
function getTaskObjects(taskSrcList, asArray) {
    return new Promise( (resolveTaskSrcObjs) => {
          var collections = [];
          var taskObjs = [];
          var promises = [];
          for (taskSrc of taskSrcList) {
              console.log("Getting task from source: "+taskSrc);
              var taskObj = {'src': taskSrc};
              var [_, collection, task] = taskSrc.split(":");
              taskObj.src = taskSrc;
              taskObj.task = task;
              taskObj.collection = collection;
              taskObjs.push(taskObj);
              if (!collections.includes(collection)) {
                  collections.push(collection);
                  promises.push(new Promise((resolve) => {
                      console.log("Getting task collection "+collection);
                      request({
                          method: 'GET',
                          url: `${scheme}://${host}:${port}${path}/tasks/${collection}.json`,
                      }, function(error, response, body) {
                          if(!error && response.statusCode == 200) {
                              data = JSON.parse(body);
                          } else {
                              data = {};
                          }
                          resolve(data); // don't parse JSON
                      });
                  }));
              }
          }
          Promise.all(promises).then(function(collectionObjs) {
              console.log(collectionObjs);
              var collectionObjsHash = collectionObjs.reduce(function(out, obj, i) { out[collections[i]] = obj; return out; }, {});
              console.log(collectionObjsHash);
              for (taskObj of taskObjs) {
                  console.log(taskObj);
                  taskObj.data = collectionObjsHash[taskObj.collection][taskObj.task];
              }
              if (asArray) {
                  taskSrcObjs = taskObjs.map(taskObj => { return taskObj.data });
              } else {
                  taskSrcObjs = taskObjs.reduce(function(obj, taskObj) { obj[taskObj.src] = taskObj; return obj; }, {});
              }
              resolveTaskSrcObjs(taskSrcObjs);
          })
    });
}
module.exports = {
    getAssignmentObject: getAssignmentObject,
    getTaskObjects: getTaskObjects,
}
