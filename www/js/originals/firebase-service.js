angular
	.module('starter.services')
	.factory('FirebaseService', function($firebaseAuth, $rootScope, $log) {

		$rootScope.authData = null;

		var ref = new Firebase("https://sworkit-user.firebaseio.com/users");
		var auth = $firebaseAuth(ref);

		var returnObj = {
			ref: ref,
			auth: auth,
			authData: null
		};

		auth.$onAuth(function(authData) {
			if (authData) {
				console.log("Logged in as:", authData.uid);
				$rootScope.authData = authData;
				returnObj.authData = authData;
				ref.child(authData.uid).update({isProAccess: true},
					function (error) {
						if (error) {
							$log.warn("Firebase update failure for isProAccess: " + error.code);
						} else {
							$log.info('Firebase update success for isProAccess');
						}
					}
				);
			} else {
				console.log("Logged out");
				$rootScope.authData = null;
			}
		});

		// TODO: When app starts, login with token from local storage (if present)
		return returnObj;

	});