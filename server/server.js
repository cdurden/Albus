var express = require('express');
//var webshot = require('webshot');
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
//var lti = require('ims-lti');
var lti = require('@dinoboff/ims-lti');
var auth = require('./auth');
//var sharedsession = require("express-socket.io-session");
var passport = require('passport');
var expressSession = require('express-session');
var redisStore = require('connect-redis')(expressSession);
const settings = require('./settings');
session = expressSession({
//    cookie: { secure: true },
    store: new redisStore({ client: client }),
    resave: false,
    saveUninitialized: true,
    secret: auth.session_secret,
});
app.use(session);
var router = express.Router();
//var entry = require('./routes/entry')
var port = 3000;
app.enable('trust proxy')


passport.serializeUser(function(user, done) {
  console.log('serializing user...');
  //console.log(user);
  console.log(user.user_id);
  done(null, user.user_id);
});
passport.deserializeUser(function(user_id, done) {
  console.log("deserializing user");
  console.log(user_id);
  user = {'user_id': user_id}
  done(null, user);
});
/*
passport.use('lti-spoof-strategy', new CustomStrategy(
	function(req, callback) {
        console.log("spoofing lti-strategy");
        callback(null, {user_id: "86258941::65ea761411d6325962ddba010329193a"});
	}
));
*/
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
  //res.send('POST request to the homepage')
  res.redirect('/');
});
/*
app.use(passport.authenticate('lti-spoof-strategy', {failureFlash: true}),  function (req, res, next) {
    console.log("Passed lti-spoof-strategy middleware");
  console.log(req.session);
    next();
});
*/
app.use(express.static(__dirname + '/lib'));
app.use('/lib/', express.static(__dirname + '/../node_modules'));
app.use(passport.authenticate('lti-strategy', {failureFlash: true}),  function (req, res, next) {
    console.log("Passed lti-spoof-strategy middleware");
    console.log(req.session);
    next();
});
app.use('/schoology_data/', express.static(settings.schoology_data_dir));
app.use(express.static(__dirname + '/../client'));
app.use('/data/', express.static(__dirname + '/../data'));
app.use('/admin/', express.static(__dirname + '/../admin'));

var server = http.createServer(app);

app.use(compression());

var io = require('./sockets')(server, session);
/*
io.use(sharedsession(session, {
    autoSave:true
}));
*/

/*
io.of('/client').use(sharedsession(session, {
    autoSave:true
}));
io.of('/admin').use(sharedsession(session, { // FIXME: feeding off of the session established by a client
    autoSave:true
}));
*/
/*
io.use((socket, next) => {
    console.log("Got packet");
    console.log(socket.handshake.session);
    if ('passport' in socket.handshake.session && 'user' in socket.handshake.session.passport) { 
        next();
    } else {
        next(new Error('Socket not authenticated'));
        //next();
    }
});
io.on('connection', (socket) => {
    console.log("Got connection request");
    console.log(socket.handshake.session);
});
*/

/*
app.use('/lti/', function(req,res) {
  console.log("lti route used");
  console.log(req.session);
  //res.send('POST request to the homepage')
  res.redirect('/');
});
app.use(function(req, res, next) {
    console.log("passed authentication middleware");
    next();
});
*/
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
//app.use('/upload', upload.uploadHandler);
app.use('/upload', uploadHandler);
//app.use('/upload', api.uploadProxy);
app.get('/', function (req, res) {
  console.log("responding to GET request at /");
  console.log(req.user);
  res.sendFile(path.resolve(__dirname+'/../client/index.html'));
});


/*app.post('/', function (req, res) {
  res.send('POST request to the homepage')
})
*/
/*
 * app.post('/', passport.authenticate(strategy, function(err, user, info) {
    console.log(err);
    console.log(user);
    console.log(info);
}), function(req, res) {
    console.log('user:' + req.user);
    console.log('session:' + req.session.id);
    console.dir(req.session);
    res.send('Hello World!');
})
*/

/*
var server = https.createServer({
  key: fs.readFileSync(process.env.PRIVATE_KEY_FILE),
  cert: fs.readFileSync(process.env.PUBLIC_KEY_FILE)
},app)
*/

/*
var HOST        = 'localhost';
//var API_PORT    = process.env.API_PORT || 444;
var API_PORT    = process.env.API_PORT || 8080;
var SOCKET_PATH = 'ws';
*/
// ==================== PROXY SERVER ==================== //

/*
var proxy = httpProxy.createProxyServer({
	target : `https://${HOST}:${API_PORT}`,
	// ws     : true,
});
*/

/*
proxy.on( 'error', function ( err ) {
	// console.error( err.stack );
	debug( 'PROXY ERROR', err );
});

proxy.on( 'proxyReq', function ( proxyReq, req, res ) {
	debug( 'Proxy Request', proxyReq.path );
});

proxy.on( 'proxyReqWs', function ( proxyReqWs, req, res ) {
	debug( 'Proxy *WS* Request', proxyReqWs.path );
});
*/

/*
app.get('/admin', function (req, res) {
  console.log(req.user);
  res.sendFile('./admin/index.html');
});
*/

// proxy non-socket requests
// * not required to proxy the socket.io connection *
/*
app.use(function ( req, res ) {
  proxy.web( req, res, { target: `https://${HOST}:${API_PORT}` } );
});
*/
//app.use(proxy(`http://${HOST}:${API_PORT}`));

// proxy the socket.io polling requests
//app.use( `/${SOCKET_PATH}`, function ( req, res ) {
//	proxy.web( req, res, { target: `https://${HOST}:${API_PORT}/${SOCKET_PATH}` } );
//});

// proxy the socket.io WS requests
//server.on( 'upgrade', function( req, socket, head ) {
////	debug( '⚡️  ---------- SOCKET CONNECTION UPGRADING ---------- ⚡️ ' );
//	proxy.ws( req, socket, head );
//});
// ======================== admin routes =============================//


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
