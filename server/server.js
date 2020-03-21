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
//var angularConfig = require('angularjs-config');
//var config = require('./config.json');
//angularConfig.initialize(app, config);


var passport = require('passport');
var session = require('express-session');

var LTIStrategy = require('passport-lti');
var strategy = new LTIStrategy({
    consumerKey: 'testconsumerkey',
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
app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});
/*
router.post('/', function (req, res) {
	req.session.lti_token = req.body;
	if(req.body.custom_class_name && req.body.lis_course_section_sourcedid){
		req.session.lti_token.lis_course_section_sourcedid_original = req.body.lis_course_section_sourcedid
		req.session.lti_token.lis_course_section_sourcedid = req.body.custom_class_name
	}
	if(req.body.custom_section_number){
		req.session.lti_token.lis_course_section_sourcedid = req.session.lti_token.lis_course_section_sourcedid + '-' + req.body.custom_section_number
	}
	const url = 'http://' + process.env.PRESENT_PATH + ':' + process.env.PROXY_PORT

	res.redirect(url);
})
*/
passport.use('lti-strategy', new CustomStrategy(
	function(req, callback) {
		var val = (req.body) ? req.body : req.user
		try{
			var provider = new lti.Provider(val , process.env.LTI_SECRET)
			if(req.user){
				callback(null, val)
			}
			else{
				provider.valid_request(req, function(err, isValid) {
					if(err){
						console.log("LTI Error", err, isValid)
					}
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
app.post('/', function (req, res) {
  res.send('POST request to the homepage')
})
app.get('/', function (req, res) {
  res.send('GET request to the homepage')
})
app.use(passport.authenticate(strategy));
app.post('/', passport.authenticate(strategy, function(err, user, info) {
    console.log(err);
    console.log(user);
    console.log(info);
}), function(req, res) {
    console.log('user:' + req.user);
    console.log('session:' + req.session.id);
    console.dir(req.session);
    res.send('Hello World!');
})
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
