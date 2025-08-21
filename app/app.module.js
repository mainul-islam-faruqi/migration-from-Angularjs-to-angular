'use strict';

// Define the `phonecatApp` module
angular.module('phonecatApp', [
  'ngAnimate',
  'ngRoute',
  'core',
  'phoneDetail',
  'phoneList'
]).run(function($rootScope, $location) {
  // Listen for messages from Angular micro-frontend
  window.addEventListener('angular-to-angularjs', function(event) {
    console.log('Message received from Angular MFE:', event.detail);
    
    if (event.detail.action === 'navigate' && event.detail.route) {
      // Handle navigation from Angular component
      $location.url(event.detail.route.replace('#!', ''));
      $rootScope.$apply();
    } else {
      alert('AngularJS received: ' + event.detail.message);
      $rootScope.$apply(); // Trigger digest cycle if needed
    }
  });
  
  console.log('AngularJS host application initialized with MFE support');
});
