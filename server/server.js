var express = require('express');
var app = express();
var http = require('http');
var https = require('https');
var bodyParser = require('body-parser');
var util = require('./utils/util');
var rooms = require('./rooms');
var client = require('./db/config');
var fs = require('fs');
var compression = require('compression');
//var angularConfig = require('angularjs-config');
//var config = require('./config.json');
//angularConfig.initialize(app, config);


var passport = require('passport');
var session = require('express-session');

var LTIStrategy = require('passport-lti');
var strategy = new LTIStrategy({
    consumerKey: 'testconsumerkey',
    consumerSecret: 'make-algebra-logical-again'
    // pass the req object to callback
    // passReqToCallback: true,
    // https://github.com/omsmith/ims-lti#nonce-stores
    // nonceStore: new RedisNonceStore('testconsumerkey', redisClient)
}, function(lti, done) {
    // LTI launch parameters
    console.dir(lti);
    // Perform local authentication if necessary
    console.log(user);
    return done(null, user);
});
passport.use(strategy);


app.get('/', (req, res) => res.send('Hello World!'))
app.set('trust proxy', 'loopback');
app.use(compression());
app.use(express.static(__dirname + '/lib'));
app.use(session({ secret: "safasfasfjhas iuyowery76"}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  done(err, {id: id});
  /*
  User.findById(id, function(err, user) {
    done(err, user);
  });
  */
});
app.use(passport.authenticate(strategy));
app.use(express.static(__dirname + '/../client'));

var port = process.env.PORT || '3000';
app.set('port', port);


/*
var server = http.createServer(app);
*/
var server = https.createServer({
  key: fs.readFileSync('./server/privkey.pem'),
  cert: fs.readFileSync('./server/fullchain.pem')
},app)
var io = require('./sockets')(server);


//app.get('/:id', passport.authenticate(strategy), function (req, res) {
app.get('/:id', function (req, res) {
  console.log(req.user);
  res.sendfile('./client/index.html');
});

app.get('/:id/screenShot', function (req, res) {
  webshot('localhost:3000/' + req.params.id, req.params.id + '.png', function(err) {
    res.sendfile(req.params.id + '.png');
  });
})

var start = function () {
  server.listen(port);
};

var end = function () {
  server.close();
};

start();

exports.start = start;
exports.end = end;
exports.app = app;
