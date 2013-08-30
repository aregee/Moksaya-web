 'use strict';

angular.module('Moksaya', ['restangular','factory.session']).
config(function(RestangularProvider ,$interpolateProvider ,$httpProvider ,$routeProvider) {

      $interpolateProvider.startSymbol('[[');
      $interpolateProvider.endSymbol(']]');
      $httpProvider.defaults.useXdomain = true;
      delete $httpProvider.defaults.headers.common['X-Requested-With'];
      

      
      RestangularProvider.setBaseUrl("http://127.0.0.1:8000/api/v1");
    //  RestangularProvider.setDefaultRequestParams({username:'aregee', api_key :'969c193ff42529c46b017c5090a2f85bda9374b8' });

       $routeProvider
       .when('/login' , { 
	  templateUrl: '/login.html' , 
	   controller: "LoginController"})
      .when('/list', {
	  templateUrl: '/list.html',
	  controller:"ListCtrl"
	  
      }).otherwise({ redirectTo: '/login'});
	   
}).controller("LoginController", function($log, $Session, $scope, $rootScope,$location){
                $scope.Login = function(){
                    $scope.$emit('event:auth-login', {username: $scope.username, password: $scope.password});
		    $location.path("/list");
                }
            }).

        run(['$rootScope',
             '$log',
             '$Session',

            function($rootScope, $log, $Session ,$routeProvider){
                $rootScope.Session = $Session;

                //namespace the localstorage with the current domain name.
                lscache.setBucket(window.location.hostname);

                // on page refresh, ensure we have a user. if none exists
                // then auth-login-required will be triggered.
                $Session.refreshUser();

                // Best practice would be to hook these events in your app.config

                // login
                $rootScope.$on('event:auth-login-required', function(scope, data) {
                        $log.info("session.login-required");
                    });

                $rootScope.$on('event:auth-login', function(scope, data) {
                        $log.info("session.send-login-details");
                        $Session.login(data);
                    });

                $rootScope.$on('event:auth-login-confirmed', function(scope, data) {
                        $log.info("session.login-confirmed");
		                           });

                // logout
                $rootScope.$on('event:auth-logout', function(scope, data) {
                        $log.info("session.request-logout");
                        $Session.logout();
                    });
                $rootScope.$on('event:auth-logout-confirmed', function(scope, data) {
                        $log.info("session.logout-confirmed");
                    });

                // session state change
                $rootScope.$on('event:session-changed', function(scope){
                    $log.info("session.changed > ", $Session.User)
                })

                $rootScope.$on('$routeChangeSuccess', function(event, next, current) {
                        if(!$Session.User && next.$$route.loginRequired){
                            $log.info("Unauthenticated access to ", next.$$route)
                            $rootScope.$broadcast('event:auth-login-required')
                        }
                    }).
controller("SignupController", function($log, $Session, $scope, $rootScope,$location){
                $scope.Login = function(){
                    $scope.$emit('event:auth-register', {username: $scope.username, password: $scope.password});
		    $location.path("/login");
                }
            })


            }]);

function ListCtrl($scope, Restangular,$log, $Session, $rootScope,$routeParams){
    $scope.user = lscache.get('userData');
    $scope.profile =  Restangular.all("profile/").getList();
    
  
}


