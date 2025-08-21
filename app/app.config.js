'use strict';

angular.
  module('phonecatApp').
  config(['$routeProvider',
    function config($routeProvider) {
      $routeProvider.
        when('/phones', {
          template: '<phone-list></phone-list>'
        }).
        when('/phones/:phoneId', {
          template: '<phone-detail></phone-detail>'
        }).
        when('/angular-page', {
          template: ''
        }).
        when('/angular-phone-list', {
          template: ''
        }).
        when('/angular-phone-detail/:phoneId', {
          template: ''
        }).
        otherwise('/phones');
    }
  ]);
