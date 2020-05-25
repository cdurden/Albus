var socketio = require('socket.io');
var rooms = require('./rooms');
var api = require('./api');
var util = require('./utils/util');
var assets = require('./assets');
var fs = require('fs');
var users = require('./users');
var client = require('./db/config');
var request = require('request');
var _ = require('underscore');
var auth = require('./auth');
var async = require('async');
var sanitize = require('sanitize-filename');
const schoology = require('./schoology');
const settings = require('./settings');
const screenshot = require('./screenshot');
const { promisify } = require("util");
function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
var PDFImage = require("pdf-image").PDFImage;
module.exports = function(server, session) {

  var room = {};
  //var board = {};

  var io = socketio.listen(server);
  var sharedsession = require("express-socket.io-session");
  io.of('/client').use(sharedsession(session, {
      autoSave:true
  }));
  io.of('/admin').use(sharedsession(session, {
      autoSave:true
  }));
  checkAuthentication = function(socket, next) {
      console.log("Got packet on socket (Socket derived from request UUID: "+socket.handshake.session.req.id+")");
      //console.log(socket.handshake.session);
      if ('passport' in socket.handshake.session && 'user' in socket.handshake.session.passport) { 
          next();
      } else {
          console.log("Socket not authenticated (Socket derived from request UUID: "+socket.handshake.session.req.id+")");
          next(new Error('Socket not authenticated'));
      }
  }
  io.of('/admin').use(checkAuthentication, function(socket, next) {
      api.getApiUser(socket.handshake.session.passport.user, function(err, api_user) {
          if (api_user.role !== 'teacher') {
              var error = new Error('user '+socket.handshake.session.passport.user.lti_user_id+' does not have admin role');
              next(error);
          } else {
              next();
          }
      });
  });
  io.of('/client').use(checkAuthentication);

  // IMPORTANT: this must be called as soom as the connection is established to that information about the user can be used to control the socket
  function setSocketUserId(socketId, userId) {
      return new Promise((resolve) => {
          client.hmset(socketId, ['userId', userId], function(err, result) {
              resolve(result);
          });
      });
  }
  function getSocketData(socketId) {
    return new Promise((resolve) => client.hgetall(socketId, function(err, result) {
      if (result === null) {
        console.log("WARNING: The following socket id was not found in Redis store: "+socketId);
        // FIXME: Is this where we want to do this?
        /*
        rooms.assignRoomToSocketId(socketId).then(function(roomId) {
          console.log(socketId);
          result['socketId'] = socketId;
          resolve(result);
        });
        */
      } else {
        //console.log(socketId);
        result['socketId'] = socketId;
        resolve(result);
      }
    })); 
  }
  function getAllClientData(callback) {
    io.of('/client').clients((error, clients) => {
      console.log("Here are our clients:");
      console.log(clients);
      if (error) throw error;
      Promise.all(clients.map(function(clientId) {
        return getSocketData(clientId);
      })).then(function(results) {
        //console.log(results);
        result = results.reduce((map, obj) => (map[obj['socketId']] = obj, map), {});
        //console.log(result);
        callback(result);
      });
    });
  }
  function saveBoardToApi(socket, data, saveAs) {
    if (typeof saveAs === 'undefined') {
        saveAs = data.boardId;
    }
    return new Promise(resolve => {
      //shapeStorage = rooms.getBoardStorage(rooms.getRoomId(socket), data.boardId);
      //rooms.getBoardStorage(rooms.getRoomId(socket), data.boardId).then(function(shapeStorage) {
      console.log("Getting board for saveBoardToApi handler (socketId: "+socket.id+", roomId: "+rooms.getRoomId(socket)+", boardId: "+data.boardId+")");
      rooms.getBoard(rooms.getRoomId(socket), data.boardId).then(function(board) {
          //console.log("Getting shapeStorage for saveBoardToApi handler (socketId: "+socket.id+", roomId: "+rooms.getRoomId(socket)+", boardId: "+data.boardId+")");
          if (!board) {
              board = data;
              //board = { 'boardId': data.boardId, 'task': data.task };
          }
          //console.log(board);
          console.log("Background image:"+board.background_image);
          //console.log(shapeStorage);
          board.boardId = saveAs;
          //.shapeStorage = shapeStorage;
          api.saveBoard(socket.handshake.session, board, function(err, data) {
              console.log("Board saved");
              //console.log(data);
              resolve(data);
          });
      });
    });
  }
  function actAsUser(socket, lti_user_id) {
      return new Promise( (resolve) => {
          var session;
          if (typeof lti_user_id === 'undefined') {
              resolve(false);
              return;
          }
          session = socket.handshake.session;
          api.getApiUser(session.passport.user, function(error, api_user) {
              if(api_user.role === 'teacher') {
                  session.actingAsUser = lti_user_id
                  session.save();
                  client.hmset(socket.id, ['actingAsUser', lti_user_id], function(err, result) {
                      if (result) {
                          resolve(true);
                      }
                  });
              } else {
                  resolve(false);
              }
          });
      });
  }
  function getSubmissionsReceived(socket, state) {
      api.getSubmissionsReceived(state, function(error, submissions) {
        console.log("Got "+submissions.length+" submissions received.");
        if (submissions) {
        //var tasks = Array.from(new Set(submissions.map(submission => { return submission.task })))
        var taskSources = Array.from(new Set(submissions.map(submission => { return submission.task.source })))
        var taskAssetsPromise = assets.getTaskAssets(taskSources, false);
          Promise.all(submissions.map((submission, i) => {
              return new Promise(resolve => {
                  rooms.loadBoard(socket.room, submission.board, function() {
                     resolve(submission.board);
                  });
              });
          })).then(function(boards) {
              socket.emit('submissionsReceived', submissions);
              taskAssetsPromise.then(function(taskAssets) {
                  console.log("Emitting tasks from getSubmissionsReceived");
                  socket.emit('tasks', taskAssets);
              });
          });
            /*
          Promise.all(submissions.map((submission, i) => {
              return new Promise(resolve => {
                  var board = submission.board;
                  if (board === null) {
                      console.log("ERROR: board is null");
                      console.log(submission)
                  }
                  //board.i = i;
                  board.submission_id = submission.id
                  console.log(board);
                  //board.task = submission.task; //FIXME: I'm not sure why this is not already returned by the api
                  //board.id = board.boardId;
                  rooms.loadBoard(socket.room, board, function() {
                     resolve(board);
                  });
              });
          })).then(function(boards) {
              console.log("Got boards from submissions");
              console.log(boards.length);
              console.log("emitting boards to socket "+socket.id);
              socket.emit('boards', boards);
              taskAssetsPromise.then(function(taskAssets) {
                  console.log("Emitting tasks from getSubmissionsReceived");
                  socket.emit('tasks', taskAssets);
              });
          });
*/
        }
      });
  }
  function getFeedbackReceived(socket, board_ids) {
      api.getFeedbackReceived(socket.handshake.session, board_ids, function(err, feedbackList) {
          if (feedbackList === null) {
              console.log(err);
          } else {
              console.log("Got "+feedbackList.length+" feedback items.");
              //console.log(feedbackList);
              if (feedbackList) {
                  socket.emit('feedbackList', feedbackList);
              }
          }
      });
  }
  function getRoomBoards(socket) {
    console.log("Getting free (room) boards");
    new Promise(resolve => {
        roomBoardsObject = rooms.getBoards(rooms.getRoomId(socket)) || {};
        roomBoards = Object.values(roomBoardsObject);
        resolve(roomBoards);
    }).then(function(roomBoards) {
        socket.emit('freeBoards', roomBoards );
        /*
        taskAssetsPromise.then(function(taskAssets) {
            console.log("Emitting tasks from getAssignmentBoards");
            socket.emit('tasks', taskAssets);
        });
        */
    });
  }
  function getAssignmentBoards(socket, assignment) {
    console.log("Loading boards for assignment "+assignment);
    var assignmentPromise;
    if (assignment) {
        assignmentPromise = new Promise(resolve => { resolve({ 'assignment': assignment }) });
    } else {
        assignmentPromise = getSocketData(socket.id);
    }
    assignmentPromise.then(function(data) {
        assets.getAssignmentAsset(data.assignment).then(function(assignmentAsset) {
            var taskAssetsPromise = assets.getTaskAssets(assignmentAsset, false);
            //api.getTaskBoardsFromSource(socket.handshake.session, assignmentData, function(error, tasks) {
            api.getTasksFromSources(assignmentAsset, function(error, tasks) {//new
                console.log("Got tasks");
                //console.log(tasks);
                Promise.all(assignmentAsset.map((taskSource, i) => {
                    //Promise.all(tasks.map((task, i) => {
                    return new Promise(resolve => {
                        var task = tasks[i];
                        if (task) { //FIXME: correctly test whether this task was received
                            api.getLatestBoard(socket.handshake.session, task.id, function(err, board) { //new
                                if (typeof (board || {}).id !== 'undefined') {
                                    console.log("Received a board from the api");
                                    board.taskSource = taskSource;
                                    board.task = task; 
                                    //rooms.getBoardStorage(rooms.getRoomId(socket), board.boardId).then(function(roomStorage) {
                                    rooms.getBoard(rooms.getRoomId(socket), board.boardId).then(function(roomBoard) {
                                        //if (typeof roomBoard !== 'undefined') {
                                        if (roomBoard) {
                                            board.roomShapeStorage = roomBoard.shapeStorage;// TODO: If there is already a board with this id loaded in the room, ask the user whether to load it as a new board or use the version from the room
                                            board.apiShapeStorage = board.shapeStorage;//FIXME: remove this to decrease data transfer
                                            // load the board from the room instead of the api. FIXME: should check which is newer
                                            board.shapeStorage = roomBoard.shapeStorage;
                                        }
                                        rooms.loadBoard(socket.room, board, function() {
                                            resolve(board);
                                        });
                                    });
                                } else { // board was not received from the API
                                    console.log("Getting or creating task board in node process");
                                    rooms.getOrCreateTaskBoard(socket, task, function(err, board) { // FIXME: the return values of rooms methods suffer from a lack of parallelism
                                        //board.task_id = task.id;
                                        //board.task = task; //FIXME: maybe this should be moved into the getOrCreateTaskBoard method
                                        resolve(board);
                                    });
                                }
                            });
                        } else { //task was not received from API
                            rooms.getOrCreateTaskBoard(socket, {'source': taskSource }, function(err, board) { // FIXME: the return values of rooms methods suffer from a lack of parallelism
                                resolve(board);
                            });
                        }
                    });
                })).then(function(boards) { // we are going to add boards that have already been created in the room
                    getRoomBoards();
                    /*
                    var freeBoards = [];
                    console.log("Got boards for the assigned tasks. Adding boards that have been created in the room.");
                    //console.log(boards);
                    new Promise(resolve => {
                        roomBoards = rooms.getBoards(rooms.getRoomId(socket)) || {};
                        resolve(roomBoards);
                    }).then(function(roomBoards) {
                        var ids = boards.map(board => { return board.boardId });
                        console.log("Got boards that have been created in this room");
                        //console.log(roomBoards);
                        //for (let [boardId, boardStorage] of Object.entries(roomBoards)) {
                        for (let [boardId, board] of Object.entries(roomBoards)) { // this changed now that boards are stored with metadata
                            if (!ids.includes(boardId)) {
                                freeBoards.push(board)
                            }
                        }
                        console.log("Emitting boards to socket "+socket.id);
                        //console.log(boards);
                        socket.emit('assignmentBoards', { 'assignment': assignment, 'boards': boards } );
                        socket.emit('freeBoards', freeBoards );
                        taskAssetsPromise.then(function(taskAssets) {
                            console.log("Emitting tasks from getAssignmentBoards");
                            socket.emit('tasks', taskAssets);
                        });
                    });
                    */
                });
                //}
            });
        });  
    });
  }
  function registerCommonListeners(socket) {
    socket.on('getAssignedTask', function(){
      client.get('task', function(err, result) {
        //console.log(result);
        try {
          data = JSON.parse(result);
          socket.emit('task', data);
        } catch {
          return;
        }
      });
    });
    socket.on('getUser', function () {
      if (typeof socket.handshake.session === 'undefined') {
        return;
      }
      var user = socket.handshake.session.passport.user;
      api.getApiUser(user, function(error, data) {
        socket.emit('user', data);
      });
    });
    socket.on('getActingUser', function () {
      if (typeof socket.handshake.session === 'undefined') {
        return;
      }
      api.getActingApiUserFromSession(socket.handshake.session, function(error, data) {
          socket.emit('actingAsUser', data);
      });
    });
    socket.on('getUsers', function() {
      console.log("Getting api users");
      api.getApiUsers(function(err,results) { 
          users_dict = results.reduce(function(p, user) { p[user.id] = user; return p; }, {});
          socket.emit("users", users_dict)
      });
    });
    socket.on('getAssignedTasks', function(){
      getSocketData(socket.id).then(function(data) {
          var assignment = data.assignment;
          console.log("Getting assignment "+assignment+" for socket "+socket.id);
          request({
              method: 'GET',
              url: 'https://dev.algebra742.org:444/static/teaching_assets/assignments/'+assignment+'.json',
              transformResponse: [function (data) {
                return data;
              }]
          }, function(error, response, body) {
            console.log("Got assignment data");
            //console.log(body);
            data = JSON.parse(body)
            api.getTasksFromSources(data, function(error, data) {
                //console.log(data);
                console.log("Emitting tasks from getAssignedTasks");
                socket.emit('tasks', data);
            });
          })  
      });
      /*
      client.hget(socket.id, 'tasks', function(err, result) {
        try {
          data = JSON.parse(result);
          socket.emit('tasks', data);
        } catch {
          return;
        }
      });
      */
    });
    socket.emit("goAhead");
  }


  io.of('/admin').on('connection', function(socket) {
    console.log("Admin connected on socket "+socket.id);
    registerCommonListeners(socket);
    socket.on('disconnect', function(){ });
    socket.on('getAllClientData', function() {
      console.log("Getting socket data");
      getAllClientData(function(results) { socket.emit("allClientData", results) });
    });
    socket.on('assignRooms', function(assignments){
      console.log("assigning sockets to rooms");
      for (socketId in assignments) {
        rooms.assignRoomToSocket(io.of("/client").connected[socketId], assignments[socketId]['roomId']);
        io.of("/client").connected[socketId].emit("room", assignments[socketId]['roomId']); //FIXME: handle exceptions
          /*
        getSocketData(socketId).then(function(data) {
            var socketId = data.socketId;
            var assignment = data.assignment;
            console.log("Getting assignment "+assignment+" for socket "+socket.id);
            request({
                method: 'GET',
                url: 'https://dev.algebra742.org:444/static/teaching_assets/assignments/'+assignment+'.json',
                transformResponse: [function (data) {
                  return data;
                }]
            }, function(error, response, body) {
              console.log("assignment data");
              console.log(body);
              try {
                data = JSON.parse(body);
              } catch (e) {
                data = [];
              }
              api.getTasksFromSource(data, function(error, data) {
                  console.log(data);
                  if (typeof io.of("/client").connected[socketId] !== 'undefined') {
                    loadBoards(io.of("/client").connected[socketId]); //FIXME: just inform the client of the update, and handle loading the boards on the client side
                  }
              });
            })  
        });
        */
      }
    });
    socket.on('gradeSubmission', function(data){
      api.gradeSubmission(data.submission_id, data.grade, function(error, result) {
        io.of('/admin').emit('submissionGraded', result);
      });
    });
    socket.on('updateAssignments', function(data) {
      console.log("Assigning assignments to users");
      assignments = Object.entries(data).reduce(function(p,ua) { p[ua[0]] = ua[1].assignment; return p;}, {});
      //console.log(assignments);
      //assignments = data.map(function(user) { return({ user.id: user.assignmentId}); });
      api.updateAssignments(assignments, function(err, results) { return; });
        /*
      client.hmset('assignments', assignments, function(err, result) {
        socket.emit('assignedAssignments', assignments);
      });
      */
    });
    socket.on('getTaskFromSource', function(source){
      if (source.length > 1) {
          source = source.pop();
      }
      api.getTaskFromSource(source, function(error, data) {
        socket.emit('task', data);
      });
    });
    socket.on('getTasks', function(collections){
        if (typeof collections === 'undefined') {
            collections = ['tasks'];
        }
        assets.getTaskAssets(collections).then(function(taskAssets) {
            console.log("Emitting tasks from getTasks");
            socket.emit('tasks', taskAssets);
        });
        /*
      api.getTasksDataFromCollection('tasks', function(error, data) {
        socket.emit('tasks', data);
      });
      */
    });
    socket.on('getTasksFromSources', function(taskSrcList){
        api.getTasksFromSources(taskSrcList, function(error, data) {
            var tasks_json = JSON.stringify(data);
            client.hmset(socketId, ['tasks', tasks_json], function(err, result) {
                client.hget(socketId, 'tasks', function(err, result) {
                    try {
                      data = JSON.parse(result);
                      console.log("Emitting tasks from getTasksFromSources");
                      socket.emit('tasks', data);
                    } catch {
                      return;
                    }
                });
            });
        });
    });
    socket.on('getSections', function(course_id){
        console.log("Getting sections");
        api.getSections(course_id, function(err, sections) {
            sections.forEach(section => {section.selected = true });
            socket.emit('sections', sections);
        });
    });
    socket.on('clearSchoologySubmissionsMetadata', async function() {
        client.hdel(socket.id, 'schoologySubmissionsMetadata', function(err, res) {
            socket.emit('clearSchoologySubmissionsMetadataSuccess', true);
        });
    });
    socket.on('sendFeedbackAsSchoologyMessage', async function(data) {
        var feedback = data.feedback;
        console.log("Sending message with feedback "+feedback.id+" to "+feedback.recipient.firstname+" "+feedback.recipient.lastname)
        var mid;
        if (data.useExistingThread) {
            mid = feedback.recipient.schoology_message_thread_id;
        }
        if (data.confirmation_code === 'send' && settings.enable_schoology_interface && (data.createNewThread || data.useExistingThread)) {
            var subject = feedback.data.subject;
            var message = feedback.data.message;
            var file_attachments = feedback.data.file_attachments || [];
            var attachments = feedback.data.attachments || [];
            var uid = feedback.recipient.lti_user_id.split("::")[0];
            var screenshotPath = await screenshot.takeScreenshot(feedback.id);
            if (!(file_attachments.includes(screenshotPath))) {
                file_attachments.push(screenshotPath);
            }
            console.log("uid: "+uid);
            console.log("mid: "+mid);
            console.log(subject);
            console.log(message);
            console.log(file_attachments);
            if (file_attachments.length) {
                var message = await schoology.uploadFilesAndSendWithMessage(file_attachments, [uid], subject, message, attachments, mid)
                console.log("Setting feedback "+feedback.id+" message id to "+message.id);
                await new Promise(resolve => {
                    api.setSchoologyFeedbackMessageThread(feedback.id, message.id, function(err, res) {
                        console.log(res) 
                        feedback = res;
                        resolve(res);
                    });
                });
            } else {
                await schoology.sendSchoologyMessage([uid], subject, message, attachments, undefined, mid).then(function(data) {
                    api.setSchoologyFeedbackMessageThread(feedback.id, data.id, function(err, res) {
                        console.log(res) 
                        feedback = res;
                    });
                });
            }
        }
    });
    socket.on('importSchoologySubmissions', async function(data) {
        var box_id = data.box_id;
        var taskPagesObject = data.taskPagesObject;
        var grade_item_id = data.grade_item_id;
        var schoologySubmissionsMetadata = data.schoologySubmissionsMetadata;
        var users = await new Promise(resolve => { api.getApiUsers(function(err, users) { resolve(users) }); })
      //  console.log(users);
        var usersObject = {};
        for (user of users) {
            usersObject[user.lti_user_id.split("::")[0]] = user;
        }
        /*
        client.hget(socket.handshake.session.passport.user, 'schoologySubmissionsMetadata', async function(err, res){
            schoologySubmissionsMetadata = JSON.parse(res);
        */
//            var schoologySubmissionsMetadata = JSON.parse(fs.readFileSync(settings.schoology_data_dir+"/"+'submissionsMetadata.json')) || {};
            for (submissionMetadata of schoologySubmissionsMetadata[grade_item_id]) {
                if (!(submissionMetadata.selected)) {
                    continue;
                }
                var pdffile = sanitize(submissionMetadata.uid+"-"+submissionMetadata.grade_item_id+"-"+submissionMetadata.filename);
                var pdfpath = settings.schoology_data_dir+"/"+pdffile
                for (let [taskSource, slide] of Object.entries(taskPagesObject)) {
                    console.log("Generating image for task "+taskSource+" on slide "+slide);
                    var boardId = util.generateRandomId(7);
                    var pdfImage = new PDFImage(pdfpath,{
                      convertOptions: {
                        "-resize": "1000x1000",
                        //"-quality": "75"
                      }
                    });
                    await pdfImage.convertPage(slide).then(async function (imagePath) {
                      console.log("Uploading image to API");
                      console.log(imagePath);
                      //var file = fs.createReadStream(imagePath);
                      await new Promise(resolve => {
                        console.log(submissionMetadata);
                        var lti_user_id = usersObject[submissionMetadata.uid].lti_user_id;
                        //console.log(lti_user_id);
                        api.uploadBoard(lti_user_id, boardId, taskSource, undefined, "{}", imagePath).then(function(board) {
                            //console.log(board);
                            var session = { passport: { user: lti_user_id } };
                            //console.log(session);
                            var board = board;
                            //console.log(board);
                            var submission = {
                                box_id: box_id,
                                board_id: board.id,
                                //task_id: board.task_id,
                                task: board.task || { 'source': taskSource, 'id': board.task_id },
                                user_id: lti_user_id,
                            }
                            console.log("Submitting board");
                            api.submit(session, submission, function(submission) {
                                console.log(submission);
                                resolve(submission);
                            });
                        });
                      });
                    });
                }
                submissionMetadata.selected = false;
            }
            fs.writeFileSync(settings.schoology_data_dir+"/"+'submissionsMetadata.json', JSON.stringify(schoologySubmissionsMetadata, null, 4));
        /*
        });
        */
    });
    socket.on('downloadSchoologySubmissions', async function(data) {
        var wait_time_msec;
        var confirmation_code = data.confirmation_code;
        var grade_item_id = data.grade_item_id;
        /*
        client.hget(socket.handshake.session.passport.user, 'schoologySubmissionsMetadata', async function(err, res){
            if (res === null) {
                //schoologySubmissionsMetadata = [];
                schoologySubmissionsMetadata = {};
            } else {
                schoologySubmissionsMetadata = JSON.parse(res);
            }
        */
        if (settings.enable_schoology_interface && confirmation_code === grade_item_id) {
            var schoologySubmissionsMetadata = JSON.parse(fs.readFileSync(settings.schoology_data_dir+"/"+'submissionsMetadata.json')) || {};
            for (submissionMetadata of schoologySubmissionsMetadata[grade_item_id]) {
                var pdfpath = settings.schoology_data_dir+"/"+sanitize(submissionMetadata.uid+"-"+submissionMetadata.grade_item_id+"-"+submissionMetadata.filename);
                var sleepPromise;
                if (!fs.existsSync(pdfpath)) {
                    console.log("Downloading "+pdfpath);
                    await schoology.downloadSubmission(submissionMetadata.download_path).then(function(data) {
                        fs.writeFileSync(pdfpath, data);
                        submissionMetadata.fetched = true;
                        submissionMetadata.selected = true;
                        return;
                    });
                    if (typeof wait_time_msec === 'undefined') {
                        wait_time_msec = 20000;
                    }
                    sleepPromise = sleep(wait_time_msec);
                    await sleepPromise;
                }
            }
            fs.writeFileSync(settings.schoology_data_dir+"/"+'submissionsMetadata.json', JSON.stringify(schoologySubmissionsMetadata, null, 4));
        }
        /*
        });
        */
    });
    socket.on('getSchoologySubmissionsMetadata', async function(data) {
        var grade_item_id = data.grade_item_id;
        var section_ids = data.section_ids;
        var confirmation_code = data.confirmation_code;
        //var schoologySubmissionsMetadata = [];
        //var schoologySubmissionsMetadata = {};
        var schoologySubmissionsMetadata = JSON.parse(fs.readFileSync(settings.schoology_data_dir+"/"+'submissionsMetadata.json')) || {};
        //fs.writeFileSync(settings.schoology_data_dir+"/"+'submissionsMetadata.json', JSON.stringify(schoologySubmissionsMetadata, null, 4));
        /*
        client.hget(socket.handshake.session.passport.user, 'schoologySubmissionsMetadata', async function(err, res){
            //var schoologySubmissionsMetadata = JSON.parse(res);
            if (res === null) {
            //if (false) {
        */
            if (settings.enable_schoology_interface && confirmation_code === grade_item_id) {
                console.log("Updating schoologySubmissionsMetadata on getSchoologySubmissionsMetadata event");
                var users = await new Promise(resolve => { api.getApiUsers(function(err, users) { resolve(users) }); })
              //  console.log(users);
                var usersObject = {};
                for (user of users) {
                    usersObject[user.lti_user_id.split("::")[0]] = user;
                }
                schoologySubmissionsMetadata[grade_item_id] = [];
                for (var section_id of section_ids) {
                    await schoology.getSubmissionsList(section_id,grade_item_id,'?with_attachments=TRUE').then(function(json) {
                        var data = JSON.parse(json);
                        for (let revision_item of data.revision) {
                            file = revision_item.attachments.files.file[0];
                            schoologySubmissionsMetadata[grade_item_id].push({
                                section_id: section_id,
                                grade_item_id: grade_item_id,
                                revision_id: revision_item.revision_id,
                                uid: revision_item.uid,
                                user: usersObject[revision_item.uid],
                                download_path: file.converted_download_path,
                                filename: file.filename,
                                fetched: false,
                                //selected: true,
                            })
                        }
                    });
                    await sleep(10000);
                }
                fs.writeFileSync(settings.schoology_data_dir+"/"+'submissionsMetadata.json', JSON.stringify(schoologySubmissionsMetadata, null, 4));
            //    client.hmset(socket.handshake.session.passport.user, ['schoologySubmissionsMetadata', JSON.stringify(schoologySubmissionsMetadata)], function(err, res) {
//});
            } else {
                console.log("Not updating on getSchoologySubmissionsMetadata event");
            }
            socket.emit("schoologySubmissionsMetadata", schoologySubmissionsMetadata);
/*
        });
            */
    });
    socket.on('getFeedback', function(board_ids){
        console.log("Getting feedback for board_ids"+(board_ids || ["(none specified)"]).join());
        api.getFeedback(board_ids, function(err, feedbackList) {
            console.log("Got "+feedbackList.length+" feedback");
            //console.log(feedbackList);
            socket.emit('feedbackList', feedbackList);
        });
    });
    socket.on('getFeedbackTemplateCollections', function() {
        socket.emit('feedbackTemplateCollections', ['Generic','ScientificNotation','Computation','WorkShown','PythagoreanTheorem','GraphingLinearEquations']);
    });
    socket.on('getFeedbackTemplates', function(collection){
        request({
            method: 'GET',
            url: 'https://dev.algebra742.org:444/static/teaching_assets/feedback/'+collection+'.json',
            transformResponse: [function (data) {
              return data;
            }]
        }, function(error, response, body) {
            if(!error && response.statusCode == 200) {
              data = JSON.parse(body);
            } else {
              data = {};
            }
            socket.emit('feedbackTemplates', data);
        });
    });
    socket.on('getAssignmentTasks', function(assignment){ // FIXME: this should probably return an object that contains the name of the assignment to avoid collisions between different model components on the page
        request({
            method: 'GET',
            url: 'https://dev.algebra742.org:444/static/teaching_assets/assignments/'+assignment+'.json',
            transformResponse: [function (data) {
              return data;
            }]
        }, function(error, response, body) {
            var data;
            console.log("assignment data");
            console.log(body);
            if(!error && response.statusCode == 200) {
              data = JSON.parse(body);
            } else {
              data = [];
            }
            api.getTasksFromSources(data, function(error, tasks) {
                console.log("Emitting tasks from getAssignmentTasks");
                socket.emit('tasks', tasks);
            });
        });
    });
    socket.on('getAssignments', function(){
      assignments = ['ProductRule','QuotientRule','NegativeExponents','CorrectProductRule','CorrectQuotientRule','CorrectNegativeExponents','CorrectExponentRuleMistakesAdvanced','ExponentRulesColorByNumber','EquationsOfLinesReview','DividingNumbersInScientificNotation']
      socket.emit('assignments', assignments);
/*
      client.hmget(socket, assignmentIds, function(err, results) {
        var assignments = {};
        assignmentIds.forEach((id, i) => { assignments[id] = results[i]; });
        socket.emit('assignments', assignments);
      });
*/
/*
      client.hgetall('assignments', function(err, results) {
        socket.emit('assignments', results);
      }
*/
    });
    socket.on('viewTask', function(task_id){
      console.log(task_id);
      tasks_json = fs.readFileSync('./data/tasks.json');
      tasks = JSON.parse(tasks_json);
      task = tasks[task_id];
      socket.emit('showTask', task);
    });
/*    socket.on('assignTask', function(data){
      //console.log(data);
      json = JSON.stringify(data);
      client.set('tasks', json, function(err) {
        //console.log(err);
        client.get('tasks', function(err, result) {
          try {
            data = JSON.parse(result);
            io.of('/client').emit('tasks', data); // TODO: assign to specific socket
          } catch {
            return;
          }
        });
      });
    });
    */
    socket.on('assignTasksToSockets', function(assignments){
        console.log("assigning tasks to sockets");
        //console.log(assignments);
        var assignTasksToSocket = function(socketId) {
            var socket = io.of("/client").connected[socketId];
            api.getTasksFromSources(assignments[socketId], function(error, data) {
                var tasks_json = JSON.stringify(data);
                client.hmset(socketId, ['tasks', tasks_json], function(err, result) {
                    client.hget(socketId, 'tasks', function(err, result) {
                        try {
                          data = JSON.parse(result);
                          console.log("Emitting tasks from assignTasksToSocket");
                          socket.emit('tasks', data);
                        } catch {
                          return;
                        }
                    });
                });
            });
        }
        for (socketId in assignments) {
            assignTasksToSocket(socketId);
        }
    });
      /*
    socket.on('assignTasks', function(data){
      //console.log(data);
      api.getTasksFromSource(data, function(error, data) {
        json = JSON.stringify(data);
        client.set('tasks', json, function(err) {
          //console.log(err);
          client.get('tasks', function(err, result) {
            try {
              data = JSON.parse(result);
              io.of('/client').emit('tasks', data); // TODO: assign to specific socket
            } catch {
              return;
            }
          });
        });
        //socket.emit('task', data);
      });
    });
    */
    socket.on('getSubmissionsReceived', function(state){
        console.log("Getting submissions received.");
        getSubmissionsReceived(socket, state);
    });
      /*
    socket.on('getSubmissions', function(state){
      api.getSubmissions(state, function(error, data) {
        //console.log(data)
        io.of('/admin').emit('submissions', data);
        //socket.emit('confirmSubmission', data);
      });
    });
    */
  });
  io.of('/client').on('connection', function (socket) {
    console.log("Client connected on socket "+socket.id);
    //console.log(socket.handshake.session);
  //if ('passport' in socket.handshake.session && 'user' in socket.handshake.session.passport) {
    socket.on('idRequest', function () {
      console.log("Got socket id request (socket id: "+socket.id+")");
      socket.emit('socketId', {socketId: socket.id});
    });
    socket.on('heartbeat', function () {
    })
    socket.on('disconnect', function () {
      console.log("disconnect from socket "+socket.id);
      getAllClientData(function(results) { io.of('/admin').emit("allClientData", results) });
    });
    if (typeof socket.handshake.session === 'undefined') {
        return;
    }
    var userId = socket.handshake.session.passport.user;
    socketReadyPromise = new Promise(resolve => {
      setSocketUserId(socket.id, userId);
      api.getApiUser(userId, function(error, user) {
        console.log("returning from getting Api user");
        if (user) {
            //console.log("received data:");
            //console.log(user);
            flat_data = Object.entries(user).flat().map(obj => { if (typeof obj === 'string') { return(obj); } else { return(JSON.stringify(obj)); } });
            client.hmset(socket.id, flat_data, function(err, result) {
                var actingAsUser = socket.handshake.session.actingAsUser;
                actAsUser(socket, actingAsUser).then(function(success) {
                    rooms.assignRoomToUser(userId).then(function() {
                        rooms.assignRoomToSocket(socket).then(function(roomId) {
                            var actingAsUser = socket.handshake.session.actingAsUser
                            resolve(user);
                        });
                    });
                });
            });
        }
      });
    }); // end bind listeners

    (function() {
      var $emit = socket.$emit;
      socket.$emit = function() {
        console.log('***','on',Array.prototype.slice.call(arguments));
        socketReadyPromise.then(function() {
          $emit.apply(socket, arguments);
        });
      };
    })();
    setInterval(function() {
      socket.emit('heartbeat');
    }, 5000);

    console.log("Registering socket listeners.");
    registerCommonListeners(socket);
    console.log("Emitting client data to admin");
    getAllClientData(function(results) { io.of('/admin').emit("allClientData", results) });
   
  
    socket.on('submit', function(data){
      //console.log(data);
      saveBoardToApi(socket, data).then(function(board) {
          console.log(board);
          data.board_id = board.id; //FIXME: why is board an array?
          api.submit(socket.handshake.session, data, function(error, data) {
            console.log(data)
            io.of('/admin').emit('submission', data);
            //socket.emit('confirmSubmission', data);
          });
      });
    });
    socket.on('getTask', function(){
      client.get('task', function(err, result) {
        api.getTask(result, function(error, data) {
          socket.emit('task', data);
        });
      });
    });

/*
    socket.on('roomId', function (data) {
      rooms.addMember(socket, data.roomId);
    });
    socket.on('get_assignment', function (data) {
    });
*/

    socket.on('actAsUser', function (data) {
      actAsUser(socket, data.lti_user_id).then(function(success) {
          if (success) {
              console.log("Acting as user");
              console.log(socket.handshake.session.actingAsUser);
              console.log("Reassigning room to socket");
              rooms.assignRoomToSocket(socket);
              api.getActingApiUserFromSession(socket.handshake.session, function(error, data) {
                  console.log("Got acting user data from API");
                  console.log(data);
                  socket.emit('actingAsUser', data);
              });
              //getBoards(socket);
          }
      });
    });
    socket.on('newShape', function (data) {
      //console.log("new shape");
      //console.log(this.room);
      socket.to(this.room).emit('shapeCreated', data);
      //console.log(data);
      rooms.addShape(data, socket);
    });

    socket.on('editShape', function (data) {
      socket.to(this.room).emit('shapeEdited', data);
      if (data.tool.name !== 'text') {
        rooms.editShape(data, socket);
      }
    });

    socket.on('shapeCompleted', function (data) {
      socket.to(this.room).emit('shapeCompleted', {
        socketId: socket.id,
        myid: data.myid,
        tool: data.tool,
        boardId: data.boardId,
      });
      rooms.completeShape(data, socket);
    });

    socket.on('pathCompleted', function (data) {
      socket.to(this.room).emit('shapeCompleted', {
        socketId: socket.id,
        boardId: data.boardId,
        myid: data.myid,
        tool: data.tool
      });
      rooms.completePath(data, socket);
    });

    socket.on('copiedPathCompleted', function (data) {
      socket.to(this.room).emit('copiedPathCompleted', {
        socketId: socket.id,
        myid: data.myid,
        tool: data.tool,
        boardId: data.boardId,
        pathDProps: data.pathDProps
      });
      rooms.completePath(data, socket);
    })

    socket.on('moveShape', function (data) {
      rooms.moveShape(data, socket);
      socket.to(this.room).emit('shapeMoved', data);
    });

    socket.on('finishMovingShape', function (data) {
      rooms.completeShape(data, socket);
      socket.to(this.room).emit('shapeFinishedMoving', data);
    });

    socket.on('deleteShape', function (data) {
      rooms.deleteShape(data, socket);
      socket.to(this.room).emit('shapeDeleted', {myid: data.myid, socketId: data.socketId, boardId: data.boardId});
    });


    socket.on('chat message', function(msg){
      io.of('/client').emit('chat message', msg);
      console.log(msg);
    });
    socket.on('saveBoardToApi', function(data) {
      saveBoardToApi(socket, data.boardId).then(function() {
          socket.emit('saved');
      });
    });
    socket.on('getBoardFromApi', function(boardId) {
      api.getBoard(socket.handshake.session, boardId, function(err, board) {
        if (typeof (board || {}).boardId === 'undefined') {
          console.log("Board not found");
          console.log(board);
          socket.emit('boardNotFound', boardId);
        } else {
          rooms.loadBoard(socket.room, board, function() {
            assets.getTaskAssets([board.task.source]).then(function(taskAssets) {
                console.log("Emitting tasks from loadBoardFromApi");
                socket.emit('tasks', taskAssets);
            });
            console.log("Sending board to client");
            console.log(board);
            socket.emit('boards', [board]);
          });
        }
      });
    });
      /*
    socket.on('getBoardStorage', function(boardId) {
      rooms.getBoardStorage(socket.room, boardId).then(function(boardStorage) {
          socket.emit('boardStorage', {'boardId': boardId, 'shapeStorage': boardStorage});
      });
    });
    */
    socket.on('getRoomBoards', function() {
      getRoomBoards(socket);
    });
    socket.on('getAssignmentBoards', function(assignment) {
      console.log("Got getAssignmentBoards");
      getAssignmentBoards(socket, assignment);
      // get assignment
    });
    socket.on('getSubmissionsReceived', function(state){
        console.log("Getting submissions received.");
        getSubmissionsReceived(socket, state);
    });
    socket.on('getSubmissionBox', function(box_id) {
        console.log("Getting submission box with box_id "+box_id);
        new api.SubmissionBox(socket.handshake.session.passport.user, box_id).get().then(function(submissionBox) {
            socket.emit('submissionBox', submissionBox);
        });
    });
    socket.on('getInboxes', function() {
        console.log("Getting submission boxes");
        new api.SubmissionBoxList(socket.handshake.session.passport.user).get().then(function(inboxes) {
            socket.emit('inboxes', inboxes);
        });
    });
    socket.on('createSubmissionBox', function(label) {
        console.log("Creating submission box with label: "+label);
        new api.SubmissionBoxList(socket.handshake.session.passport.user).post({label: label}).then(function(submissionBox) {
            socket.emit('submissionBoxCreated', submissionBox);
        });
    });
    socket.on('getSubmissions', function(state) {
      //api.getSubmissions(socket.handshake.session, {}, function(err, submissions) {
      getSubmissions(socket, state);
      //});
      // load assignment
    });
    socket.on('getFeedbackReceived', function(board_ids){
        console.log("Loading feedback received for board_ids: "+(board_ids || []).join());
        getFeedbackReceived(socket, board_ids);
    });
    socket.on('getFeedback', function(feedback_id){
        console.log("Loading feedback (feedback_id: "+feedback_id+")");
        api.getFeedbackById(feedback_id, function(err, feedback) {
            console.log("Got feedback item "+feedback_id);
            //console.log(feedback);
            if (feedback) {
                board = feedback.board
                rooms.loadBoard(socket.room, board, function() {
                  //if (typeof (board.task || {}).source  !== 'undefined') {
                      //assets.getTaskAssets([board.task.source]).then(function(taskAssets) {
                      //console.log(board);
                      assets.getTaskAssets([feedback.submission.board.task.source]).then(function(taskAssets) {
                          console.log("Emitting tasks from getFeedback");
                          socket.emit('tasks', taskAssets);
                      });
                  //}
                  console.log("Sending board to client");
                  //console.log(board);
                  socket.emit('boards', [board]);
                });
                socket.emit('feedback', feedback);
            }
        });
    });
      /*
    socket.on('getOrCreateTaskBoard', function(task_id) {
      //api.getTaskBoard(socket.handshake.session, task_id, function(err, board) {
      api.getLatestBoard(socket.handshake.session, task_id, function(err, board) {
        if (board) {
          console.log("Loading task board from API");
          console.log(board);
          rooms.loadBoard(socket.room, board, function() {
            socket.emit('board', board);
          });
        } else {
          console.log("Creating new task board");
          rooms.getOrCreateTaskBoard(socket, { 'id': task_id }, function(error, board) {
            socket.emit('board', board);
          });
        }
      });
    });
    */
    socket.on('editFeedback', function(data){
      newBoardId = util.generateRandomId(6);
      saveBoardToApi(socket, data, saveAs=newBoardId).then(function(board) {
          console.log("Saved board. (board_id: "+board.id+")");
          data.board_id = board.id;
          //data.boardId = newBoardId;
          api.editFeedback(socket.handshake.session, data, function(error, result) {
            //console.log(data)
            socket.emit('feedbackCreated', result);
            //socket.emit('confirmSubmission', data);
          });
      });
    });
    socket.on('createFeedback', function(data){
      //shapeStorage = rooms.getBoardStorage(rooms.getRoomId(socket), data.boardId);
      newBoardId = util.generateRandomId(6);
      saveBoardToApi(socket, data, saveAs=newBoardId).then(function(board) {
          console.log("Saved board. (board_id: "+board.id+")");
          data.board_id = board.id;
          //data.boardId = newBoardId;
          api.createFeedback(socket.handshake.session, data, function(error, result) {
            //console.log(data)
            socket.emit('feedbackCreated', result);
            //socket.emit('confirmSubmission', data);
          });
      });
    });
  });

  return io;

};
