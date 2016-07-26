// Phrases to translate. Please continue to add here as you find them:

// Log in with email
// Sign up with email
// Log In
// Log Out
// Learn More
// By signing up you agree to the [privacy policy]
// Sign Up
// Email
// Password
// First Name
// Last Name
// Forgot Password

angular.module('starter.login-controllers', [])

    .controller('WelcomeCtrl', function ($rootScope, $scope, $translate) {
      $scope.showWelcome = $rootScope.showWelcome;
      $scope.show_hidden_actions = false;

      $scope.toggleHiddenActions = function () {
        $scope.show_hidden_actions = !$scope.show_hidden_actions;
      };

      $scope.$on('$ionicView.leave', function () {
        $rootScope.showWelcome = false;
      })

    })

    .controller('LoginCtrl', function ($rootScope, $scope, FirebaseService, AppSyncService, AccountsService, $location, $timeout, $ionicPopup, $translate, WorkoutService) {

      $scope.user = {
        proAccess: true,
        email: null,
        password: null,
        firstName: null,
        lastName: null,
        gender: null,
        photo: null
      };

      $rootScope.data = {
        loading: false
      }

      $scope.facebookSignIn = function () {
        AccountsService.facebookAuthProcess(isPro);
      }

      $scope.googleSignIn = function () {
        AccountsService.googleAuthProcess();
      }

      $scope.error = false;

      $scope.loginEmail = function () {
        $scope.data.loading = true;
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
      };

      $scope.openPrivacy = function ($event) {
        window.open('http://m.sworkit.com/privacy.html', '_blank', 'location=yes,AllowInlineMediaPlayback=yes,toolbarposition=top');
      }

      $scope.openTerms = function ($event) {
        window.open('http://m.sworkit.com/TOS.html', '_blank', 'location=yes,AllowInlineMediaPlayback=yes,toolbarposition=top');
      }

    })

    .controller('SignUpCtrl', function ($rootScope, $scope, $location, $timeout, $ionicPopup, $translate, FirebaseService, AppSyncService, AccountsService, WorkoutService, $log) {

      $scope.user = {
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

      $scope.signupEmail = function (signUpForm) {
        if (signUpForm.$valid) {
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
      };

	$scope.facebookSignUp = function() {
		$scope.setSignUpDateLang();
		AccountsService.facebookAuthProcess(isPro);
		trackEvent('User Registration', 'facebook', 0);
	}

	$scope.googleSignUp = function() {
		$scope.setSignUpDateLang();
		AccountsService.googleAuthProcess();
		trackEvent('User Registration', 'google', 0);
	}

      $scope.openPrivacy = function ($event) {
        window.open('http://m.sworkit.com/privacy.html', '_blank', 'location=yes,AllowInlineMediaPlayback=yes,toolbarposition=top');
      }

      $scope.openTerms = function ($event) {
        window.open('http://m.sworkit.com/TOS.html', '_blank', 'location=yes,AllowInlineMediaPlayback=yes,toolbarposition=top');
      }

      $scope.$on('$ionicView.enter', function () {
        if (device) cordova.plugins.Keyboard.disableScroll(true);
      })
      $scope.$on('$ionicView.leave', function () {
        if (device) cordova.plugins.Keyboard.disableScroll(false);
      })

      $scope.setSignUpDateLang = function () {
        var dateNow = new Date();
        var timeNow = dateNow.getTime();
        PersonalData.GetUserProfile.signUpDate = timeNow;
        PersonalData.GetUserProfile.defaultLang = PersonalData.GetUserSettings.preferredLanguage;
      }

    })

    .controller('ExtraInfoCtrl', function ($scope, $timeout, $translate, $location, AppSyncService, $q) {

      $scope.user = PersonalData.GetUserProfile;
      $scope.userSettings = PersonalData.GetUserSettings;
      if ($scope.user.birthYear == '') {
        $scope.user.birthYear = 1980;
      }
      $scope.displayWeight = {data: 0};
      $scope.weightTypes = [{id: 0, title: 'LBS'}, {id: 1, title: 'KGS'}]
      $scope.selectedType = {data: $scope.weightTypes[$scope.userSettings.weightType]};
      $scope.convertWeight = function () {
        if ($scope.userSettings.weightType == 0) {
          $scope.displayWeight.data = $scope.userSettings.weight;
        } else {
          $scope.displayWeight.data = Math.round(($scope.userSettings.weight / 2.20462));
        }
      }
      $scope.$watch('selectedType.data', function (newValue, oldValue) {
        if (!isNaN(newValue.id)) {
          $scope.userSettings.weightType = newValue.id;
        }
        $scope.convertWeight();
      })
      $scope.$watch('displayWeight.data', function (val) {
        if ($scope.userSettings.weightType == 0) {
          $scope.userSettings.weight = $scope.displayWeight.data;
        } else {
          $scope.userSettings.weight = Math.round(($scope.displayWeight.data * 2.20462));
        }
      })

      $scope.extraInfoSubmit = function (extraForm) {
        persistMultipleObjects($q, {
          'userSettings': PersonalData.GetUserSettings,
          'userProfile': PersonalData.GetUserProfile
        }, function () {
          AppSyncService.syncLocalForageObject('userProfile', null, PersonalData.GetUserProfile);
          AppSyncService.syncLocalForageObject('userSettings', [
            'lastLength',
            'mfpAccessToken',
            'mfpRefreshToken',
            'mfpStatus',
            'mfpWeight',
            'weight',
            'weightType'
          ], PersonalData.GetUserSettings);
        });
        $location.path('/app/auth/extra-info-goals');
      }

      $timeout(function () {
        $scope.convertWeight();
      }, 1800)

    })

    .controller('ExtraInfoGoalsCtrl', function ($scope, $timeout, $translate, $location, AppSyncService, $q) {

      $scope.user = PersonalData.GetUserProfile;

      $scope.goalList = [
        {short: "GOAL_HEALTH", checked: false},
        {short: "GOAL_LOSE", checked: false},
        {short: "GOAL_BUILD", checked: false},
        {short: "GOAL_TONE", checked: false},
        {short: "GOAL_SPORTS", hecked: false},
        {short: "GOAL_FLEXIBILITY", checked: false},
        {short: "GOAL_INJURY", checked: false}
      ];

      $scope.getGoals = function (goalArray, callback) {
        var deferred = $q.defer();
        var promise = deferred.promise;
        promise.then(function () {
          $scope.user.goals = [];
          angular.forEach(goalArray, function (value, key) {
            if (value.checked) {
              $scope.user.goals.push(value.short);
            }
          });
        }).then(function () {
          callback();
        });
        deferred.resolve();
      };

      $scope.updateCheckedGoals = function () {
        angular.forEach($scope.user.goals, function (value, key) {
          angular.forEach($scope.goalList, function (_value, _key) {
            if (_value.short == value) {
              _value.checked = true;
            }
          });
        });
      }

      $scope.extraInfoSubmit = function (extraForm) {
        $scope.getGoals($scope.goalList, function () {
          persistMultipleObjects($q, {
            'userProfile': PersonalData.GetUserProfile
          }, function () {
            AppSyncService.syncLocalForageObject('userProfile', null, PersonalData.GetUserProfile);
          });
          $location.path('/app/auth/profile');
        });
      }

      $timeout(function () {
        $scope.updateCheckedGoals();
      }, 1000)

    })

    .controller('ForgotPasswordCtrl', function ($scope, $translate, $location, FirebaseService) {

      $scope.user = {
        email: null,
        password: null
      }

      $scope.data = {
        loading: false
      }

      $scope.error = false;

      $scope.requestNewPassword = function () {
        $scope.data.loading = true;
        FirebaseService.auth.$resetPassword({
          email: $scope.user.email
        }).then(function () {
          console.log("Password reset email sent successfully!");
          $scope.error = $translate.instant('PASS_SENT');
          $scope.data.loading = false;
          $location.path('/app/auth/edit-profile');
        }).catch(function (error) {
          $scope.error = $translate.instant(error.code);
          console.error("Error: ", error);
          $scope.data.loading = false;
        });
      };
    })

    .controller('ProfileCtrl', function ($scope, $ionicModal, $ionicPopup, $cordovaCamera, $translate, $location, $rootScope, $ionicActionSheet, $q, $timeout, FirebaseService, AppSyncService, AchievementService, $log, WorkoutService) {

      $scope.init = function () {
        $scope.user = PersonalData.GetUserProfile;
        $scope.userSettings = PersonalData.GetUserSettings;

        $scope.toggle = {
          showGoals: false
        };

        $scope.goalList = [
          {short: "GOAL_HEALTH", checked: false},
          {short: "GOAL_LOSE", checked: false},
          {short: "GOAL_BUILD", checked: false},
          {short: "GOAL_TONE", checked: false},
          {short: "GOAL_SPORTS", checked: false},
          {short: "GOAL_FLEXIBILITY", checked: false},
          {short: "GOAL_INJURY", checked: false}
        ];

        $scope.updateCheckedGoals();

        $scope.goldStatus = 30;
        $scope.silverStatus = 15;
        $scope.bronzeStatus = 5;

        $scope.listOptions = [
          {text: $translate.instant('ALLTIME'), value: "all"},
          {text: $translate.instant('TODAY'), value: "today"},
          {text: $translate.instant('THISWEEK'), value: "week"},
          {text: $translate.instant('PAST30'), value: "month"}
        ];

        $scope.optionSelected = {
          listType: 'all'
        };

        $scope.show_hidden_actions = false;
        $scope.updateStats();
        $scope.resetData();
      };

      $scope.toggleHiddenActions = function () {
        $scope.show_hidden_actions = !$scope.show_hidden_actions;
      };

      $scope.handleLogOutData = function () {
        $ionicPopup.confirm({
          title: $translate.instant('WORKOUT_LOG'),
          template: '<p class="centered">' + $translate.instant("WHATLOG") + '</p>',
          okType: 'energized',
          okText: $translate.instant("KEEPDEVICE"),
          cancelText: $translate.instant("RMDEVICE")
        }).then(function (res) {
          if (!res) {
            $scope.removeWorkoutLogs();
          }
          WorkoutService.lockForLogOutAccount();
          $location.path('/app/auth/welcome');
          FirebaseService.auth.$unauth();
          PersonalData.GetUserProfile = angular.copy(defaultNewProfileData);
          localforage.setItem('userProfile', PersonalData.GetUserProfile);
          //TODO: The workouts stay in storage, but we probably need to remove the sync_id so that they don't get deleted if another user logs in
          localforage.keys(function (keys) {
            // Returns array of all the localforage key names, old localforage syntax needed
            angular.forEach(keys, function (value, key) {
              if (value.indexOf("sync_") > -1) {
                localforage.removeItem(value, function () {
                  console.log('Removed localforage sync item: ', value);
                })
              }
            })
          });
          $scope.hideEditProfile();
        });
      };

      $scope.logOut = function () {
        $ionicPopup.confirm({
          title: $translate.instant('LOGOUTQ'),
          template: '<p class="centered">' + $translate.instant('SURELOGOUT') + '</p>',
          okType: 'energized',
          okText: $translate.instant('OK'),
          cancelText: $translate.instant('CANCEL_SM')
        }).then(function (res) {
          if (res) {
            $timeout(function () {
              $scope.handleLogOutData();
            }, 500)
          }
        });
      };

      $scope.removeWorkoutLogs = function () {
        var deleteLog = function (tx, results) {
          for (var i = 0; i < results.rows.length; i++) {
            $scope.deleteMaxLog();
          }
        }
        db.transaction(
            function (transaction) {
              //REMEMBER: This needs to become SworkitFree for Lite
              transaction.executeSql("SELECT * FROM Sworkit",
                  [],
                  deleteLog,
                  null)
            }
        );
      };

      $scope.deleteMaxLog = function () {
        //REMEMBER: This needs to become SworkitFree for Lite
        window.db.transaction(function (transaction) {
          transaction.executeSql('DELETE FROM Sworkit WHERE sworkit_id = (SELECT MAX(sworkit_id) FROM Sworkit)');
        });
      };

      $scope.changePhoto = function () {
        if (device && device.platform.toLowerCase() == 'ios') {
          $timeout(function () {
            $ionicActionSheet.show({
              buttons: [
                {text: $translate.instant("TAKEPHOTO")},
                {text: $translate.instant("CHOOSEPHOTO")},
              ],
              cancelText: $translate.instant("CANCEL_SM"),
              buttonClicked: function (indexNum) {
                $scope.upload(indexNum);
                return true;
              },
              cancel: function (indexNum) {
                return true;
              }
            });
          }, 200);
        } else {
          $scope.actionPopup = $ionicPopup.show({
            title: '',
            subTitle: '',
            scope: $scope,
            template: '<div class="action-button" style="padding-bottom:10px"><button class="button button-full button-stable" ng-click="upload(0)">' + $translate.instant("TAKEPHOTO") + '</button><button class="button button-full button-stable" ng-click="upload(1)">' + $translate.instant("CHOOSEPHOTO") + '</button><button class="button button-full button-stable cancel-button" ng-click="popupClose()" >{{"CANCEL_SM" | translate}}</button></div>'
          });
        }
      };

      $scope.upload = function (source) {
        if ($scope.actionPopup) {
          $scope.actionPopup.close();
        }

        if (source == 1) {
          var pictureSource = Camera.PictureSourceType.PHOTOLIBRARY
        } else {
          var pictureSource = Camera.PictureSourceType.CAMERA;
        }

        if (device) {
          var options = {
            quality: 75,
            destinationType: Camera.DestinationType.DATA_URL,
            sourceType: pictureSource,
            allowEdit: true,
            encodingType: Camera.EncodingType.JPEG,
            popoverOptions: CameraPopoverOptions,
            targetWidth: 500,
            targetHeight: 500,
            cameraDirection: 1,
            saveToPhotoAlbum: false
          };
          $cordovaCamera.getPicture(options).then(function (imageData) {
            console.log('Image uploaded: ' + imageData);
            PersonalData.GetUserProfile.photo = "data:image/jpeg;base64," + imageData;
            $scope.user.photo = PersonalData.GetUserProfile.photo;
          }, function (error) {
            console.error(error);
          });
        }
      };

      $scope.popupClose = function () {
        $scope.actionPopup.close();
      };

      $scope.updateStats = function () {

        $scope.recentWorkouts = [];

        $scope.displayStats = {
          averageDuration: 0,
          totalSessions: 0,
          totalMinutes: 0,
          totalCalories: 0,
          goldCount: 0,
          silverCount: 0,
          bronzeCount: 0
        }

        $scope.statsTotal = {
          averageDuration: 0,
          totalSessions: 0,
          totalMinutes: 0,
          totalCalories: 0,
          goldCount: 0,
          silverCount: 0,
          bronzeCount: 0
        }

        $scope.stats30 = {
          averageDuration: 0,
          totalSessions: 0,
          totalMinutes: 0,
          totalCalories: 0,
          goldCount: 0,
          silverCount: 0,
          bronzeCount: 0
        }

        $scope.stats7 = {
          averageDuration: 0,
          totalSessions: 0,
          totalMinutes: 0,
          totalCalories: 0,
          goldCount: 0,
          silverCount: 0,
          bronzeCount: 0
        }

        $scope.statsToday = {
          averageDuration: 0,
          totalSessions: 0,
          totalMinutes: 0,
          totalCalories: 0,
          goldCount: 0,
          silverCount: 0,
          bronzeCount: 0
        }

        db.transaction(
            function (transaction) {
              //REMEMBER: This needs to become SworkitFree for Lite
              transaction.executeSql("SELECT * FROM Sworkit",
                  [],
                  presentStats,
                  null)
            }
        );
        function presentStats(tx, results) {
          var todayOnly = $scope.getToday();
          var sevenDaysPast = $scope.getPastDate(7);
          var thisWeek = AchievementService.getWeekStart(todayOnly);
          var thirtyDaysPast = $scope.getPastDate(30);
          var allWorkouts = [];
          var workoutsByDate = {};
          var month_names_short = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          for (var i = 0; i < results.rows.length; i++) {
            var workoutDate = results.rows.item(i)['created_on'].split(/[- :]/);
            var thisDay = new Date(workoutDate[0], workoutDate[1] - 1, workoutDate[2], 0, 0, 0, 0);
            thisDay = thisDay.getTime();
            workoutDate = new Date(workoutDate[0], workoutDate[1] - 1, workoutDate[2], workoutDate[3], workoutDate[4], workoutDate[5]);
            if (workoutsByDate[thisDay]) {
              workoutsByDate[thisDay].minutes = workoutsByDate[thisDay].minutes + results.rows.item(i)['minutes_completed']
              workoutsByDate[thisDay].calories = workoutsByDate[thisDay].calories + results.rows.item(i)['calories']
            } else {
              workoutsByDate[thisDay] = {
                minutes: results.rows.item(i)['minutes_completed'],
                calories: results.rows.item(i)['calories']
              }
            }

            allWorkouts.push(results.rows.item(i));
            allWorkouts[i].workoutDate = workoutDate;

            if (thisDay === todayOnly.getTime()) {
              $scope.statsToday.totalSessions++;
            }
            if (workoutDate.getTime() >= thisWeek.getTime()) {
              $scope.stats7.totalSessions++;
            }
            if (workoutDate.getTime() >= thirtyDaysPast.getTime()) {
              $scope.stats30.totalSessions++;
            }
            $scope.statsTotal.totalSessions++;

            if (i == results.rows.length - 1) {
              allWorkouts.sort(function (a, b) {
                return new Date(b.workoutDate) - new Date(a.workoutDate);
              });
              createStats();
              $scope.streakCount = AchievementService.getStreakCount(workoutsByDate, todayOnly);
            }
          }

          function createStats() {
            _.each(workoutsByDate, function (statValues, dateKey) {
              //console.log(dateKey);
              //console.log(todayOnly.getTime());
              if (dateKey >= todayOnly.getTime()) {
                $scope.statsToday.totalMinutes += statValues.minutes;
                $scope.statsToday.totalCalories += statValues.calories;
                if (statValues.minutes >= $scope.goldStatus) {
                  $scope.statsToday.goldCount++;
                } else if (statValues.minutes >= $scope.silverStatus) {
                  $scope.statsToday.silverCount++;
                } else if (statValues.minutes >= $scope.bronzeStatus) {
                  $scope.statsToday.bronzeCount++;
                }
              }
              if (dateKey >= thisWeek.getTime()) {
                $scope.stats7.totalMinutes += statValues.minutes;
                $scope.stats7.totalCalories += statValues.calories;
                if (statValues.minutes >= $scope.goldStatus) {
                  $scope.stats7.goldCount++;
                } else if (statValues.minutes >= $scope.silverStatus) {
                  $scope.stats7.silverCount++;
                } else if (statValues.minutes >= $scope.bronzeStatus) {
                  $scope.stats7.bronzeCount++;
                }
              }
              if (dateKey >= thirtyDaysPast.getTime()) {
                $scope.stats30.totalMinutes += statValues.minutes;
                $scope.stats30.totalCalories += statValues.calories;
                if (statValues.minutes >= $scope.goldStatus) {
                  $scope.stats30.goldCount++;
                } else if (statValues.minutes >= $scope.silverStatus) {
                  $scope.stats30.silverCount++;
                } else if (statValues.minutes >= $scope.bronzeStatus) {
                  $scope.stats30.bronzeCount++;
                }
              }
              $scope.statsTotal.totalMinutes += statValues.minutes;
              $scope.statsTotal.totalCalories += statValues.calories;
              if (statValues.minutes >= $scope.goldStatus) {
                $scope.statsTotal.goldCount++;
              } else if (statValues.minutes >= $scope.silverStatus) {
                $scope.statsTotal.silverCount++;
              } else if (statValues.minutes >= $scope.bronzeStatus) {
                $scope.statsTotal.bronzeCount++;
              }
            }, function (err) {

            });

            $scope.statsToday.averageDuration = Math.round($scope.statsToday.totalMinutes / $scope.statsToday.totalSessions);
            $scope.stats7.averageDuration = Math.round($scope.stats7.totalMinutes / $scope.stats7.totalSessions);
            $scope.stats30.averageDuration = Math.round($scope.stats30.totalMinutes / $scope.stats30.totalSessions);
            $scope.statsTotal.averageDuration = Math.round($scope.statsTotal.totalMinutes / $scope.statsTotal.totalSessions);
            $scope.setDisplayedStats('all');

            var numRecentWorkouts = allWorkouts.length > 3 ? 3 : allWorkouts.length;
            for (var wkout = 0; wkout < numRecentWorkouts; wkout++) {
              $scope.recentWorkouts.push(allWorkouts[wkout]);
              $scope.recentWorkouts[wkout].typeName = LocalData.GetWorkoutTypes[allWorkouts[wkout]['type']].activityNames;

              if (!device || (isUSA && $scope.userSettings.preferredLanguage == 'EN' && true)) {
                var useDate = allWorkouts[wkout]['created_on'].split(/[- :]/);
                createdDate = new Date(useDate[0], useDate[1] - 1, useDate[2], useDate[3], useDate[4], useDate[5]);
                var ampm = (createdDate.getHours() > 11) ? "pm" : "am";
                var useHour = (createdDate.getHours() > 12) ? createdDate.getHours() - 12 : createdDate.getHours();
                var useMinute = (createdDate.getMinutes() < 10) ? "0" + createdDate.getMinutes() : createdDate.getMinutes();
                createdDate = month_names_short[createdDate.getMonth()] + ' ' + createdDate.getDate() + ', ' + useHour + ":" + useMinute + " " + ampm;
                $scope.recentWorkouts[wkout].created_on = createdDate;
              } else {
                var useDate = results.rows.item(i)['created_on'].split(/[- :]/);
                useDate = new Date(useDate[0], useDate[1] - 1, useDate[2], useDate[3], useDate[4], useDate[5]);
                $scope.recentWorkouts[wkout].created_on = useDate;
              }
              if (!LocalData.GetWorkoutTypes[results.rows.item(i)['type']].activityNames) {
                $scope.recentWorkouts[wkout].typeName = $translate.instant('CUSTOM_SM');
              }

              var wt = $scope.recentWorkouts[wkout].typeName;
              if (wt == 'FULL' || wt == 'UPPER' || wt == 'CORE' || wt == 'LOWER' || wt == 'SEVEN_MINUTE' || wt == 'RUMP' || wt == 'QUICK') {
                $scope.recentWorkouts[wkout].background = 'strength-color.jpg';
                $scope.recentWorkouts[wkout].goToLocation = 'app.workout-length({ categoryId: 0, typeId:"' + $scope.recentWorkouts[0].type + '"})';
              } else if (wt == 'CARDIO_LIGHT' || wt == 'CARDIO_FULL' || wt == 'PLYOMETRICS' || wt == 'BRING_PAIN' || wt == 'BOOT_CAMP') {
                $scope.recentWorkouts[wkout].background = 'cardio-color.jpg';
                $scope.recentWorkouts[wkout].goToLocation = 'app.workout-length({ categoryId: 1, typeId:"' + $scope.recentWorkouts[0].type + '"})';
              } else if (wt == 'SUN_SALUTATION' || wt == 'FULL_SEQ' || wt == 'RUNNER_YOGA' || wt == 'PILATES') {
                $scope.recentWorkouts[wkout].background = 'yoga-color.jpg';
                $scope.recentWorkouts[wkout].goToLocation = 'app.workout-length({ categoryId: 2, typeId:"' + $scope.recentWorkouts[0].type + '"})';
              } else if (wt == 'HEAD_TOE' || wt == 'STRETCH' || wt == 'STANDING' || wt == 'BACK_STRENGTH' || wt == 'OFFICE' || wt == 'ANYTHING') {
                $scope.recentWorkouts[wkout].background = 'stretch-color.jpg';
                $scope.recentWorkouts[wkout].goToLocation = 'app.workout-length({ categoryId: 3, typeId:"' + $scope.recentWorkouts[0].type + '"})';
              } else {
                $scope.recentWorkouts[wkout].background = 'cardio-dark.jpg';
                $scope.recentWorkouts[wkout].goToLocation = 'app.workout-custom'
              }

            }

          }

        }

      };

      $scope.setDisplayedStats = function (statsSelected) {
        if (statsSelected == 'today') {
          $scope.displayStats = $scope.statsToday;
        } else if (statsSelected == 'week') {
          $scope.displayStats = $scope.stats7;
        } else if (statsSelected == 'month') {
          $scope.displayStats = $scope.stats30;
        } else {
          $scope.displayStats = $scope.statsTotal;
        }
      }

      $scope.getToday = function () {
        var date = new Date();
        var utc_now = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds());
        utc_now.setHours(0);
        utc_now.setMinutes(0);
        utc_now.setSeconds(0);
        utc_now.setMilliseconds(0);
        return utc_now;
      }

      $scope.getPastDate = function (numDays) {
        var date = new Date();
        var last = new Date(date.getTime() - (numDays * 24 * 60 * 60 * 1000));
        var lastMidnight = new Date(last.getFullYear(), last.getMonth(), last.getDate());
        return lastMidnight;
      }

      $ionicModal.fromTemplateUrl('templates/login/partials/edit-profile.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function (modal) {
        $scope.edit_profile_modal = modal;
      });

      $ionicModal.fromTemplateUrl('templates/login/partials/change-password.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function (modal) {
        $scope.change_password_modal = modal;
      });

      $ionicModal.fromTemplateUrl('templates/login/partials/change-email.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function (modal) {
        $scope.change_email_modal = modal;
      });

      $scope.showEditProfile = function () {
        $scope.edit_profile_modal.show();
        $scope.userClone = cloneObject($scope.user);
        $scope.updateCheckedGoals();
        if (device) cordova.plugins.Keyboard.disableScroll(true);
      };

      $scope.hideEditProfile = function () {
        $scope.edit_profile_modal.hide();
        if (device) cordova.plugins.Keyboard.disableScroll(false);
      };

      $scope.cancelEdit = function () {
        if ($scope.user.authType !== "email") {
          $scope.user.email = $scope.userClone.email;
        }

        $scope.user.birthYear = $scope.userClone.birthYear;
        $scope.user.gender = $scope.userClone.gender;
        $scope.user.goals = $scope.userClone.goals;
        $scope.user.firstName = $scope.userClone.firstName;
        $scope.user.lastName = $scope.userClone.lastName;
        $scope.user.photo = $scope.userClone.photo;

        $scope.hideEditProfile();
      }

      $scope.saveProfileEdit = function (signUpForm) {
        if (signUpForm.$valid) {
          $scope.getGoals($scope.goalList, function () {
            PersonalData.GetUserProfile = $scope.user;
            persistMultipleObjects($q, {
              'userProfile': PersonalData.GetUserProfile
            }, function () {
              AppSyncService.syncStoredData();
            });
            $scope.hideEditProfile();
          });
        } else {
          signUpForm.submitted = true;
          console.log('Profile Data Invalid');
        }
      }

      $scope.changePassword = function () {
        $scope.change_password_modal.show();
      }

      $scope.cancelChangePassword = function () {
        $scope.resetData();
        $scope.change_password_modal.hide();
      }

      $scope.cancelPasswordEmail = function () {
        $scope.resetData();
        $scope.change_password_modal.hide();
      }

      $scope.forgotPassword = function () {
        $scope.hideEditProfile();
        $scope.change_password_modal.hide();
        $location.path('/app/auth/forgot-password');
      }

      $scope.confirmPasswordChange = function (passwordForm) {
        passwordForm.submitted = true;
        if (!passwordForm.password.$invalid && !passwordForm.newPassword.$invalid) {
          $scope.data.loading = true;
          FirebaseService.ref.changePassword({
            email: $scope.user.email,
            oldPassword: $scope.data.password,
            newPassword: $scope.data.newPassword
          }, function (error) {
            if (error) {
              if (error.code == "INVALID_PASSWORD") {
                $scope.data.incorrectPassword = true;
              } else {
                $scope.data.errorMessage = $translate.instant(error.code);
              }
              console.error("Error: ", error);
              $scope.data.loading = false;
            } else {
              $scope.data.errorMessage = false;
              $scope.data.incorrectPassword = false;
              $scope.cancelPasswordEmail();
              console.log("Password changed successfully!");
              $scope.data.loading = false;
            }
          })
        }
      }

      $scope.changeEmail = function () {
        $scope.change_email_modal.show();
      }

      $scope.cancelChangeEmail = function () {
        $scope.resetData();
        $scope.change_email_modal.hide();
      }

      $scope.confirmEmailChange = function (emailForm) {
        emailForm.submitted = true;
        if (!$scope.data.password.$invalid && !emailForm.newEmail.$invalid) {
          $scope.data.loading = true;
          FirebaseService.auth.$changeEmail({
            oldEmail: $scope.user.email,
            newEmail: $scope.data.newEmail,
            password: $scope.data.password
          }).then(function () {
            $scope.data.errorMessage = false;
            $scope.user.email = $scope.data.newEmail;
            PersonalData.GetUserProfile.email = $scope.data.newEmail;
            $scope.cancelChangeEmail();
            $scope.data.loading = false;
          }).catch(function (error) {
            console.error("Error: ", error);
            $scope.data.errorMessage = $translate.instant(error.code);
            $scope.data.loading = false;
          });
        }
      }

      $scope.refreshData = function () {
        AppSyncService.syncStoredData();
        AppSyncService.syncWebSqlWorkoutLog();
        AppSyncService.syncLocalForageCustomWorkouts();
        //TODO: Full stats update may be overkill, can we do this smarter?
        //TODO URGENT: replace this timeout with a promise from AppSyncService
        $timeout(function () {
          $scope.updateStats();
          $scope.optionSelected.listType = 'all'
          $scope.$broadcast('scroll.refreshComplete');
        }, 2000)
      }

      $scope.resetData = function () {
        $scope.data = {
          errorMessage: false,
          newEmail: '',
          password: '',
          newPassword: '',
          loading: false
        }
      }

      $scope.getGoals = function (goalArray, callback) {
        var deferred = $q.defer();
        var promise = deferred.promise;
        promise.then(function () {
          $scope.user.goals = [];
          angular.forEach(goalArray, function (value, key) {
            if (value.checked) {
              $scope.user.goals.push(value.short);
            }
          });
        }).then(function () {
          callback();
        });
        deferred.resolve();
      };

      $scope.updateCheckedGoals = function () {
        angular.forEach($scope.user.goals, function (value, key) {
          angular.forEach($scope.goalList, function (_value, _key) {
            if (_value.short == value) {
              _value.checked = true;
            }
          });
        });
      }

      $scope.showProgress = function () {
        $location.path('/app/progress');
      }

      $scope.init();

    })

    .controller('ProgressCtrl', function ($scope, $location, $ionicPlatform, $translate, UserService) {
      $scope.totals = {
        'totalEver': 0,
        'todayMinutes': 0,
        'todayMinutesRounded': 0,
        'todayCalories': 0,
        'weeklyMinutes': 0,
        'weeklyCalories': 0,
        'totalMonthMin': 0,
        'topMinutes': 0,
        'topCalories': 0,
        'topDayMins': '',
        'topDayCals': ''
      };
      $scope.goalSettings = UserService.getGoalSettings();
      buildStats($scope, $translate);
      logActionSessionM('View Progress');
      if (device) {
        navigator.globalization.getLocaleName(
            function (returnResult) {
              var returnCountry;
              if (ionic.Platform.isAndroid()) {
                returnCountry = returnResult.value[2];
              } else {
                returnCountry = returnResult.value;
              }
              if (returnCountry.slice(-2).toUpperCase() == 'US') {
                isUSA = true;
              } else {
                isUSA = false;
              }
            },
            function (error) {
              isUSA = false;
            }
        )
      }
    })

    .controller('LogCtrl', function ($scope, $ionicLoading, $location, $stateParams, $translate, $ionicPlatform, $ionicPopup, $ionicListDelegate, $http, UserService, AppSyncService) {
      $ionicLoading.show({
        template: $translate.instant('LOADING_W')
      });
      $scope.noLogs = false;
      $scope.userSettings = UserService.getUserSettings();
      db.transaction(
          function (transaction) {
            transaction.executeSql("SELECT * FROM Sworkit",
                [],
                $scope.createLog,
                null)
          }
      );
      $scope.createLog = function (tx, results) {
        $scope.allLogs = [];
        if (results.rows.length == 0) {
          $scope.noLogs = true;
          $ionicLoading.hide();
        }
        //TODO: Translate these months and use proper date format
        var month_names_short = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        var totalRows = 0;
        for (var i = results.rows.length - 1; i > -1; i--) {
          var createdDate;
          var wasError = false;
          var workoutDate = results.rows.item(i)['created_on'].split(/[- :]/);
          workoutDate = new Date(workoutDate[0], workoutDate[1] - 1, workoutDate[2], workoutDate[3], workoutDate[4], workoutDate[5]);
          var useID = results.rows.item(i)['sworkit_id'];
          var activityTitle = LocalData.GetWorkoutTypes[results.rows.item(i)['type']].activityNames;
          var useCalories = results.rows.item(i)['calories'];
          var useMinutes = results.rows.item(i)['minutes_completed'];
          if (!device || (isUSA && $scope.userSettings.preferredLanguage == 'EN' && true)) {
            var useDate = results.rows.item(i)['created_on'].split(/[- :]/);
            createdDate = new Date(useDate[0], useDate[1] - 1, useDate[2], useDate[3], useDate[4], useDate[5]);
            var ampm = (createdDate.getHours() > 11) ? "pm" : "am";
            var useHour = (createdDate.getHours() > 12) ? createdDate.getHours() - 12 : createdDate.getHours();
            var useMinute = (createdDate.getMinutes() < 10) ? "0" + createdDate.getMinutes() : createdDate.getMinutes();
            createdDate = month_names_short[createdDate.getMonth()] + ' ' + createdDate.getDate() + ', ' + useHour + ":" + useMinute + " " + ampm;
            if (!activityTitle) {
              activityTitle = "Workout";
            }
            $scope.allLogs.push({
              'id': useID,
              'createdDate': createdDate,
              'useMinutes': useMinutes,
              'activityTitle': activityTitle,
              'useCalories': useCalories,
              'workoutDate': workoutDate
            })
            totalRows++;
            if (totalRows = results.rows.length) {
              $ionicLoading.hide();
            }
          } else {
            var useDate = results.rows.item(i)['created_on'].split(/[- :]/);
            useDate = new Date(useDate[0], useDate[1] - 1, useDate[2], useDate[3], useDate[4], useDate[5]);
            if (!activityTitle) {
              activityTitle = "Workout";
            }
            $scope.allLogs.push({
              'id': useID,
              'createdDate': useDate.toLocaleString(),
              'useMinutes': useMinutes,
              'activityTitle': activityTitle,
              'useCalories': useCalories,
              'workoutDate': workoutDate
            })
            totalRows++;
            if (totalRows = results.rows.length) {
              $ionicLoading.hide();
            }
          }
          if (i == 0) {
            $scope.allLogs.sort(function (a, b) {
              return new Date(b.workoutDate) - new Date(a.workoutDate);
            });
          }
        }

      }
      $scope.syncRow = function (rowId) {
        var fakeData = {
          "sworkit_id": 44,
          "created_on": "2014-06-26 14:08:06",
          "minutes_completed": 0,
          "calories": 0,
          "type": "fullBody",
          "utc_created": "2014-06-26 13:08:06"
        }
        db.transaction(function (transaction) {
          transaction.executeSql('SELECT * FROM Sworkit WHERE sworkit_id = ?', [rowId],
              function (tx, results) {
                var syncableWorkout = results.rows.item(0);
                var dateString = syncableWorkout["utc_created"];
                var actionString = "log_cardio_exercise";
                var accessString = PersonalData.GetUserSettings.mfpAccessToken;
                var appID = "79656b6e6f6d";
                var exerciseID = LocalData.GetWorkoutTypes[syncableWorkout["type"]].activityMFP;
                var durationFloat = syncableWorkout["minutes_completed"] * 60000;
                var energyCalories = syncableWorkout["calories"];
                ;
                var unitCountry = "US";
                var statusMessage = "burned %CALORIES% calories doing %QUANTITY% minutes of " + $translate.instant(LocalData.GetWorkoutTypes[results.rows.item(0).type].activityNames) + " with Sworkit Pro";
                var dataPost = JSON.stringify({
                  'action': actionString,
                  'access_token': accessString,
                  'app_id': appID,
                  'exercise_id': exerciseID,
                  'duration': durationFloat,
                  'energy_expended': energyCalories,
                  'start_time': dateString,
                  'status_update_message': statusMessage,
                  'units': unitCountry
                });
                $http({
                  method: 'POST',
                  url: 'https://www.myfitnesspal.com/client_api/json/1.0.0?client_id=sworkit',
                  data: dataPost,
                  headers: {'Content-Type': 'application/json'}
                }).then(function (resp) {
                  showNotification('Successly logged to MyFitnessPal', 'button-calm', 2000);
                }, function (err) {
                  if ($scope) {
                    showNotification('Unable to log to MyFitnessPal', 'button-assertive', 2000);
                  }
                })
              },
              null);
        });
      }
      $scope.deleteRow = function (rowId) {
        if (device) {
          navigator.notification.confirm(
              'Are you sure you want to delete this workout?',
              function (buttonIndex) {
                if (buttonIndex == 2) {
                  doDeleteWorkout(rowId);
                  $ionicListDelegate.closeOptionButtons();
                }
              },
              'Delete Workout',
              ['Cancel', 'Delete']
          );
        } else {
          $ionicPopup.confirm({
            title: 'Delete Workout',
            template: '<p class="padding">Are you sure you want to delete this workout?</p>',
            okType: 'assertive',
            okText: 'Delete'
          }).then(function (res) {
            if (res) {
              doDeleteWorkout(rowId);
              $ionicListDelegate.closeOptionButtons();
            }
          });
        }
      }

      function doDeleteWorkout(rowId) {
        db.transaction(function (transaction) {
          transaction.executeSql('SELECT * FROM Sworkit WHERE sworkit_id = ?', [rowId], function (tx, results) {
            if (!results.rows || !results.rows.item(0)) {
              // alert('Unexpected error', rowId);  // TODO: for debugging, either remove after testing, or handle error if necessary
              console.error('Unexpected error', rowId, results);
              return;
            }
            var syncId = results.rows.item(0).sync_id;

            // delete locally
            db.transaction(function (transaction) {
              transaction.executeSql('DELETE FROM Sworkit WHERE sworkit_id = ?', [rowId]);
            });
            $scope.allLogs.forEach(function (element, index, array) {
              if (element.id == rowId) {
                $scope.allLogs.splice(index, 1);
              }
            });
            $scope.$apply();

            // delete remotely
            AppSyncService.remoteDeleteWebSqlWorkoutLog(syncId);

          });
        });
        return

      }
    })

    .controller('RemindersCtrl', function ($scope, $translate, UserService) {
      $scope.$on('$ionicView.enter', function () {
        angular.element(document.getElementsByClassName('bar-header')).addClass('blue-bar');
      });
      if (isNaN(LocalData.SetReminder.daily.minutes)) {
        LocalData.SetReminder.daily.minutes = 0;
      }
      if (isNaN(LocalData.SetReminder.daily.time)) {
        LocalData.SetReminder.daily.time = 7;
      }
      if (isNaN(LocalData.SetReminder.inactivity.minutes)) {
        LocalData.SetReminder.inactivity.minutes = 0;
      }
      if (isNaN(LocalData.SetReminder.inactivity.time)) {
        LocalData.SetReminder.inactivity.time = 7;
      }
      if (isNaN(LocalData.SetReminder.inactivity.frequency)) {
        LocalData.SetReminder.inactivity.frequency = 2;
      }
      $scope.reminderText = {message: ''};
      if (device) {
        window.plugin.notification.local.hasPermission(function (granted) {
          if (!granted) {
            $scope.reminderText.message = $translate.instant('UPDATE_REMINDER');
          }
        });
      }

      $scope.reminderTimes = {
        selected: 7,
        times: [{id: 0, real: '12', time: '12 am', short: 'am'}, {id: 1, real: '1', time: '1 am', short: 'am'}, {
          id: 2,
          real: '2',
          time: '2 am',
          short: 'am'
        }, {id: 3, real: '3', time: '3 am', short: 'am'}, {id: 4, real: '4', time: '4 am', short: 'am'}, {
          id: 5,
          real: '5',
          time: '5 am',
          short: 'am'
        }, {id: 6, real: '6', time: '6 am', short: 'am'}, {id: 7, real: '7', time: '7 am', short: 'am'}, {
          id: 8,
          real: '8',
          time: '8 am',
          short: 'am'
        }, {id: 9, real: '9', time: '9 am', short: 'am'}, {id: 10, real: '10', time: '10 am', short: 'am'}, {
          id: 11,
          real: '11',
          time: '11 am',
          short: 'am'
        }, {id: 12, real: '12', time: '12 pm', short: 'pm'}, {id: 13, real: '1', time: '1 pm', short: 'pm'}, {
          id: 14,
          real: '2',
          time: '2 pm',
          short: 'pm'
        }, {id: 15, real: '3', time: '3 pm', short: 'pm'}, {id: 16, real: '4', time: '4 pm', short: 'pm'}, {
          id: 17,
          real: '5',
          time: '5 pm',
          short: 'pm'
        }, {id: 18, real: '6', time: '6 pm', short: 'pm'}, {id: 19, real: '7', time: '7 pm', short: 'pm'}, {
          id: 20,
          real: '8',
          time: '8 pm',
          short: 'pm'
        }, {id: 21, real: '9', time: '9 pm', short: 'pm'}, {id: 22, real: '10', time: '10 pm', short: 'pm'}, {
          id: 23,
          real: '11',
          time: '11 pm',
          short: 'pm'
        }],
        reminder: false
      };
      $scope.inactivityTimes = {
        frequency: 2,
        selected: 7,
        times: [{id: 0, real: '12', time: '12 am', short: 'am'}, {id: 1, real: '1', time: '1 am', short: 'am'}, {
          id: 2,
          real: '2',
          time: '2 am',
          short: 'am'
        }, {id: 3, real: '3', time: '3 am', short: 'am'}, {id: 4, real: '4', time: '4 am', short: 'am'}, {
          id: 5,
          real: '5',
          time: '5 am',
          short: 'am'
        }, {id: 6, real: '6', time: '6 am', short: 'am'}, {id: 7, real: '7', time: '7 am', short: 'am'}, {
          id: 8,
          real: '8',
          time: '8 am',
          short: 'am'
        }, {id: 9, real: '9', time: '9 am', short: 'am'}, {id: 10, real: '10', time: '10 am', short: 'am'}, {
          id: 11,
          real: '11',
          time: '11 am',
          short: 'am'
        }, {id: 12, real: '12', time: '12 pm', short: 'pm'}, {id: 13, real: '1', time: '1 pm', short: 'pm'}, {
          id: 14,
          real: '2',
          time: '2 pm',
          short: 'pm'
        }, {id: 15, real: '3', time: '3 pm', short: 'pm'}, {id: 16, real: '4', time: '4 pm', short: 'pm'}, {
          id: 17,
          real: '5',
          time: '5 pm',
          short: 'pm'
        }, {id: 18, real: '6', time: '6 pm', short: 'pm'}, {id: 19, real: '7', time: '7 pm', short: 'pm'}, {
          id: 20,
          real: '8',
          time: '8 pm',
          short: 'pm'
        }, {id: 21, real: '9', time: '9 pm', short: 'pm'}, {id: 22, real: '10', time: '10 pm', short: 'pm'}, {
          id: 23,
          real: '11',
          time: '11 pm',
          short: 'pm'
        }],
        reminder: false
      };
      $scope.reminderMins = getMinutesObj();
      $scope.reminderMins.selected = $scope.reminderMins.times[LocalData.SetReminder.daily.minutes];
      $scope.reminderTimes.selected = $scope.reminderTimes.times[LocalData.SetReminder.daily.time];
      $scope.reminderTimes.reminder = LocalData.SetReminder.daily.status;
      $scope.inactivityMins = getMinutesObj();
      $scope.inactivityMins.selected = $scope.inactivityMins.times[LocalData.SetReminder.inactivity.minutes];
      $scope.inactivityTimes.selected = $scope.inactivityTimes.times[LocalData.SetReminder.inactivity.time];
      $scope.inactivityTimes.reminder = LocalData.SetReminder.inactivity.status;
      $scope.inactivityTimes.frequency = LocalData.SetReminder.inactivity.frequency;
      $scope.inactivityOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
      if (device) {
        window.plugin.notification.local.cancelAll();
      }
      var newDate = new Date();
      newDate.setHours($scope.reminderTimes.selected.id);
      newDate.setMinutes($scope.reminderMins.selected.id);
      var newDate2 = new Date();
      newDate2.setHours($scope.inactivityTimes.selected.id);
      newDate2.setMinutes($scope.inactivityMins.selected.id);

      $scope.datePickerOpen = function () {
        if (device) {
          datePicker.show(
              {
                "date": newDate,
                "mode": "time"
              },
              function (returnDate) {
                if (!isNaN(returnDate.getHours())) {
                  $scope.reminderTimes.selected = $scope.reminderTimes.times[returnDate.getHours()];
                  $scope.reminderMins.selected = $scope.reminderMins.times[returnDate.getMinutes()];
                  $scope.$apply();
                }
              }
          )
        }

      }
      $scope.datePicker2Open = function () {
        if (device) {
          datePicker.show(
              {
                "date": newDate2,
                "mode": "time"
              },
              function (returnDate) {
                if (!isNaN(returnDate.getHours())) {
                  $scope.inactivityTimes.selected = $scope.inactivityTimes.times[returnDate.getHours()];
                  $scope.inactivityMins.selected = $scope.inactivityMins.times[returnDate.getMinutes()];
                  $scope.$apply();
                }
              }
          )
        }

      }

      $scope.closeScreen = function ($event) {
        if (device) {
          LocalData.SetReminder.daily.time = $scope.reminderTimes.selected.id;
          LocalData.SetReminder.daily.minutes = $scope.reminderMins.selected.id;
          LocalData.SetReminder.daily.status = $scope.reminderTimes.reminder;
          LocalData.SetReminder.inactivity.time = $scope.inactivityTimes.selected.id;
          LocalData.SetReminder.inactivity.minutes = $scope.inactivityMins.selected.id;
          LocalData.SetReminder.inactivity.status = $scope.inactivityTimes.reminder;
          LocalData.SetReminder.inactivity.frequency = $scope.inactivityTimes.frequency;
          if (($scope.reminderTimes.reminder || $scope.inactivityTimes.reminder) && ionic.Platform.isIOS()) {
            window.plugin.notification.local.hasPermission(function (granted) {
              if (!granted) {
                window.plugin.notification.local.promptForPermission();
              }
            });
          }
          if ($scope.reminderTimes.reminder) {
            var dDate = new Date();
            var tDate = new Date();
            dDate.setHours($scope.reminderTimes.selected.id);
            dDate.setMinutes($scope.reminderMins.selected.id);
            dDate.setSeconds(0);
            if ($scope.reminderTimes.selected.id <= tDate.getHours() && $scope.reminderMins.selected.id <= tDate.getMinutes()) {
              dDate.setDate(dDate.getDate() + 1);
            }
            window.plugin.notification.local.add({
              id: 1,
              date: dDate,    // This expects a date object
              message: $translate.instant('TIME_TO_SWORKIT'),  // The message that is displayed
              title: $translate.instant('WORKOUT_REM'),  // The title of the message
              repeat: 'daily',
              autoCancel: true,
              icon: 'ic_launcher',
              smallIcon: 'ic_launcher'
            });
            window.plugin.notification.local.onclick = function (id, state, json) {
              window.plugin.notification.local.cancel(1);
              var nDate = new Date();
              var tDate = new Date();
              nDate.setHours(LocalData.SetReminder.daily.time);
              nDate.setMinutes(LocalData.SetReminder.daily.minutes);
              nDate.setSeconds(0);
              if (tDate.getHours() <= nDate.getHours() && tDate.getMinutes() <= nDate.getMinutes()) {
                nDate.setDate(nDate.getDate() + 1);
              }
              $timeout(function () {
                window.plugin.notification.local.add({
                  id: 1,
                  date: nDate,    // This expects a date object
                  message: $translate.instant('TIME_TO_SWORKIT'),  // The message that is displayed
                  title: $translate.instant('WORKOUT_REM'),  // The title of the message
                  repeat: 'daily',
                  autoCancel: true,
                  icon: 'ic_launcher',
                  smallIcon: 'ic_launcher'
                });
              }, 2000);
            }
            logActionSessionM('SetReminder');
          }
          if ($scope.inactivityTimes.reminder) {
            var dDate = new Date();
            dDate.setHours($scope.inactivityTimes.selected.id);
            dDate.setMinutes($scope.inactivityMins.selected.id);
            dDate.setSeconds(0);
            dDate.setDate(dDate.getDate() + $scope.inactivityTimes.frequency);
            window.plugin.notification.local.add({
              id: 2,
              date: dDate,    // This expects a date object
              message: $translate.instant('TOO_LONG'),  // The message that is displayed
              title: $translate.instant('WORKOUT_REM'),  // The title of the message
              autoCancel: true,
              icon: 'ic_launcher',
              smallIcon: 'ic_launcher'
            });
            window.plugin.notification.local.onclick = function (id, state, json) {
              window.plugin.notification.local.cancel(2);
              var nDate = new Date();
              nDate.setHours(LocalData.SetReminder.inactivity.time);
              nDate.setMinutes(LocalData.SetReminder.inactivity.minutes);
              nDate.setSeconds(0);
              nDate.setDate(nDate.getDate() + $scope.inactivityTimes.frequency);
              $timeout(function () {
                window.plugin.notification.local.add({
                  id: 2,
                  date: nDate,    // This expects a date object
                  message: $translate.instant('TOO_LONG'),  // The message that is displayed
                  title: $translate.instant('WORKOUT_REM'),  // The title of the message
                  autoCancel: true,
                  icon: 'ic_launcher',
                  smallIcon: 'ic_launcher'
                });
              }, 2000);
            }
            logActionSessionM('SetReminder');
          }

          localforage.setItem('reminder', {
            daily: {
              status: $scope.reminderTimes.reminder,
              time: $scope.reminderTimes.selected.id,
              minutes: $scope.reminderMins.selected.id
            },
            inactivity: {
              status: $scope.inactivityTimes.reminder,
              time: $scope.inactivityTimes.selected.id,
              minutes: $scope.inactivityMins.selected.id,
              frequency: $scope.inactivityTimes.frequency
            }
          });
        }
      }

      $scope.$on('$ionicView.leave', function () {
        $scope.closeScreen();
        angular.element(document.getElementsByClassName('bar-header')).removeClass('blue-bar');
      });
    })

    .filter('rawHtml', function ($sce) {
      return function (val) {
        return $sce.trustAsHtml(val);
      };
    })

    .filter('range', function () {
      return function (input, start, end) {
        start = parseInt(start);
        end = parseInt(end);
        var direction = (start <= end) ? 1 : -1;
        while (start != end) {
          input.push(start);
          start += direction;
        }
        return input;
      };
    })

;
