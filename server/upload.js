var fs = require('fs');
var path = require('path');
//moves the $file to $dir2
var moveFile = (file, dir2)=>{
  //include the fs, path modules

  //gets file name and adds it to dir2
  var f = path.basename(file);
  var dest = path.resolve(dir2, f);

  fs.rename(file, dest, (err)=>{
    if(err) throw err;
    else console.log('Successfully moved');
  });
};
function privatePath(filename) {
    return
}

function uploadHandler(req, res) {
    /*
    proxy.web(req, res, { target: 'http://mytarget.com:8080' });
    */
    var user = req.session.passport.user;
    console.log("User "+user+" requested to upload a file");
    console.log(req.files.file); // the uploaded file object
    console.log("formData");
    console.log(req.body);
    var boardId = req.body.boardId;
    var action = req.body.action;
    var filename;
    if (action === 'setBoardBackground') {
        if (req.files.file.mimetype === 'image/png') {
            filename = req.files.file.md5+".png";
            moveFile(req.files.file.tempFilePath, privatePath(filename)) 
        }
        rooms.getRoomAssignment(user).then(function(roomId) {
            shapeStorage = rooms.getBoardStorage(roomId, boardId);
            api.saveBoard(req.session, shapeStorage, { boardId: boardId }, filename, function(err, data) {
                if (!err) {
                    res.sendStatus(200);
                } else {
                    res.sendStatus(500);
                }
            });
        });
    }
}

module.exports = {
    uploadHandler: uploadHandler
}
async function uploadHandler(creq, cres, next){
    //var user = creq.session.passport.user;
    var user = await api.getActingSessionUser(creq.session);
    console.log("User "+user+" requested to upload a file");
    creq.files.file;
    var boardId = creq.body.boardId;
    var action = creq.body.action;
    console.log(creq.body);
    if (action === 'submit') {
        //var FormData = require("form-data");
        //var formData = new FormData();
        var boardId = creq.body.boardId;
        var lti_user_id = user
        //var shapeStorage = rooms.getBoardStorage(creq.roomId, boardId);
        rooms.getBoard(creq.roomId, boardId).then(function(board) {
            var shapeStorage_json = JSON.stringify(board.shapeStorage);
            console.log("shapeStorage: "+shapeStorage_json);
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
            //var file = creq.files.file;
            var file = creq.files.file.tempFilePath;
            var task_id;
            var taskSource = ((board || {}).task || {}).source;
            if (typeof creq.body.task_id !== 'undefined') {
                task_id = creq.body.task_id;
            }
            //api.uploadBoard(lti_user_id, boardId, taskSource, task_id, shapeStorage_json, file).then(function(res) {
            api.uploadBoard(lti_user_id, boardId, taskSource, task_id, shapeStorage_json, file).then(function(res) {
                cres.send(res);
            });
            /*
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
            */
        });
    }
}
module.exports = {
    uploadHandler: uploadHandler
}
