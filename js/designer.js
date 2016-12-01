'use strict';

var KRAKENDESIGNER_VERSION = 1;

/**
 * Word of advice. This was coded by a backend monkey who didn't do frontend for the past 15 years and played with
 * Angular only for a while. The monkey went through a period of sickness after this week, but now looks like he is
 * fully recovered. Despite everything the application works.
 *
 * @TODO: Refactor and data validation.
 *
 * PRs are more than welcome.
 */

angular.module('KrakenDesigner', ['ngRoute']).config(function ($interpolateProvider, $routeProvider) {

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

});


angular.module('KrakenDesigner').controller('KrakenDesignerController', function ($scope, $rootScope, $location, DataService) {

    // DataService.loadSample();
    $rootScope.service = DataService.configuration;

    if ('undefined' === typeof $rootScope.service.version) {
        // KrakenDesigner version to use unless specified by the user
        $rootScope.service.version = KRAKENDESIGNER_VERSION;
    }


    $rootScope.save = function () {
        if ( 'undefined' === typeof $rootScope.service.endpoints || $rootScope.service.endpoints.length < 1) {
            alert("At least you need to define an endpoint");
            return false;
        }
        var date = new Date().getTime();
        downloadDocument( date + "-krakend.json", angular.toJson($rootScope.service, true)); // Beautify
        $rootScope.saved_once = true;
    };

    $rootScope.loadFile = function () {
        try {
            var loaded_json = JSON.parse($scope.service_configuration);
            DataService.configuration = loaded_json;
            console.log(DataService.configuration);
            $rootScope.service = DataService.configuration;
            $rootScope.dropzone_loaded = true;
        } catch (e) {
            alert("Failed to parse the selected JSON file.\n\n" + e.message);
        }
    };

    $rootScope.backendDelete = function (index) {
        $rootScope.service.host.splice(index, 1);
        return false;
    };

    /**
     * Pushes the value of the given container to an array with the given name or object, only if it doesn't exist.
     * @param container_name_with_value
     * @param array
     * @returns {*}
     */
    $rootScope.addTermToArray = function (container_name_with_value, array) {

        var term = $(container_name_with_value).val();

        if ('string' == typeof array) {
            array = eval(array);
        }

        if (typeof array === "undefined") {
            return false;
        }

        if (array.indexOf(term) !== -1) {
            return false;
        }

        array.push(term);
    };

    $rootScope.deleteIndexFromArray = function (index, array_qualified_name) {

        var array = eval(array_qualified_name);
        array.splice(index, 1);
    };

    $rootScope.addGlobalBackend = function () {

        var backend_container = '#backendAddContent';
        var backend = $(backend_container).val();

        if (/^https?:\/\/.+/i.test(backend)) {

            if (typeof $rootScope.service.host === "undefined") {
                $rootScope.service.host = [];
            }

            $rootScope.addTermToArray(backend_container, '$rootScope.service.host');
        }
    };


    $rootScope.deleteWhitelist = function (white, backend_index, endpoint_index) {
        $rootScope.service.endpoints[endpoint_index].backend[backend_index].whitelist.splice(white - 1, 1);
    };

    $rootScope.deleteBlacklist = function (black, backend_index, endpoint_index) {
        $rootScope.service.endpoints[endpoint_index].backend[backend_index].blacklist.splice(black - 1, 1);
    };


    $rootScope.addWhitelist = function (endpoint_index, backend_index) {

        var container_name_with_value = '#wl' + endpoint_index + backend_index;

        // Create object if it doesn't exist yet
        if ('undefined' === typeof $rootScope.service.endpoints[endpoint_index].backend[backend_index].whitelist) {
            $rootScope.service.endpoints[endpoint_index].backend[backend_index].whitelist = [];
        }

        $rootScope.addTermToArray(
            container_name_with_value,
            $rootScope.service.endpoints[endpoint_index].backend[backend_index].whitelist
        );

    };

    $rootScope.addBlacklist = function (endpoint_index, backend_index) {

        var container_name_with_value = '#bl' + endpoint_index + backend_index;

        // Create object if it doesn't exist yet
        if ('undefined' === typeof $rootScope.service.endpoints[endpoint_index].backend[backend_index].blacklist) {
            $rootScope.service.endpoints[endpoint_index].backend[backend_index].blacklist = [];
        }

        $rootScope.addTermToArray(
            container_name_with_value,
            $rootScope.service.endpoints[endpoint_index].backend[backend_index].blacklist
        );

    };

    $rootScope.addTransformation = function (endpoint_index, backend_index) {

        var target = $('#tr_target' + endpoint_index + backend_index).val();
        var origin = $('#tr_origin' + endpoint_index + backend_index).val();

        if (typeof $rootScope.service.endpoints[endpoint_index].backend[backend_index].mapping === "undefined") {
            $rootScope.service.endpoints[endpoint_index].backend[backend_index].mapping = {};
        }
        $rootScope.service.endpoints[endpoint_index].backend[backend_index].mapping[origin] = target;
    };

    $rootScope.deleteTransformation = function (origin, endpoint_index, backend_index) {
        delete $rootScope.service.endpoints[endpoint_index].backend[backend_index].mapping[origin];
    };

    $rootScope.addEndpoint = function () {

        if (typeof $rootScope.service.host === "undefined" || 1 < $rootScope.service.length) {
            alert("You need to add a backend first in the Service Configuration.");
            return false;
        }

        if (typeof $rootScope.service.endpoints === "undefined") {
            $rootScope.service.endpoints = [];
        }
        $rootScope.service.endpoints.push({"endpoint": "/", "method": "GET"});
    };

    // Valid endpoints start with Slash and do not contain /__debug[/]
    $rootScope.isValidEndpoint = function (endpoint) {
        return !(/^[^\/]|\/__debug(\/.*)?$|\/favicon\.ico/i.test(endpoint));
    };

    $rootScope.isValidTimeUnit = function (time_with_unit) {

        return (
            'undefined' === typeof time_with_unit ||
            '' == time_with_unit ||
            /^\d+(ns|us|µs|ms|s|m|h)$/.test(time_with_unit)
        );
    };

    $rootScope.isInteger = function (integer) {
        return (
            'undefined' === typeof integer ||
            '' == integer ||
            /^\d+$/.test(integer)
        );
    };


    $rootScope.deleteEndpoint = function (endpoint_index, message) {
        if (confirm(message)) {
            $rootScope.service.endpoints.splice(endpoint_index, 1);
        }
    };

    $rootScope.updateNonGETBackends = function (endpoint_index, old_value, message) {

        var num_backends = ( 'undefined' === typeof $rootScope.service.endpoints[endpoint_index].backend ? 0 : $rootScope.service.endpoints[endpoint_index].backend.length );
        if (num_backends > 1) {
            if (old_value == 'GET' && confirm(message)) {
                $rootScope.service.endpoints[endpoint_index].backend.splice(1, 10000);
            } else {
                // Angular already updated the value, revert:
                $rootScope.service.endpoints[endpoint_index].method = 'GET';
            }
        }
    };


    $rootScope.addBackendQuery = function (endpoint_index) {

        if (typeof $rootScope.service.endpoints[endpoint_index].backend === "undefined") {
            $rootScope.service.endpoints[endpoint_index].backend = [];
        }

        $rootScope.service.endpoints[endpoint_index].backend.push({"url_pattern": "/"});
    };

    $rootScope.deleteBackendQuery = function (endpoint_index, backend_index, message) {
        if (confirm(message)) {
            $rootScope.service.endpoints[endpoint_index].backend.splice(backend_index, 1);
        }
    };

    $rootScope.addQuerystring = function (endpoint_index) {

        if (typeof $rootScope.service.endpoints[endpoint_index].querystring_params === "undefined") {
            $rootScope.service.endpoints[endpoint_index].querystring_params = [];
        }

        var term = document.getElementById('addQuerystring_' + endpoint_index).value;
        if (term.length > 0 && $rootScope.service.endpoints[endpoint_index].querystring_params.indexOf(term) === -1) {
            $rootScope.service.endpoints[endpoint_index].querystring_params.push(term);
        }
    };


    $rootScope.deleteQuerystring = function (query_index, endpoint_index) {
        $rootScope.service.endpoints[endpoint_index].querystring_params.splice(query_index, 1);
    };


    $rootScope.addAllowedHosts = function () {

        if (typeof $rootScope.service.security.allowed_hosts === "undefined") {
            $rootScope.service.security.allowed_hosts = [];
        }

        $rootScope.addTermToArray('#allowedHosts', '$rootScope.service.security.allowed_hosts');
    };

    $rootScope.addSSLHeader = function () {

        if (typeof $rootScope.service.security === "undefined") {
            $rootScope.service.security = {};
        }

        if (typeof $rootScope.service.security.ssl_proxy_headers === "undefined") {
            $rootScope.service.security.ssl_proxy_headers = {};
        }

        var header = document.getElementById('ssl_header').value;
        var value = document.getElementById('ssl_header_value').value;

        if (header.length > 0 && value.length > 0) {
            $rootScope.service.security.ssl_proxy_headers[header] = value;
        }

    };

    $rootScope.deleteSSLHeader = function (header) {
        delete $rootScope.service.security.ssl_proxy_headers[header];
    };


})
    .factory("DataService", function ($http) {

        var service = {
            configuration: {},
            loadSample: sampleConfiguration
        };

        function sampleConfiguration() {
            $http.get('/js/endpoints_sample.json').then(function (data) {
                service.configuration = data.data;
            });
        }

        return service;
    });


function downloadDocument(name, content) {
    saveAs(new Blob([content], {type: "text/plain;charset=UTF-8"}), name);
}

// Avoid losing the configuration:
window.onbeforeunload = function () {
    return "Leaving now implies losing the changes configured so far. Are you sure?";
}
