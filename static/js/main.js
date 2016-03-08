(function($) {
  var ood=angular.module('ood', []), csrf=$('html').attr('csrf'), scaleOptions;

  scaleOptions=new Array(33).join().replace(/./g, function(m, i) {
    return '<option value="'+(i+1)+'">'+(i+1)+'</option>';
  });

  $(document).on('focus', 'select.scale', function() {
    if (this.childNodes.length===1) {
      $(this).append(scaleOptions);
    }
  });

  ood.factory('api', function($http) {
    return function api(cmd, params, cb) {
      if (typeof params==='function') {
        cb=params;
        params=null;
      }
      $http({
        method:'POST',
        url:'/.oodmin/api/'+cmd,
        data:params,
        headers:{'x-csrf':csrf}
      }).then(function(res) {
        if (res.data.error) {
          alert(res.data.error);
        } else if (typeof cb==='function') {
          cb(res.data);
        }
      }, function(res) {
        location.reload();
      });
    }
  });

  ood.controller('MenuCtrl', function($scope, api) {
    $scope.logout=function() {
      api('logout', function() {
        location.href='/.oodmin';
      });
      return false;
    };
  });

  ood.controller('StatusCtrl', function($scope, $timeout, api) {
    $scope.status={};
    $scope.uptime=uptimeHuman;

    $scope.restart=function(appName) {
      api('restart', {app:appName});
    };

    $scope.scale=function(appName, app) {
      api('scale', {app:appName, instances:app.scale});
      app.scale='';
    };

    (function refresh() {
      api('status', function(data) {
        $scope.status=data.status;
        $timeout(refresh, 3000);
      });
    })();
  });

  ood.filter('cpu', function() {
    return function(p) {
      return (p===null || p===-1) ? 'N/A' : p.toFixed(1)+'%';
    };
  });

  ood.filter('ram', function() {
    return function(b) {
      return (b===null || b===-1) ? 'N/A' : (b/1048576).toFixed(2)+' MB';
    };
  });

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

})(jQuery);
