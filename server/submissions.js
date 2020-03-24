var utils = require('./utils/util');
var client = require('./db/config');
var _ = require('underscore');

var submissions = {};

var submissionsManager = {

  getSubmissions: function () {
    return submissions;
  },
  
  getSubmission: function (submissionId) {
    return submissions[submissionId];
  },

  createSubmission: function (shape, socket) {
    //console.log(socket);
    console.log(submissions);
    console.log(socket.room);
    console.log(shape.socketId);
    console.log(shape.myid);
    //it seems that the client was setting the socketId of the shape
    //submissions[socket.room][shape.socketId][shape.myid] = shape;
    //here the line has been modified to use the id of the current socket.
    submissions[socket.room][socket.id][shape.myid] = shape;
  },


}

module.exports = submissionsManager;
