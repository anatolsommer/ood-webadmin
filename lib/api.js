/*!
 * ood-webadmin
 * Copyright(c) 2016 Anatol Sommer <anatol@anatol.at>
 * MIT Licensed
 */

'use strict';

var express=require('express');

exports.init=function(log, api, config) {
  var route=express.Router();

  route.get('/init', function(req, res) {
    res.json({loggedIn:!!req.session.user, csrf:req.session.csrf});
  });

  route.post('*', function(req, res, next) {
    if (!req.session.user) {
      res.json({error:'Session invalid'});
    } else {
      next();
    }
  });

  route.post('/logout', function(req, res) {
    req.session.user=null;
    res.end();
  });

  route.post('/status', function(req, res) {
    api.status(function(err, status) {
      if (err) {
        return res.json({error:err.message || err});
      }
      res.json({status:status});
    });
  });

  route.post('/scale', function(req, res) {
    api.scale(req.body.app, req.body.instances, function(err, status) {
      if (err) {
        return res.json({error:err.message || err});
      }
      res.json({status:status});
    });
  });

  route.post('/restart', function(req, res) {
    api.restart(req.body.app, function(err, status) {
      if (err) {
        return res.json({error:err.message || err});
      }
      res.json({status:status});
    });
  });

  route.post('/config', function(req, res) {
    api('config', req.body, function(err, data) {
      if (err) {
        return res.json({error:err.message || err});
      }
      res.json(data);
    });
  });

  return route;
};
