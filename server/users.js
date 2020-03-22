var utils = require('./utils/util');
var client = require('./db/config');
var server = require('./server');
var request = require('request');
var _ = require('underscore');

var users = {};

var usersManager = {

  getUsers: function () {
    users = request({hostname: "https://localhost:444/api/users", json: true}, function(err, res, body) {}); 
    return users;
  },
  
  getUser: function (userId) {
    return users[userId];
  },

}

module.exports = usersManager;
