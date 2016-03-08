/*!
 * ood-webadmin
 * Copyright(c) 2016 Anatol Sommer <anatol@anatol.at>
 * MIT Licensed
 */

'use strict';

var crypto=require('crypto'), bodyParser=require('body-parser'),
  express=require('express'), session=require('express-session'),
  session=require('express-session'), stylus=require('stylus');
  //RedisStore=require('connect-redis')(session);

exports.init=function(app, log, api, config) {

  app.set('view engine', 'jade');
  app.set('views', __dirname+'/../views');
  app.locals.compileDebug=false;

  /*app.use('/.oodmin', stylus.middleware({
    src:__dirname+'/../',
    dest:__dirname+'/../static'
  }));*/

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({extended:true}));

  app.use(session({
    name:'sid',
    secret:api.secret,
    //store:new RedisStore({}),
    resave:false,
    saveUninitialized:true
  }));

  app.use(function(req, res, next) {
    res.locals.csrf=req.session.csrf=req.session.csrf || random();
    res.locals.user=req.session.user;
    next();
  });

  app.post('*', function csrfProtection(req, res, next) {
    var csrf=req.session.csrf;
    if (req.headers['x-csrf']!==csrf && req.body.csrf!==csrf) {
      resError(res, 'Invalid csrf token!');
    } else {
      next();
    }
  });

  app.get('/.oodmin', function(req, res) {
    res.render('page/start');
  });

  app.get('/.oodmin/status', function(req, res) {
    res.render('page/status');
  });

  app.get('/.oodmin/app/:app', function(req, res) {
    res.render('page/app', {appName:req.params.app});
  });

  app.post('/.oodmin', function(req, res) {
    api.config.get('token', function(err, token) {
      if (err || !token) {
        throw new Error('API request failed');
      }
      if (req.body.pass==='token') {
        req.session.user='me';
        res.redirect('/.oodmin');
      } else {
        res.status(403);
        res.render('app', {loginMsg:'Password invalid!'});
      }
    });
  });

  app.use('/.oodmin/api', require('./api').init(log, api, config));

  app.use('/.oodmin', express.static(__dirname+'/../static'));

  app.use(function errorHandler(err, req, res, next) {
    log.error('Error in route', {url:req.originalUrl, stack:err.stack});
    if (res.headersSent) {
      return next(err);
    }
    res.status(500);
    resError(res, 'Server error');
  });

  app.use(function notFound(req, res) {
    res.status(404);
    resError(res, 'Not found');
  });

};


function random() {
  return crypto.randomBytes(32).toString('base64').replace(/=/g, '');
}

function resError(res, msg) {
  res.format({
    json:function() {
      res.json({error:msg});
    },
    html:function() {
      res.render('error', {text:msg});
    },
    default:function() {
      res.send(msg);
    }
  });
}
