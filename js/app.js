 'use strict';

angular.module('Moksaya', ['restangular','factory.session','truncate']).
config(function(RestangularProvider ,$interpolateProvider ,$httpProvider ,$routeProvider) {

      $interpolateProvider.startSymbol('[[');
      $interpolateProvider.endSymbol(']]');
      $httpProvider.defaults.useXdomain = true;
      delete $httpProvider.defaults.headers.common['X-Requested-With'];
    
      RestangularProvider.setBaseUrl("http://127.0.0.1:8000/api/v1");
    //  RestangularProvider.setDefaultRequestParams({username:'aregee', api_key :'969c193ff42529c46b017c5090a2f85bda9374b8' });

       $routeProvider
       .when('/login' , { 
	  templateUrl: 'views/login.html' , 
	   controller: "LoginController"})
      .when('/wall', {
	  templateUrl: 'views/main.html',
	  controller:"MyProfileCtrl"
      })
      .when('/wall/:username', {
	  templateUrl: 'views/profile.html',
	  controller:"ViewCtrl"
      })
	.when('/register', { 
	    templateUrl: 'views/signup.html',
	    controller:SignupController

	    })
	.when('/registered', { 
	    templateUrl: 'views/create_profile.html',
	    controller:PostProfileController

	    }).otherwise({ redirectTo: '/login'});
	   
}).controller("LoginController", function($log, $Session, $scope, $rootScope,$location){
                $scope.Login = function(){
                    $scope.$emit('event:auth-login', {username: $scope.username, password: $scope.password});
		    
                }
    
             
            }).run(['$rootScope',
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
		
		$rootScope.$on('event:auth-join', function(scope, data) {
                        $log.info("session.send-join-details");
                        $Session.join(data);
                    });

		$rootScope.$on('event:auth-follow', function(scope, data) {
                        $log.info("session.send-follow-details");
                        $Session.follow(data);
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
                });

                $rootScope.$on('$routeChangeSuccess', function(event, next, current) {
                        if(!$Session.User && next.$$route.loginRequired){
                            $log.info("Unauthenticated access to ", next.$$route)
                            $rootScope.$broadcast('event:auth-login-required')
                        }
                    })


            }]);

function MyProfileCtrl($scope, Restangular,$log, $Session, $rootScope,$routeParams,$location){
    $scope.user = lscache.get('userData');
    $scope.username = $routeParams.username;
    $scope.profile =  Restangular.one("profile" , $scope.user.username).get();
    
    $scope.showtooltip = false;
    $scope.profile.about_me = "Hello Guys";
    $scope.hideTooltip = function() {
	$scope.showtooltip = false;
	}
    $scope.toggleTooltip = function(e) {
	e.stopPropagation();
	$scope.showtooltip = !$scope.showtooltip;
	}
    
    


    $scope.Logout = function() { 
	   $scope.$emit('event:auth-logout', {});
	   $location.path("/");
          
	} 
  
}

//Public Profile View Controller 
function ViewCtrl($scope,$q, Restangular,$log, $Session, $rootScope,$routeParams,$location){
    $scope.user = lscache.get('userData');
    $scope.username = $routeParams.username;
    
    
    var defer = $q.defer();
    defer.promise = $scope.profile = Restangular.one("profile" , $scope.username).get(); 
    $scope.viewer= Restangular.one("profile" , $scope.user.username).get().then(function(response) {
	var follow = Restangular.copy(response);
	lscache.set('followerdata',follow);
});

     defer.promise.then(function(response) {
	var data = Restangular.copy(response);
	//console.log(data.resource_uri);
	
	lscache.set('followdata', data);
        return data;
	//alert("Hello Mr " + data.user);
	}).then(function(data){
	
	    console.log('followee' + lscache.get('followdata').resource_uri);
	    console.log('follower' + lscache.get('followerdata').resource_uri);
	    });

     

    defer.resolve();

  
    $scope.Follow = function() {
	$scope.$emit('event:auth-follow' , { follower : lscache.get('followerdata').resource_uri , followee: lscache.get('followdata').resource_uri })
	}

  
      
}



function SignupController($log,Restangular,$Session,$scope,$rootScope,$location){
		$scope.Signup = function(){Restangular.all('register').post($scope.register).then(function(register)
{
$scope.$emit('event:auth-join', {username: $scope.register.username, password: $scope.register.password});

})}

}

//Controller to automatically populate User Profile with arbitarty data 
function PostProfileController($rootScope,Restangular, $location , $Session, $scope ) {
      $scope.user = lscache.get('userData');
    
    var data = {
	
	user : "/api/v1/user/"+lscache.get('userData').username+"/",
	about_me : "Howdy partner, this is "+lscache.get('userData').username+"'s Moksaya Profile"
	};
    
    var base = Restangular.all("profile");
	base.post(data).then(function(profile) {
	$location.path("/wall");
	})

}


