var express = require('express');
const fileUpload = require('express-fileupload');
var path = require('path');
var app = express();
var http = require('http');
var api = require('./api');
var upload = require('./upload');
//var https = require('https');
//var httpProxy = require( 'http-proxy' );
var proxy = require( 'express-http-proxy' );
var bodyParser = require('body-parser');
var util = require('./utils/util');
var rooms = require('./rooms');
var client = require('./db/config');
var fs = require('fs');
var compression = require('compression');
var CustomStrategy = require('passport-custom');
var lti = require('@dinoboff/ims-lti');
var auth = require('./auth');
var passport = require('passport');
var expressSession = require('express-session');
var redisStore = require('connect-redis')(expressSession);
const settings = require('./settings');

/* ======= variable declaration ============= */
var router = express.Router();
var port = 3000;
session = expressSession({
    store: new redisStore({ client: client }),
    resave: false,
    saveUninitialized: true,
    secret: auth.session_secret,
});

/* ======= app configuration ================ */
app.enable('trust proxy')

/* ======= passport configuration ================ */
passport.serializeUser(function(user, done) {
  console.log('serializing user...');
  console.log(user.user_id);
  done(null, user.user_id);
});
passport.deserializeUser(function(user_id, done) {
  console.log("deserializing user");
  console.log(user_id);
  user = {'user_id': user_id}
  done(null, user);
});
passport.use('lti-strategy', new CustomStrategy(
	function(req, callback) {
        console.log("Hostname");
        console.log("Hostname: "+req.headers.host);
        console.log("IP of client: "+req.ip);
        console.log("IPs from proxy: "+req.ips);
        var forwardedIpsStr = req.header('x-forwarded-for');
        console.log("X-Forwarded-For: "+forwardedIpsStr);
        if (req.headers.host === 'localhost' || req.headers.host.match("^localhost:[0-9]+")) {
            console.log("spoofing lti-strategy");
            callback(null, {user_id: "86258941::65ea761411d6325962ddba010329193a"});
        } else {
            console.log("using lti-strategy");
    		var val = (req.body) ? req.body : req.user
            console.log(val);
    		try {
                var provider = new lti.Provider(auth.consumer_key, auth.consumer_secret, {trustProxy: true})
    			if(req.user){
    				callback(null, val)
    			} else {
    				provider.valid_request(req, function(err, isValid) {
    					if(err){
    						console.log("LTI Error", err, isValid);
    					}
    					callback(err, val)
    				});
    			}
    		}
    		catch(err){
    			console.log("Authentication error", err)
    			callback(err, null)
    		}
        }
	}
));

/* ======= middleware configuration ========= */
app.use(session);

/*
passport.use('lti-spoof-strategy', new CustomStrategy(
	function(req, callback) {
        console.log("spoofing lti-strategy");
        callback(null, {user_id: "86258941::65ea761411d6325962ddba010329193a"});
	}
));
*/
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(passport.initialize());
app.use(passport.session());

app.post('/lti/', function(req, res, next) {
  console.log("POST to /lti/");
  console.log(req.headers)
  next();
}, passport.authenticate('lti-strategy', {failureFlash: true}),  function (req, res) {
  console.log("lti route used");
  console.log(req.session);
  res.redirect('/');
});

app.use(express.static(__dirname + '/lib'));
app.use('/lib/', express.static(__dirname + '/../node_modules'));
app.use(passport.authenticate('lti-strategy', {failureFlash: true}),  function (req, res, next) {
    console.log("Passed lti-strategy middleware");
    console.log(req.session);
    next();
});
app.use('/schoology_data/', express.static(settings.schoology_data_dir));
app.use(express.static(__dirname + '/../client'));
app.use('/data/', express.static(__dirname + '/../data'));
app.use('/admin/', express.static(__dirname + '/../admin'));

app.use(compression());

app.use('/upload', function(req, res, next) {
    console.log("Trying to get roomId and store it in the request object...");
    rooms.getRoomAssignment(req.session.passport.user).then(function(roomId) {
        console.log("Setting roomId to request object: "+roomId);
        req.roomId = roomId
        next();
    });
});
app.use(fileUpload({
        preserveExtension: true,
        useTempFiles : true,
        tempFileDir : '/tmp/'
}));
app.use('/upload', upload.uploadHandler);
//app.use('/upload', uploadHandler);
//app.use('/upload', api.uploadProxy);
app.get('/', function (req, res) {
  console.log("responding to GET request at /");
  console.log(req.user);
  res.sendFile(path.resolve(__dirname+'/../client/index.html'));
});


// ======================== main routes ===============================//
//app.get('/:id', passport.authenticate(strategy), function (req, res) {
app.get('/:resource', function (req, res) {
  console.log(req.user);
  res.sendFile(path.resolve(__dirname+'/../client/index.html'));
});
app.get('/:resource/:id', function (req, res) {
  console.log(req.user);
  res.sendFile(path.resolve(__dirname+'/../client/index.html'));
});
/*

app.get('/:id/screenShot', function (req, res) {
    //filename = sanitize(UNSAFE_USER_INPUT);
    const tmp = require('tmp');
    const tmpobj = tmp.fileSync({postfix: '.png' });
    console.log('File: ', tmpobj.name);
    */
/*
    var page = require('webpage').create();
    page.open('localhost' + req.params.id, function(status) {
        var title = page.evaluate(function() {
          return document.title;
        });
        console.log('Page title is ' + title);
        phantom.exit();
    });
})
*/
/*
    webshot('localhost/' + req.params.id, tmpobj.name, function(err) {
        console.log(err);
        res.sendFile(tmpobj.name);
    //res.sendFile(tmpobj.name, { root: __dirname });
  });
*/

/* ======== server setup ===================== */
var server = http.createServer(app);
var io = require('./sockets')(server, session);

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
