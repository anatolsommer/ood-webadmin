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
      Object.keys(status).forEach(function(appName) {
        var app=status[appName];
        if (!app.master) {
          return;
        }
        app.master.usage.cpu=formatCPU(app.master.usage.cpu);
        app.master.usage.ram=formatRAM(app.master.usage.ram);
        app.workers.forEach(function(worker) {
          worker.usage.cpu=formatCPU(worker.usage.cpu);
          worker.usage.ram=formatRAM(worker.usage.ram);
        });
      });
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

  ['start', 'stop', 'restart'].forEach(function(cmd) {
    route.post('/'+cmd, function(req, res) {
      api[cmd](req.body.app, function(err, status) {
        if (err) {
          return res.json({error:err.message || err});
        }
        res.json({status:status});
      });
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

function formatCPU(p) {
  return (typeof p!=='number' || p===-1) ? 'N/A' : p.toFixed(1);
}

function formatRAM(b) {
  return (typeof b!=='number' || b===-1) ? 'N/A' : (b/1048576).toFixed(2);
}
