var request = require('request').defaults({ rejectUnauthorized: false }) // TODO: remove option
//var https = require('https');
var https = require('http');
const agent = new https.Agent({  
    rejectUnauthorized: false
});
//var auth = require('./auth');
var host = "localhost";
var base_uri = "/static/teaching_assets/";
/*
var scheme = "https";
var port = 444;
*/
var scheme = "http";
var port = 80;
function getAssignmentObject(assignment) {
    return new Promise( resolve => {
        request({
            method: 'GET',
            url: `${scheme}://${host}:${port}${base_uri}/assignments/${assignment}.json`,
        }, function(error, response, body) {
            console.log("assignment data");
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
          for (taskSrc in taskSrcList) {
              var taskObj = {'src': taskSrc};
              var [_, collection, task] = taskSrc.split(":");
              taskObj.src = taskSrc;
              taskObj.task = task;
              taskObj.collection = collection;
              taskObjs.push(taskObj);
              if (!collections.includes(collection)) {
                  collections.push(collection);
                  promises.push(new Promise((resolve) => {
                      request({
                          method: 'GET',
                          url: `${scheme}://${host}:${port}${base_uri}/tasks/${collection}.json`,
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
              for (taskObj in taskObjs) {
                  taskObj.data = collectionObjs[taskObj.collection][taskObj.task];
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
