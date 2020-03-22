var express = require('express');
var app = express();
var http = require('http');
var https = require('https');
var httpProxy = require( 'http-proxy' );
var bodyParser = require('body-parser');
var util = require('./utils/util');
var rooms = require('./rooms');
var client = require('./db/config');
var fs = require('fs');
var compression = require('compression');
var CustomStrategy = require('passport-custom')
var router = express.Router();
var lti = require('ims-lti')


var passport = require('passport');
var session = require('express-session')({
    resave: false,
    saveUninitialized: true,
    secret: "safsfvvfasfasfjhas iuyowery76",
    cookie: { secure: true }
});
var sharedsession = require("express-socket.io-session");

app.set('trust proxy', 'loopback');
app.use(compression());
app.use(express.static(__dirname + '/lib'));
app.use(session);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
passport.serializeUser(function(user, done) {
  console.log('serializing user...');
  console.log(user);
  console.log(user.user_id);
  done(null, user.user_id);
});

passport.deserializeUser(function(user_id, done) {
  done(null, user_id);
});
var entry = require('./routes/entry')
passport.use('lti-strategy', new CustomStrategy(
	function(req, callback) {
		var val = (req.body) ? req.body : req.user
		try {
			var provider = new lti.Provider(val , 'make-algebra-logical-again')
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
app.use(express.static(__dirname + '/../client'));
app.use('/admin/', express.static(__dirname + '/../admin'));
app.use(passport.initialize());
app.use(passport.session());
//app.use('/', passport.authenticate('lti-strategy', {failureFlash: true}));
//app.use('/', entry)

app.post('/', passport.authenticate('lti-strategy', {failureFlash: true}),  function (req, res) {
  //res.send('POST request to the homepage')
  res.redirect('/test');
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
io.use(sharedsession(session, {
    autoSave:true
}));


var HOST        = 'localhost';
var API_PORT    = process.env.API_PORT || 444;
var SOCKET_PATH = 'ws';
// ==================== PROXY SERVER ==================== //

var proxy = httpProxy.createProxyServer({
	target : `https://${HOST}:${API_PORT}`,
	// ws     : true,
});

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


// proxy non-socket requests
// * not required to proxy the socket.io connection *
app.use( '/api', function ( req, res ) {
  proxy.web( req, res, { target: `https://${HOST}:${API_PORT}` } );
});

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
app.get('/admin', function (req, res) {
  console.log(req.user);
  res.sendfile('./admin/index.html');
});


// ======================== main routes ===============================//
app.get('/test', function (req, res) {
  console.log(req.session.id);
  console.log(req.user);
  res.send('GET request to the homepage')
})
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
