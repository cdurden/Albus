var express = require('express');
var app = express();
var https = require('https');
var bodyParser = require('body-parser');
var fs = require('fs');
var CustomStrategy = require('passport-custom');
var lti = require('ims-lti');
var auth = require('./auth');
var passport = require('passport');
var session = require('express-session')({
    resave: false,
    saveUninitialized: true,
    secret: auth.token,
    cookie: { secure: true }
});
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

app.get(function(req, res, next) {
    console.log(req.user);
    if (type(req.user)  === 'undefined') {
        next();
    } else {
        next("route");
    }
}, passport.authenticate('lti-strategy', {failureFlash: true}));

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

app.use(function(req, res, next) {
    console.log("passed authentication middleware");
    next();
});
app.get('/', function (req, res) {
  console.log("responding to GET request at /");
  console.log(req.user);
  res.sendfile('./client/index.html');
});
app.get('/test', function (req, res) {
  console.log(req.session);
  console.log(req.session.id);
  console.log(req.user);
  res.send('GET request to the homepage')
}

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
