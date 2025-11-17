'use strict';

// Define the `phonecatApp` module
angular.module('phonecatApp', [
  'ngAnimate',
  'ngRoute',
  'core',
  'phoneDetail',
  'phoneList'
]).run(['$rootScope', '$location', 'cookieBridge', function($rootScope, $location, cookieBridge) {
  var lastRouteFromAngular = null;

  // Set a sample cookie (once) so Angular MFEs can prove sharing works
  if (!cookieBridge.get('mfe-sample')) {
    cookieBridge.set('mfe-sample', 'angularjs-host', { path: '/' });
  }

  console.log('🍪 AngularJS host cookies:', cookieBridge.getAll());

  // Listen for navigation events emitted by the Angular micro-frontend
  window.addEventListener('angular-to-angularjs', function(event) {
    var detail = event.detail || {};
    console.log('Message received from Angular MFE:', detail);
    if (detail.action !== 'navigate' || !detail.route) {
      return;
    }

    var targetUrl = '/eui' + (detail.route.startsWith('/') ? detail.route : '/' + detail.route);

    if (targetUrl === lastRouteFromAngular) {
      return;
    }

    lastRouteFromAngular = targetUrl;

    if ($location.url().indexOf('/eui') !== 0) {
      return;
    }

    $rootScope.$evalAsync(function() {
      $location.url(targetUrl);
    });
  });

  // Send host route changes back to the Angular micro-frontend
  $rootScope.$on('$locationChangeSuccess', function() {
    var currentUrl = $location.url();

    if (currentUrl === lastRouteFromAngular) {
      lastRouteFromAngular = null;
      return;
    }

    if (currentUrl.indexOf('/eui') !== 0) {
      return;
    }

    var internalRoute = currentUrl.replace(/^\/eui/, '') || '/screen/home';
    if (!internalRoute.startsWith('/')) {
      internalRoute = '/' + internalRoute;
    }

    var navigationEvent = new CustomEvent('angularjs-to-angular', {
      detail: {
        action: 'navigate',
        route: internalRoute
      }
    });
    window.dispatchEvent(navigationEvent);
  });
  
  console.log('AngularJS host application initialized with MFE routing bridge');
}]);
