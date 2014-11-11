var saldosApp = angular.module('saldosApp', ['ngRoute','saldosController']);

saldosApp.config(['$routeProvider', '$controllerProvider', '$locationProvider',
  function($routeProvider, $controllerProvider, $locationProvider) {
    $routeProvider.
      when('/inicio', {
        templateUrl: 'partials/inicio.html',
        controller: 'mainController as main'
      }).
      when('/olvido', {
        templateUrl: 'partials/olvido-clave.html'
      }).
      when('/corriente', {
        templateUrl: 'partials/corriente.html',
        controller: 'mainController as main'
      }).
      when('/tarjeta', {
        templateUrl: 'partials/tarjeta.html',
        controller: 'mainController as main'
      }).
      when('/document', {
        templateUrl: 'partials/documento.html',
        controller: 'mainController as main'
      }).
      when('/config', {
        templateUrl: 'partials/configuracion.html',
        controller: 'mainController as main'
      }).
      otherwise({
        templateUrl: 'templates/acceso.html'
      });

      $locationProvider.html5Mode(true);


  }]);
