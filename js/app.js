 'use strict';

angular.module('Moksaya', ['restangular','factory.session','truncate','angularFileUpload']).
config(function(RestangularProvider ,$interpolateProvider ,$httpProvider ,$routeProvider) {

      $interpolateProvider.startSymbol('[[');
      $interpolateProvider.endSymbol(']]');
      $httpProvider.defaults.useXdomain = true;
      delete $httpProvider.defaults.headers.common['X-Requested-With'];
    
      RestangularProvider.setBaseUrl("http://moksaya-rahulgaur.rhcloud.com/api/v1/");


       $routeProvider
       .when('/login' , { 
	  templateUrl: 'views/login.html' , 
	   controller: "LoginController"})
      .when('/wall', {
	  templateUrl: 'views/main.html',
	  controller:"MyProfileCtrl"
      })
	.when('/wall/edit/:username', { 
	    templateUrl: 'views/profile_edit.html',
	    controller:"ProfileEditController"

	})
      .when('/wall/:username', {
	  templateUrl: 'views/profile.html',
	  controller:"ViewCtrl"
      })
       .when('/project/:id', {
	    templateUrl : 'views/project.html',
	     controller : "ProjectViewController"
	    })
    
       .when('/project/edit/:id', {
	    templateUrl : 'views/project_edit.html',
	     controller : "ProjectEditController"
	    })

        .when('/projects', {
	    templateUrl : 'views/projects_list.html',
	     controller : "ProjectListController"
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
	   
});

function MyProfileCtrl($scope,$q, Restangular,$log, $Session, $rootScope,$routeParams,$location){
    $scope.user = lscache.get('userData');
    
     
     
     var defer = $q.defer();
    
    defer.promise = $scope.profile = Restangular.one("profile" , $scope.user.username).get();
    
    defer.promise.then(function(response) {
	var follow = Restangular.copy(response);
	lscache.set('profiledata',follow);
    });
    defer.resolve();
  


    $scope.Logout = function() { 
	   $scope.$emit('event:auth-logout', {});
	  
          
	} 
  
}

//Public Profile View Controller 
function ViewCtrl($scope,$q, Restangular,$log, $Session, $rootScope,$routeParams,$location,$http){
    $scope.user = lscache.get('userData');
    $scope.username = $routeParams.username;
    $http.defaults.headers.common.Authorization = "apikey "+lscache.get('userData').username+':'+lscache.get('userData').apikey;
    
    var defer = $q.defer();
    defer.promise = $scope.profile = Restangular.one("profile" , $scope.username).get(); 

     defer.promise.then(function(response) {
	var data = Restangular.copy(response);
	//console.log(data.resource_uri);
	
	lscache.set('frienddata', data);
        return data;
	//alert("Hello Mr " + data.user);
	}).then(function(data){
	
	    console.log('followee' + lscache.get('frienddata').resource_uri);
	    console.log('follower' + lscache.get('profiledata').resource_uri);
	    });

     

    defer.resolve();


  
    $scope.Follow = function() {
	$scope.$emit('event:auth-follow', { follower : lscache.get('profiledata').resource_uri , followee: lscache.get('frienddata').resource_uri })
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
	about_me : "Howdy "+lscache.get('userData').username+" , this is your  Moksaya Profile"
	};
    
    var base = Restangular.all("profile");
	base.post(data).then(function(profile) {
	$location.path("/wall");
	})

}




function ProjectViewController($scope,$q, Restangular,$log, $Session, $rootScope,$routeParams,$location,$http){   
    $scope.user = lscache.get('userData');
    
    $scope.id = $routeParams.id
    $http.defaults.headers.common.Authorization = "apikey "+lscache.get('userData').username+':'+lscache.get('userData').apikey;
    $log.info("Setting Authorization Header", $http.defaults.headers.common.Authorization)

    
    
    var defer = $q.defer();

    defer.promise = $scope.project= Restangular.one("projects" , $scope.id ).get();
    defer.promise.then(function(response){
	var data = Restangular.copy(response);
	lscache.set('projectData', data, 10);
	console.log('Project URI is ' + lscache.get('projectData').resource_uri);
	console.log('USer URI is ' + lscache.get('profiledata').resource_uri);
    });
    
    

    defer.resolve();
    
    

    $scope.Like = function() {
	$scope.$emit('event:auth-liked' , { user : lscache.get('profiledata').resource_uri , liked_content_type:lscache.get('projectData').resource_uri }) }

    $scope.Fork = function(){ Restangular.one("forking", $scope.id ).get();
			      $location.path("/wall")
			    }
    
    $scope.Delete = function() { Restangular.one("projects", $scope.id).remove();
				 $location.path("/wall");}


    $scope.Comment = function() {
	$scope.$emit('event:auth-comment' , { user : lscache.get('profiledata').resource_uri  , entry : lscache.get('projectData').resource_uri , text : $scope.text } )

    }
    
    
}



function ProjectUploadController($scope,$q, Restangular,$log, $Session,$location ,$http)
{   

$http.defaults.headers.common.Authorization = "apikey "+lscache.get('userData').username+':'+lscache.get('userData').apikey;



$scope.onFileSelect = function($files) {
    //$files: an array of files selected, each file has name, size, and type.
   var $file, $screen;
   var extension;
   function isImage(name) {
	   var ext = name; 
	   switch (ext) {
	   case 'jpg':
	   case 'gif':
	   case 'bmp':
	   case 'png':
	   case 'jpeg':
               //etc
               return true;
	   }
	   return false;
       } 
      
   for (var i = 0; i < 2; i++) {
       var name = $files[i].name;
       name = name.toLowerCase();
       
       //console.log("total files" + $files.length);
       //console.log("name is" + name);
       //console.log("extension " + (/[.]/.exec(name))? /[^.]+$/.exec(name):undefined);
       extension = (/[.]/.exec(name))? /[^.]+$/.exec(name):undefined;
       

       //console.log(isImage(extension[0])); 

       if( isImage(extension[0]) === true )
	   {
	 //     console.log("is a valid image");
	       $screen = $files[i];
	       }
       else{
	   $file = $files[i];
	  // console.log("LEts move ahead");
	   }
		   
	       

       }

      $http.uploadFile({
        url: 'http://moksaya-rahulgaur.rhcloud.com/api/v1/projects/', //upload.php script, node.js route, or servlet uplaod url)
        data: {user: lscache.get('profiledata').resource_uri , title: $scope.myTitle , desc:$scope.myDesc },
	 
        screen:$screen,
	  
	file:$file
		  


      }).then(function(data, status, headers, config) {
        // file is uploaded successfully
	$location.path("/wall");
        console.log(data);
	
      }); 
     

    

}
}


function ProfileEditController($scope,Restangular,$http,$location,$routeParams,$log)
{
    
    $scope.username =  $routeParams.username; //lscache.get('profiledata').user;    
    $http.defaults.headers.common.Authorization = "apikey "+lscache.get('userData').username+':'+lscache.get('userData').apikey;
 
     $scope.profile = Restangular.one('profile', $scope.username).get();
	
	$scope.submit = function() {
	   
	var  data = {
	        user : lscache.get('userData').resource_uri,  
		about_me : $scope.about_me
		}

	    $http({ method:'PUT' ,url:'http://moksaya-rahulgaur.rhcloud.com/api/v1/profile/'+lscache.get('userData').username+'/' ,data:{ user : lscache.get('userData').resource_uri,  
		about_me : $scope.about_me
		} }).then(function(){
		$location.path('/wall');
	    });
	    }

}
	
	
	
function ProjectEditController($scope, Restangular, $rootScope, $routeParams,$http,$log,$location)
{
    $scope.id = $routeParams.id
    $http.defaults.headers.common.Authorization = "apikey "+lscache.get('userData').username+':'+lscache.get('userData').apikey;
    $log.info("Setting Authorization Header", $http.defaults.headers.common.Authorization)
    $scope.project = Restangular.one("projects", $scope.id).get();
   


    $scope.onFileSelect = function($files) {
	//$files: an array of files selected, each file has name, size, and type.
   var $file, $screen;
   var extension;
   function isImage(name) {
	   var ext = name; 
	   switch (ext) {
	   case 'jpg':
	   case 'gif':
	   case 'bmp':
	   case 'png':
	   case 'jpeg':
               //etc
               return true;
	   }
	   return false;
       } 
      
   for (var i = 0; i < 2; i++) {
       var name = $files[i].name;
       name = name.toLowerCase();
       
       //console.log("total files" + $files.length);
       //console.log("name is" + name);
       //console.log("extension " + (/[.]/.exec(name))? /[^.]+$/.exec(name):undefined);
       extension = (/[.]/.exec(name))? /[^.]+$/.exec(name):undefined;
       

       //console.log(isImage(extension[0])); 
       
       if( isImage(extension[0]) === true )
	   {
	 //     console.log("is a valid image");
	       $screen = $files[i];
	       }
       else{
	   $file = $files[i];
	  // console.log("LEts move ahead");
	   }
		   
	       

       }

      $http.uploadFile({
	
	method: 'PUT',

        url: 'http://moksaya-rahulgaur.rhcloud.com/api/v1/projects/'+lscache.get('projectData').id+'/' , //upload.php script, node.js route, or servlet uplaod url)
        data: {user: lscache.get('profiledata').resource_uri , title: $scope.myTitle , desc:$scope.myDesc },
	 
        screen:$screen,
	  
	file:$file
		  


      }).then(function(data, status, headers, config) {
        // file is uploaded successfully
	$location.path("/wall");
        console.log(data);
	
      });
} 
     

}



function ProjectListController($scope,$q, Restangular,$log, $Session, $rootScope,$routeParams,$location,$http){
    $scope.user = lscache.get('userData');   
    $http.defaults.headers.common.Authorization = "apikey "+lscache.get('userData').username+':'+lscache.get('userData').apikey;          
    $scope.projects = Restangular.all("projects").getList();
    
  
}


    















