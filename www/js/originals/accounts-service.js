angular
	.module('starter.services')
	.factory('AccountsService', function($rootScope, $location, $translate, $ionicPopup, AppSyncService, FirebaseService, WorkoutService) {

		var _syncDataPostAuth = function() {
			AppSyncService.syncStoredData();
	        AppSyncService.syncWebSqlWorkoutLog(); 
			AppSyncService.checkLocalForageCustomWorkouts(); 
		};

		var _facebookPostAuthProcess = function(authData, emailAddress) {
			PersonalData.GetUserProfile.uid = authData.uid;
			PersonalData.GetUserProfile.email = emailAddress;
			PersonalData.GetUserProfile.firstName = authData.facebook.cachedUserProfile.first_name || '';
			PersonalData.GetUserProfile.lastName = authData.facebook.cachedUserProfile.last_name || '';
			PersonalData.GetUserProfile.locale = authData.facebook.cachedUserProfile.locale || '';
			PersonalData.GetUserProfile.authType = 'facebook';
			var gender = '';
			switch(authData.facebook.cachedUserProfile.gender.toLowerCase()) {
			    case 'male':
			        gender = "MALE"
			        break;
			    case 'female':
			        gender = "FEMALE"
			        break;
			    case 'other':
			        gender = "OTHER"
			        break;
			    default:
			        gender = "OTHER"
			}
			PersonalData.GetUserProfile.gender = gender;
			convertImgToBase64URL(authData.facebook.cachedUserProfile.picture.data.url, function(image){
				PersonalData.GetUserProfile.photo = image || false;
				localforage.setItem('userProfile', PersonalData.GetUserProfile).then(function(){
					_syncDataPostAuth();
					$location.path('/app/auth/extra-info');
					$rootScope.data.loading = false;
				});
				if (device) {
					WorkoutService.unlockForCreateUserAccount()
									.then(WorkoutService.downloadUnlockedExercises);
				}
			});	
		}

		var _googlePostAuthProcess = function(authData, emailAddress) {
			PersonalData.GetUserProfile.uid = authData.uid;
			PersonalData.GetUserProfile.email = authData.google.email || '';
			PersonalData.GetUserProfile.firstName =  authData.google.cachedUserProfile.given_name || '';
			PersonalData.GetUserProfile.lastName = authData.google.cachedUserProfile.family_name || '';
			PersonalData.GetUserProfile.locale = authData.google.cachedUserProfile.locale || '';
			PersonalData.GetUserProfile.authType = 'google';
			var gender = '';
			switch(authData.google.cachedUserProfile.gender.toLowerCase()) {
			    case 'male':
			        gender = "MALE"
			        break;
			    case 'female':
			        gender = "FEMALE"
			        break;
			    case 'other':
			        gender = "OTHER"
			        break;
			    default:
			        gender = "OTHER"
			}
			PersonalData.GetUserProfile.gender = gender;
			convertImgToBase64URL(authData.google.cachedUserProfile.picture, function(image){
				PersonalData.GetUserProfile.photo = image || false;
				localforage.setItem('userProfile', PersonalData.GetUserProfile).then(function(){
					_syncDataPostAuth();
					$location.path('/app/auth/extra-info');
					$rootScope.data.loading = false;
				});
				if (device) {
					WorkoutService.unlockForCreateUserAccount()
									.then(WorkoutService.downloadUnlockedExercises);
				}
			});	
		}

		return {

			facebookAuthProcess: function(isWebViewForced) {
				$rootScope.data.loading = true;
				if (device && !isWebViewForced) {
					facebookConnectPlugin.login(['public_profile', 'email'], function(status) {
					  facebookConnectPlugin.getAccessToken(function(token) {
					    // Authenticate with Facebook using an existing OAuth 2.0 access token
					    FirebaseService.auth.$authWithOAuthToken("facebook", token).then(function(authData) {
						  console.log('Authenticated successfully with payload:', authData);
					        if (typeof authData.facebook.cachedUserProfile.email !== "undefined") {
								_facebookPostAuthProcess(authData, authData.facebook.cachedUserProfile.email);
							} else {
								var emailPopup = $ionicPopup.show({
					            title: $translate.instant('EMAILREQ'),
					            template: '<form name="signInForm" novalidate><p style="margin-left:10px;">' + $translate.instant("VALIDEMAIL") + ':</p><input type="email" autofocus class="ng-pristine ng-valid" placeholder="' + $translate.instant("EMAILADD") + '" required name="email"></form>',
								buttons: [
									{ text: $translate.instant('CANCEL_SM'),
									onTap: function(e) {
								    	FirebaseService.auth.$unauth();
								    	$rootScope.data.loading = false;
								    	emailPopup.close();
									}
									},
									{
									text: $translate.instant('SAVE'),
									type: 'energized',
									onTap: function(e) {
										var res = signInForm.email.value;
										angular.element(signInForm).addClass('ng-submitted');
									 	if (res && res.length > 1 && signInForm.email.checkValidity()){
									      	_facebookPostAuthProcess(authData, res);
											emailPopup.close();
									    } else {
									    	e.preventDefault();
									    }
									}
									}
								]
							    });
							}
						}).catch(function(error) {
						  console.error("Authentication failed:", error);
						});
					  }, function(error) {
					    console.log('Could not get access token', error);
					  });
					}, function(error) {
					  console.log('An error occurred logging the user in', error);
					});

				} else {

					FirebaseService.auth.$authWithOAuthPopup("facebook",{scope: "email"}).then(function(authData) {
						console.log("Logged in as:", authData.uid);
						console.log("Auth Data is: ", authData);
						if (typeof authData.facebook.cachedUserProfile.email !== "undefined") {
							_facebookPostAuthProcess(authData, authData.facebook.cachedUserProfile.email);
						} else {
							var emailPopup = $ionicPopup.show({
				            title: $translate.instant('EMAILREQ'),
					        template: '<form name="signInForm" novalidate><p style="margin-left:10px;">' + $translate.instant("VALIDEMAIL") + ':</p><input type="email" autofocus class="ng-pristine ng-valid" placeholder="' + $translate.instant("EMAILADD") + '" required name="email"></form>',
							buttons: [
								{ text: $translate.instant('CANCEL_SM'),
								onTap: function(e) {
							    	FirebaseService.auth.$unauth();
							    	$rootScope.data.loading = false;
							    	emailPopup.close();
								}
								},
								{
								text: $translate.instant('SAVE'),
								type: 'energized',
								onTap: function(e) {
									var res = signInForm.email.value;
									angular.element(signInForm).addClass('ng-submitted');
								 	if (res && res.length > 1 && signInForm.email.checkValidity()){
								      	_facebookPostAuthProcess(authData, res);
								      	emailPopup.close();
								    } else {
								    	e.preventDefault();
								    }
								}
								}
							]
						    });
						}
					}).catch(function(error) {
						$rootScope.data.loading = false;
						console.log("Authentication failed:", error);
					});

				}
			},

			facebookPostAuthProcess: _facebookPostAuthProcess,

			googleAuthProcess: function() {
				$rootScope.data.loading = true;
				FirebaseService.auth.$authWithOAuthPopup("google",{scope: "email"}).then(function(authData) {
				console.log("Logged in as:", authData.uid);
				console.log("Auth Data is: ", authData);
				if (typeof authData.google.cachedUserProfile.email !== "undefined") {
					_googlePostAuthProcess(authData, authData.google.cachedUserProfile.email);
				} else {
					var emailPopup = $ionicPopup.show({
			            title: $translate.instant('EMAILREQ'),
				        template: '<form name="signInForm" novalidate><p style="margin-left:10px;">' + $translate.instant("VALIDEMAIL") + ':</p><input type="email" autofocus class="ng-pristine ng-valid" placeholder="' + $translate.instant("EMAILADD") + '" required name="email"></form>',
						buttons: [
							{ text: $translate.instant('CANCEL_SM'),
							onTap: function(e) {
						    	FirebaseService.auth.$unauth();
						    	$rootScope.data.loading = false;
						    	emailPopup.close();
							}
							},
							{
							text: $translate.instant('SAVE'),
							type: 'energized',
							onTap: function(e) {
								var res = signInForm.email.value;
								angular.element(signInForm).addClass('ng-submitted');
							 	if (res && res.length > 1 && signInForm.email.checkValidity()){
							      	_googlePostAuthProcess(authData, res);
							      	emailPopup.close();
							    } else {
							    	e.preventDefault();
							    }
							}
							}
						]
					    });
					}
				}).catch(function(error) {
					$rootScope.data.loading = false;
					console.log("Authentication failed:", error);
				});

			},

			googlePostAuthProcess: _googlePostAuthProcess,

			syncDataPostAuth: _syncDataPostAuth

		}

	});



	