var request = require('request').defaults({ rejectUnauthorized: false }) // TODO: remove option
//var https = require('https');
//var https = require('http');
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

function getAsset(resource_path, type) {
    return new Promise( resolve => {
        request({
            method: 'GET',
            url: `${scheme}://${host}:${port}${path}/${resource_path}`,
        }, function(error, response, body) {
            if(!error && response.statusCode == 200) {
              if (type === 'json') {
                  data = JSON.parse(body);
              }
              if (typeof type === 'undefined') {
                  data = body;
              }
            } else {
              data = null;
            }
            resolve(data);
        });
    });
}
function getAssignmentAsset(assignment) {
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
function getTaskAssets(taskSrcList, asArray) {
    return new Promise( (resolveTaskSrcObjs) => {
          var collections = [];
          var taskAssets = [];
          var promises = [];
          for (taskSrc of taskSrcList) {
              console.log("Getting task from source: "+taskSrc);
              var taskAsset = {'source': taskSrc};
              var [_, collection, task] = taskSrc.split(":");
              taskAsset.source = taskSrc;
              taskAsset.task = task;
              taskAsset.collection = collection;
              taskAssets.push(taskAsset);
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
              for (taskAsset of taskAssets) {
                  console.log(taskAsset);
                  taskAsset.data = collectionObjsHash[taskAsset.collection][taskAsset.task];
              }
              if (asArray) {
                  taskAssetsArray = taskAssets.map(taskAsset => { return taskAsset.data });
                  resolveTaskSrcObjs(taskAssetsArray);
              } else {
                  taskAssetsObject = taskAssets.reduce(function(obj, taskAsset) { obj[taskAsset.source] = taskAsset; return obj; }, {});
                  resolveTaskSrcObjs(taskAssetsObject);
              }
          })
    });
}
module.exports = {
    getAssignmentAsset: getAssignmentAsset,
    getTaskAssets: getTaskAssets,
    getAsset: getAsset,
}
