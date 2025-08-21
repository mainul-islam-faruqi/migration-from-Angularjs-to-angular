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
          template: '<div id="angular-mfe-container"></div>'
        }).
        when('/angular-phone-list', {
          template: '<div id="angular-mfe-container"></div>'
        }).
        otherwise('/phones');
    }
  ]);
