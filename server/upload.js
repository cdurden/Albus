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
