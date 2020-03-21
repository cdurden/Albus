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
var CustomStrategy = require('passport-custom')
var router = express.Router();
var lti = require('ims-lti')
//var angularConfig = require('angularjs-config');
//var config = require('./config.json');
//angularConfig.initialize(app, config);


var passport = require('passport');
var session = require('express-session');

/*
var LTIStrategy = require('passport-lti');
var strategy = new LTIStrategy({
    consumerKey: 'consumer_secret',
    consumerSecret: 'make-algebra-logical-again',
    // pass the req object to callback
    //passReqToCallback: true,
    // https://github.com/omsmith/ims-lti#nonce-stores
    //nonceStore: new RedisNonceStore('testconsumerkey', redisClient)
}, function(lti, done) {
    // LTI launch parameters
    console.dir(lti);
    // Perform local authentication if necessary
    console.log(user);
    return done(null, user);
});
passport.use(strategy);
*/


app.set('trust proxy', 'loopback');
app.use(compression());
app.use(express.static(__dirname + '/lib'));
app.use(session({
    resave: true,
    saveUninitialized: false,
    secret: "safsfvvfasfasfjhas iuyowery76"
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
passport.serializeUser(function(user, done) {
  console.log('serializing user...');
  console.log(user);
  done(null, user.user_id);
});

passport.deserializeUser(function(user_id, done) {
  done(null, user_id);
});
var entry = require('./routes/entry')
passport.use('lti-strategy', new CustomStrategy(
	function(req, callback) {
		var val = (req.body) ? req.body : req.user
		try{
			var provider = new lti.Provider(val , 'make-algebra-logical-again')
			if(req.user){
				callback(null, val)
			} else {
				provider.valid_request(req, function(err, isValid) {
					if(err){
						console.log("LTI Error", err, isValid);
					}
                    //console.log(val);
					callback(err, val)
				});
			}
		}
		catch(err){
			console.log("Authenication error", err)
			callback(err, null)
		}
	}
));
app.use(passport.initialize());
app.use(passport.session());
app.use(passport.authenticate('lti-strategy', {failureFlash: true}));
app.use('/', entry)

app.post('/', function (req, res) {
  res.send('POST request to the homepage')
})
app.get('/', function (req, res) {
  console.log(req.session.id);
  console.log(req.user);
  res.send('GET request to the homepage')
})
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
