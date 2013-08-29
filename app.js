 'use strict';

var moksaya = angular.module('Moksaya', ['restangular','factory.session']).
  config(function(RestangularProvider ,$interpolateProvider ,$httpProvider ) {

      $interpolateProvider.startSymbol('[[');
      $interpolateProvider.endSymbol(']]');
      $httpProvider.defaults.useXdomain = true;
      delete $httpProvider.defaults.headers.common['X-Requested-With'];


      
      RestangularProvider.setBaseUrl("http://127.0.0.1:8000/api/v1");
    //  RestangularProvider.setDefaultRequestParams({username:'aregee', api_key :'969c193ff42529c46b017c5090a2f85bda9374b8' });
});


//function ListCtrl($scope, Restangular) {
 // $scope.key = Restangular.all("token/auth/").getList();
    
//  $scope.profile =  Restangular.all("profile/").getList();
  
//}


