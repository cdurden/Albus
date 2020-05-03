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
                          url: `${scheme}://${host}:${port}${base_uri}/tasks/${collection}.json`,
                      }, function(error, response, body) {
                          if(!error && response.statusCode == 200) {
                              data = JSON.parse(body);
                          } else {
                              data = {};
                          }
                          obj = {};
                          obj['collection'] = collection;
                          obj['data'] = data;
                          resolve(obj); // don't parse JSON
                      });
                  }));
              }
          }
          Promise.all(promises).then(function(collectionObjs) {
              console.log(collectionObjs);
              var collectionObjsHash = collectionObjs.reduce(function(out, obj) { out[obj.collection] = obj.data; return out; }, {});
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
