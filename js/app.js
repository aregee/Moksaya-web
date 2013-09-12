 'use strict';

angular.module('Moksaya', ['restangular','factory.session','truncate','angularFileUpload']).
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
       .when('/project/:id', {
	    templateUrl : 'views/project.html',
	     controller : "ProjectViewController"
	    }) 
        .when('/upload', {
	    templateUrl : 'views/project_upload.html',
	     controller : "ProjectUploadController"
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

		$rootScope.$on('event:auth-liked', function(scope, data) {
                        $log.info("session.send-liked-details");
                        $Session.liked(data);
                    });

		$rootScope.$on('event:auth-comment', function(scope, data) {
                        $log.info("session.send-liked-details");
                        $Session.comment(data);
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

function MyProfileCtrl($scope,$q, Restangular,$log, $Session, $rootScope,$routeParams,$location){
    $scope.user = lscache.get('userData');
    $scope.username = $routeParams.username;
    var defer = $q.defer();
    
    defer.promise = $scope.profile =  Restangular.one("profile" , $scope.user.username).get();

    defer.promise.then(function(response) {
	var follow = Restangular.copy(response);
	lscache.set('followerdata',follow);
    });

    defer.resolve();
    //var orignal = 
    $scope.visible = false;
    


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




function ProjectViewController($scope,$q, Restangular,$log, $Session, $rootScope,$routeParams,$location){
    $scope.id = $routeParams.id
    var defer = $q.defer();
    defer.promise = $scope.project = Restangular.one("projects" , $scope.id ).get();
    defer.promise.then(function(response){
	var data = Restangular.copy(response);
	lscache.set('projectData', data )}).then(function(){
	    console.log('Project URI is ' + lscache.get('projectData').resource_uri);
	    console.log('USer URI is ' + lscache.get('followerdata').resource_uri);
	    });

    defer.resolve();
    
    
    $scope.Like = function() {
	$scope.$emit('event:auth-liked' , { user : lscache.get('followerdata').resource_uri , liked_content_type:lscache.get('projectData').resource_uri }) }

    $scope.Fork = function(){ Restangular.one("forking", $scope.id ).get();
			      $location.path("/wall")
			     }
    
    $scope.Delete = function() { Restangular.one("projects", $scope.id).remove();
			       $location.path("/wall");}


    $scope.Comment = function() {
	$scope.$emit('event:auth-comment' , { user : lscache.get('followerdata').resource_uri  , entry : lscache.get('projectData').resource_uri , text : $scope.text } )
	}
		     
    
 }



function ProjectUploadController($scope,$q, Restangular,$log, $Session, $rootScope,$routeParams,$location ,$http)
{   

$scope.onFileSelect = function($files) {
    //$files: an array of files selected, each file has name, size, and type.
    //for (var i = 0; i < $files.length; i++) {
      //var $file = $files[i];
      $http.uploadFile({
        url: 'http://127.0.0.1:8000/api/v1/projects/', //upload.php script, node.js route, or servlet uplaod url)
        data: {user: lscache.get('followerdata').resource_uri , title: $scope.myTitle , desc:$scope.myDesc },
	 
        file: $files[0],
	  
	screen: $files[1]
		  


      }).then(function(data, status, headers, config) {
        // file is uploaded successfully
	$location.path("/wall");
        console.log(data);
	
      }); 
    //} 

}
}
