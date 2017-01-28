(function () {


    'use strict';

    /**
     * Word of advice. This was coded by a backend monkey who didn't do frontend for the past 15 years and played with
     * Angular only for a while. The monkey went through a period of sickness after this week, but now looks like he is
     * fully recovered. Despite everything the application works.
     *
     * @TODO: Refactor and data validation.
     *
     * PRs are more than welcome.
     */


    angular
        .module('KrakenDesigner', ['ngRoute'])
        .config(config);

    config.$inject = ['$interpolateProvider', '$routeProvider'];


    function config($interpolateProvider, $routeProvider) {

        // Go templates also use {{ vars }} and there are shared templates, let's use {% vars %} in Angular.
        $interpolateProvider.startSymbol('{%');
        $interpolateProvider.endSymbol('%}');

        // Known Routes:
        $routeProvider
            .when('/', {
                templateUrl: '/designer/dashboard.html',
                controller: 'KrakenDesignerController'
            })
            .when('/service', {
                templateUrl: '/designer/form_service_configuration.html',
                controller: 'KrakenDesignerController'
            })
            .when('/endpoints', {
                templateUrl: '/designer/form_endpoints.html',
                controller: 'KrakenDesignerController'
            })
            .when('/oauth', {
                templateUrl: '/designer/form_oauth.html',
                controller: 'KrakenDesignerController'
            })
            .when('/security', {
                templateUrl: '/designer/form_security.html',
                controller: 'KrakenDesignerController'
            })
            .otherwise({
                redirectTo: '/'
            });

    }
})();