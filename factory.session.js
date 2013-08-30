(function () {
  'use strict';
    /*
        Angular Apikey Session Authentication

        This module deals with the following concepts
            - anonymous / authenticated users
            - username/password for initial session authentication
            - apikeys instead of passwords for remaining interaction
            - feature flip code checking


        :: Dataflow

            event:login-required
                perform anything you need at this point, something like
                showing a login form would be appropriate

            LoginController.login
                sends username and password via an event to the session service

            $Session.login
                performs the api post to the login endpoint
                collects the user data and stores userid, apikey, username in time limited cookies
                on success, it broadcasts a login-confirmed


        :: Elements

            Service: $Session
                .hasFeatures
                .logout
                .login
                .setApiKeyAuthHeader
                .refreshCredentials
                .cacheCredentials
                .wipeCredentials


            Controller: LoginController
                .login


            Run: Initialise Module
                sets up all the events required to decouple this module.

                event:auth-login

                event:auth-logout

                event:auth-login-required

                event:auth-login-confirmed

                $routeChangeSuccess

     */

    angular.module("factory.session",['http-auth-interceptor','restangular'])
        .constant('constSessionExpiry', 20) // in minutes
        .factory("$Session", [
                '$rootScope',
                '$q',
                '$location',
                '$log',
                '$http',
                'Restangular',
                'authService',
                'constSessionExpiry',

                function($rootScope, $q, $location, $log, $http, Restangular, authService, constSessionExpiry) {
	         return {
			
                        loginInProgress: false,
                        User: null,
                        authSuccess: function(){
                                this.loginInProgress = false;
                                $rootScope.$broadcast('event:session-changed');
                                authService.loginConfirmed();
                            },

                        logout: function(){
                                $log.info("Handling request for logout");
                                this.wipeUser();
                                $rootScope.$broadcast('event:auth-logout-confirmed');
                            },

		        register: function(){
			    $log.info("Preparing Signup data",data);
			   
			    return Restangular.all('register/').post(data)

			    },
                        login: function(data){
                                $log.info("Preparing Login Data", data);
                                var $this = this;
                                return Restangular
                                        .all('user/login/')
                                        .post(data)
                                        .then(function userLoginSuccess(response){
                                            $log.info("login.post: auth-success", response);
                                            $this.User = response;
                                            // remove properties we don't need.
                                            delete $this.User.route
                                            delete $this.User.restangularCollection
                                            $this.User.is_authenticated = true;
                                            $this.cacheUser()
                                            $this.setApiKeyAuthHeader();
                                            $this.authSuccess();
                                        }, function userLoginFailed(response){
                                            $log.info('login.post: auth-failed', response);
                                            $this.logout();
                                            return $q.reject(response);
                                        });
                            },

                        setApiKeyAuthHeader: function(){
                                if(this.hasOwnProperty('User') && this.User){
                                    $http.defaults.headers.common.Authorization = "apikey "+this.User.username+':'+this.User.apikey;
                                    $log.info("Setting Authorization Header", $http.defaults.headers.common.Authorization)
                                }else{
                                    $log.info("No user for AuthHeader")
                                    delete $http.defaults.headers.common.Authorization;
                                }
                            },

                        refreshUser: function(){
                                var $this = this;
                                var cachedUser = lscache.get('userData');
                                $log.info("Request to pull User from Cache");
                                $log.info("$Session.User", $this.User)
                                $log.info('lscache.get("userData")', cachedUser)

                                if(!$this.User && cachedUser && cachedUser.hasOwnProperty('apikey') && cachedUser.apikey){
                                    $log.info('Attempting pull user from cache', cachedUser)
                                    $this.User = cachedUser;
                                }else{
                                    $log.warn("No user available.")
                                    $rootScope.$broadcast("event:auth-login-required")
                                }

                                if($this.User && $this.User.hasOwnProperty('apikey') && $this.User.apikey){
                                    $this.setApiKeyAuthHeader();
                                    Restangular
                                        .one('user', $this.User.id)
                                        .get().then(function(response){
                                            $log.info("User data updated from server.")
                                            $this.User = response;
                                            $this.cacheUser();
                                            $this.setApiKeyAuthHeader();
                                            $this.authSuccess()
                                        }, function(response){
                                            $log.error("Error retrieving user. logging out.");
                                            $this.logout();
                                        })
                                }

                            },

                        cacheUser: function(){
                                if(!this.User){
                                    $log.warn("Can't cache a null value User")
                                    return false;
                                }
                                if(!this.User.hasOwnProperty("id") && this.User.hasOwnProperty("resource_uri")){
                                    $log.info("Building $this.User.id")
                                    var bits = this.User.resource_uri.split("/")
                                    this.User.id = Number(bits[bits.length-1])
                                }
                                $log.info("Caching User", this.User);
                                lscache.set('userData', this.User, constSessionExpiry);
                            },

                        wipeUser: function(){
                                $log.info("Wiping User");
                                lscache.remove('userData');
                                this.User = null;
                                this.setApiKeyAuthHeader();
                                $rootScope.$broadcast('event:session-changed');
                            }
                    };
            }])

})();
