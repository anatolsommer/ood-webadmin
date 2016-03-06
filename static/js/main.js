jQuery(function($) {
  var $status=$('#status');

  $.ajaxSetup({
    headers:{'x-csrf':$('html').attr('csrf')}
  });

  function api(cmd, params, cb) {
    if (!cb) {
      cb=params;
      params=null;
    }
    $.post('/.oodmin/api/'+cmd, params)
      .success(function(res) {
        if (res.error) {
          alert(res.error);
        } else {
          cb(res);
        }
      })
      .error(function() {
        alert('ooops');
      });
  }

  api.logout=function() {
    api('logout', function() {
      location.href='/.oodmin';
    });
    return false;
  };

  if ($status.length) {
    api('status', function(res) {
      var trs=[];
      Object.keys(res.status).forEach(function(appName) {
        var app=res.status[appName];
        trs.push($('<tr>').append([
          $('<td>').prop('rowspan', app.workers.length+1).text(appName),
          $('<td>').text('Master'),
          $('<td>').text(app.master.state),
          $('<td class="r">').text(uptimeHuman(app.master.startTime)),
          $('<td class="r hidden-xs">').text(formatCPU(app.master.usage.cpu)),
          $('<td class="r hidden-xs">').text(formatRAM(app.master.usage.ram))
        ]));
        app.workers.forEach(function(worker) {
          trs.push($('<tr>').append([
            $('<td>').text('Worker #'+worker.workerId),
            $('<td>').text(worker.state),
            $('<td class="r">').text(uptimeHuman(worker.startTime)),
            $('<td class="r hidden-xs">').text(formatCPU(worker.usage.cpu)),
            $('<td class="r hidden-xs">').text(formatRAM(worker.usage.ram))
          ]));
        });
      });
      $status.empty().append(trs);
    });
  }

  $('nav .logout').click(api.logout);

  function uptimeHuman(time) {
    var ms=Date.now()-time, s=Math.floor(ms/1000), m, h, d;
    m=Math.floor(s/60);
    s=s % 60;
    h=Math.floor(m/60);
    m=m % 60;
    d=Math.floor(h/24);
    h=h % 24;
    s=s<10 ? '0'+s : s;
    m=m<10 ? '0'+m : m;
    h=h<10 ? '0'+h : h;
    return d+'d '+h+':'+m+':'+s;
  }

  function formatCPU(p) {
    return (p===null || p===-1) ? 'N/A'.grey : p.toFixed(1)+'%';
  }

  function formatRAM(b) {
    return (b===null || b===-1) ? 'N/A'.grey : (b/1048576).toFixed(2)+' MB';
  }

});
