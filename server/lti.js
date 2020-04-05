var express = require('express');
var app = express();
var lti = require('@dinoboff/ims-lti');
//var lti = require('ims-lti');
var http = require('http');
var bodyParser = require('body-parser');
var fs = require('fs');
var compression = require('compression');
var CustomStrategy = require('passport-custom');
var ltiMiddleware = require('express-ims-lti');
var auth = require('./auth');
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
passport.use('lti-strategy', new CustomStrategy(
	function(req, callback) {
        console.log("using lti-strategy");
		var val = (req.body) ? req.body : req.user
        console.log(val);
		try {
			var provider = new lti.Provider auth.consumer_key, auth.consumer_secret, trustProxy: true
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
app.use(session);
app.use(ltiMiddleware({
  consumer_key: auth.consumer_key,       // Required if not using credentials.
  consumer_secret: auth.consumer_secret, // Required if not using credentials.
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(passport.session());

app.use(express.static(__dirname + '/lib'));
app.use(express.static(__dirname + '/../client'));
app.use('/data/', express.static(__dirname + '/../data'));
app.use('/admin/', express.static(__dirname + '/../admin'));

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

app.get('/test', function (req, res) {
  console.log(req.session);
  console.log(req.session.id);
  console.log(req.user);
  res.send('GET request to the homepage')
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
