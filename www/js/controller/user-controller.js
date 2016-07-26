'use strict';

angular.module("dywos.controllers")
	.controller('LoginCtrl', function ($rootScope, $scope, $location, $timeout, $ionicPopup, $translate, UserServices, OAuth2Factory) 
	{
      $scope.user = 
      {
        proAccess: true,
        email: null,
        password: null,
        firstName: null,
        lastName: null,
        gender: null,
        photo: null
      };

      $rootScope.data = 
      {
        loading: false
      }

      $scope.facebookSignIn = function () 
      {
      //  AccountsService.facebookAuthProcess(isPro);
      }

      $scope.googleSignIn = function () 
      {
       //AccountsService.googleAuthProcess();
      }

      $scope.error = false;

      $scope.loginEmail = function () 
      {
      	$scope.data.loading = true;

        var loginOAuth =  OAuth2Factory.loginOAuth2($scope.user.email, $scope.user.password);
        loginOAuth.then(
              function(resolve)
              {
                $rootScope.oauthData = resolve;
                UserServices.get({action:'login', 
                                  oauth_access_token: $rootScope.oauthData.access_token, 
                                  oauth_client_id: $rootScope.oauthData.client_id},
                                function(data)
                                {
                                  $rootScope.userData = data._embedded["mets:login"];
                                   $location.path('/app/auth/extra-info');
                                }, function(error) {
                                  console.log(error);
                                })
              }, function(reject){
                error = false;    
              }
          );
       

        /*
        FirebaseService.auth.$authWithPassword($scope.user)
            .then(function (authData) {
              console.log("Logged in as:", authData.uid);
              $timeout(function () {
                if (PersonalData.GetUserProfile.photo) {
                  PersonalData.GetUserProfile.photo = "data:image/jpeg;base64," + imageData;
                  $scope.user.photo = PersonalData.GetUserProfile.photo;
                }

                localforage.setItem('userProfile', PersonalData.GetUserProfile).then(function () {
                  AccountsService.syncDataPostAuth();
                  $location.path('/app/auth/extra-info');
                  $rootScope.data.loading = false;
                });
                if (device) {
                  WorkoutService.unlockForCreateUserAccount()
                      .then(WorkoutService.downloadUnlockedExercises);
                }
              }, 1500)
            }).catch(function (error) {
          console.error("Authentication failed:", error);
          $scope.error = $translate.instant(error.code);
          $scope.data.loading = false;
        });
		*/
      };     
    });

angular.module("dywos.controllers")
  .controller('SignUpCtrl', function ($rootScope, $scope, $location, $timeout, $ionicPopup, $translate, $log) 
  {
    $scope.user = 
    {
        proAccess: true,
        email: null,
        password: null,
        firstName: null,
        lastName: null,
        gender: '',
        birthYear: '',
        photo: '',
        emailPreference: true
    };

    $rootScope.data = {
      loading: false
    }

    $scope.submitted = false;
    $scope.error = false;

    $scope.signupEmail = function (signUpForm) 
    {
      /*
      if (signUpForm.$valid) 
      {
        $rootScope.data.loading = true;
        FirebaseService.auth.$createUser($scope.user)
              .then(function (userData) {
                FirebaseService.auth.$authWithPassword($scope.user)
                    .then(function (authDataLogin) {
                      $log.debug("Logged in as:", authDataLogin.uid);
                      $scope.setSignUpDateLang();
                      PersonalData.GetUserProfile.uid = authDataLogin.uid;
                      PersonalData.GetUserProfile.email = $scope.user.email;
                      PersonalData.GetUserProfile.firstName = $scope.user.firstName;
                      PersonalData.GetUserProfile.lastName = $scope.user.lastName;
                      PersonalData.GetUserProfile.emailPreference = $scope.user.emailPreference;
                      PersonalData.GetUserProfile.authType = 'email';
                      PersonalData.GetUserProfile.locale = navigator.language || '';

                  localforage.setItem('userProfile', PersonalData.GetUserProfile).then(function () {
                    AccountsService.syncDataPostAuth();
                    $location.path('/app/auth/extra-info');
                    $rootScope.data.loading = false;
                  });
                  if (device) {
                    WorkoutService.unlockForCreateUserAccount()
                      .then(WorkoutService.downloadUnlockedExercises);
            trackEvent('User Registration', 'email', 0);
                  }
                }).catch(function (error) {
                  $log.error("Authentication failed:", error);
                  $rootScope.data.loading = false;
                });
                $scope.message = "User created with uid: " + userData.uid;
                $rootScope.data.loading = false;
              }).catch(function (error) {
            $log.error("error", error);
            $scope.error = $translate.instant(error.code);
            $rootScope.data.loading = false;
          });
      } else {
          signUpForm.submitted = true;
          $log.debug($scope.signUpForm);
      }
      */
    };

    $scope.facebookSignUp = function() 
    {
      /*
      $scope.setSignUpDateLang();
      AccountsService.facebookAuthProcess(isPro);
      trackEvent('User Registration', 'facebook', 0);
      */
    } 

    $scope.googleSignUp = function() 
    {
      /*
      $scope.setSignUpDateLang();
      AccountsService.googleAuthProcess();
      trackEvent('User Registration', 'google', 0);
      */
    }

    $scope.openPrivacy = function ($event) 
    {
      window.open('http://m.sworkit.com/privacy.html', '_blank', 'location=yes,AllowInlineMediaPlayback=yes,toolbarposition=top');
    }

    $scope.openTerms = function ($event) 
    {
      window.open('http://m.sworkit.com/TOS.html', '_blank', 'location=yes,AllowInlineMediaPlayback=yes,toolbarposition=top');
    }

    $scope.$on('$ionicView.enter', function () 
    {
      if (device) cordova.plugins.Keyboard.disableScroll(true);
    })
    
    $scope.$on('$ionicView.leave', function () 
    {
      if (device) cordova.plugins.Keyboard.disableScroll(false);
    })

    $scope.setSignUpDateLang = function () 
    {
      var dateNow = new Date();
      var timeNow = dateNow.getTime();
      //PersonalData.GetUserProfile.signUpDate = timeNow;
      //PersonalData.GetUserProfile.defaultLang = PersonalData.GetUserSettings.preferredLanguage;
    }
  });