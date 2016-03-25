(function($) {
  var ood=angular.module('ood', ['ngRoute']), scaleOptions;

  scaleOptions=new Array(33).join().replace(/./g, function(m, i) {
    return '<option value="'+(i+1)+'">'+(i+1)+'</option>';
  });

  $(document).on('focus', 'select.scale', function() {
    if (this.childNodes.length===1) {
      $(this).append(scaleOptions);
    }
  });

  ood.config(function($routeProvider) {
    router($routeProvider)
      .when('/status', {templateUrl:'/.oodmin/view/status'})
      .when('/config', {templateUrl: '/.oodmin/view/config'})
      .when('/app/:appName', {templateUrl:'/.oodmin/view/app'})
      .otherwise({redirectTo:'/status'});
  });

  ood.factory('api', function($http, $route, $rootScope) {
    function api(cmd, params, cb) {
      if (typeof params==='function') {
        cb=params;
        params=null;
      }
      $http({
        method:'POST',
        url:'/.oodmin/api/'+cmd,
        data:params,
        headers:{'x-csrf':$rootScope.csrf}
      }).then(function(res) {
        if (res.data.error) {
          alert(res.data.error);
          $route.reload();
        } else if (typeof cb==='function') {
          cb(res.data);
        }
      }, function(res) {
        alert('error');
        $route.reload();
      });
    }

    api.logout=function() {
      api('logout');
      $route.reload();
    };

    return api;
  });

  ood.controller('AppCtrl', function($scope, api) {
    $scope.logout=api.logout;
  });

  ood.controller('StatusCtrl', function($scope, $routeParams, $timeout, api) {
    var timeout=[];

    $scope.appName=$routeParams.appName;
    $scope.status={};
    $scope.app={};

    $scope.uptime=uptimeHuman;

    ['start', 'stop', 'restart'].forEach(function(cmd) {
      $scope[cmd]=function(appName) {
        if (cmd==='stop' && !confirm('Do you really want to stop this app?')) {
          return;
        }
        api(cmd, {app:appName});
      };
    });

    $scope.scale=function(appName, app) {
      var scale=app.scale, diff=app.workers.length-scale,
        q='Do you really want to kill '+diff+' worker'+(diff>1 ? 's' : '')+'?';
      app.scale='';
      if (diff>0 && !confirm(q)) {
        return;
      }
      api('scale', {app:appName, instances:scale});
    };

    (function refresh() {
      if (!$scope.loggedIn) {
        return;
      }
      api('status', function(data) {
        $scope.status=data.status;
        $scope.app=$scope.status[$scope.appName];
        timeout=[
          $timeout($scope.$apply.bind($scope), 1000),
          $timeout($scope.$apply.bind($scope), 2000),
          $timeout(refresh, 2950)
        ];
      });
    })();

    $scope.$on('$destroy', function(){
      timeout.forEach($timeout.cancel);
    });
  });

  ood.controller('ConfigCtrl', function($scope, $routeParams, $timeout, api) {
    var timeout;

    $scope.config={};

    $scope.refresh=function() {
      api(
        'config',
        {get:$routeParams.appName ? 'app:'+$routeParams.appName : ''},
        function(res) {
          $scope.config=res.value;
        }
      );
    };

    (function refresh() {
      if (!$scope.loggedIn) {
        return;
      }
      $scope.refresh();
      timeout=$timeout(refresh, 5000);
    })();

    $scope.$on('$destroy', function(){
      $timeout.cancel(timeout);
    });
  });

  ood.filter('cpu', function() {
    return function(p) {
      return (typeof p!=='number' || p===-1) ? 'N/A' : p.toFixed(1)+'%';
    };
  });

  ood.filter('ram', function() {
    return function(b) {
      return (typeof b!=='number' || b===-1) ? 'N/A' : (b/1048576).toFixed(2)+' MB';
    };
  });

  ood.filter('teselecta', function($sce) {
    return function(d) {
      return $sce.trustAsHtml(teselecta(d));
    };
  });

  function init($q, $http, $rootScope) {
    var deffered=$q.defer();
    $http.get('/.oodmin/api/init').then(function(res) {
      $rootScope.loggedIn=res.data.loggedIn;
      $rootScope.csrf=res.data.csrf;
      deffered[$rootScope.loggedIn ? 'resolve' : 'reject']();
    });
    return deffered.promise;
  }

  function router($routeProvider) {
    return angular.extend({}, $routeProvider, {
      when: function(path, route) {
        route.resolve=angular.extend({init:init}, route.resolve);
        $routeProvider.when(path, route);
        return this;
      }
    })
  }

  function uptimeHuman(time) {
    var ms=Date.now()-time, s=Math.floor(ms/1000), m, h, d;
    if (isNaN(ms)) {
      return '';
    }
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
