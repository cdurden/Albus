var express = require('express');
var app = express();
var http = require('http');
var https = require('https');
//var httpProxy = require( 'http-proxy' );
var proxy = require( 'express-http-proxy' );
var bodyParser = require('body-parser');
var util = require('./utils/util');
var rooms = require('./rooms');
var client = require('./db/config');
var fs = require('fs');
var compression = require('compression');
var CustomStrategy = require('passport-custom');
var lti = require('ims-lti');
//var lti = require('express-ims-lti');
var auth = require('./auth');
var sharedsession = require("express-socket.io-session");
var passport = require('passport');
var session = require('express-session')({
    resave: false,
    saveUninitialized: true,
    secret: auth.token,
    cookie: { secure: true }
});
//var router = express.Router();
//var entry = require('./routes/entry')
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
var LTIStrategy = require('passport-lti');
var strategy = new LTIStrategy({
    createProvider : function (req, done) {
        // Lookup your LTI customer in your DB with req's params, and get its secret
        // Dummy DB lookup
        DAO.getConsumer(
            req.body.oauth_consumer_key,
            function callback (err, consumer){
                if(err){
                    console.log("lti auth failure");
                    // Standard error, will crash the process
                    return done(err);
                }

                if(consumer.is_authorized){
                    console.log("consumer is authorized");
                    var consumer = new lti.Provider(auth.consumer_key, auth.consumer_secret);
                    return done(null, consumer);
                }
                else {
                    // String error, will fail the strategy (and not crash it)
                    console.log("consumer not authorized");
                    return done("not_authorized");
                }
            }
        );
    }
});
passport.use(strategy);

/*
passport.use('lti-strategy', new CustomStrategy(
	function(req, callback) {
        console.log("using lti-strategy");
		var val = (req.body) ? req.body : req.user
        console.log(val);
		try {
			var provider = new lti.Provider(auth.consumer_key, auth.consumer_secret)
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
*/
app.get(function(req, res, next) {
    console.log(req.user);
    if (type(req.user)  === 'undefined') {
        next();
    } else {
        next("route");
    }
}, passport.authenticate('lti-strategy', {failureFlash: true}));

app.use(session);
app.use('/lti/', function (req, res,next) {
  res.send('passed lti middleware')
  console.log(req.session);
  console.log(req.user);
  next();
})

app.use(function(req,res,next) {
    console.log("new request");
    next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(passport.session());

app.use(express.static(__dirname + '/lib'));
app.use(express.static(__dirname + '/../client'));
app.use('/data/', express.static(__dirname + '/../data'));
app.use('/admin/', express.static(__dirname + '/../admin'));

app.get(function(req, res, next) {
    console.log(req.user);
    if (type(req.user)  === 'undefined') {
        next();
    } else {
        next("route");
    }
}, passport.authenticate('lti-strategy', {failureFlash: true}));

var port = process.env.PORT || '3000';
app.set('port', port);

var server = http.createServer(app);

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

app.use(compression());

var io = require('./sockets')(server);
io.use(sharedsession(session, {
    autoSave:true
}));

/*
app.use('/lti/', function(req,res) {
  console.log("lti route used");
  console.log(req.session);
  //res.send('POST request to the homepage')
  res.redirect('/');
});
*/
app.use(function(req, res, next) {
    console.log("passed authentication middleware");
    next();
});
app.get('/', function (req, res) {
  console.log("responding to GET request at /");
  console.log(req.user);
  res.sendfile('./client/index.html');
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
  res.sendfile('./admin/index.html');
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
app.get('/test', function (req, res) {
  console.log(req.session);
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
