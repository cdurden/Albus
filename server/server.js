var express = require('express');
var path = require('path');
var app = express();
var http = require('http');
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
var sharedsession = require("express-socket.io-session");
var passport = require('passport');
var expressSession = require('express-session');
var redisStore = require('connect-redis')(expressSession);
session = expressSession({
//    cookie: { secure: true },
    store: new redisStore({ client: client }),
    resave: false,
    saveUninitialized: true,
    secret: auth.session_secret,
});
app.use(session);
//var router = express.Router();
//var entry = require('./routes/entry')
var port = 3000;
app.enable('trust proxy')


passport.serializeUser(function(user, done) {
  console.log('serializing user...');
  console.log(user);
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
));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(__dirname + '/lib'));
app.use(express.static(__dirname + '/../client'));
app.use('/data/', express.static(__dirname + '/../data'));
app.use('/admin/', express.static(__dirname + '/../admin'));
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

var server = http.createServer(app);

app.use(compression());

var io = require('./sockets')(server);
io.of('/client').use(sharedsession(session, {
    autoSave:true
}));
io.of('/admin').use(sharedsession(session, { // FIXME: feeding off of the session established by a client
    autoSave:true
}));
io.on('connection', (socket) => {
    socket.use((packet, next) => {
        if ('passport' in socket.handshake.session && 'user' in socket.handshake.session.passport) { 
            next();
        } else {
            next(new Error('Socket not authenticated'));
        }
    });
});

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
app.get('/:id', function (req, res) {
  console.log(req.user);
  res.sendFile(path.resolve(__dirname+'/../client/index.html'));
});

app.get('/:id/screenShot', function (req, res) {
  webshot('localhost:3000/' + req.params.id, req.params.id + '.png', function(err) {
    res.sendFile(req.params.id + '.png', { root: __dirname });
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
