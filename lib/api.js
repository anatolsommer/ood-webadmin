/*!
 * ood-webadmin
 * Copyright(c) 2016 Anatol Sommer <anatol@anatol.at>
 * MIT Licensed
 */

'use strict';

var express=require('express');

exports.init=function(log, api, config) {
  var route=express.Router();

  route.post('*', function(req, res, next) {
    if (!req.session.user) {
      res.json({error:'Session invalid'});
    } else {
      next();
    }
  });

  route.post('/logout', function(req, res) {
    req.session.user=null;
  });

  route.post('/status', function(req, res) {
    api.status(function(err, status) {
      if (err) {
        res.json({error:err.message || err});
        return;
      }
      res.json({status:status});
    });
  });

  return route;
};
