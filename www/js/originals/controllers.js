angular.module('starter.controllers', [])

/*

ROADMAP FEATURES:


EXERCISE LIST FILTERING:
- Beginner, Intermediate, Advanced
- Ground, Standing
- Jumping, Not-Jumping2

BUGS
- Deleting Workout on Logs screen does not delete item - remove collection repeat?

*/

.controller('BodyCtrl', function($rootScope, $scope,$http,$location,$timeout,$translate, $ionicLoading,$ionicSideMenuDelegate, $stateParams, $interval, $q, AppSyncService) {
  window.cb = '';
  $scope.callCustom = function(url){
    var schemaParams = deparam(url);
    if (schemaParams["workout"]){
        $ionicLoading.show({
          template: $translate.instant('IMPORTING')
        });
        var getUrl = 'http://sworkitapi.herokuapp.com/workouts?s=' + schemaParams["workout"] + '&d=true';
        $http.get(getUrl).then(function(resp){
             if (resp.data.name){
               installWorkout(resp.data.name, resp.data.exercises, $location, $ionicSideMenuDelegate, $translate);
               $timeout(function(){
                var tempLocation = $location.$$url.slice(-7);
                $ionicLoading.hide();
                if (tempLocation !== "workout"){
                  $location.path('/app/home');
                  $ionicSideMenuDelegate.toggleLeft(false);
                }
                showNotification($translate.instant('CUSTOM_ADDED'), 'button-balanced', 2000);
               }, 1000)
               $timeout(function(){
                var tempLocation = $location.$$url.slice(-7);
                if (tempLocation !== "workout"){
                  $location.path('/app/custom');
                  $ionicSideMenuDelegate.toggleLeft(false);
                }
                logActionSessionM('ImportCustomWorkout');
               }, 2000)
             } else {
              $ionicLoading.hide();
                navigator.notification.alert(
                  $translate.instant('UNABLE'),  // message
                  nullHandler,         // callback
                  $translate.instant('INVALID'),            // title
                  $translate.instant('OK')                  // buttonName
                );
             }

           }, function(err) {
                $ionicLoading.hide();
                navigator.notification.alert(
                  $translate.instant('UNABLE'),  // message
                  nullHandler,         // callback
                  $translate.instant('INVALID'),            // title
                  $translate.instant('OK')                  // buttonName
                );
            })
    }
    else if (schemaParams["custom"]){
      var tempLocation = $location.$$url.slice(-7);
      if (tempLocation !== "workout"){
        $location.path('/app/custom');
        $ionicSideMenuDelegate.toggleLeft(false);
      }
    }
    else if(schemaParams["access_code"]){
        $ionicLoading.show({
          template: $translate.instant('AUTHORIZING')
        });
        myObj.code = schemaParams["access_code"];
        $timeout(function(){
                var tempLocation = $location.$$url.slice(-7);
                $ionicLoading.hide();
                if (tempLocation !== "workout"){
                  $location.path('/app/settings');
                  setTimeout(function(){$rootScope.childBrowserClosed()}, 500);
                }
               }, 1000)

        if (window.cb.close){
          window.cb.close();
        }
    }
    else if(schemaParams["mfperror"]){
        console.log('mfperror: ' + schemaParams);
        window.cb.close();
        $rootScope.childBrowserClosed();
    }
  }
  $scope.changeLanguage = function (langKey) {
    $translate.use(langKey);
  };

})

.controller('AppCtrl', function($rootScope,$scope,$ionicModal,$ionicSlideBoxDelegate,$translate, $timeout,$location,$stateParams,WorkoutService) {
  $scope.clickHome = function(){
    var tempURL = $location.$$url.substring(0,9);
    if (tempURL == '#/app/cust') {
      $location.path('/app/custom');
    } else if (tempURL !== '/app/home'){
      $location.path('/app/home');
    }
  }
  $scope.isItemActive = function(shortUrl) {
    var tempURL = '/app/' + shortUrl;
    return (tempURL == $location.$$path.substring(0,9));
  };
  $scope.showWelcome = function(){
    $ionicModal.fromTemplateUrl('welcome.html', function(modal) {
                                  $scope.welcomeModal = modal;
                                  }, {
                                  scope:$scope,
                                  animation: 'slide-in-up',
                                  focusFirstInput: false,
                                  backdropClickToClose: false
                                  });
    $scope.slideChanged = function(index) {
      $scope.slideIndex = index;
    };
    $scope.next = function() {
      $ionicSlideBoxDelegate.next();
    };
    $scope.previous = function() {
      $ionicSlideBoxDelegate.previous();
    };
    $scope.closeOpenNexercise = function(){
      $scope.closeModal();
    }
    $scope.openModal = function() {
      $scope.welcomeModal.show();
    };
    $scope.closeModal = function() {
      $scope.welcomeModal.hide();
    };
    $scope.$on('$ionicView.leave', function() {
      $scope.welcomeModal.remove();
    });
    $timeout(function(){
             $scope.openModal();
             }, 0);
  }
  $scope.downloadNexerciseMenu = function(){
    if (!isSamsung()){
      trackEvent('More Action', 'Install Nexercise', 0);
      setTimeout(function(){
        if (device.platform.toLowerCase() == 'ios') {
          window.open('http://nxr.cz/nex-ios', '_system', 'location=no,AllowInlineMediaPlayback=yes');
        }  else if (isAmazon()){
          window.appAvailability.check('com.amazon.venezia', function() {
               window.open('amzn://apps/android?p=com.nexercise.client.android', '_system')},function(){
               window.open(encodeURI("http://www.amazon.com/gp/mas/dl/android?p=com.nexercise.client.android"), '_system');}
               );
        } else {
        window.open('market://details?id=com.nexercise.client.android', '_system')
        }
      }, 400)
    }
  }
  $scope.launchStore = function(){
    window.open('http://www.ntensify.com/sworkit', '_blank', 'location=yes,AllowInlineMediaPlayback=yes,toolbarposition=top');
  }
})

.controller('HomeCtrl', function($rootScope, $scope, $timeout, $ionicSideMenuDelegate, $location, $translate, $ionicPopup, $ionicModal, $stateParams, UserService, WorkoutService) {
  LocalHistory.getCustomHistory.lastHomeURL = $location.$$url;
  $scope.title = "<img src='img/sworkit_logo.png'/>"
  $scope.timesUsedVar = parseInt(window.localStorage.getItem('timesUsed'));
  $scope.rewardSettings = UserService.getUserSettings();
  if ($scope.rewardSettings.preferredLanguage == undefined){
    localforage.getItem('userSettings', function (result){
      if (result !== null){
        $translate.use(result.preferredLanguage);
      }
    })
  }
  $scope.quickImage = {img:'quick-' + $translate.instant('LANGUAGE')};
  $rootScope.showPointsBadge = false;
  $rootScope.mPointsTotal = 0;
  $scope.rateAttempts = 0;
  $timeout(function(){
    $scope.rewardSettings = UserService.getUserSettings();
  }, 1000);
  $timeout(function(){
    $scope.rewardSettings = UserService.getUserSettings();
    if ($scope.rewardSettings.mPoints && device && $rootScope.sessionMAvailable){
      sessionm.phonegap.getUnclaimedAchievementCount(function callback(data) {
          $rootScope.showPointsBadge = (data.unclaimedAchievementCount > 0) ? true : false;
          $rootScope.mPointsTotal = data.unclaimedAchievementCount;
      });
    } else {
      $rootScope.showPointsBadge = false;
    }
    $scope.launchPopups();
    WorkoutService.downloadUnlockedExercises();
  }, 2500);


  $scope.launchMPoints = function(){
    if (device){
      sessionm.phonegap.presentActivity(2);
    }
  }
  $scope.launchPopups = function(){
    if (globalNew310Option){
        $scope.choosePopup();
        globalNew310Option = false;
        localforage.setItem('new310Home', false);
    } else if (globalRemindOption){
      globalRemindOption = false;
      localforage.setItem('remindHome', {show:false,past:true}, function(){
        var pDate = new Date();
        var pHour = (pDate.getHours() > 12) ? pDate.getHours() - 12 : pDate.getHours();
        var ampm = (pDate.getHours() > 11) ? $translate.instant('PM') : $translate.instant('AM');
        var pMinute = (pDate.getMinutes() < 10) ? "0" + pDate.getMinutes()  : pDate.getMinutes();
        var timeString = pHour + ':' + pMinute + ' ' + ampm;
        if (!LocalData.SetReminder.daily.status){
          $timeout(function(){
            $ionicPopup.confirm({
               title: $translate.instant('DAILY'),
               template: '<p class="padding">'+ $translate.instant('REMINDER_SET') + ' ' + timeString + '. ' + $translate.instant('REMINDER_CONT') +'</p>',
               okType: 'energized',
               okText: $translate.instant('OK'),
               cancelText: $translate.instant('OPTIONS')
             }).then(function(res) {
                  var dDate = new Date();
                  var tDate = new Date();
                  dDate.setSeconds(0);
                  dDate.setDate(dDate.getDate() + 1);
                  LocalData.SetReminder.daily.time = dDate.getHours();
                  LocalData.SetReminder.daily.minutes = dDate.getMinutes();
                  LocalData.SetReminder.daily.status = true;
                  window.plugin.notification.local.add({
                                                         id:         1,
                                                         date:       dDate,    // This expects a date object
                                                         message:    $translate.instant('TIME_TO_SWORKIT'),  // The message that is displayed
                                                         title:      $translate.instant('WORKOUT_REM'),  // The title of the message
                                                         repeat:     'daily',
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
                        if (tDate.getHours() <= nDate.getHours() && tDate.getMinutes() <= nDate.getMinutes()){
                            nDate.setDate(nDate.getDate() + 1);
                        }
                        $timeout( function (){window.plugin.notification.local.add({
                                                                               id:         1,
                                                                               date:       nDate,    // This expects a date object
                                                                               message:    $translate.instant('TIME_TO_SWORKIT'),  // The message that is displayed
                                                                               title:      $translate.instant('WORKOUT_REM'),  // The title of the message
                                                                               repeat:     'daily',
                                                                               autoCancel: true,
                                                                               icon: 'ic_launcher',
                                                                               smallIcon: 'ic_launcher'
                                                                               });}, 2000);
                    }
                    localforage.setItem('reminder',{daily: {
                      status: true,
                      time: dDate.getHours(),
                      minutes: dDate.getMinutes()},
                      inactivity: {
                        status:LocalData.SetReminder.inactivity.status,
                        time:LocalData.SetReminder.inactivity.time,
                        minutes:LocalData.SetReminder.inactivity.minutes,
                        frequency:LocalData.SetReminder.inactivity.frequency
                      }
                    });
                  if (res){
                    if (ionic.Platform.isIOS()){
                      window.plugin.notification.local.hasPermission(function (granted) {
                          if (!granted){
                            window.plugin.notification.local.promptForPermission();
                          }
                      });
                    }
                  }
                  if (!res) {
                    $location.path('/app/reminders');
                    $ionicSideMenuDelegate.toggleLeft(false);
                  }
                })
          }, 200)
        }
      })
    }
  }

  $scope.whatsNewPopup = function(){
      angular.element(document.getElementsByTagName('body')[0]).addClass('home-new');
      $ionicPopup.alert({
               title: $translate.instant('WHAT_NEW'),
               template: '<div class="padding whats-new"><h3>{{"NEW_TRANSLATE1" | translate}}</h3><h3 style="color:#C4C4C4">{{"NEW_TRANSLATE2" | translate}}</h3><h3>{{"NEW_TRANSLATE3" | translate}}</h3></div>',
               okType: 'energized',
               okText: $translate.instant('OK_SWORKIT')
             }).then(function(res) {
               if(res) {
                $timeout(function(){
                angular.element(document.getElementsByTagName('body')[0]).removeClass('home-new');
               }, 2000)
               }
             });
  }

  $scope.whatsNewPopupHealth = function(){
      angular.element(document.getElementsByTagName('body')[0]).addClass('home-new');
      $ionicPopup.alert({
               title: $translate.instant('WHAT_NEW'),
               template: '<div class="padding whats-new"><h3>Health App Integration</h3><p>Settings - Connect to Health App</p><h3>Share Custom Workouts</h3><p>Now personal trainers, physicians, coaches, and friends can share specially designed workouts</p><h3>Popular Workouts</h3><p>Find out which custom workouts are popular among other users</p></div>',
               okType: 'energized',
               okText: $translate.instant('WORKOUT_REM')
             }).then(function(res) {
               if(res) {
                $timeout(function(){
                angular.element(document.getElementsByTagName('body')[0]).removeClass('home-new');
               }, 2000)
               }
             });
  }

  $scope.choosePopup = function(){
    if (ionic.Platform.isAndroid()){
      $scope.androidPlatform = true;
    } else{
      $scope.androidPlatform = false;
    }
    //Removing What's New Popup
    //$scope.whatsNewPopup();
  }

  $scope.activateSelection = function(tag){
    if (ionic.Platform.isAndroid()){
      // angular.element(document.getElementById(tag)).addClass('activated');
    }
  }

  $scope.downloadNexercise = function (){
    trackEvent('More Action', 'Install Nexercise', 0);
    setTimeout(function(){
      if (device.platform.toLowerCase() == 'ios') {
        window.open('http://nxr.cz/nex-ios', '_system', 'location=no,AllowInlineMediaPlayback=yes');
      }  else if (isAmazon()){
        window.appAvailability.check('com.amazon.venezia', function() {
             window.open('amzn://apps/android?p=com.nexercise.client.android', '_system')},function(){
             window.open(encodeURI("http://www.amazon.com/gp/mas/dl/android?p=com.nexercise.client.android"), '_system');}
             );
      } else if (isMobiroo()){
          window.open('mma://app/157a5c50-1599-445e-985b-b8a9ba24e64a', '_system');
      } else {
          window.open('market://details?id=com.nexercise.client.android', '_system')
      }
    }, 400)
  }

  $scope.$on('$ionicView.leave', function() {
    //TODO: remove the activated class from whichever one was chosen and we are still using activateSelection
    //angular.element(document.getElementById(tag)).removeClass('activated');
  });
})

.controller('WorkoutCategoryCtrl', function($rootScope, $scope, $translate,$timeout,$location,$ionicPopup,$stateParams, WorkoutService) {
  LocalHistory.getCustomHistory.lastHomeURL = $location.$$url;
  if (ionic.Platform.isAndroid()){
    $scope.androidPlatform = true;
  } else{
    $scope.androidPlatform = false;
  }
  $scope.timesUsedVar = parseInt(window.localStorage.getItem('timesUsed'));
  $scope.thisCategory = $stateParams.categoryId;
  $scope.categoryTitle = LocalData.GetWorkoutCategories[$stateParams.categoryId].fullName;
  $scope.categories = WorkoutService.getWorkoutsByCategories($stateParams.categoryId);
  $scope.workoutTypes = WorkoutService.getWorkoutsByType();
  $scope.showRateOption = globalRateOption;
  $scope.showShareOption = globalShareOption;
  $scope.rateAttempts = 0;
  $scope.resizeOptions = {grow: false, shrink:true, defaultSize: 18, minSize:18, maxSize:32};
  $scope.rateHeader = $translate.instant('ENJOYING_RATE');
  $scope.noButton = $translate.instant('NOT_REALLY');
  $scope.yesButton = $translate.instant('YES_SM') + '!';
  $scope.noTaps = true;
  $scope.yesTaps = true;
  if ($scope.showShareOption == 4){
    $scope.rateHeader = $translate.instant('THANK_SHARE');
    $scope.noButton = $translate.instant('NO_THANKS');
    $scope.yesButton = $translate.instant('YES_SM') + '!';
  } else if ($scope.showShareOption == 8) {
    $scope.rateHeader = $translate.instant('CAT_TWITTER');
    $scope.noButton = $translate.instant('NO_THANKS');
    $scope.yesButton = $translate.instant('YES_SM') + '!';
  } else if ($scope.showShareOption == 13) {
    $scope.rateHeader = $translate.instant('CAT_FACEBOOK');
    $scope.noButton = $translate.instant('NO_THANKS');
    $scope.yesButton = $translate.instant('YES_SM') + '!';
  }
  $scope.data = {showInfo:false};
  $scope.yesOption = function(){
    if ($scope.yesTaps && $scope.noTaps && $scope.showShareOption == 4){
      $scope.showShareOption = 5;
      globalShareOption = 5;
      localforage.setItem('ratingCategory', {show:false,past:true,shareCount:5,sharePast:true}, function(){});
      var challengeText = $translate.instant('SHARE_THANK');
      window.plugins.socialsharing.share(challengeText, null, null, null);
      trackEvent('Dialog Request', 'Share', 0);
    } else if ($scope.yesTaps && $scope.noTaps && $scope.showShareOption == 8){
      $scope.showShareOption = 9;
      globalShareOption = 9;
      localforage.setItem('ratingCategory', {show:false,past:true,shareCount:9,sharePast:true}, function(){});
      window.open('http://twitter.com/sworkit', '_blank', 'location=yes,AllowInlineMediaPlayback=yes,toolbarposition=top');
      trackEvent('Dialog Request', 'Follow Twitter', 0);
    } else if ($scope.yesTaps && $scope.noTaps && $scope.showShareOption == 13){
      $scope.showShareOption = 14;
      globalShareOption = 14;
      localforage.setItem('ratingCategory', {show:false,past:true,shareCount:14,sharePast:true}, function(){});
      window.open('http://facebook.com/SworkitApps', '_blank', 'location=yes,AllowInlineMediaPlayback=yes,toolbarposition=top');
      trackEvent('Dialog Request', 'Follow Facebook', 0);
    } else if ($scope.yesTaps && $scope.noTaps){
      $scope.yesButton = $translate.instant('OK') + '!';
      $scope.noButton = $translate.instant('NO_THANKS');
      $scope.rateHeader = $translate.instant('PLEASE_REVIEW');
      $scope.yesTaps = false;
    } else if (!$scope.noTaps){
      globalRateOption = false;
      $scope.showRateOption = false;
      trackEvent('Dialog Request', 'Feedback', 0);
      localforage.setItem('ratingCategory', {show:false,past:true,shareCount:1,sharePast:false}, function(){});
      if (ionic.Platform.isAndroid()){
        $scope.appVersion = '5.70.09'
      } else {
        $scope.appVersion = '3.6.3'
      }
      var emailBody = "<p>" + $translate.instant('DEVICE') + ": " + device.model + "</p><p>" + $translate.instant('PLATFORM') + ": "  + device.platform + " " + device.version  + "</p>" + "<p>" + $translate.instant('APP_VERSION') + ": " + $scope.appVersion + "</p><p>" + $translate.instant('FEEDBACK') + ": </p>";
      window.plugin.email.open({
                       to:      ['contact@sworkit.com'],
                       subject: $translate.instant('FEEDBACK') + ': Sworkit Pro App',
                       body:    emailBody,
                       isHtml:  true
                       });
    } else {
      $timeout(function(){
        globalRateOption = false;
        $scope.showRateOption = false;
        var volumeNotification = angular.element(document.getElementsByClassName('volume-notification'));
        var insideTextNew = $translate.instant('THANK_REVIEW');
        volumeNotification.html('<h3 class="ng-binding">'+insideTextNew+'</h3>');
        volumeNotification.addClass('animate').removeClass('flash');
        setTimeout(function(){
              trackEvent('Dialog Request', 'Review', 0);
              volumeNotification.addClass('flash').removeClass('animate');
              var insideText = $translate.instant('VOLUME_REC');
              volumeNotification.html('<h3 class="ng-binding"><span><i class="icon ion-volume-medium"></i></span>  '+insideText+'</h3>');
        }, 4000);
        localforage.setItem('ratingCategory', {show:false,past:true,shareCount:1,sharePast:false}, function(){upgradeNotice(2)});

        }, 500);
    }
  }
  $scope.noOption = function(){
    if ($scope.yesTaps && $scope.noTaps && $scope.showShareOption == 4){
      $scope.showShareOption = 5;
      globalShareOption = 5;
      localforage.setItem('ratingCategory', {show:false,past:true,shareCount:5,sharePast:true}, function(){});
    } else if ($scope.yesTaps && $scope.noTaps && $scope.showShareOption == 8){
      $scope.showShareOption = 9;
      globalShareOption = 9;
      localforage.setItem('ratingCategory', {show:false,past:true,shareCount:9,sharePast:true}, function(){});
    } else if ($scope.yesTaps && $scope.noTaps && $scope.showShareOption == 13){
      $scope.showShareOption = 14;
      globalShareOption = 14;
      localforage.setItem('ratingCategory', {show:false,past:true,shareCount:14,sharePast:true}, function(){});
    } else if ($scope.yesTaps && $scope.noTaps){
      $scope.yesButton = $translate.instant('OK') + '!';
      $scope.noButton = $translate.instant('NO_THANKS');
      $scope.rateHeader = $translate.instant('LEAVE_FEEDBACK');
      $scope.noTaps = false;
    } else if (!$scope.noTaps || !$scope.yesTaps){
      $scope.showRateOption = false;
      globalRateOption = false;
      localforage.setItem('ratingCategory', {show:false,past:true,shareCount:1,sharePast:false}, function(){});
    } else {
      $scope.showRateOption = false;
      globalRateOption = false;
    }
  }
})

.controller('WorkoutCustomCtrl', function($rootScope, $scope, $ionicModal, $location, $ionicLoading, $translate, $ionicPopup, $ionicListDelegate, $http, $ionicActionSheet, $ionicSlideBoxDelegate, $ionicScrollDelegate, $location, $timeout, filterFilter, UserService, WorkoutService, AppSyncService, FirebaseService, $ionicPlatform, $log, $q) {
  var controller = this;
  LocalHistory.getCustomHistory.lastHomeURL = $location.$$url;
  $scope.currentSelection = {};
  if (ionic.Platform.isAndroid()){
    $scope.androidPlatform = true;
  } else{
    $scope.androidPlatform = false;
  }
  if (ionic.Platform.isWebView()){
    $scope.browserPlatform = false;
  } else{
    $scope.browserPlatform = true;
  }
  if (device){
    cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
  }
  $scope.getFirst = function(phrase){
    if (phrase){
      return phrase.split(/[.!?]+/)[0].substring(0,98) + '' || '';
    } else {
      return '';
    }
  }

  $scope.downloadedWorkouts = downloadableWorkouts;
  $scope.editMode = false;
  $scope.customName = '';
  $scope.currentCustom = UserService.getCurrentCustom();
  $scope.isPressed = false;
  $ionicPlatform.ready(function () {
    if (device){
      $scope.deviceBasePath = cordova.file.dataDirectory;
    } else {
      $scope.deviceBasePath = false;
    }
    $log.debug("$scope.deviceBasePath", $scope.deviceBasePath);
  })
      .then(WorkoutService.getUserExercises)
      .then(function (userExercises) {
        controller.userExercises = userExercises;
        $scope.exerciseCategories = [
          {shortName:"upper",longName:"UPPER_SM", exercises: WorkoutService.getExercisesByCategory(controller.userExercises, 'upper') },
          {shortName:"core",longName:"CORE_SM", exercises: WorkoutService.getExercisesByCategory(controller.userExercises, 'core') },
          {shortName:"lower",longName:"LOWER_SM", exercises: WorkoutService.getExercisesByCategory(controller.userExercises, 'lower') },
          {shortName:"stretch",longName:"STRETCH_SM", exercises: WorkoutService.getExercisesByCategory(controller.userExercises, 'stretch') },
          {shortName:"back",longName:"BACK_SM", exercises: WorkoutService.getExercisesByCategory(controller.userExercises, 'back') },
          {shortName:"cardio",longName:"CARDIO_SM", exercises: WorkoutService.getExercisesByCategory(controller.userExercises, 'cardio') },
          {shortName:"pilates",longName:"PILATES_SM", exercises: WorkoutService.getExercisesByCategory(controller.userExercises, 'pilates') },
          {shortName:"yoga",longName:"YOGA_SM", exercises: WorkoutService.getExercisesByCategory(controller.userExercises, 'yoga') }
        ];
        $scope.allExercises = [];
        for (var eachExercise in controller.userExercises) {
            if (controller.userExercises[eachExercise].category !== "hidden") {
                $scope.allExercises.push($translate.instant(controller.userExercises[eachExercise].name));
            }
        }
        $timeout(function () {
          $scope.allExercises.sort();
        }, 1500)
      });

  // This is called from the HTML template custom-workout-reorder.html
  $scope.getTranslatedExercise = function(exerciseName){
    return $scope.possibleWorkouts[exerciseName].name;
  };

  $scope.addExercise = function(){
    if ($scope.selectedExerciseAdd.selected !== ''){
      var keyObject = translations[PersonalData.GetUserSettings.preferredLanguage];
      keyObject.getKeyByValue = function( value ) {
        for( var prop in this ) {
          if( this.hasOwnProperty( prop ) ) {
            if( this[ prop ] === value )
            return prop;
          }
        }
      }
      var foundKey = keyObject.getKeyByValue($scope.selectedExerciseAdd.selected);
      var keyInEN = translations['EN'][foundKey];
      $scope.reorderWorkout.push(keyInEN);
    }
  }
  $scope.selectedExerciseAdd = {selected: $translate.instant('ABDOMINALCRUNCH')};
  $scope.workoutLengths = function(){
    $scope.customWorkouts.savedWorkouts.forEach(function(element, index, array){if (element.workout.length == 1){element.total = "1 "} else{element.total = element.workout.length + ' '}});
  }
  $scope.editAll = function(){
    if ($scope.editMode){
      angular.element(document.getElementsByClassName('my-customs')).removeClass('edit-mode');
      angular.element(document.getElementsByClassName('item-options')).addClass('invisible');
    }
    else{
      angular.element(document.getElementsByClassName('item-options')).removeClass('invisible');
      angular.element(document.getElementsByClassName('my-customs')).addClass('edit-mode');
    }
    $scope.editMode = !$scope.editMode;
  }
  $scope.shareCustom = function(indexEl, customObj) {
    var selectedWorkout = customObj;
    $ionicListDelegate.closeOptionButtons();
    if (selectedWorkout.shareUrl){
      var postURL = 'http://sworkitapi.herokuapp.com/workouts?s=' + selectedWorkout.shareUrl;
    } else{
      var postURL = 'http://sworkitapi.herokuapp.com/workouts';
    }
    $http({
        url: postURL,
        method: "POST",
        data: JSON.stringify({name:selectedWorkout.name, exercises: selectedWorkout.workout}),
        headers: {'Content-Type': 'application/json'}
      }).then(function(resp){
            selectedWorkout.shareUrl = resp.data.shortURI;
            //TODO: Update this URL with swork.it
            var customMessage = $translate.instant('TRY_WORKOUT') + ', ' + resp.data.name + '. ' + $translate.instant('GET_IT') + ' http://m.sworkit.com/share?w=' + resp.data.shortURI;
            if (device){
              window.plugins.socialsharing.share(customMessage, function(){logActionSessionM('ShareCustomWorkout');}, null);
            } else {
              console.log('Share: http://m.sworkit.com/share?w=' + resp.data.name);
            }
          }, function(err) {
            navigator.notification.alert(
                  $translate.instant('PLEASE_RETRY'),  // message
                  nullHandler,         // callback
                  $translate.instant('SHARE_FAIL'),            // title
                  $translate.instant('OK')                  // buttonName
                );
      });
  }
  $scope.deleteCustom  = function(indexEl, customObj){
    var confirmDelete = $translate.instant('DELETE') + ' ' + customObj.name + '?';
    //TODO: Need to remove custom workout from Firebase
    if (device){
      navigator.notification.confirm(
                  '',
                   function(buttonIndex){
                    if (buttonIndex !== 2){
                      // do delete
                      doDeleteCustom();
                      $ionicListDelegate.closeOptionButtons();
                    }
                   },
                  confirmDelete,
                  [$translate.instant('OK'),$translate.instant('CANCEL_SM')]
                );
    } else {
      doDeleteCustom();
      $ionicListDelegate.closeOptionButtons();
    }

    function doDeleteCustom() {
      $scope.customWorkouts.savedWorkouts.forEach(function(element, index, array) {
        if (element.name == customObj.name) {
          if (!element.$id || element.$id == customObj.$id) {
            console.log(element);
            var syncId = element.$id || false;
            console.log(syncId);
            $scope.customWorkouts.savedWorkouts.splice(index, 1);
            localforage.setItem('customWorkouts', PersonalData.GetCustomWorkouts);
            if (FirebaseService.authData) {
              if (syncId) {
                AppSyncService.remoteDeleteFromLocalForageCustomWorkouts(syncId);
              }
            }
          }
        }


      });
    }

  }
  $scope.editCustom = function(indexEl, customObj) {
    if (device && device.platform.toLowerCase() == 'ios'){
      $timeout(function(){
        $ionicActionSheet.show({
         buttons: [
           { text: '<b>'+ $translate.instant("ADD_REMOVE")+'</b>' },
           { text: $translate.instant("CHANGE_ORDER") },
           { text: $translate.instant("RENAME_WORKOUT") },
         ],
         titleText: $translate.instant("EDIT_CUSTOM"),
         cancelText: $translate.instant("CANCEL_SM"),
         buttonClicked: function(indexNum) {
           $scope.actionButtonClicked(indexNum);
           return true;
         },
         cancel: function(indexNum) {
           $scope.actionCancel(indexNum);
           return true;
         }
       });
        $scope.actionPopup = {
          close : function(){
          }
        }
      }, 800);
    } else{
      $scope.actionPopup = $ionicPopup.show({
        title: $translate.instant('EDIT_CUSTOM'),
        subTitle: '',
        scope: $scope,
        template: '<div class="action-button" style="padding-bottom:10px"><button class="button button-full button-stable" ng-click="actionButtonClicked(0)">{{"ADD_REMOVE" | translate}}</button><button class="button button-full button-stable" ng-click="actionButtonClicked(1)">{{"CHANGE_ORDER" | translate}}</button><button class="button button-full button-stable" ng-click="actionButtonClicked(2)">{{"RENAME_WORKOUT" | translate}}</button><button class="button button-full button-stable" ng-click="actionCancel()" style="text-align:center;padding-left:0px;margin-bottom:-10px">{{"CANCEL_SM" | translate}}</button></div>'
      });
      $timeout(function(){
        angular.element(document.getElementsByTagName('body')[0]).addClass('popup-open');
      }, 500)
    }
    $scope.actionButtonClicked =function(indexNum) {
      var selectedItem = customObj;
       if (indexNum == 0){
        $scope.currentCustom = selectedItem.workout;
        $scope.editMode = true;
        $scope.customName = selectedItem.name;
        $scope.createCustom();
        $scope.actionPopup.close();
       } else if (indexNum == 1){
         $scope.customName = selectedItem.name;
         $scope.reorderCustom(selectedItem);
         $scope.actionPopup.close();
       } else if (indexNum == 2){
          $ionicPopup.prompt({
             title: $translate.instant('NEW_NAME'),
             cancelText: $translate.instant('CANCEL_SM'),
             inputType: 'text',
             template: '<input ng-model="data.response" type="text" autofocus class="ng-pristine ng-valid">',
             inputPlaceholder: selectedItem.name,
             okText: $translate.instant('SAVE'),
             okType: 'energized'
             }).then(function(res) {
                if (res && res.length > 1){
                  selectedItem.name = res;
                  if (selectedItem.sync_lastUpdated) {
                    var currentTime = new Date();
                    selectedItem.sync_lastUpdated = currentTime.getTime();
                    AppSyncService.updateToSyncLogLocal(selectedItem.$id, selectedItem.sync_lastUpdated);
                  } else {
                    localforage.setItem('customWorkouts', PersonalData.GetCustomWorkouts);
                  }
                }
                $scope.actionPopup.close();
          });
       }
       $ionicListDelegate.closeOptionButtons();
     },
     $scope.actionCancel = function(indexNum) {
       $ionicListDelegate.closeOptionButtons();
       $scope.actionPopup.close();
     };
     $scope.actionDestructiveButtonClicked  = function(indexNum) {
       var selectedItem = customObj;
       $scope.customWorkouts.savedWorkouts.forEach(function(element, index, array){if (element.name == selectedItem.name){$scope.customWorkouts.savedWorkouts.splice(index, 1);PersonalData.GetCustomWorkouts=$scope.customWorkouts;localforage.setItem('customWorkouts', PersonalData.GetCustomWorkouts);}});
       $ionicListDelegate.closeOptionButtons();
       $scope.actionPopup.close();
     }
  }
  $scope.createCustom = function(){
    $ionicLoading.show({
                  template: $translate.instant('GATHERING'),
                  animation: 'fade-in',
                  showBackdrop: true,
                  maxWidth: 200,
                  duration:5000
              });
    $timeout(function(){
              $scope.createCustomOpen();
             }, 500);
  }
  $scope.createCustomOpen = function(){
    $ionicModal.fromTemplateUrl('custom-workout.html', function(modal) {
                                  $scope.customModal = modal;
                                  }, {
                                  scope:$scope,
                                  animation: 'fade-implode',
                                  focusFirstInput: false,
                                  backdropClickToClose: false,
                                  hardwareBackButtonClose: false
                                  });
    $timeout(function(){
              $scope.openCreateCustom();
             }, 100);
    $scope.openCreateCustom = function() {
      $scope.customModal.show();
    };
    $scope.cancelCreateCustom = function() {
      $scope.customModal.hide();
      $scope.editMode = false;
      $scope.currentCustom = UserService.getCurrentCustom();
      $scope.selectedExercises()
          .then(function (selectedExercises) {
            PersonalData.GetWorkoutArray.workoutArray = selectedExercises;
            $timeout(function(){
              $scope.customModal.remove();
            }, 1000);

          });
    };
    $scope.resetCustom = function() {
      if (device){
            navigator.notification.confirm(
              $translate.instant('CLEAR_SELECTIONS'),
               function(buttonIndex){
                if (buttonIndex == 2){
                  angular.forEach(controller.userExercises, function (value, key) {
                    $scope.currentSelection[value.name] = false;
                  });
                  $scope.totalSelected = 0;
                  PersonalData.GetWorkoutArray.workoutArray = [];
                  $scope.$apply();
                }
               },
              $translate.instant('RESET_CUSTOM'),
              [$translate.instant('CANCEL_SM'),$translate.instant('OK')]
            );
      } else{
        $ionicPopup.confirm({
             title: $translate.instant('RESET_CUSTOM'),
             template: '<p class="padding">'+$translate.instant("CLEAR_SELECTIONS")+'</p>',
             okType: 'energized',
             okText: $translate.instant('OK'),
             cancelText: $translate.instant('CANCEL_SM')
           }).then(function(res) {
             if(res) {
              angular.forEach(controller.userExercises, function (value, key) {
                $scope.currentSelection[value.name] = false;
              });
              PersonalData.GetWorkoutArray.workoutArray = [];
             }
           });
        }
      }

      angular.forEach(controller.userExercises, function (value, key) {
        $scope.currentSelection[value.name] = false;
      });
      $scope.currentCustom.forEach(function(element, index, array){
        $scope.currentSelection[controller.userExercises[element].name] = true
      });


      $scope.selectedExercises = function() {
          var deferred = $q.defer();

          var arrUse = [];
          angular.forEach($scope.currentSelection, function (value, key) {
                      if (value){
                      arrUse.push(translations['EN'][key]);
                      }
                      });
          deferred.resolve(arrUse);
          return deferred.promise;

      }

      $scope.setTotalSelectedExercises = function () {
        $scope.selectedExercises()
            .then(function (selectedExercises) {
              $scope.totalSelected = selectedExercises.length;
            });
      };

      $scope.setTotalSelectedExercises();

      $scope.mathSelected = function(addSubtract){
        if (addSubtract){
          $scope.totalSelected++;
        } else {
          $scope.totalSelected--;
        }
      }
      $timeout(function(){
                $ionicLoading.hide();
               }, 1000);
      $scope.$on('$ionicView.leave', function() {
        $scope.customModal.remove();
      });
      $timeout(function(){
                angular.element(document.getElementsByTagName('body')[0]).removeClass('loading-active');
                $ionicLoading.hide();
              }, 6000);

      $scope.searchTyping = function(typedthings){

      }
      $scope.searchSelect = function(suggestion){
        $scope.slideTo($scope.allExercises.indexOf(suggestion), suggestion);
      }
      $scope.slideTo = function(location, suggestion) {
        var newLocation = $location.hash(location);
        var keyObject = translations[PersonalData.GetUserSettings.preferredLanguage];
        keyObject.getKeyByValue = function( value ) {
          for( var prop in this ) {
            if( this.hasOwnProperty( prop ) ) {
              if( this[ prop ] === value )
              return prop;
            }
          }
        }
        var foundKey = keyObject.getKeyByValue(suggestion);
        var keyInEN = translations['EN'][foundKey];
        $scope.currentSelection[foundKey] = true;
        $timeout( function(){
          $ionicScrollDelegate.$getByHandle('createScroll').anchorScroll("#"+newLocation);
          $scope.setTotalSelectedExercises();
        },50);
      };
    };
    $scope.toggleAll = function(shortCat, indexN){
      var indexID = angular.element(document.getElementById('cat' + indexN));
      indexID.toggleClass('group-active');
      if (indexID.hasClass('group-active')){
        $scope.exerciseCategories[indexN].exercises.forEach(function(element, index, array){$scope.currentSelection[element.name] = true});
      } else {
        $scope.exerciseCategories[indexN].exercises.forEach(function(element, index, array){$scope.currentSelection[element.name] = false});
      }
      $scope.setTotalSelectedExercises();
    }
    $scope.saveCustom = function() {
      $scope.selectedExercises()
          .then(function (selectedExercisesForCustom) {
            PersonalData.GetWorkoutArray.workoutArray = selectedExercisesForCustom;
            localforage.setItem('currentCustomArray', PersonalData.GetWorkoutArray);
            if ($scope.editMode){
              var fillTitle =  $translate.instant('SAVE_CHANGE') + '  ' + $scope.customName + '?';
              if (device){
                  navigator.notification.confirm(
                    '',
                     function(buttonIndex){
                      if (buttonIndex == 2 && selectedExercisesForCustom.length > 0){
                        $scope.customWorkouts.savedWorkouts.forEach(function(element, index, array){
                          if (element.name == $scope.customName) {
                            element.workout = selectedExercisesForCustom;
                            PersonalData.GetCustomWorkouts = $scope.customWorkouts;
                            if (element.sync_lastUpdated) {
                              var currentTime = new Date();
                              element.sync_lastUpdated = currentTime.getTime();
                              localforage.setItem('customWorkouts', PersonalData.GetCustomWorkouts).then(function(){
                                AppSyncService.updateToSyncLogLocal(element.$id, element.sync_lastUpdated);
                              });
                            } else {
                              localforage.setItem('customWorkouts', PersonalData.GetCustomWorkouts);
                            }
                          }
                        });
                        $scope.editMode = false;
                        $scope.currentCustom = UserService.getCurrentCustom();
                        $scope.customModal.hide();
                        $scope.workoutLengths();
                        $timeout(function(){
                           $scope.customModal.remove();
                           }, 1000);
                      }
                     },
                    fillTitle,
                    [$translate.instant('CANCEL_SM'),$translate.instant('OK')]
                  );
              } else {
                  $ionicPopup.confirm({
                     title: fillTitle,
                     template: '',
                     okType: 'energized',
                     okText: $translate.instant('OK'),
                     cancelText: $translate.instant('CANCEL_SM')
                   }).then(function(res) {
                                if (res && selectedExercisesForCustom.length > 0){
                                  if (selectedExercisesForCustom.sync_lastUpdated) {
                                    var currentTime = new Date();
                                    selectedExercisesForCustom.sync_lastUpdated = currentTime.getTime();
                                  }
                                  $scope.customWorkouts.savedWorkouts.forEach(function(element, index, array){
                                    if (element.name == $scope.customName) {
                                      element.workout = selectedExercisesForCustom;
                                      PersonalData.GetCustomWorkouts = $scope.customWorkouts;
                                      if (element.sync_lastUpdated) {
                                        var currentTime = new Date();
                                        element.sync_lastUpdated = currentTime.getTime();
                                        localforage.setItem('customWorkouts', PersonalData.GetCustomWorkouts).then(function(){
                                          AppSyncService.updateToSyncLogLocal(element.$id, element.sync_lastUpdated);
                                        });
                                      } else {
                                        localforage.setItem('customWorkouts', PersonalData.GetCustomWorkouts);
                                      }
                                    }
                                  });
                                  $scope.editMode = false;
                                  $scope.currentCustom = UserService.getCurrentCustom();
                                  $scope.customModal.hide();
                                  $scope.workoutLengths();
                                  $timeout(function(){
                                     $scope.customModal.remove();
                                     }, 1000);
                                }
                   });
                 }
            } else {
              $ionicPopup.prompt({
                           title: $translate.instant('NAME_THIS'),
                           cancelText: $translate.instant('CANCEL_SM'),
                           inputType: 'text',
                           inputPlaceholder: 'name',
                           template: '<input ng-model="data.response" type="text" autofocus class="ng-pristine ng-valid">',
                           okText: $translate.instant('SAVE'),
                           okType: 'energized'
                           }).then(function(res) {
                                if (res && res.length > 1 && selectedExercisesForCustom.length > 0){
                                  $scope.customWorkouts.savedWorkouts.unshift({"name": res,"workout": selectedExercisesForCustom});
                                  localforage.setItem('customWorkouts', PersonalData.GetCustomWorkouts);
                                  if (!$scope.editMode && device){
                                    logActionSessionM('DesignCustomWorkout');
                                  }
                                  $scope.editMode = false;
                                  $scope.currentCustom = UserService.getCurrentCustom();
                                  $scope.customModal.hide();
                                  $scope.workoutLengths();
                                  $timeout(function(){
                                    $scope.customModal.remove();
                                  }, 1000);
                                }
                              });
            };
          });
  }

  $scope.previewCustom = function(){
    angular.element(document.getElementsByTagName('body')[0]).addClass('preview-popup');
    $scope.selectedExercises().then(function (selectedExercisesForCustom) {
      $scope.currentlySelectedExercises = selectedExercisesForCustom;
      $ionicPopup.alert({
               title: $translate.instant('SELECTED'),
               scope: $scope,
               template: '<div class="selected-exercises"><p class="item" ng-repeat="selExercise in currentlySelectedExercises">{{selExercise | translate}}</p></div>',
               okType: 'energized',
               okText: $translate.instant('OK')
             }).then(function(res) {
              angular.element(document.getElementsByTagName('body')[0]).removeClass('preview-popup');
             });
    })
  }

  $scope.reorderCustom = function(passedWorkout){
    $scope.passedWorkoutSave = passedWorkout;
    WorkoutService.getUserExercises()
        .then(function (userExercises) {
          $scope.possibleWorkouts = userExercises;
          $scope.openReorderCustom2();
        });
    $ionicModal.fromTemplateUrl('custom-workout-reorder.html', function(modal) {
                                  $scope.customModal2 = modal;
                                  }, {
                                  scope:$scope,
                                  animation: 'fade-implode',
                                  focusFirstInput: false,
                                  backdropClickToClose: false,
                                  hardwareBackButtonClose: false
                                  });

    $scope.reorderWorkout = passedWorkout.workout;
    $scope.data = {showReorder:true,showDelete: false};
    $scope.moveItem = function(item, fromIndex, toIndex) {
      $scope.reorderWorkout.splice(fromIndex, 1);
      $scope.reorderWorkout.splice(toIndex, 0, item);
    };
    $scope.onItemDelete = function(item) {
      $scope.reorderWorkout.splice($scope.reorderWorkout.indexOf(item), 1);
    };
    $scope.openReorderCustom2 = function() {
      $scope.customModal2.show();
    };
    $scope.cancelReorderCustom = function() {
      $scope.customModal2.hide();
      $scope.editMode = false;
      $timeout(function(){
       $scope.customModal2.remove();
      }, 1000);
    };
    $scope.saveReorder = function() {
        var fillTitle = $translate.instant('SAVE_CHANGE') + '  ' + $scope.customName + '?';
        if (device){
          navigator.notification.confirm(
          '',
           function(buttonIndex){
            if (buttonIndex == 2){
                  $scope.customWorkouts.savedWorkouts.forEach(function(element, index, array){
                    if (element.name == $scope.passedWorkoutSave.name){
                      element.workout = $scope.passedWorkoutSave.workout;
                      if (element.sync_lastUpdated) {
                        var currentTime = new Date();
                        element.sync_lastUpdated = currentTime.getTime();
                        localforage.setItem('customWorkouts', PersonalData.GetCustomWorkouts).then(function(){
                          AppSyncService.updateToSyncLogLocal(element.$id, element.sync_lastUpdated);
                        });
                      } else {
                      PersonalData.GetCustomWorkouts = $scope.customWorkouts;
                      localforage.setItem('customWorkouts', PersonalData.GetCustomWorkouts);
                      }
                    }
                  });
                  $scope.editMode = false;
                  $scope.customModal2.hide();
                  $scope.workoutLengths();            }
           },
          fillTitle,
          [$translate.instant('CANCEL_SM'),$translate.instant('OK')]
          );
        } else{
            $ionicPopup.confirm({
               title: fillTitle,
               template: '',
               okType: 'energized',
               okText: $translate.instant('OK'),
               cancelText: $translate.instant('CANCEL_SM')
             }).then(function(res) {
               if (res){
                  $scope.customWorkouts.savedWorkouts.forEach(function(element, index, array){
                    if (element.name == $scope.passedWorkoutSave.name){
                      element.workout = $scope.passedWorkoutSave.workout;
                      PersonalData.GetCustomWorkouts = $scope.customWorkouts;
                      if (element.sync_lastUpdated) {
                        var currentTime = new Date();
                        element.sync_lastUpdated = currentTime.getTime();
                        localforage.setItem('customWorkouts', PersonalData.GetCustomWorkouts).then(function(){
                          AppSyncService.updateToSyncLogLocal(element.$id, element.sync_lastUpdated);
                        });
                      } else {
                        localforage.setItem('customWorkouts', PersonalData.GetCustomWorkouts);
                      }
                    }
                  });
                  $scope.editMode = false;
                  $scope.customModal2.hide();
                  $scope.workoutLengths();
                }
             });
        }
    };
    if (device) {cordova.plugins.Keyboard.hideKeyboardAccessoryBar(false)};
    $scope.$on('$ionicView.leave', function() {
      if (device) {cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true)};
      $scope.customModal2.remove();
    });
  }

  $scope.selectCustom = function(indexEl, selectedCustom){
    LocalData.GetWorkoutTypes.customWorkout = { id: 100, activityWeight: 6, activityMFP: "134026252709869", activityNames: selectedCustom.name, exercises: selectedCustom.workout, customData: selectedCustom},
    $location.path('/app/home/2/customWorkout');
  }
  $scope.addCustomWorkout = function(workid, index){
    var selectWorkout;
    $scope.downloadedWorkouts.forEach(function(element, index, array){if (element.shortURI == workid){selectWorkout = element}});
    var notifyEl = angular.element(document.getElementById('item' + index)).removeClass('ion-plus').addClass('ion-checkmark');
    $timeout(function(){
      angular.element(document.getElementById('item' + index)).removeClass('ion-checkmark').addClass('ion-plus');
    }, 3000)
    $scope.customWorkouts.savedWorkouts.unshift({"name": selectWorkout.name,"workout": selectWorkout.exercises});
    PersonalData.GetCustomWorkouts = $scope.customWorkouts;
    localforage.setItem('customWorkouts', PersonalData.GetCustomWorkouts);
    trackEvent('Download Custom', selectWorkout.name, 0);
    $scope.workoutLengths();
  }
  $scope.showFeatured = function(){
    $location.path('/app/custom/featured');
  }
  $scope.orPressed = function(){
    $scope.isPressed = true;
    $timeout(function(){
      $scope.isPressed = false;
    }, 1000);
  }
  $scope.$on('$ionicView.leave', function() {
    if(device){
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(false);
    }
    $ionicSlideBoxDelegate.update();
    localforage.setItem('customWorkouts', PersonalData.GetCustomWorkouts).then(function() {
      AppSyncService.syncLocalForageCustomWorkouts();
    })
  });
  $scope.$on('$ionicView.beforeEnter', function() {
    $ionicSlideBoxDelegate.update();
    $scope.customWorkouts = UserService.getCustomWorkoutList();
    $scope.workoutLengths();
  });
})

.controller('WorkoutCustom2Ctrl', function($rootScope, $scope, $ionicScrollDelegate, $location, $translate, $ionicPopup, $ionicListDelegate, $http, $ionicScrollDelegate, $timeout, filterFilter, UserService, WorkoutService, AppSyncService) {
  $scope.customWorkouts = UserService.getCustomWorkoutList();
  $scope.listOptions = [
      { text: "FEATURED", value: "featured" },
      { text: "POPULAR", value: "popular" },
      { text: "STANDARD", value: "standard"}
  ];
  $scope.optionSelected = {
      listType : 'featured'
  };
  $scope.standardSelected = false;
  $scope.downloadedWorkouts = downloadableWorkouts;

  function newWorkoutObj() {
    this.name="";
    this.shortURI=false;
    this.description="";
    this.exercises="";
    this.credit={name:false,href:false,color:false};
    this.isEquipmentRequired=false;
    this.isFeatured=false;
    this.hiddenWorkout=false;
    this.priority=0;
    this.opens=0;
    this.downloads=0
  }

  $scope.toggleLists = function(){
    if ($scope.optionSelected.listType == 'popular'){
      $scope.downloadedWorkouts = popularWorkouts;
      $scope.standardSelected = false;
    } else if ($scope.optionSelected.listType == 'featured'){
      $scope.downloadedWorkouts = downloadableWorkouts;
      $scope.standardSelected = false;
    } else {
      $scope.downloadedWorkouts = $scope.fullList;
      $scope.standardSelected = true;
    }
  }
  $scope.openDownLink = function(url){
      window.open(url, '_blank', 'location=no,AllowInlineMediaPlayback=yes');
  }
  $scope.showExercises = function(workoutPassed, index){
    var notifyEl = angular.element(document.getElementById('item' + index));
    notifyEl.addClass('green-text');
    $timeout(function(){
      notifyEl.removeClass('green-text');
    }, 1000)
    var tempString = JSON.stringify(workoutPassed.exercises);
    tempString = tempString.replace(/"/g,' ');
    tempString = tempString.replace(/\[/g,'');
    tempString = tempString.replace(/\]/g,'');
    workoutPassed.exercises_view = tempString;
    workoutPassed.show = true;
  }
  $scope.hideExercises = function(workoutPassed){
    workoutPassed.show = false;
  }
  $scope.toggleExercises = function(workoutPassed, index){
    if (workoutPassed.show){
      $scope.hideExercises(workoutPassed);
    } else{
      $scope.showExercises(workoutPassed, index);
    }
  }
  $scope.addCustomWorkout = function(workid, index, standardWorkout){
    var selectWorkout;
    if (standardWorkout){
      selectWorkout = $scope.fullList[index];
    } else {
      $scope.downloadedWorkouts.forEach(function(element, index, array){if (element.shortURI == workid){selectWorkout = element}});
    }
    var notifyEl = angular.element(document.getElementById('item' + index)).removeClass('ion-plus').addClass('ion-checkmark');
    $timeout(function(){
      angular.element(document.getElementById('item' + index)).removeClass('ion-checkmark').addClass('ion-plus');
    }, 3000)
    PersonalData.GetCustomWorkouts.savedWorkouts.unshift({"name": selectWorkout.name,"workout": selectWorkout.exercises});
    localforage.setItem('customWorkouts', PersonalData.GetCustomWorkouts);
    trackEvent('Download Custom', selectWorkout.name, 0);
    $location.path('/app/custom');
  }
  $scope.shareWorkout = function(workid){
    var selectWorkout;
    $scope.downloadedWorkouts.forEach(function(element, index, array){if (element.shortURI == workid){selectWorkout = element}});
    //TODO: Update this URL with swork.it
    workoutMessage = $translate.instant('THIS') + ' ' + $translate.instant(selectWorkout.name) + ' ' + $translate.instant('WORKOUT_AWESOME') + ': http://m.sworkit.com/share?w=' + selectWorkout.shortURI;
    if (device){
      window.plugins.socialsharing.share(workoutMessage, null, null);
    } else {
      console.log('Share: http://m.sworkit.com/share?w=' + selectWorkout.shortURI)
    }
  }
  $scope.updateDownloads = function(){
    getDownloadableWorkouts($http, true, $scope.optionSelected.ListType);
    $timeout(function(){
      $scope.$apply();
    }, 3000)
  }

  $scope.fullList = [];
  $scope.fakePriority = 3141592;
  for (var workoutType = 0;workoutType < LocalData.GetWorkoutCategories.length; workoutType++){
      for (var thisWorkout = 0;thisWorkout < LocalData.GetWorkoutCategories[workoutType].workoutTypes.length; thisWorkout++){
       var useWorkoutObj = new newWorkoutObj();
        var currentWorkoutObj = LocalData.GetWorkoutTypes[LocalData.GetWorkoutCategories[workoutType].workoutTypes[thisWorkout]];
        useWorkoutObj.name = $translate.instant(currentWorkoutObj.activityNames);
        useWorkoutObj.description = $translate.instant(currentWorkoutObj.description);
        useWorkoutObj.priority = $scope.fakePriority;
        $scope.fakePriority--;
        if (!currentWorkoutObj.exercises && currentWorkoutObj.activityNames == "FULL"){
          useWorkoutObj.exercises = LocalData.GetWorkoutTypes.upperBody.exercises.concat(LocalData.GetWorkoutTypes.coreExercise.exercises).concat(LocalData.GetWorkoutTypes.lowerBody.exercises)
        } else {
          useWorkoutObj.exercises = currentWorkoutObj.exercises;
        }
        $scope.fullList.push(useWorkoutObj);
      }
  }

})

.controller('WorkoutTimeCtrl', function($rootScope, $scope, $stateParams,$location,$translate,$timeout,$ionicModal,$ionicPopup,$q,WorkoutService, UserService, AppSyncService) {
  LocalHistory.getCustomHistory.lastHomeURL = $location.$$url;
  $scope.Math = Math;
  $scope.adjustTimer = function(){
    var contentWidth = angular.element(document.getElementById('time-screen')).prop('offsetWidth');
    var screenHeight = window.innerHeight;
    $scope.size =  Math.min(contentWidth * .75,screenHeight * .4);
    angular.element(document.getElementById('minute-selection'))[0].style.fontSize = ($scope.size * .40) + 'px';
    angular.element(document.getElementById('minute-selection'))[0].style.height = ($scope.size * .40) + 'px';
    angular.element(document.getElementById('timer-minutes'))[0].style.fontSize = ($scope.size * .10) + 'px';
    angular.element(document.getElementById('minus-button'))[0].style.marginRight = ($scope.size / 2.1 - 35) + 'px';
    angular.element(document.getElementById('plus-button'))[0].style.marginLeft = ($scope.size / 2.1 -35) + 'px';
    $scope.areaWidth = contentWidth - 40;
    $scope.areaHeight = $scope.size;
  }
  $scope.adjustTimer();
  $scope.thisType = WorkoutService.getTypeName($stateParams.typeId);
  $scope.categoryTitle = LocalData.GetWorkoutCategories[$stateParams.categoryId].fullName;
  if ($stateParams.typeId == "customWorkout"){
    $scope.categoryTitle  = "STRENGTH";
  }
  $scope.typeName = $stateParams.typeId;
  $scope.advancedTiming = WorkoutService.getTimingIntervals();
  $scope.userSettings = UserService.getUserSettings();
  $scope.timeSelected = {minutes:$scope.userSettings.lastLength};
  $scope.scopeFirstOption = $scope.userSettings.timerTaps < 2 ? true : false;
  $scope.urxAvailable = true;
  if (ionic.Platform.isAndroid() && device){
    $scope.androidPlatform = true;
    if (isAmazon()){
      $scope.urxAvailable = false;
      window.appAvailability.check('com.spotify.music',function() {$scope.urxAvailable = true;},function(){});
    }
  } else{
    $scope.androidPlatform = false;
  }
  $scope.isToolTipTime = false;
  $scope.urxText = "Listen to motivating " + $translate.instant($scope.categoryTitle).toLowerCase() + " music";
  $scope.$on('$ionicView.enter', function () {
      if ($scope.userSettings.showAudioTip && !isAmazon()){
        $scope.userSettings.showAudioTip = false;
        if (PersonalData.GetUserSettings.preferredLanguage == 'EN'){
          $scope.isToolTipTime = true;
          $timeout(function(){
            $scope.isToolTipTime = false;
          }, 4000)
        }
      } else {
        $timeout(function(){
          checkVolume();
        }, 1000);
      }
  });
  $scope.defaultAdd = 5;
  $scope.sevenTiming = WorkoutService.getSevenIntervals();
  $scope.yogaSelection = false;
  $scope.sevenMinuteSelection = false;
  if ($stateParams.typeId == 'sevenMinute') {
    $scope.minuteArray = [7,14,21,28,35,42,49,56];
    $scope.sevenMinuteSelection = true;
    $scope.defaultAdd = 7;
    $scope.timeSelected.minutes = 7;
  } else{
    $scope.minuteArray = [5,10,15,20,25,30,35,40,45,50,55,60];
  }
  if ($stateParams.typeId == 'sunSalutation') {
    $scope.yogaSelection = true;
    $scope.isSunSalutation = true;
  } else if ($stateParams.typeId == 'fullSequence') {
    $scope.yogaSelection = true;
    $scope.isFullSequence= true;
  } else if ($stateParams.typeId == 'runnerYoga'){
    $scope.yogaSelection = true;
    $scope.isRunnerYoga= true;
  }
  $scope.returnX = function(mins){
    return (($scope.areaWidth/2) + (($scope.size/2)*(Math.cos(((mins-15)*6)*Math.PI/180))) - ($scope.size/8));
  }
  $scope.returnY = function(mins){
    return (($scope.areaHeight/2) + (($scope.size/2)*(Math.sin(((mins-15)*6)*Math.PI/180))) - ($scope.size/8));
  }
  $scope.setMinuteTime = function(num) {
    $scope.timeSelected.minutes = num;
    $scope.scopeFirstOption = false;
    $scope.userSettings.timerTaps++;
  }
  $scope.minusFive = function() {
    if ($scope.timeSelected.minutes > $scope.defaultAdd){
      $scope.timeSelected.minutes = $scope.timeSelected.minutes - $scope.defaultAdd;
    }
  }
  $scope.plusFive = function() {
    if ($scope.timeSelected.minutes < 60){
      $scope.timeSelected.minutes = $scope.timeSelected.minutes + $scope.defaultAdd;
    }
  }
  $scope.showTiming = function(){
      $scope.advancedTiming.customSet = true;
      showTimingModal($scope,$ionicModal,$timeout, WorkoutService, $q, AppSyncService);
  }
  $scope.customLength = function (){
    $timeout(function(){
      angular.element(document.getElementById('minute-selection'))[0].focus();
      if ($scope.androidPlatform){
        cordova.plugins.Keyboard.show();
      }
    }, 200)
  }
  $scope.clearTime = function(){
    $scope.timeSelected.minutes = '';
  }
  $scope.calcComplete = function (){
    var calcResult = Math.max( 1 - ($scope.timeSelected.minutes/60.00000001), 0);
    return calcResult;
  }
  $scope.beginWorkout = function (){
    $location.path('/app/home/' + $stateParams.categoryId + '/' + $stateParams.typeId + '/' + $scope.timeSelected.minutes + '/workout');
  }
  $scope.validateTime = function(){
    if ($scope.timeSelected.minutes< 1 || $scope.timeSelected.minutes > 1000 || $scope.timeSelected.minutes == ''){
      $scope.timeSelected.minutes = $scope.defaultAdd;
    }
    if ($scope.androidPlatform){
      cordova.plugins.Keyboard.close();
    }
  }
  window.addEventListener('native.keyboardhide', keyboardHideHandler);

  function keyboardHideHandler(e){
    if (isNaN($scope.timeSelected.minutes)){
      $scope.timeSelected.minutes = $scope.defaultAdd;
      $scope.$apply();
    }
  }

  $scope.launchURX = function(){
    if (device){
      cordova.exec(function (){trackEvent('URX Launched', $scope.categoryTitle.toLowerCase(), 0);}, function (){}, "URX", "searchSongs", [ $scope.categoryTitle.toLowerCase() + ' "sworkit workout playlist" OR workout playlist action:ListenAction']);
    }
  }


  var orientationTimeChange = function(){
    $timeout(function(){
      $scope.adjustTimer();
    }, 500)
  }

  window.addEventListener("orientationchange", orientationTimeChange , false);

  $scope.$on('$ionicView.leave', function() {
    if ($scope.sevenMinuteSelection) {
      TimingData.GetSevenMinuteSettings.randomizationOptionSeven = $scope.sevenTiming.randomizationOptionSeven;
      persistMultipleObjects($q,{
          'timingSevenSettings': TimingData.GetSevenMinuteSettings
        }, function() {
          // When all promises are resolved
          AppSyncService.syncLocalForageObject('timingSevenSettings', null, TimingData.GetSevenMinuteSettings);
      });
    } else {
      PersonalData.GetUserSettings.lastLength = $scope.timeSelected.minutes;
      persistMultipleObjects($q,{
          'userSettings': PersonalData.GetUserSettings,
          'timingSettings': TimingData.GetTimingSettings
        }, function() {
          // When all promises are resolved
          AppSyncService.syncLocalForageObject('timingSettings', [
            'breakFreq',
            'breakTime',
            'customSet',
            'exerciseTime',
            'randomizationOption',
            'restStatus',
            'transitionTime',
            'workoutLength',
            'sunSalutation',
            'fullSequence',
            'runnerYoga'
          ], TimingData.GetTimingSettings);
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
    }
    window.removeEventListener('native.keyboardhide', $scope.keyboardHideHandler);
    window.removeEventListener("orientationchange", orientationTimeChange , false);
  });
})

.controller('WorkoutCtrl', function($rootScope, $scope, $ionicHistory, $stateParams,$ionicModal,$translate,$ionicPopup,$ionicPlatform,$ionicSideMenuDelegate, $http, $ionicSlideBoxDelegate, $ionicNavBarDelegate, $sce,$location,$timeout,$interval, $state, $q, WorkoutService, UserService, AppSyncService, FirebaseService, UserWorkoutService, AchievementService, $log) {
  var controller = this;
  $ionicPlatform.ready(function () {
    if (device){
      $scope.deviceBasePath = cordova.file.dataDirectory;      
    } else {
      $scope.deviceBasePath = false;
    }
  })
  $ionicNavBarDelegate.showBackButton(false);
  $scope.transitionStatus = false;
  $scope.title = "<img src='img/sworkit_logo.png'/>"
  $scope.videoAddress = 'video/blank.mp4';
  $scope.resizeOptions = {grow: false, shrink:true, defaultSize: 30};
  $scope.dimensions = {inHeight: window.innerHeight, inWidth: window.innerWidth};
  $scope.isPortrait = true;
  $scope.urxAvailable = true;
  if (device){
    try{
      cordova.plugins.screenorientation.unlockOrientation();
    } catch(e){
      screen.unlockOrientation();
    }
  }
  $scope.adjustTimer = function(){
    var timerHeight = $scope.dimensions.inHeight * .25;
    if ($scope.isPortrait){
      $scope.size =  Math.min(Math.max(timerHeight * .6,
                    60
                  ), timerHeight * .9);     
     } else {
      $scope.size = Math.min(Math.max($scope.dimensions.inHeight * .3,
                    90
                  ), 140);   
     }

    $scope.adjustTimerMinutes();
    if ($scope.dimensions.inWidth > 415 && $scope.dimensions.inHeight > 500){
      $scope.resizeOptions.defaultSize = 42;
    } else {
      $scope.resizeOptions.defaultSize = 30;
    }
  }
  $scope.adjustTimerMinutes = function(){
    var adjustmentAmount = Math.max(($scope.size * .40), 35);
    if ($scope.singleTimer.minutes > 0 || $scope.advancedTiming.breakTime > 59){
      angular.element(document.getElementById('timer-number-h1'))[0].style.fontSize = ($scope.size - 50) + 'px';
    } else {
      angular.element(document.getElementById('timer-number-h1'))[0].style.fontSize = ($scope.size - adjustmentAmount) + 'px';
    } 
  }
  // workout.html used to used ng-if to determine unlocked but Android manually sizes video-background at beginning and that goes away when element becomes false
  $scope.getImageAddress = function(currentEx){
    if (currentEx.unlocked) {
      return $scope.deviceBasePath + 'exercises/keyframe-middle/' + currentEx.image
    } else {
      return 'img/exercises/' + currentEx.image;   
    }
  }
  $scope.getImageAddressNext = function(currentEx){
    if (currentEx.unlocked) {
      return $scope.deviceBasePath + 'exercises/keyframe-first/' + currentEx.image
    } else {
      console.log(currentEx.image)
      return 'img/frames/' + currentEx.image;   
    }
  }
  $scope.setVideo = function(){
    console.log("setVideo()");
    var portraitMode = (ionic.viewport.orientation() == 0 || ionic.viewport.orientation() == 180) ? true : false;
    if (portraitMode){
      $scope.isPortrait = true;
      $scope.dimensions.inHeight = Math.max(window.innerHeight, window.innerWidth);
      $scope.dimensions.inWidth = Math.min(window.innerHeight, window.innerWidth);
      $ionicNavBarDelegate.showBar(true);
      if (ionic.Platform.isIOS() && device){
        StatusBar.show()
      }
    } else{
      $scope.isPortrait = false;
      $scope.showControls = true;
      $scope.controlTimeout = $timeout(function(){
        $scope.showControls = false;
      }, 3000);
      $scope.dimensions.inWidth = Math.max(window.innerHeight, window.innerWidth);
      $scope.dimensions.inHeight = Math.min(window.innerHeight, window.innerWidth);
      $ionicNavBarDelegate.showBar(false);
      if (ionic.Platform.isIOS() && device){
        StatusBar.hide()
      }
    }
    if (ionic.Platform.isAndroid()){
      var linkto = angular.element(document.getElementById('linkto'));
      var inlineVid = angular.element(document.getElementById('inlinevideo'));
      var vidBackground = angular.element(document.getElementById('video-background'));
      var imageOnly = angular.element(document.getElementById('image-only'));
      if(ionic.viewport.orientation() == 0 || ionic.viewport.orientation() == 180){
        var percentage = 98;
        var widthToUse = (percentage / 100) * $scope.dimensions.inWidth;
        var heightToUse = widthToUse / (720/404);
        var bHeight = 45;
        inlineVid.css('width', (widthToUse + 'px'));
        vidBackground.css('width', (widthToUse + 'px'));
        inlineVid.css('max-height', (heightToUse + 8 + 'px'));
        vidBackground.css('max-height', (heightToUse+ 8 + 'px'));
        inlineVid.css('min-width', (widthToUse + 'px'));
        vidBackground.css('min-width', (widthToUse + 'px'));
        inlineVid.css('max-width', (widthToUse + 'px'));
        vidBackground.css('max-width', (widthToUse + 'px'));
        inlineVid.css('left', '0px');
        linkto.css('left', '1%');
        linkto.css('min-height', bHeight + '%');
        linkto.css('margin-top', '0px');
      } else {
        var widthToUse = $scope.dimensions.inWidth * .80;
        var heightToUse = widthToUse / (720/404);
        var videoMargin = Math.max(($scope.dimensions.inHeight - heightToUse) / 2, 45);
        var bHeight = 25;
        if ($scope.advancedTiming.autoPlay){
          inlineVid.css('width', (heightToUse + 8 + 'px'));
          vidBackground.css('width', (widthToUse + 'px'));
          inlineVid.css('max-height', (heightToUse + 8 + 'px'));
          vidBackground.css('max-height', (heightToUse+ 8 + 'px'));
          inlineVid.css('min-width', (widthToUse + 'px'));
          vidBackground.css('min-width', (widthToUse + 'px'));
          inlineVid.css('max-width', (widthToUse + 'px'));
          vidBackground.css('max-width', (widthToUse + 'px'));
          linkto.css('left', '0%');
          inlineVid.css('left', '0px');
          linkto.css('left', '1%');
          linkto.css('min-height', bHeight + '%');
        } else {
          imageOnly.css('width', (widthToUse + 'px'));
          imageOnly.css('max-height', (heightToUse + 8 + 'px'));
          imageOnly.css('min-width', (widthToUse + 'px'));
          imageOnly.css('max-width', (widthToUse + 'px'));
          linkto.css('left', '10%');
        }
        linkto.css('margin-top', videoMargin + 'px');
        if (videoMargin > 45){
          angular.element(document.getElementById('next-exercise-id')).css('margin-top', ((videoMargin - 45) * -1) + 'px');
        }
        linkto.css('min-height', bHeight + '%');
      }
    }
    $scope.adjustTimer();
  }
  $scope.$on('$ionicView.enter', function () {
    $ionicSideMenuDelegate.canDragContent(false);
  });
  angular.element(document.getElementsByTagName('body')[0]).addClass('workout-bar');
  $scope.direction = false;
  $scope.strokeWidth = 5;
  $scope.stroke = '#FF8614';
  $scope.background = '#EEEEEE';
  $scope.totalWidth = 100;
  $scope.counterClockwise = true;
  LocalHistory.getCustomHistory.lastHomeURL = $location.$$url;
  $scope.healthKitData = {healthKitAvailable: false, showHealthKitOption: false, healthKitStatus: ''}
  if (!ionic.Platform.isAndroid()) {
    if (device){
      window.plugins.healthkit.available(
                                               function(result){
                                                if (result == true){
                                                  $scope.healthKitData.healthKitAvailable = true;
                                                }
                                               },
                                               function(){
                                                $scope.healthKitData.healthKitAvailable = false;
                                               }
                                        );
    } else {
      //Available in browser for testing purposes
      $scope.healthKitData.healthKitAvailable = true;
    }
  } else {
    if (isAmazon()){
      $scope.urxAvailable = false;
      window.appAvailability.check('com.spotify.music',function() {$scope.urxAvailable = true;},function(){});
    }
  }
  $scope.advancedTiming = WorkoutService.getTimingIntervals();
  $scope.kindleDevice = false;
  $scope.androidHeader = function(){
    if (ionic.Platform.isAndroid()){
      if (device){
        // FIXME: js error Cannot read property attributes of undefined
        document.querySelectorAll("drawer")[0].attributes.candrag.value = false || false;
      }
      $scope.androidPlatform = true;
      $scope.iOSPlatform = false;
      angular.element(document.getElementsByClassName('title')).addClass('no-nav');
      //$ionicNavBarDelegate.align('center');
      if (ionic.Platform.version() >= 4.4){
        $scope.isKitKat = true;
      } else{
        $scope.isKitKat = false;
      }
      if (isKindle()){
        $scope.kindleDevice = true;
      }
    } else{
      $scope.androidPlatform = false;
      $scope.iOSPlatform = true;
    }
  }
  $scope.androidHeader();
  
  $timeout(function(){
    $scope.androidHeader();
  }, 800);
  $scope.timesUsedVar = parseInt(window.localStorage.getItem('timesUsed'));
  $scope.userSettings = UserService.getUserSettings();
  $scope.googleFitSettings = UserService.getFitSettings();
  $scope.audioSettings = UserService.getAudioSettings();
  $scope.sevenTiming = WorkoutService.getSevenIntervals();
  $scope.previousExercise = false;
  $scope.endModalOpen = false;
  $scope.unloadQueue = [];
  $scope.isAutoStart = $scope.advancedTiming.autoStart;
  $scope.beginNotification = false;
  $scope.yogaSelection = false;
  $scope.helpText = false;
  $scope.changeText = false;
  var allWorkouts = WorkoutService.getWorkoutsByType();
  $scope.chosenWorkout = cloneObject(allWorkouts[$stateParams.typeId]);
  WorkoutService.getUserExercises()
      .then(function (userExercises) {
        controller.userExercises = userExercises;
        var cleanWorkout = [];
        if ($stateParams.typeId == "fullBody"){
          $scope.chosenWorkout.exercises = cleanWorkout.concat(allWorkouts['upperBody'].exercises.concat(allWorkouts['lowerBody'].exercises,allWorkouts['coreExercise'].exercises));
        } else if ($stateParams.typeId == "anythingGoes"){
          $scope.chosenWorkout.exercises = cleanWorkout.concat(allWorkouts['upperBody'].exercises.concat(allWorkouts['lowerBody'].exercises,allWorkouts['coreExercise'].exercises,allWorkouts['stretchExercise'].exercises,allWorkouts['backStrength'].exercises,allWorkouts['cardio'].exercises,allWorkouts['pilatesWorkout'].exercises));
        }
        for (i=0;i<$scope.chosenWorkout.exercises.length;i++) {
          if (userExercises[$scope.chosenWorkout.exercises[i]] != null) {
            cleanWorkout.push($scope.chosenWorkout.exercises[i])
          }
          if (i === $scope.chosenWorkout.exercises.length - 1) {
            //Get workout array
            $scope.chosenWorkout.exercises = cleanWorkout;
            $scope.currentWorkout = [];
            $scope.currentWorkout = $scope.currentWorkout.concat($scope.chosenWorkout.exercises);
            if ($stateParams.typeId == "quickFive"){
              checkVolume();
            }
            if ($scope.currentWorkout.length == 1){
              $scope.currentWorkout = $scope.currentWorkout.concat($scope.currentWorkout);
            }
            //Randomize Workouts
            if ($stateParams.typeId == 'headToToe' || ($stateParams.typeId == 'sevenMinute' && !$scope.sevenTiming.randomizationOptionSeven) || $stateParams.typeId == 'sunSalutation' || $stateParams.typeId == 'runnerYoga' || $stateParams.typeId == 'fullSequence'){
            } else {
               if($scope.advancedTiming.randomizationOption || !$scope.advancedTiming.customSet){
                  if ($stateParams.typeId == "upperBody"){
                    var pushupBased = ["Push-ups","Diamond Push-ups","Wide Arm Push-ups","Alternating Push-up Plank","One Arm Side Push-up", "Dive Bomber Push-ups","Shoulder Tap Push-ups", "Spiderman Push-up", "Push-up and Rotation"];
                    var nonPushup = ["Overhead Press","Overhead Arm Clap","Tricep Dips","Jumping Jacks", "Chest Expander", "T Raise","Lying Triceps Lifts","Reverse Plank","Power Circles","Wall Push-ups"]
                    pushupBased = pushupBased.sort(function() { return 0.5 - Math.random() });
                    nonPushup = nonPushup.sort(function() { return 0.5 - Math.random() });
                    var mergedUpper = mergeAlternating(pushupBased,nonPushup)
                    $scope.currentWorkout = mergedUpper;
                  } else{
                    $scope.currentWorkout = $scope.currentWorkout.sort(function() { return 0.5 - Math.random() });
                  }
               }
            }
            
            $scope.startedWorkout = [];
            $scope.startedWorkout = $scope.startedWorkout.concat($scope.currentWorkout);
          }
        }
        $scope.setDefaults();
      });

  $scope.extraSettings = WorkoutService.getTimingIntervals();
  $scope.showTiming = function(){
    $scope.stopTimer();
    $interval.cancel($scope.transitionCountdown);
    $timeout.cancel($scope.delayStart);
    $scope.transitionStatus = false;
    $scope.timerDelay = null;
    showTimingModal($scope,$ionicModal,$timeout, WorkoutService, $q, AppSyncService, true);
  }
  $scope.calcComplete = function (lower, upper){
    var calcResult = Math.max( 1 - (lower/upper), 0);
    return calcResult;
  }
  $scope.endWorkout = function(){
  $scope.endModalOpen = true;

  $scope.unlockMedal = false;
  $scope.unlockedToday = false;

  $scope.listOptions = [
      { text: "MEDALS", value: 'medals'},
      { text: "SESSION", value: "session" },
      { text: "GOALS", value: "goals" }
  ];
  $scope.optionSelected = {
      listType : 'medals'
  };
  $scope.sessionSelected = true;
  $scope.toggleLists = function(){
    if ($scope.optionSelected.listType == 'medals'){
      $ionicSlideBoxDelegate.slide(0);
    } else if ($scope.optionSelected.listType == 'session') {
      $ionicSlideBoxDelegate.slide(1);
    } else{
      $ionicSlideBoxDelegate.slide(2);
    }
  }
  $scope.updatedSlider = function(){
    if ($ionicSlideBoxDelegate.currentIndex() == 0){
      $scope.optionSelected.listType = 'medals';
    } else if ($ionicSlideBoxDelegate.currentIndex() == 1){
      $scope.optionSelected.listType = 'session';
    } else {
      $scope.optionSelected.listType = 'goals';
    }
  }
  $ionicModal.fromTemplateUrl('workout-complete.html', function(modal) {
                                $scope.endModal = modal;
                                }, {
                                scope:$scope,
                                animation: 'superScaleIn',
                                focusFirstInput: false,
                                backdropClickToClose: false,
                                hardwareBackButtonClose: false
                                });
      $scope.openModal = function() {
        $scope.stopTimer();
        $interval.cancel($scope.transitionCountdown);
        $timeout.cancel($scope.delayStart);
        $scope.transitionStatus = false;
        $timeout( function() {
          $ionicSlideBoxDelegate.update();
        },0);
          var mathComp = ($stateParams.timeId * 60) - ((($scope.totalTimer.minutes) * 60) + $scope.totalTimer.seconds);
          $scope.timeToAdd = Math.round( (mathComp / 60) * 2) / 2.0;
          if ($stateParams.typeId == 'sevenMinute' && !$scope.workoutComplete && $stateParams.timeId % 7 == 0){
            //Close enough
            $scope.timeToAdd = $scope.timeToAdd - ($stateParams.timeId / 7);
            $scope.timeToAdd = $scope.timeToAdd * ($scope.advancedTiming.exerciseTime / 30);
          }
          if ($scope.timeToAdd > 0){
                var kilograms;
                var burnValue = $scope.chosenWorkout.activityWeight;
                kilograms=PersonalData.GetUserSettings.weight / 2.2;
                $scope.minutesCompleted = $scope.timeToAdd / 60.0;
                $scope.burn = Math.round(burnValue*kilograms*$scope.minutesCompleted);
          }
          else{
              $scope.burn = 0;
          }
          $scope.burnRounded = Math.round($scope.burn);
          $scope.timeToAddRounded = Math.round($scope.timeToAdd);
          $scope.syncStateWithWatch(false, true);
          if ($scope.workoutComplete){
            if ($scope.userSettings.mfpStatus){
              $timeout(function(){$scope.syncMFP();}, 0);
              $timeout(function(){$scope.endWorkoutAnalytics('MyFitnessPal Complete');}, 4000);
            } else{
              $timeout(function(){$scope.endWorkoutAnalytics('Regular Complete');}, 4000);
            }
          }
          if ($scope.burn == null){
            $scope.burn = 0;
          }
          var useDevice = device ? device.model : 'browser';
          var connectedApps = [];
          if ($scope.userSettings.mfpStatus) {
            connectedApps.push('MyFitnessPal');
          }
          if ($scope.userSettings.healthKit) {
            connectedApps.push('Apple Health');
          }
          if ($scope.googleFitSettings.enabled) {
            connectedApps.push('Google Fit');
          }
          connectedApps.push('Sworkit Pro');
          if ($scope.avgHeartRate > 0) {
            var heartRateData = {'average': $scope.avgHeartRate, 'peak': $scope.peakHeartRate}
          } else {
            var heartRateData = {'average': false, 'peak': false}
          }
          window.db.transaction(function (transaction) {
            transaction.executeSql('INSERT INTO Sworkit(created_on, minutes_completed, calories, type, utc_created, exercise_list, device_type, connected_apps, heart_rate) VALUES ((datetime("now","localtime")),?,?,?,datetime("now"),?,?,?,?)',
                [$scope.timeToAdd, $scope.burn, $stateParams.typeId, JSON.stringify($scope.trackedExercises), useDevice, connectedApps, JSON.stringify(heartRateData)],
                nullHandler,
                errorHandler);
            },
            function onError() {
              $log.info("tx onError");
            },
            function onSuccess() {
              $log.info("tx onSuccess");
              UserWorkoutService.getWorkoutsByDate()
                  .then(function (workoutsByDateForStreak) {
                    $log.info("getWorkoutsByDate", workoutsByDateForStreak);
                    $scope.streakCount = AchievementService.getStreakCount(workoutsByDateForStreak, new Date());
                  });
            });
          var totalWeek = parseInt(window.localStorage.getItem('weeklyTotal'));
          totalWeek += $scope.timeToAdd;
          window.localStorage.setItem('weeklyTotal', totalWeek);
          $scope.totals = {'totalEver':0,'todayMinutes':0,'todayMinutesRounded':0,'todayCalories':0,'weeklyMinutes':0,'weeklyCalories':0,'topMinutes':0, 'topCalories':0, 'topDayMins':'', 'topDayCals':''};
          $scope.goalSettings = UserService.getGoalSettings();
          $timeout( function() {
            buildStats($scope, $translate, 'workout');
          },0);
          $timeout( function() {
            $ionicSlideBoxDelegate.update();
          },1000);
          $scope.endModal.show();
          
          $timeout(function(){
            if (!$scope.workoutComplete && $scope.timeToAdd > 1){
                $ionicPopup.confirm({
                       title: $translate.instant('FINISHED'),
                       cancelText: $translate.instant('CANCEL_NO'),
                       template: '<p class="padding">' + $translate.instant('FINISHED_B') + '</p>',
                       okType: 'energized',
                       okText: $translate.instant('YES_SM')
                     }).then(function(res) {
                       if(res) {
                          $scope.confirmDone();
                       }
                     }); 
            }
          },1000)
      };
      $scope.confirmDone = function(){
        if (device){
          for (i=0;i<$scope.unloadQueue.length;i++){
            LowLatencyAudio.unload($scope.unloadQueue[i]);
          }
        }
        if (!$scope.workoutComplete){
          $scope.workoutComplete = true;
          $scope.playCongratsSound();
          if ($scope.userSettings.mfpStatus){
            $timeout(function(){$scope.syncMFP();}, 0);
            $timeout(function(){$scope.endWorkoutAnalytics('MyFitnessPal Partial');}, 4000);
          } else{
            $timeout(function(){$scope.endWorkoutAnalytics('Regular Partial');}, 4000);
          }
          if (device && $scope.userSettings.mPoints){
                $timeout(function(){$scope.endworkoutReward();}, 400);
              }
          if (device && $scope.userSettings.healthKit){
            $scope.syncHealthKit();
          }
          if (device && $scope.googleFitSettings.enabled){
            $scope.syncGoogleFit();
          }
          $scope.setVariables();
        }
      }
      $scope.cancelModal = function() {
          console.log("cancelModal");
          $scope.endModal.hide();
          $scope.endModal.remove();
          $scope.endModalOpen = false;
          $scope.syncStateWithWatch();
          window.db.transaction(function(transaction) {
                               transaction.executeSql('DELETE FROM Sworkit WHERE sworkit_id = (SELECT MAX(sworkit_id) FROM Sworkit)');
                               });
          var totalWeek = parseInt(window.localStorage.getItem('weeklyTotal'));
          totalWeek -= $scope.timeToAdd;
          window.localStorage.setItem('weeklyTotal', totalWeek);
      };
      $scope.mainMenu = function() {
          $scope.videoAddress = 'video/blank.mp4';
          $scope.currentWorkout = $scope.startedWorkout;
          $scope.endModal.hide();
          $scope.endModal.remove();
          $scope.endModalOpen = false;
          if ($scope.timeToAdd < 1){
            window.db.transaction(function(transaction) {
                               transaction.executeSql('DELETE FROM Sworkit WHERE sworkit_id = (SELECT MAX(sworkit_id) FROM Sworkit)');
                               });
            var totalWeek = parseInt(window.localStorage.getItem('weeklyTotal'));
            totalWeek -= $scope.timeToAdd;
            window.localStorage.setItem('weeklyTotal', totalWeek);
          } 
          document.removeEventListener("pause", workoutOnPause, false);
          document.removeEventListener("resume", onResumeWorkout, false);
          window.removeEventListener("orientationchange", orientationChange);

          //Ensure that Head to Toe does not keep randomization off for all future workouts
          if ($stateParams.typeId == 'headToToe' || $stateParams.typeId == 'sunSalutation' || $stateParams.typeId == 'fullSequence' || $stateParams.typeId == 'runnerYoga'){
            $scope.advancedTiming.randomizationOption = $scope.originalRandomization;

            if ($stateParams.typeId == 'headToToe'){
              persistMultipleObjects($q,{
              'timingSettings': TimingData.GetTimingSettings
            }, function() {
              // When all promises are resolved
              AppSyncService.syncLocalForageObject('timingSettings', [
                'randomizationOption',
              ], TimingData.GetTimingSettings);
            });
            } 
          }
          $scope.syncStateWithWatch(true);
          $ionicNavBarDelegate.showBackButton(true);
          $state.go('app.home');
      };
      $scope.endWorkoutAnalytics =function(mfpRegular){
        if (FirebaseService.authData){
          AppSyncService.syncWebSqlWorkoutLog();
        }
        if ($stateParams.typeId == "sunSalutation" || $stateParams.typeId == "fullSequence" || $stateParams.typeId == 'runnerYoga'){
          trackEvent('Yoga Finish', mfpRegular, $scope.timeToAdd);
        } else{
          trackEvent('Workout Finish', mfpRegular, $scope.timeToAdd);
        }
      }
      $scope.setVariables = function(){
        localforage.getItem('ratingCategory', function(result){
          if(!result.past){
            globalRateOption = true;
            localforage.setItem('ratingCategory', {show:true,past:false,shareCount:1,sharePast:false});
          } else{
            if (result.shareCount){
              result.shareCount++
            } else {
              result.shareCount = 2;
            }
            localforage.setItem('ratingCategory', {show:false,past:true,shareCount:result.shareCount,sharePast:false});
            globalShareOption = result.shareCount;
          }
        });
        localforage.getItem('remindHome', function(result){
          if(!result.past){
            globalRemindOption = true;
            localforage.setItem('remindHome', {show:true,past:true});
            if (!$scope.userSettings.healthKit && $scope.iOSPlatform){
              $scope.healthKitData.showHealthKitOption = $scope.healthKitData.healthKitAvailable;
            }
          }
        });
      }
      $scope.endworkoutReward = function(){
        if ($stateParams.typeId == "fullBody" || $stateParams.typeId == "upperBody" || $stateParams.typeId == "coreExercise" || $stateParams.typeId == "lowerBody" || $stateParams.typeId == "anythingGoes"){
          sessionm.phonegap.logAction(translations['EN'][LocalData.GetWorkoutTypes[$stateParams.typeId].activityNames]);
        } else if ($stateParams.typeId == "stretchExercise" || $stateParams.typeId == "backStrength" || $stateParams.typeId == "headToToe" || $stateParams.typeId == "pilatesWorkout" || $stateParams.typeId == "standingStretches" || $stateParams.typeId == "officeStretch"){
          sessionm.phonegap.logAction('Stretch');
        } else if ($stateParams.typeId == "sunSalutation" || $stateParams.typeId == "fullSequence" || $stateParams.typeId == 'runnerYoga'){
          sessionm.phonegap.logAction('Yoga');
        } else if ($stateParams.typeId == "bootCamp" || $stateParams.typeId == "rumpRoaster" || $stateParams.typeId == "bringThePain" || $stateParams.typeId == "sevenMinute"){
          sessionm.phonegap.logAction('Bonus Workout');
        } else if ($stateParams.typeId == "quickFive"){
          sessionm.phonegap.logAction('Quick Five');
        } else if ($stateParams.typeId == "customWorkout"){
          sessionm.phonegap.logAction('Custom Workout');
        } else if ($stateParams.typeId == "cardio" || $stateParams.typeId == "cardioLight", $stateParams.typeId == "plyometrics"){
          sessionm.phonegap.logAction('Cardio');
        }
        var tempTotal = $scope.totals.todayMinutes;
        if (tempTotal >= 5){
          for (var i = 0; i <Math.floor(tempTotal / 5);i++){
            sessionm.phonegap.logAction('Bonus5');
          }
        }
        if (tempTotal >= 10){
          for (var i = 0; i <Math.floor(tempTotal / 10);i++){
            sessionm.phonegap.logAction('Bonus10');
          }
        }
        if ($scope.timeToAdd > 30){
          sessionm.phonegap.logAction('30 Full Minutes');
        }
        if ($scope.totals.todayMinutes > $scope.goalSettings.dailyGoal){
          sessionm.phonegap.logAction('Daily Goal Met');
        }
        if ($scope.totals.todayMinutes > $scope.goalSettings.weeklyGoal){
          sessionm.phonegap.logAction('Weekly Goal Met');
        }
        window.db.transaction(
                           function(transaction) {
                           transaction.executeSql("SELECT * FROM Sworkit WHERE created_on > (SELECT DATETIME('now', '-1 day'))",
                                                  [],
                                                  function(tx, results){
                                                    var workoutsToday = results.rows.length;
                                                    if (workoutsToday == 2){
                                                      sessionm.phonegap.logAction('Double Take');
                                                    } else if(workoutsToday == 3) {
                                                      sessionm.phonegap.logAction('Triple Hit');
                                                    }
                                                  },
                                                  null)
                           }
                           );
        $timeout(function(){
          $scope.getSessionMCount();
          $scope.$apply(); 
        }, 3000);
     
      }
      $scope.$on('$ionicView.leave', function() {
                 $scope.endModal.remove();
                 });
      $timeout(function(){
        $scope.openModal();
      }, 0);

    $scope.sessionMCount = {count:false, mPointsAvailable: $rootScope.sessionMAvailable};
    
    $scope.getSessionMCount = function(){
      sessionm.phonegap.getUnclaimedAchievementCount(function callback(data) {
        $scope.sessionMCount.count = (data.unclaimedAchievementCount == 0) ? false : data.unclaimedAchievementCount;  
        $scope.$apply();
      });
      sessionm.phonegap.listenDidDismissActivity(function callback(data2) {
        $scope.getSessionMCount();
      });
    }
    $scope.launchMPoints = function(){
      if (device){
        sessionm.phonegap.presentActivity(2);
      }
    }
    $scope.challengeFriend = function(){
      var challengeText = $translate.instant('I_AWESOME') + ' ' + $scope.timeToAdd + ' ' + $translate.instant('MINUTES_OF') + ' ' + $translate.instant(LocalData.GetWorkoutTypes[$stateParams.typeId].activityNames) + ' ' + $translate.instant('EX_WITH') + ' Sworkit Pro ' + $translate.instant('HASHTAG');
      window.plugins.socialsharing.share(challengeText, null, null, null)
    }
    $scope.enableHealthKit = function(){
      $scope.healthKitData.showHealthKitOption = false;
      window.plugins.healthkit.requestAuthorization(
                                                          {
                                                          'readTypes'  : [ 'HKQuantityTypeIdentifierBodyMass', 'HKQuantityTypeIdentifierHeartRate'],
                                                          'writeTypes' : [ 'HKQuantityTypeIdentifierActiveEnergyBurned', 'workoutType']
                                                          },
                                                          function(){
                                                            PersonalData.GetUserSettings.healthKit = true;
                                                            $scope.userSettings.healthKit = true;
                                                            localforage.setItem('userSettings', PersonalData.GetUserSettings);
                                                            $scope.syncHealthKit();
                                                          },
                                                          function(){}
                                                          );
    }
    $scope.syncHealthKit = function(){
      var workoutHK;
      if ($stateParams.typeId == "upperBody" || $stateParams.typeId == "coreExercise" || $stateParams.typeId == "lowerBody"){
          workoutHK = 'HKWorkoutActivityTypeFunctionalStrengthTraining';
        } else if ($stateParams.typeId == "stretchExercise" || $stateParams.typeId == "backStrength" || $stateParams.typeId == "headToToe" || $stateParams.typeId == "standingStretches" || $stateParams.typeId == "officeStretch"){
          workoutHK = 'HKWorkoutActivityTypePreparationAndRecovery';
        } else if ($stateParams.typeId == "sunSalutation" || $stateParams.typeId == "fullSequence" || $stateParams.typeId == 'runnerYoga'){
          workoutHK = 'HKWorkoutActivityTypeYoga';
        } else if ($stateParams.typeId == "customWorkout" || $stateParams.typeId == "fullBody"  || $stateParams.typeId == "anythingGoes" || $stateParams.typeId == "bootCamp" || $stateParams.typeId == "rumpRoaster" || $stateParams.typeId == "bringThePain" || $stateParams.typeId == "sevenMinute" || $stateParams.typeId == "quickFive"){
          workoutHK = 'HKWorkoutActivityTypeCrossTraining';
        } else if ($stateParams.typeId == "cardio" || $stateParams.typeId == "cardioLight" || $stateParams.typeId == "plyometrics"){
          workoutHK = 'HKWorkoutActivityTypeMixedMetabolicCardioTraining';
        } else if ($stateParams.typeId == "pilatesWorkout"){
          workoutHK = 'HKWorkoutActivityTypeDanceInspiredTraining';
        }
      window.plugins.healthkit.saveWorkout({
                                                 'activityType': workoutHK,
                                                 'quantityType': null,
                                                 'startDate': $scope.startDate,
                                                 'endDate': null,
                                                 'requestReadPermission' : false,
                                                 'duration': $scope.minutesCompleted * 60 * 60,
                                                 'energy': $scope.burn,
                                                 'energyUnit': 'kcal',
                                                 'distance': null,
                                                 'distanceUnit': 'm'
                                                 },
                                                 function(msg){
                                                  //console.log('HealthKit success: ' + msg);
                                                  $scope.healthKitData.healthKitStatus = $translate.instant('SAVED') + ' HealthKit';
                                                  $timeout(function(){
                                                    $scope.healthKitData.healthKitStatus = '';
                                                  }, 5000)
                                                 },
                                                 function(msg){
                                                  //console.log('HealthKit error: ' + msg);
                                                 }
                                                 );

    }
    $scope.enableGoogleFit = function(){
      var infoTemplate = '<div class="end-workout-health" style="text-align: center;width:230px;margin:0px auto"><img src="img/googleFit.png" style="height:50px;display: block;margin: 10px auto;"/><div style="width:100%"><p>' + $translate.instant('GFIT_1') + '</p><p>' + $translate.instant('GFIT_2') + '</p><p style="color:#777;font-size:12px">' + $translate.instant('GFIT_3') + '</p><button class="button button-assertive" ng-click="confirmGoogleFit()" style="width:230px">{{"CONNECT_FIT" | translate}}</button></div></div>';
      $scope.googleFitPopup = $ionicPopup.show({
        title: '',
        subTitle: '',
        scope: $scope,
        template: infoTemplate,
        hardwareBackButtonClose: true,
        buttons: [
          { text: $translate.instant('CANCEL_SM') }
        ]
      });
    }
    $scope.hideGoogleFitPopup = function(){
      $scope.googleFitPopup.close();
    }
    $scope.confirmGoogleFit = function(){
      $scope.hideGoogleFitPopup();
      $scope.googleFitSettings.enabled = true;
      $scope.googleFitSettings.attempted = true;
      $scope.syncGoogleFit();
      localforage.setItem('googleFitStatus', PersonalData.GetGoogleFit);
    }
    $scope.syncGoogleFit = function(){
      var fitnessActivity;
      if ($stateParams.typeId == "upperBody" || $stateParams.typeId == "fullBody" || $stateParams.typeId == "coreExercise" || $stateParams.typeId == "lowerBody"){
          fitnessActivity = 'STRENGTH_TRAINING';
        } else if ($stateParams.typeId == "stretchExercise" || $stateParams.typeId == "backStrength" || $stateParams.typeId == "headToToe" || $stateParams.typeId == "standingStretches" || $stateParams.typeId == "officeStretch"){
          fitnessActivity = 'CALISTHENICS';
        } else if ($stateParams.typeId == "sunSalutation" || $stateParams.typeId == "fullSequence" || $stateParams.typeId == 'runnerYoga'){
          fitnessActivity = 'YOGA';
        } else if ($stateParams.typeId == "customWorkout" || $stateParams.typeId == "anythingGoes" || $stateParams.typeId == "bootCamp" || $stateParams.typeId == "rumpRoaster" || $stateParams.typeId == "bringThePain" || $stateParams.typeId == "sevenMinute" || $stateParams.typeId == "quickFive"){
          fitnessActivity = 'CIRCUIT_TRAINING';
        } else if ($stateParams.typeId == "cardio" || $stateParams.typeId == "cardioLight" || $stateParams.typeId == "plyometrics"){
          fitnessActivity = 'CIRCUIT_TRAINING';
        } else if ($stateParams.typeId == "pilatesWorkout"){
          fitnessActivity = 'PILATES';
        }
        window.plugins.GoogleFit.insertSession(
          [$scope.startDate.getTime(), $scope.minutesCompleted * 60 * 60000, "Sworkit", fitnessActivity],
          function(){
            $scope.healthKitData.healthKitStatus = $translate.instant('SAVED') + ' Google Fit';
            $timeout(function(){
              $scope.healthKitData.healthKitStatus = '';
            }, 5000)
          },
          function(result){console.log('Google Fit Fail ' + result)}
        )      
    }
  }
  $scope.myFitnessPalRetry = true;
  $scope.syncMFP = function(){
    var dateString = $scope.startTime;
    var actionString = "log_cardio_exercise";
    var accessString = PersonalData.GetUserSettings.mfpAccessToken;
    var appID = "79656b6e6f6d";
    var exerciseID = LocalData.GetWorkoutTypes[$stateParams.typeId].activityMFP;
    var durationFloat = $scope.timeToAdd * 60000;
    var energyCalories = $scope.burn;
    var unitCountry = "US";
    var statusMessage = "burned %CALORIES% calories doing %QUANTITY% minutes of " + $translate.instant(LocalData.GetWorkoutTypes[$stateParams.typeId].activityNames) + " with Sworkit Pro";
    console.log('MFP Sync time: ' + $scope.startTime);
    var dataPost = JSON.stringify({'action' : actionString, 'access_token' : accessString,'app_id': appID, 'exercise_id': exerciseID, 'duration': durationFloat, 'energy_expended': energyCalories, 'start_time' : dateString, 'status_update_message': statusMessage, 'units': unitCountry});
    $http({
      method: 'POST',
      url: 'https://www.myfitnesspal.com/client_api/json/1.0.0?client_id=sworkit',
      data: dataPost,
      headers: {'Content-Type': 'application/json'}
    }).then(function(resp){
      showNotification($translate.instant('MFP_SUCCESS'), 'button-calm', 4000);
     }, function(err) {
      if ($scope.myFitnessPalRetry){
        $scope.myFitnessPalRetry = false;
        $timeout(function(){
          $scope.syncMFP();
        }, 1400);
      } else {
        showNotification($translate.instant('MFP_ERROR'), 'button-assertive', 4000);
      } 
    })
  }
            
  $ionicModal.fromTemplateUrl('show-video.html', function(modal) {
                                $scope.videoModal = modal;
                                }, {
                                scope:$scope,
                                animation: 'fade-implode',
                                focusFirstInput: false,
                                backdropClickToClose: false,
                                hardwareBackButtonClose: true
                                });
  $scope.showVideo = false;
  $scope.openVideoModal = function() {
    $scope.networkConnection = navigator.onLine;
    $scope.stopTimer();
    $interval.cancel($scope.transitionCountdown);
    $timeout.cancel($scope.delayStart);
    $scope.transitionStatus = false;
    $scope.timerDelay = null;
    $scope.videoModal.show();
    if ($scope.androidPlatform && device){
      if ($scope.advancedTiming.autoPlay){
        // FIXME: Do same here as whatever works for inline video
        window.plugins.html5Video.initialize({
          "modalvideoplayer" : $scope.currentExercise.video,
          "unlocked": $scope.currentExercise.unlocked
        })
        $timeout(function(){
          window.plugins.html5Video.play("modalvideoplayer", function(){})
        }, 1400)
        $timeout(function(){
          angular.element(document.getElementById('modalvideoplayer')).css('opacity','1');
        }, 2500)
        $timeout(function(){
            angular.element(document.getElementById('modalvideoplayer')).css('opacity','0.00001');
          }, 0);
      } else{
        $timeout(function(){
              var videoPlayerFrame = angular.element(document.getElementById('modalvideoplayer'));
              videoPlayerFrame.css('opacity','0.00001');
              videoPlayerFrame[0].src = 'http://m.sworkit.com/assets/exercises/Videos/' + $scope.currentExercise.video;

              videoPlayerFrame[0].addEventListener("timeupdate", function() {
                if (videoPlayerFrame[0].duration > 0 
                  && Math.round(videoPlayerFrame[0].duration) - Math.round(videoPlayerFrame[0].currentTime) == 0) {
                  
                  //if loop atribute is set, restart video
                    if (videoPlayerFrame[0].loop) {
                        videoPlayerFrame[0].currentTime = 0;
                    }
                }
              }, false);
              
              videoPlayerFrame[0].addEventListener("canplay", function(){
                videoPlayerFrame[0].removeEventListener("canplay", this, false);
                videoPlayerFrame[0].play();
                videoPlayerFrame.css('opacity','1');
              }, false);
              
              videoPlayerFrame[0].play();
            },100);
      } 
    } else {
      $scope.videoAddressModal = $scope.getVideoLocation() + $scope.currentExercise.video +'?random=1';
    }
    var calcHeight = (angular.element(document.getElementsByClassName('modal')).prop('offsetHeight'))   * .7;
    calcHeight = calcHeight +'px';
    $scope.showVideo = true;
  } 
  $scope.cancelVideoModal = function() {
    $scope.showVideo = false;
    $scope.videoModal.hide();
    // if($scope.advancedTiming.autoPlay){
    //   var videoElement = angular.element(document.getElementById('inline-video'))[0];
    //   videoElement.muted= true;
    //   videoElement.play();
    // }
  };
  $scope.$on('$ionicView.leave', function() {
    $scope.showVideo = false;
    $scope.videoModal.remove();
  });

  $scope.isPaused = function () {
    return !$scope.totalTimerRunning;
  }
  //Interval variable is 'start'
  var start;

  $scope.setMinutes = function (){
    var singleSeconds = $scope.advancedTiming.exerciseTime;
    var totalMinutes = $stateParams.timeId;
    if (singleSeconds > 60){
      $scope.singleTimer.minutes = Math.floor(singleSeconds / 60);
      $scope.singleTimer.seconds = singleSeconds % 60;
    } else {
      $scope.singleTimer.minutes = 0;
      $scope.singleTimer.seconds = singleSeconds;
    }
    if ($stateParams.typeId == 'sevenMinute' && $stateParams.timeId % 7 == 0){
      var mathMin = ($scope.advancedTiming.exerciseTime * 12) / 60;
      var parseMin = parseInt(mathMin);
      var mathSec = Math.round( (mathMin % parseMin) * 10) / 10;
      mathSec = mathSec * 60;
      if (mathSec.toString().length == 1){
          mathSec = "0" + mathSec;
      }
      $scope.totalTimer.seconds = parseInt(mathSec);
      $scope.totalTimer.minutes =  (parseMin * $stateParams.timeId/7);
    } else {
      $scope.totalTimer.minutes = totalMinutes;
      $scope.totalTimer.seconds = 0;
    }
    $scope.updateTime();
  }
  $scope.updateTime = function() {
    $scope.singleTimer.displayText = $scope.displayTime($scope.singleTimer.minutes, $scope.singleTimer.seconds, 'single');
    $scope.totalTimer.displayText = $scope.displayTime($scope.totalTimer.minutes, $scope.totalTimer.seconds, 'total');
  }
  $scope.displayTime = function(mins, secs, type){
    var cleanedTime;
    if (mins > 0 && secs < 10){
        secs = '0' + secs;
    } else if (type == 'total' && secs < 10){
      secs = '0' + secs;
    }
    if (mins > 0 || type == 'total'){
      return mins + ":" + secs;
    } else{
      return secs;
    }
  }
  
  $scope.getVideoLocation = function() {
    if ($scope.currentExercise.unlocked) {
      return $scope.deviceBasePath + 'exercises/video/';
    } else {
      return 'video/';
    }
  };

  $scope.getAudioLocation = function(requestedExercise) {
    if (requestedExercise.unlocked) {
      console.log("getAudioLocation() is unlocked");
      return $scope.deviceBasePath + 'exercises/audio/' + PersonalData.GetUserSettings.preferredLanguage.toLowerCase() + '/';
    } else {
      console.log("getAudioLocation() is NOT unlocked");
      return normalAudioPath;
    }
  };

  //Set defaults each time
  $scope.setDefaults = function() {
    angular.element(document.getElementById('inline-video')).css('opacity','0.0001');
    angular.element(document.getElementById('video-background')).css('opacity','0.00001');
    angular.element(document.getElementById('inlinevideo')).css('opacity','0.0001');

    $scope.currentExercise = controller.userExercises[$scope.currentWorkout[0]];
    $scope.currentExercise.imageAddress = $scope.getImageAddress(controller.userExercises[$scope.currentWorkout[0]]);
    $scope.nextExercise = {status: false, name: false, imageAddress: $scope.getImageAddressNext(controller.userExercises[$scope.currentWorkout[0]]), unlocked: controller.userExercises[$scope.currentWorkout[0]].unlocked || false};
    if ($scope.androidPlatform && device){
        console.log("First window.plugins.html5Video.initialize() with unlocked property...");
        window.plugins.html5Video.initialize({
          "inlinevideo" : $scope.currentExercise.video,
          "unlocked": $scope.currentExercise.unlocked
        });
    } else {
      $scope.videoAddress = $scope.getVideoLocation() + $scope.currentExercise.video;
    }
    $timeout(function(){
      if ($scope.currentExercise.switchOption){
        $scope.helpText = $translate.instant('CHANGE_SIDE');
      } else{
        $scope.helpText = false;
      }
      angular.element(document.getElementById('total-progress-bar')).addClass('started');
    }, 800);
    $scope.hasStarted = false;
    $scope.transitionsStatus = false;
    $scope.timerDelay = null;
    $scope.workoutComplete = false;
    $scope.numExercises = 0;
    $scope.originalRandomization = $scope.advancedTiming.randomizationOption;
    $scope.trackedExercises = [];
    $scope.heartRateSamples = [];
    if ($stateParams.typeId == 'sevenMinute'){
      $scope.advancedTiming.breakFreq = 0;
      $scope.advancedTiming.restStatus = false
      $scope.advancedTiming.exerciseTime = $scope.sevenTiming.exerciseTimeSeven;
      $scope.advancedTiming.breakTime = 0;
      $scope.advancedTiming.transitionTime = $scope.sevenTiming.transitionTimeSeven;
      $scope.advancedTiming.randomizationOption = $scope.sevenTiming.randomizationOptionSeven;
    } else if (!$scope.advancedTiming.customSet){
      $scope.advancedTiming.breakFreq = 5;
      $scope.advancedTiming.restStatus = true;
      $scope.advancedTiming.exerciseTime = 30;
      $scope.advancedTiming.breakTime = 30;
      $scope.advancedTiming.transitionTime = 0;
      $scope.advancedTiming.randomizationOption = true;
      if ($stateParams.typeId == 'headToToe' || $stateParams.typeId == 'stretchExercise' || $stateParams.typeId == 'sevenMinute' || $stateParams.typeId == "standingStretches" || $stateParams.typeId == "officeStretch"){
          $scope.advancedTiming.breakFreq = 0;
          $scope.advancedTiming.restStatus = false;
        }
    }
    if ($stateParams.typeId == 'headToToe'){
      $scope.advancedTiming.randomizationOption = false;
    }
    if ($stateParams.typeId == 'sunSalutation'){
      $scope.yogaSelection = true;
      $scope.advancedTiming.customSet = false;
      $scope.advancedTiming.breakFreq = 0;
      $scope.advancedTiming.restStatus = true;
      $scope.advancedTiming.warningAudio = false;
      $scope.advancedTiming.exerciseTime = $scope.advancedTiming.sunSalutation;
      $scope.advancedTiming.breakTime = 0;
      $scope.advancedTiming.transitionTime = 0;
      $scope.advancedTiming.randomizationOption = false;
    } else if ($stateParams.typeId == 'fullSequence'){
      $scope.yogaSelection = true;
      $scope.advancedTiming.customSet = false;
      $scope.advancedTiming.breakFreq = 0;
      $scope.advancedTiming.restStatus = true;
      $scope.advancedTiming.warningAudio = false;
      $scope.advancedTiming.exerciseTime = $scope.advancedTiming.fullSequence;
      $scope.advancedTiming.breakTime = 0;
      $scope.advancedTiming.transitionTime = 0;
      $scope.advancedTiming.randomizationOption = false;
    } else if ($stateParams.typeId == 'runnerYoga'){
      $scope.yogaSelection = true;
      $scope.advancedTiming.customSet = false;
      $scope.advancedTiming.breakFreq = 0;
      $scope.advancedTiming.restStatus = true;
      $scope.advancedTiming.warningAudio = false;
      $scope.advancedTiming.exerciseTime = $scope.advancedTiming.runnerYoga;
      $scope.advancedTiming.breakTime = 0;
      $scope.advancedTiming.transitionTime = 0;
      $scope.advancedTiming.randomizationOption = false;
    }
    $scope.nextExercise.name = controller.userExercises[$scope.currentWorkout[1]].name;
    $scope.transitionCountdown;

    $scope.singleTimerRunning = false;
    $scope.totalTimerRunning = false;
    $scope.singleTimer = {time: $scope.advancedTiming.exerciseTime, minutes: 0, seconds: 0, displayText: '', status: false};
    $scope.totalTimer = {time: $stateParams.timeId, minutes: 0, seconds: 0, displayText: '', status: false};
    $scope.singleSecondsStart = $scope.advancedTiming.exerciseTime;
    $scope.totalSecondsStart = $stateParams.timeId;

    $scope.setMinutes();
    
    $scope.initWatch(function(result){
            //$scope.initWatch();
            $scope.syncStateWithWatch();
          }, 
          function(){
          
          }
    );
    
    $timeout(function(){

     angular.element(document.getElementById('video-background')).css('opacity','1');
     if ($scope.advancedTiming.autoPlay){
     var videoFrame = angular.element(document.getElementById('inline-video'))[0];
       if (ionic.Platform.isAndroid() && device){
         // TODO: Isn't this already initialized above? When I logged it, initialize() was called twice.
        console.log("Second window.plugins.html5Video.initialize() with unlocked property...");
        window.plugins.html5Video.initialize({
          "inlinevideo" : $scope.currentExercise.video,
          "unlocked": $scope.currentExercise.unlocked
        });
       setTimeout(function(){
                  playInlineVideo($scope.advancedTiming.autoPlay);
                  }, 500);
       setTimeout(function(){
                  angular.element(document.getElementById('inlinevideo')).css('opacity','1');
                  $scope.nextExercise.imageAddress = $scope.getImageAddressNext(controller.userExercises[$scope.currentWorkout[1]]);
                  $scope.nextExercise.unlocked = controller.userExercises[$scope.currentWorkout[1]].unlocked || false;
                  $scope.$apply();
                  }, 1500)
       } else {
       clearTimeout(inlineVideoTimeout);
       var playEventListener = function(){
       playInlineVideo($scope.advancedTiming.autoPlay, controller.userExercises[$scope.currentWorkout[0]]);
       setTimeout(function(){angular.element(document.getElementById('inline-video')).css('opacity','1');
                  $scope.nextExercise.imageAddress = $scope.getImageAddressNext(controller.userExercises[$scope.currentWorkout[1]]);
                  $scope.nextExercise.unlocked = controller.userExercises[$scope.currentWorkout[1]].unlocked || false;
                  $scope.$apply();
                  }, 1000);
       videoFrame.removeEventListener('canplaythrough', playEventListener);
       }
       videoFrame.addEventListener('canplaythrough', playEventListener);
       setTimeout(function(){angular.element(document.getElementById('inline-video')).css('opacity','1');
                  }, 1500);
       }
     } else {
     setTimeout(function(){angular.element(document.getElementById('inline-video')).css('opacity','1');
                $scope.nextExercise.imageAddress = $scope.getImageAddressNext(controller.userExercises[$scope.currentWorkout[1]]);
                $scope.nextExercise.unlocked = controller.userExercises[$scope.currentWorkout[1]].unlocked || false;
                }, 500);   
     }
    if($scope.isAutoStart){
      $scope.transitionAction(true);
    }

    },200)

    $timeout(function(){
          $scope.setVideo();
    },500)
  };

  $scope.startTimer = function (){

    start = $interval(function() {
      if ($scope.totalTimer.seconds % 5 == 0){
        $scope.totalWidth = 100 - (((($stateParams.timeId * 60) - ((($scope.totalTimer.minutes) * 60) + $scope.totalTimer.seconds)) / ($stateParams.timeId * 60)) * 100);
      }
      if ($scope.totalTimer.seconds == 0 && $scope.totalTimer.minutes == 0){
        $scope.playCongratsSound();
        $scope.workoutComplete = true;
        $scope.endWorkout();
        $scope.trackedExercises.push({'exercise': translations['EN'][$scope.currentExercise.name], 'length': $scope.advancedTiming.exerciseTime});
        $scope.stopTimer;
        $scope.singleTimer.seconds = 1;
        $scope.totalTimer.seconds = 1;
        if (device && $scope.userSettings.mPoints){
              $timeout(function(){$scope.endworkoutReward();}, 1200);
            }
        if (device && $scope.userSettings.healthKit){
            $timeout(function(){$scope.syncHealthKit();}, 1500);
           }
        if (device && $scope.googleFitSettings.enabled){
          $timeout(function(){$scope.syncGoogleFit();}, 1500);
        }
        $scope.setVariables();
      }
      else if ($scope.totalTimer.seconds == 0 && $scope.totalTimer.minutes > 0){
        $scope.totalTimer.seconds = 60;
        $scope.totalTimer.minutes --;
      }

      if ($scope.currentExercise.switchOption && $scope.singleTimer.seconds == (Math.round($scope.advancedTiming.exerciseTime / 2))) {
        if ($scope.currentExercise.image !== "restbreak.jpg"){
          $scope.playSwitchSound();
          $scope.changeText = $translate.instant('CHANGE_SIDE_SM');
          continueInlineVideo($scope.advancedTiming.autoPlay, controller.userExercises[$scope.currentWorkout[0]]);
        }
      } else if ($scope.advancedTiming.warningAudio){
        if ($scope.singleTimer.seconds == 11 && $scope.numExercises !== $scope.advancedTiming.breakFreq - 1){
          if ($scope.totalTimer.minutes == 0){
            if ($scope.totalTimer.seconds > 11){
              $scope.playNextWarning(controller.userExercises[$scope.currentWorkout[1]]);
              $scope.nextExercise.name = controller.userExercises[$scope.currentWorkout[1]].name;
              $scope.nextExercise.status = true;
            }
          } else if ($scope.singleTimer.minutes == 0){
            $scope.playNextWarning(controller.userExercises[$scope.currentWorkout[1]]);
            $scope.nextExercise.name = controller.userExercises[$scope.currentWorkout[1]].name;
            $scope.nextExercise.status = true;
          }
        }
      }
      if ($scope.singleTimer.seconds == 0 && $scope.singleTimer.minutes == 0){
        $scope.numExercises++;
        if ($scope.numExercises == $scope.advancedTiming.breakFreq && $scope.advancedTiming.breakFreq !== 0 && $scope.advancedTiming.restStatus && $scope.advancedTiming.breakTime > 0){
            $scope.nextExercise.status = false;
            $scope.playBreakSound();
            $scope.numExercises = -1;
            $scope.helpText = false;
            var breakText = $translate.instant('TAKE') + " " + $scope.advancedTiming.breakTime + " " + $translate.instant('SEC_BREAK');
            $scope.currentExercise = {"name":breakText,"image":"restbreak.jpg","youtube":"rN6ATi7fujU","switchOption":false,"video":"restbreak.mp4","category":false};
            $scope.currentExercise.imageAddress = 'img/frames/restbreak.jpg';
            $scope.videoAddress = 'video/restbreak.mp4';
            $scope.nextExercise.name = controller.userExercises[$scope.currentWorkout[1]].name;
            if ($scope.androidPlatform && device){
            } else {
              $scope.videoAddress = 'video/restbreak.mp4';
            }
            var videoFrame = angular.element(document.getElementById('inline-video'))[0];
            if ($scope.advancedTiming.autoPlay){

              if (ionic.Platform.isAndroid() && device){
                angular.element(document.getElementById('inlinevideo')).css('opacity','0.00001');
                console.log("Third window.plugins.html5Video.initialize() with unlocked property...");
                window.plugins.html5Video.initialize({
                  "inlinevideo" : 'restbreak.mp4',
                  "unlocked": $scope.currentExercise.unlocked
                });
                setTimeout(function(){
                  playInlineVideo($scope.advancedTiming.autoPlay);
                }, 500);
                setTimeout(function(){
                  angular.element(document.getElementById('inlinevideo')).css('opacity','1');
                  $scope.nextExercise.imageAddress = $scope.getImageAddressNext(controller.userExercises[$scope.currentWorkout[1]]);
                  $scope.nextExercise.unlocked = controller.userExercises[$scope.currentWorkout[1]].unlocked || false;
                  $scope.nextExercise.name = controller.userExercises[$scope.currentWorkout[1]].name;
                  $scope.$apply();
                }, 1500)
              }
              else{
                angular.element(document.getElementById('inline-video')).css('opacity','0.0001');
                var playEventListener = function(){
                  playInlineVideo($scope.advancedTiming.autoPlay, controller.userExercises[$scope.currentWorkout[0]]);
                  $timeout(function(){
                         $scope.nextExercise.imageAddress = $scope.getImageAddressNext(controller.userExercises[$scope.currentWorkout[1]]);
                         $scope.nextExercise.unlocked = controller.userExercises[$scope.currentWorkout[1]].unlocked || false;
                         $scope.nextExercise.name = controller.userExercises[$scope.currentWorkout[1]].name;
                         $scope.$apply()
                         }, 2000);
                  setTimeout(function(){angular.element(document.getElementById('inline-video')).css('opacity','1');}, 500);
                  videoFrame.removeEventListener('canplaythrough', playEventListener);
                }
                videoFrame.addEventListener('canplaythrough', playEventListener);
              }
            } else {
              setTimeout(function(){angular.element(document.getElementById('inline-video')).css('opacity','1');
                $scope.nextExercise.imageAddress = $scope.getImageAddressNext(controller.userExercises[$scope.currentWorkout[1]]);
                $scope.nextExercise.unlocked = controller.userExercises[$scope.currentWorkout[1]].unlocked || false;
                $scope.nextExercise.name = controller.userExercises[$scope.currentWorkout[1]].name;
              }, 500);
            }
            var singleSeconds = $scope.advancedTiming.breakTime;
            if (singleSeconds > 60){
              $scope.singleTimer.minutes = Math.floor(singleSeconds / 60);
              $scope.singleTimer.seconds = singleSeconds % 60;
              if ($scope.singleTimer.seconds == 0){
                $scope.singleTimer.seconds = 60;
                $scope.singleTimer.minutes--;
              }
            } else {
              $scope.singleTimer.minutes = 0;
              $scope.singleTimer.seconds = singleSeconds;
            }
            $scope.updateTime();
            $scope.syncStateWithWatch();
        }
        else{
            $scope.skipExercise();
            $scope.singleTimer.seconds ++;
            $scope.totalTimer.seconds ++;
            if ($scope.totalTimer.seconds > 60){
              $scope.totalTimer.minutes++;
              $scope.totalTimer.seconds = 1;
            }
        }
      }
      else if ($scope.singleTimer.seconds == 4 && $scope.advancedTiming.countdownBeep && $scope.singleTimer.minutes == 0){
        if (!$scope.yogaSelection){
          $scope.playCountdown();
        }
        if($scope.numExercises == $scope.advancedTiming.breakFreq - 1 && $scope.advancedTiming.breakFreq !== 0  && $scope.advancedTiming.breakTime > 0 && $scope.advancedTiming.restStatus){
          $scope.nextExercise.name = $translate.instant('TAKE') + " " + $scope.advancedTiming.breakTime + " " + $translate.instant('SEC_BREAK');
          $scope.nextExercise.imageAddress = "img/frames/restbreak.jpg";
          $scope.nextExercise.unlocked = false;
          $scope.nextExercise.status = true;
        }
      }
      // else if ($scope.singleTimer.seconds == 4 && $scope.advancedTiming.countdownBeep && $scope.singleTimer.seconds == 0 && $scope.singleTimer.minutes < 0){
      //   if (!$scope.yogaSelection){
      //     $scope.playCountdown();
      //   }
      // }
      else if ($scope.singleTimer.seconds == 0 && $scope.singleTimer.minutes > 0){
          $scope.singleTimer.seconds = 60;
          $scope.singleTimer.minutes--;
      }
      if ($scope.singleTimer.seconds == 4 && $scope.advancedTiming.countdownBeep && $scope.singleTimer.seconds == 0 && $scope.singleTimer.minutes < 0){
        console.log('Ryan: weird scenario commented out earier');
      }
      $scope.singleTimer.seconds --;
      $scope.totalTimer.seconds --;
      $scope.updateTime();
    }, 1000);
    $scope.singleTimer.status = true;
    $scope.totalTimer.status = true;

    //Specific actions for very first START
    if (!$scope.hasStarted){
      if (!$scope.advancedTiming.autoStart){
        $scope.playNextSound(controller.userExercises[$scope.currentWorkout[0]]);
      }
      $scope.isAutoStart = false;
      if ($stateParams.typeId !== 'sevenMinute' && !$scope.advancedTiming.autoStart){
        $scope.transitionAction();
      }
      $scope.startTime = js_yyyy_mm_dd_hh_mm_ss();
      $scope.startDate = new Date();
    }
    $scope.hasStarted = true;
$scope.syncStateWithWatch();
    
  };

  $scope.showBegin = function(){
    $scope.beginNotification = true;
    $scope.changeText = false;
      $timeout(function(){
        $scope.beginNotification = false;
    },2000)
  }

  $scope.stopTimer = function (){
      $interval.cancel(start);
      start = undefined;
      $scope.singleTimer.status = false;
      $scope.totalTimer.status  = false;
  };

  $scope.toggleTimer = function (){
    $timeout.cancel($scope.delayStart);
    if ($scope.timerDelay !== null && !$scope.totalTimer.status){
      $scope.transitionStatus = false;
      $interval.cancel($scope.transitionCountdown);
      $scope.isAutoStart = false;
      $scope.timerDelay = null;
      $scope.startTimer();
      $scope.toggleControls();
    } else if($scope.timerDelay == null && $scope.totalTimer.status) {
      $scope.stopTimer();
    } else if ($scope.timerDelay == null && !$scope.totalTimer.status && !$scope.hasStarted){
      $scope.startTimer();
      $scope.toggleControls();
    } else if ($scope.timerDelay == null && !$scope.totalTimer.status){
      //Leaving this else if in case we want to have the pause always after watching video
      //$scope.transitionAction();
      $scope.startTimer();
      $scope.toggleControls();
    }
    $scope.syncStateWithWatch();
  };

  $scope.skipExercise = function (fromControl){

    if (fromControl){
      $scope.toggleControls(true);
      $scope.nextExercise.imageAddress = $scope.getImageAddressNext(controller.userExercises[$scope.currentWorkout[1]]);
      $scope.nextExercise.unlocked = controller.userExercises[$scope.currentWorkout[1]].unlocked || false;
    }
    $scope.nextExercise.status = false;
    if ($scope.isAutoStart){
      $timeout.cancel($scope.firstExerciseAudio);
    } else {
      $interval.cancel($scope.transitionCountdown);
      $timeout.cancel($scope.delayStart);
    }
    $scope.previousExercise = $scope.currentExercise;
    var secondsCompleted = $scope.advancedTiming.exerciseTime - (($scope.singleTimer.minutes * 60) +  $scope.singleTimer.seconds);
    $scope.trackedExercises.push({'exercise': translations['EN'][$scope.currentExercise.name], 'length': secondsCompleted});
    $scope.currentWorkout.shift();
    if ($scope.currentWorkout.length == 1){
      $scope.lastExercise = controller.userExercises[$scope.currentWorkout[0]];
      $scope.currentWorkout = $scope.currentWorkout.concat($scope.startedWorkout);
      if ($stateParams.typeId == 'headToToe' || ($stateParams.typeId == 'sevenMinute' && !$scope.sevenTiming.randomizationOptionSeven) || $stateParams.typeId == 'sunSalutation' || $stateParams.typeId == 'fullSequence' || $stateParams.typeId == 'runnerYoga'){
      } else {
         if($scope.advancedTiming.randomizationOption || !$scope.advancedTiming.customSet){
            if ($stateParams.typeId == "upperBody"){
              var pushupBased = ["Push-ups","Diamond Push-ups","Wide Arm Push-ups","Alternating Push-up Plank","One Arm Side Push-up", "Dive Bomber Push-ups","Shoulder Tap Push-ups", "Spiderman Push-up", "Push-up and Rotation"];
              var nonPushup = ["Overhead Press","Overhead Arm Clap","Tricep Dips","Jumping Jacks", "Chest Expander", "T Raise","Lying Triceps Lifts","Reverse Plank","Power Circles","Wall Push-ups"]
              pushupBased = pushupBased.sort(function() { return 0.5 - Math.random() });
              nonPushup = nonPushup.sort(function() { return 0.5 - Math.random() });
              var mergedUpper = mergeAlternating(pushupBased,nonPushup)
              $scope.currentWorkout = mergedUpper;
            } else{
              $scope.currentWorkout = $scope.currentWorkout.sort(function() { return 0.5 - Math.random() });
            }
         }
      }
      $scope.currentWorkout.shift();
      $scope.currentWorkout.unshift(translations['EN'][$scope.lastExercise.name]);
    }
    $scope.currentExercise = controller.userExercises[$scope.currentWorkout[0]];
    $scope.currentExercise.imageAddress = $scope.getImageAddress(controller.userExercises[$scope.currentWorkout[0]]);

    if ($scope.androidPlatform && device){
      angular.element(document.getElementById('inlinevideo')).css('opacity','0.00001');
    } else {
      angular.element(document.getElementById('inline-video')).css('opacity','0.00001');
      setTimeout(function(){
        $scope.videoAddress = $scope.getVideoLocation() + $scope.currentExercise.video;
      }, 0);
    }

    if ($scope.advancedTiming.autoPlay){
      var videoFrame = angular.element(document.getElementById('inline-video'))[0];
      if (ionic.Platform.isAndroid() && device){
          console.log("Fourth window.plugins.html5Video.initialize() with unlocked property...");
          window.plugins.html5Video.initialize({
            "inlinevideo" : $scope.currentExercise.video,
            "unlocked": $scope.currentExercise.unlocked
          });
          setTimeout(function(){
            playInlineVideo($scope.advancedTiming.autoPlay);
          }, 800);
          setTimeout(function(){
            angular.element(document.getElementById('inlinevideo')).css('opacity','1');
            if ($scope.numExercises == $scope.advancedTiming.breakFreq - 1 && $scope.advancedTiming.breakFreq !== 0  && $scope.advancedTiming.breakTime > 0 && $scope.advancedTiming.restStatus){
              $scope.nextExercise.name = $translate.instant('TAKE') + " " + $scope.advancedTiming.breakTime + " " + $translate.instant('SEC_BREAK');
              $scope.nextExercise.imageAddress = "img/frames/restbreak.jpg";
              $scope.nextExercise.unlocked = false;
            } else {
              $scope.nextExercise.name = controller.userExercises[$scope.currentWorkout[1]].name;
              $scope.nextExercise.imageAddress = $scope.getImageAddressNext(controller.userExercises[$scope.currentWorkout[1]]);
              $scope.nextExercise.unlocked = controller.userExercises[$scope.currentWorkout[1]].unlocked;
            }
            $scope.$apply();
          }, 1500)
      } else {
        clearTimeout(inlineVideoTimeout);
        var playEventListener = function(){
          playInlineVideo($scope.advancedTiming.autoPlay, controller.userExercises[$scope.currentWorkout[0]]);
          setTimeout(function(){
            angular.element(document.getElementById('inline-video')).css('opacity','1');
            if ($scope.numExercises == $scope.advancedTiming.breakFreq - 1 && $scope.advancedTiming.breakFreq !== 0  && $scope.advancedTiming.breakTime > 0 && $scope.advancedTiming.restStatus){
              $scope.nextExercise.name = $translate.instant('TAKE') + " " + $scope.advancedTiming.breakTime + " " + $translate.instant('SEC_BREAK');
              $scope.nextExercise.image = "img/frames/restbreak.jpg";
              $scope.nextExercise.unlocked = false;
            } else {
              $scope.nextExercise.name = controller.userExercises[$scope.currentWorkout[1]].name;
              $scope.nextExercise.imageAddress = $scope.getImageAddressNext(controller.userExercises[$scope.currentWorkout[1]]);
              $scope.nextExercise.unlocked = controller.userExercises[$scope.currentWorkout[1]].unlocked || false;
            }
            $scope.$apply();
          }, 500);
          videoFrame.removeEventListener('canplaythrough', playEventListener);
        }
        videoFrame.addEventListener('canplaythrough', playEventListener);
        setTimeout(function(){angular.element(document.getElementById('inline-video')).css('opacity','1');
          }, 1500);
      }
    } else {
      setTimeout(function(){angular.element(document.getElementById('inline-video')).css('opacity','1');
        if ($scope.numExercises == $scope.advancedTiming.breakFreq - 1 && $scope.advancedTiming.breakFreq !== 0  && $scope.advancedTiming.breakTime > 0 && $scope.advancedTiming.restStatus){
          $scope.nextExercise.name = $translate.instant('TAKE') + " " + $scope.advancedTiming.breakTime + " " + $translate.instant('SEC_BREAK');
          $scope.nextExercise.image = "img/frames/restbreak.jpg";
          $scope.nextExercise.unlocked = false;
        } else {
          $scope.nextExercise.name = controller.userExercises[$scope.currentWorkout[1]].name;
          $scope.nextExercise.imageAddress = $scope.getImageAddressNext(controller.userExercises[$scope.currentWorkout[1]]);
          $scope.nextExercise.unlocked = controller.userExercises[$scope.currentWorkout[1]].unlocked || false;
        }
      }, 500);
    }
    var singleSeconds = $scope.advancedTiming.exerciseTime;
    if (singleSeconds > 60){
      $scope.singleTimer.minutes = Math.floor(singleSeconds / 60);
      $scope.singleTimer.seconds = singleSeconds % 60;
    } else {
      $scope.singleTimer.minutes = 0;
      $scope.singleTimer.seconds = singleSeconds;
    }

    if ($scope.totalTimer.status && $scope.timerDelay != null){
      $scope.transitionAction();
    } else if (!$scope.totalTimer.status && $scope.timerDelay != null && !$scope.isAutoStart){
      $scope.transitionTimer = $scope.advancedTiming.transitionTime;
      $scope.transitionAction();
    } else if ($scope.totalTimer.status && $scope.timerDelay == null){
      $scope.transitionTimer = $scope.advancedTiming.transitionTime;
      $scope.transitionAction();
    }
    $scope.nextExercise.name = controller.userExercises[$scope.currentWorkout[1]].name;
    $scope.playNextSound($scope.currentExercise);
    $scope.updateTime();
    if ($scope.currentExercise.switchOption){
      $scope.helpText = $translate.instant('CHANGE_SIDE');
    } else{
      $scope.helpText = false;
    }
    $scope.changeText = false;
    $scope.totalWidth = 100 - (((($stateParams.timeId * 60) - ((($scope.totalTimer.minutes) * 60) + $scope.totalTimer.seconds)) / ($stateParams.timeId * 60)) * 100);
    
    $scope.syncStateWithWatch();
    
  };

  $scope.backExercise = function (){

      if ($scope.previousExercise){
      angular.element(document.getElementById('video-background')).css('opacity','0.00001');
      $scope.nextExercise.status = false;
      $interval.cancel($scope.transitionCountdown);
      $timeout.cancel($scope.delayStart);
      $scope.currentWorkout.unshift(translations['EN'][$scope.previousExercise.name]);
      $scope.previousExercise = false;
      $scope.nextExercise.imageAddress = $scope.getImageAddressNext(controller.userExercises[$scope.currentWorkout[0]]);
      $scope.nextExercise.unlocked = controller.userExercises[$scope.currentWorkout[0]].unlocked || false;
      $scope.currentExercise = controller.userExercises[$scope.currentWorkout[0]];
      $scope.currentExercise.imageAddress = $scope.getImageAddress(controller.userExercises[$scope.currentWorkout[0]]);
      if ($scope.androidPlatform && device){
      } else {
        $scope.videoAddress = $scope.getVideoLocation() + $scope.currentExercise.video;
      }
      var videoFrame = angular.element(document.getElementById('inline-video'))[0];
      if ($scope.advancedTiming.autoPlay){
        if (ionic.Platform.isAndroid() && device){
          console.log("Fifth window.plugins.html5Video.initialize() with unlocked property...");
          window.plugins.html5Video.initialize({
            "inlinevideo" : $scope.currentExercise.video,
            "unlocked": $scope.currentExercise.unlocked
          });
          setTimeout(function(){
            playInlineVideo($scope.advancedTiming.autoPlay);
          }, 500);
          setTimeout(function(){
            angular.element(document.getElementById('video-background')).css('opacity','1');
            angular.element(document.getElementById('inlinevideo')).css('opacity','1');
            $scope.nextExercise.imageAddress = $scope.getImageAddressNext(controller.userExercises[$scope.currentWorkout[1]]);
            $scope.nextExercise.unlocked = controller.userExercises[$scope.currentWorkout[1]].unlocked || false;
            $scope.nextExercise.name = controller.userExercises[$scope.currentWorkout[1]].name;
            $scope.$apply();
          }, 1500)

        } else{
          clearTimeout(inlineVideoTimeout);
          angular.element(document.getElementById('inline-video')).css('opacity','0.0001');
          var playEventListener = function(){
            setTimeout(function(){angular.element(document.getElementById('inline-video')).css('opacity','1');
              playInlineVideo($scope.advancedTiming.autoPlay, controller.userExercises[$scope.currentWorkout[0]]);
              $scope.nextExercise.imageAddress = $scope.getImageAddressNext(controller.userExercises[$scope.currentWorkout[1]]);
              $scope.nextExercise.unlocked = controller.userExercises[$scope.currentWorkout[1]].unlocked || false;
              $scope.nextExercise.name = controller.userExercises[$scope.currentWorkout[1]].name;
              $scope.$apply();
              angular.element(document.getElementById('video-background')).css('opacity','1');
            }, 500);
            videoFrame.removeEventListener('canplaythrough', playEventListener);
          }
          videoFrame.addEventListener('canplaythrough', playEventListener);
        }
      } else {
        setTimeout(function(){angular.element(document.getElementById('inline-video')).css('opacity','1');
          $scope.nextExercise.imageAddress = $scope.getImageAddressNext(controller.userExercises[$scope.currentWorkout[1]]);
          $scope.nextExercise.unlocked = controller.userExercises[$scope.currentWorkout[1]].unlocked || false;
          $scope.nextExercise.name = controller.userExercises[$scope.currentWorkout[1]].name;
        }, 500);
        angular.element(document.getElementById('video-background')).css('opacity','1');
      }

      var singleSeconds = $scope.advancedTiming.exerciseTime;
      if (singleSeconds > 60){
        $scope.singleTimer.minutes = Math.floor(singleSeconds / 60);
        $scope.singleTimer.seconds = singleSeconds % 60;
      } else {
        $scope.singleTimer.minutes = 0;
        $scope.singleTimer.seconds = singleSeconds;
      }
      if ($scope.totalTimer.status && $scope.timerDelay != null){
        $scope.transitionAction();
      } else if (!$scope.totalTimer.status && $scope.timerDelay != null){
        $scope.transitionTimer = $scope.advancedTiming.transitionTime;
        $scope.transitionAction();
      } else if ($scope.totalTimer.status && $scope.timerDelay == null){
        $scope.transitionTimer = $scope.advancedTiming.transitionTime;
        $scope.transitionAction();
      }
      $scope.playNextSound($scope.currentExercise);
      $scope.updateTime();
      if ($scope.currentExercise.switchOption){
        $scope.helpText = $translate.instant('CHANGE_SIDE');
      } else{
        $scope.helpText = false;
      }
      $scope.changeText = false;
      $scope.toggleControls(true);
    }

    $scope.syncStateWithWatch();

  };

  $scope.swipeLeftSkip = function(){
    $scope.skipExercise();
  }
  $scope.swipeRightBack = function(){
    $scope.backExercise();
  }
  $scope.$on('$ionicView.leave', function() {
    $scope.stopTimer();
    angular.element(document.getElementsByClassName('title')).removeClass('no-nav');
    angular.element(document.getElementsByTagName('body')[0]).removeClass('workout-bar');
    if ($scope.androidPlatform & device){
      document.querySelectorAll("drawer")[0].attributes.candrag.value = true;
    } else if (device){
      StatusBar.show();
      $ionicSideMenuDelegate.canDragContent(true);
    }
    if (lockOrientation()){
      try{
        cordova.plugins.screenorientation.lockOrientation('portrait');
      } catch(e){
        screen.lockOrientation('portrait');
      }
    }
    $ionicNavBarDelegate.showBar(true);
    $ionicHistory.clearCache();
    localforage.getItem('timingSettings', function(result){if (result){TimingData.GetTimingSettings = result}})
    if (device){
      LowLatencyAudio.unload('ding');
      LowLatencyAudio.unload('begin');
      LowLatencyAudio.unload('switch');
      LowLatencyAudio.unload('switchding');
      LowLatencyAudio.unload('next');
      LowLatencyAudio.unload('countdown');
      LowLatencyAudio.unload('countdownVoice');
      LowLatencyAudio.unload('break');
      LowLatencyAudio.unload('congrats');
    }
  });

  //Audio section
  var basicAudioPath = 'audio/';
  var normalAudioPath = 'audio/';
  $scope.isAudioAvailable = PersonalData.GetLanguageSettings[$scope.userSettings.preferredLanguage];
  $scope.setAudioPaths = function(){
    if ($scope.userSettings.preferredLanguage == 'EN') {
      // Don't change paths here //
    } else if ($scope.isAudioAvailable){
      normalAudioPath = cordova.file.dataDirectory + $scope.userSettings.preferredLanguage + '/';
      basicAudioPath = 'audio/' + $scope.userSettings.preferredLanguage + '/';
    } else if ($scope.userSettings.preferredLanguage !== 'EN') {
      basicAudioPath = 'audio/' + $scope.userSettings.preferredLanguage + '/';
    }
  }

  $scope.setAudioPaths();

  if (device){
    $timeout(function(){
      LowLatencyAudio.preloadAudio('begin', basicAudioPath + 'begin.mp3', 1);
      LowLatencyAudio.preloadAudio('ding', 'audio/ding.mp3', 1);
      LowLatencyAudio.turnOffAudioDuck(PersonalData.GetAudioSettings.duckOnce.toString());
    }, 600)
    $timeout(function(){
      // If debugging sound, play this every time
      console.log("LowLatencyAudio.play('welcome')...");
      if (TimingData.GetTimingSettings.welcomeAudio){
        LowLatencyAudio.play('welcome', $scope.audioSettings.duckEverything.toString());
      }
    }, 1000)  
    $timeout(function(){
      if ($scope.advancedTiming.autoStart && PersonalData.GetLanguageSettings[$scope.userSettings.preferredLanguage] && true){
          var timeoutLength = globalFirstOption ? 7000 : 4000;
          $scope.firstExerciseAudio = $timeout(function(){
            console.log("$scope.playNextSound()...", controller.userExercises[$scope.currentWorkout[0]]);
            $scope.playNextSound(controller.userExercises[$scope.currentWorkout[0]], true);
          }, timeoutLength);
      }
      $scope.changeURX = true;
    },1200)
    $timeout(function(){
      LowLatencyAudio.preloadAudio('switch', basicAudioPath + 'change.mp3', 1);
      LowLatencyAudio.preloadAudio('switchding', 'audio/switch.mp3', 1);
      LowLatencyAudio.preloadAudio('next', basicAudioPath + 'Next.mp3', 1);
      LowLatencyAudio.preloadAudio('countdown', 'audio/beepsequence.mp3', 1);
      LowLatencyAudio.preloadAudio('countdownVoice', basicAudioPath + 'countdownVoice.mp3', 1);
      trackEvent('Workout Type', translations['EN'][$scope.chosenWorkout.activityNames], $stateParams.timeId);
      $scope.changeURX = false;
    }, 4000)
  }

  $scope.urlCounter=Math.floor(Math.random()*100000);
  $scope.playNextSound = function(currentEx, firstAudio){
    if (device) {
      $scope.urlCounter = $scope.urlCounter +1;
      var muteUnmute = $scope.extraSettings.audioOption;
      var exerciseNum = "exercise" + $scope.urlCounter.toString();
      var audioURL = $scope.getAudioLocation(currentEx) + currentEx.audio;
      $log.debug("playNextSound() audioURL", audioURL);
      if (!ionic.Platform.isAndroid()){
        LowLatencyAudio.preloadAudio(exerciseNum, audioURL, 1);
        $scope.unloadQueue.unshift(exerciseNum);
      } else {
        LowLatencyAudio.preloadFX(exerciseNum, audioURL);
        $scope.unloadQueue.unshift(exerciseNum);
      }
      if (muteUnmute && $scope.isAudioAvailable){
        $timeout(function(){
         LowLatencyAudio.play(exerciseNum, $scope.audioSettings.duckEverything.toString());
         $scope.unloadAudio();
        }, 300);

        if (firstAudio){
          $scope.isAudioAvailable = PersonalData.GetLanguageSettings[$scope.userSettings.preferredLanguage];
          if ($scope.isAudioAvailable){
            $scope.setAudioPaths();
          }
        }
      } else{
        if ($scope.yogaSelection && !firstAudio){
          LowLatencyAudio.play('switchding', $scope.audioSettings.duckEverything.toString());
        } else if (!firstAudio){
          LowLatencyAudio.play('ding', $scope.audioSettings.duckEverything.toString());
        }
        $scope.isAudioAvailable = PersonalData.GetLanguageSettings[$scope.userSettings.preferredLanguage];
        if ($scope.isAudioAvailable){
          $scope.setAudioPaths();
        }
        $scope.unloadAudio();
      }
    } else {
      console.log('Sound: Exercise name ');
    }
      
  }
  $scope.playBreakSound = function(){
    if (device){
      var muteUnmute = $scope.extraSettings.audioOption;
      if ($scope.advancedTiming.breakTime == 30){
          LowLatencyAudio.preloadAudio('break', basicAudioPath + 'Break.mp3',1);
      } else{
          LowLatencyAudio.preloadAudio('break', basicAudioPath + 'TakeBreak.mp3',1);
      }
      if (muteUnmute){
        $timeout(function(){
          LowLatencyAudio.play('break', $scope.audioSettings.duckEverything.toString());
        }, 300);
      } else {
        LowLatencyAudio.play('ding', $scope.audioSettings.duckEverything.toString());
      }
    } else {
      console.log('Sound: take a break');
    }
    trackEvent('Monetize Event', 'Rest Break', $scope.advancedTiming.breakTime);
  }
  $scope.playSwitchSound = function(){
    $scope.transitionPause();
    if (device){
      var muteUnmute = $scope.extraSettings.audioOption;
      if (muteUnmute){
        $timeout(function(){
          LowLatencyAudio.play('switch', $scope.audioSettings.duckEverything.toString());
        }, 300);
      }
      else{
        $timeout(function(){
          LowLatencyAudio.play('switchding', $scope.audioSettings.duckEverything.toString());
        }, 300);
      }
    } else {
      console.log('Sound: switch sides');
    }
  }
  $scope.playNextWarning = function(currentEx){
    if (device){
      $scope.urlCounter = $scope.urlCounter +1;
      var muteUnmute = $scope.extraSettings.audioOption;
      var exerciseNum = "exercise" + $scope.urlCounter.toString();
      var audioURL = $scope.getAudioLocation(currentEx) + currentEx.audio;
      var muteUnmute = $scope.extraSettings.audioOption;
      if (!ionic.Platform.isAndroid()){
        LowLatencyAudio.preloadAudio(exerciseNum, audioURL, 1);
        $scope.unloadQueue.unshift(exerciseNum);
      } else {
        LowLatencyAudio.preloadFX(exerciseNum, audioURL);
        $scope.unloadQueue.unshift(exerciseNum);
      }
      if (muteUnmute && $scope.isAudioAvailable){
        $timeout(function(){
          LowLatencyAudio.play('next', "false");
        },0);
        $timeout(function(){
           LowLatencyAudio.play(exerciseNum, $scope.audioSettings.duckEverything.toString());
        }, 1600);
      }
    } else {
      console.log('Sound: next warning');
    }
  }

  $scope.playCountdown = function(){
    if (device && $scope.extraSettings.countdownStyle){
      $timeout(function(){
        LowLatencyAudio.play('countdownVoice', "false");
      }, 300);
    } else if (device){
      $timeout(function(){
        LowLatencyAudio.play('countdown', "false");
      }, 300);
    } else {
      console.log('Sound: Countdown');
    }
  }
  $scope.playBeginSound = function(){
    $scope.showBegin();
    if (device){
      $timeout(function(){
        LowLatencyAudio.play('begin', $scope.audioSettings.duckEverything.toString());
      }, 300);
    } else {
      console.log('Sound: Begin');
    }
  }
  $scope.playCongratsSound = function(){
    if (device){
      LowLatencyAudio.preloadAudio('congrats', basicAudioPath + 'Congrats.mp3', 1);
      $timeout(function(){
        LowLatencyAudio.play('congrats', $scope.audioSettings.duckEverything.toString());
      }, 300);
    } else {
      console.log('Sound: Congrats!');
    }
  }
  $scope.unloadAudio = function(){
    $timeout(function(){
        for (i=$scope.unloadQueue.length-1;i>=2;i--){
          LowLatencyAudio.unload($scope.unloadQueue[i]);
          $scope.unloadQueue.splice((i), 1);
        }
    }, 2500);
  }
  $scope.toggleAudio = function(){
    $scope.extraSettings.audioOption = !$scope.extraSettings.audioOption;
  }
  $scope.toggleControls = function(override){
    if (!$scope.isPortrait && override){
      $scope.showControls = true;
      $timeout.cancel($scope.controlTimeout);
    }
    else if (!$scope.isPortrait && !$scope.showControls){
      $scope.showControls = true;
      $timeout.cancel($scope.controlTimeout);
      $scope.controlTimeout = $timeout(function(){
        $scope.showControls = true;
      }, 3000)
    } else if (!$scope.isPortrait && $scope.showControls){
      $scope.showControls = false;
      $timeout.cancel($scope.controlTimeout);
    }
  };

  $scope.toggleVideo = function(e){
    var videoElement = angular.element(document.getElementById('inline-video'))[0];
    if (ionic.Platform.isAndroid() && device){
      videoElement.paused ? playInlineVideo($scope.advancedTiming.autoPlay) : videoElement.pause();
    } else {
      videoElement.paused ? playInlineVideo($scope.advancedTiming.autoPlay, controller.userExercises[$scope.currentWorkout[0]]) : videoElement.pause();
    }
    videoElement.muted= true;
  };

  $scope.increaseTempo = function(){
    $scope.advancedTiming.exerciseTime ++;
    $scope.setYogaTiming();
    var singleSeconds = $scope.advancedTiming.exerciseTime;
    if (singleSeconds > 60){
      $scope.singleTimer.minutes = Math.floor(singleSeconds / 60);
      $scope.singleTimer.seconds = singleSeconds % 60;
    } else {
      $scope.singleTimer.minutes = 0;
      $scope.singleTimer.seconds = singleSeconds;
    }
    $scope.updateTime();
  }
  $scope.decreaseTempo = function(){
    if ($scope.advancedTiming.exerciseTime > 1){
      $scope.advancedTiming.exerciseTime --;
      $scope.setYogaTiming();
      var singleSeconds = $scope.advancedTiming.exerciseTime;
      if (singleSeconds > 60){
        $scope.singleTimer.minutes = Math.floor(singleSeconds / 60);
        $scope.singleTimer.seconds = singleSeconds % 60;
      } else {
        $scope.singleTimer.minutes = 0;
        $scope.singleTimer.seconds = singleSeconds;
      }
      $scope.updateTime();
    }
  }
  $scope.setYogaTiming = function() {
    if ($stateParams.typeId == 'sunSalutation'){
    $scope.advancedTiming.sunSalutation = $scope.advancedTiming.exerciseTime;
    } else if ($stateParams.typeId == 'fullSequence'){
    $scope.advancedTiming.fullSequence = $scope.advancedTiming.exerciseTime;
    } else if ($stateParams.typeId == 'runnerYoga'){
    $scope.advancedTiming.runnerYoga = $scope.advancedTiming.exerciseTime;
    }
  }
  $scope.transitionAction = function(autostart, continueTimer){
    if (autostart && !continueTimer){
      var transitionLength = 12;
      $scope.transitionTimer = 12;
    } else if(continueTimer){
      $timeout.cancel($scope.transitionCountdown);
    } else {
      var transitionLength = $scope.advancedTiming.transitionTime;
      $scope.transitionTimer = $scope.advancedTiming.transitionTime;
    }
    $scope.transitionCountdown = $interval(function(){$scope.transitionTimer--;}, 1000);
    if (autostart && !continueTimer){
        $scope.timerDelay = 0;
        $scope.stopTimer();
        $scope.transitionStatus = true;
        $scope.delayStart = $timeout(function(){$scope.playBeginSound();$scope.isAutoStart = false;$scope.startTimer();$scope.timerDelay = null;$scope.transitionStatus = false;$interval.cancel($scope.transitionCountdown);
        }, 12300);
    }
    else if(continueTimer){

    }
    else if (transitionLength == 10 && $stateParams.typeId == 'sevenMinute'){
        $scope.timerDelay = 0;
        $scope.stopTimer();
        $scope.transitionStatus = true;
        $scope.delayStart = $timeout(function(){$scope.playBeginSound();$scope.startTimer();$scope.timerDelay = null;$scope.transitionStatus = false;$interval.cancel($scope.transitionCountdown);
        }, 10300);
    }
    //Do not use 'begin' sound if under 4 seconds, too repetitive
    else if (transitionLength > 0 && transitionLength <= 4 ){
        $scope.timerDelay = 0;
        $scope.stopTimer();
        $scope.transitionStatus = true;
        $scope.delayStart = $timeout(function(){$scope.startTimer();$scope.timerDelay = null;$scope.transitionStatus = false;$interval.cancel($scope.transitionCountdown);
        }, transitionLength*1000);
    }
    else if (transitionLength > 4){
        $scope.timerDelay = 0;
        $scope.stopTimer();
        $scope.transitionStatus = true;
        $scope.delayStart = $timeout(function(){$scope.playBeginSound();$scope.startTimer();$scope.timerDelay = null;$scope.transitionStatus = false;$interval.cancel($scope.transitionCountdown);
        }, transitionLength*1000);
    } 
    else{
      $interval.cancel($scope.transitionCountdown);
    }
  }
  $scope.transitionPause = function(){
      if ($scope.advancedTiming.transitionTime > 0){
          $scope.timerDelay = 0;
          $scope.stopTimer();
          $scope.transitionTimer = 5;
          $scope.transitionCountdown = $interval(function(){$scope.transitionTimer--;}, 1000);
          $scope.transitionStatus = true;
          $scope.delayStart = $timeout(function(){$scope.changeText = false;$scope.helpText = false;$scope.playBeginSound();$scope.startTimer();$scope.timerDelay = null;$scope.transitionStatus = false;$interval.cancel($scope.transitionCountdown);
          }, 5000);
      } else{
        $scope.timerDelay = 0;
          $scope.stopTimer();
          $scope.transitionTimer = 3;
          $scope.transitionCountdown = $interval(function(){$scope.transitionTimer--;}, 1000);
          $scope.transitionStatus = true;
          $scope.delayStart = $timeout(function(){$scope.changeText = false;$scope.helpText = false;$scope.playBeginSound();$scope.startTimer();$scope.timerDelay = null;$scope.transitionStatus = false;$interval.cancel($scope.transitionCountdown);
          }, 3000);
      }
  }

  if (ionic.Platform.isAndroid()){
    var workoutBack = $ionicPlatform.registerBackButtonAction(
      function () {
        if (!$scope.endModalOpen){
          $scope.endWorkout();
        } else if ($scope.endModalOpen && !$scope.workoutComplete ){
          $scope.cancelModal();
        } else if ($scope.endModalOpen && $scope.workoutComplete ){
          $scope.mainMenu()
        }
      }, 250
    );
  }

  $scope.launchURX = function(){
    if (device){
      workoutOnPause();
      cordova.exec(function (){trackEvent('URX Launched', 'Workout Screen', 0);}, function (){}, "URX", "searchSongs", ['"sworkit workout playlist" OR workout action:ListenAction']);
    }
  }
  
  $scope.initWatch = function(successCallback, errorCallback){
     if (!ionic.Platform.isAndroid()) {
     if (device){
      console.log("initWatch");

      window.plugins.sworkitapplewatch.initWatch(
                        function(command){
                            var commandName = command['commandName'];
                            
                            if (commandName) {
                              console.log('new command: '+command['commandName']);
                              if (commandName == "init") {
                                                      successCallback(command);
                            }
                            else if (!$scope.endModalOpen) {
                              if (commandName == "toggleTimer") {
                                                          $scope.toggleTimer();
                                  }
                                else if (commandName == "skip") {
                                  $scope.skipExercise();
                                }
                                else if (commandName == "back") {
                                                        $scope.backExercise();
                                }
                                /*
                                else if (commandName == "heartRate") {
                                                        var heartRate = command['heartRate'];
                                                        console.log('heartRate: '+heartRate);
                                } 
                                */
                                else if (commandName == "heartRateSamples") {
                                                        $scope.heartRateSamples = $scope.heartRateSamples.concat(command['heartRateSamples']);
                                }
                                
                                
                              }
                            }
                                               
                                               },
                                               function(){
                                                  console.log('oh problem?!');
                                               }
                                        );
     
                                            
      } else {
        //Available in browser for testing purposes
        //$scope.healthKitData.healthKitAvailable = true;
      }
   }
    
  }

  
  $scope.WorkoutState = {
    NotActive : 0,
    TransitionActive : 1,
    ExercisePlaying : 2,
    ExercisePaused : 3
  };

  $scope.avgHeartRate = 0;
  $scope.peakHeartRate = 0;

  $scope.syncStateWithWatch = function(isMainMenu, isEndModal){

    if (!ionic.Platform.isAndroid()) {
    if (device){

      var exerciseName = "";
      var workoutState = $scope.WorkoutState.NotActive;

      if (isEndModal && $scope.heartRateSamples.length > 0){
        $scope.peakHeartRate = Math.round(Math.max.apply(null, $scope.heartRateSamples));
        var rateTotal = 0;
        for(var i = 0; i < $scope.heartRateSamples.length; i++) {
            rateTotal += $scope.heartRateSamples[i];
        }
        $scope.avgHeartRate = Math.round(rateTotal / $scope.heartRateSamples.length);
        console.log('average rate: ', $scope.avgHeartRate)
        console.log('peak rate: ', $scope.peakHeartRate)
      }
      if ($scope.endModalOpen || isMainMenu) {
        //hide controls...
      }
      else if (!$scope.hasStarted) {
        workoutState = $scope.WorkoutState.TransitionActive;
      }/*
        else if ($scope.transitionStatus) {
        workoutState = $scope.WorkoutState.TransitionActive;
        }*/
      else {
        //in an exercise
        if ($scope.totalTimer.status) {
          //playing
          workoutState = $scope.WorkoutState.ExercisePlaying;
        }
        else {
          //paused
          workoutState = $scope.WorkoutState.ExercisePaused;
          }
        }

        if ($scope.currentExercise) {
          //exerciseName = translations['EN'][$scope.currentExercise.name];
          exerciseName = $translate.instant($scope.currentExercise.name)
        }

        window.plugins.sworkitapplewatch.syncWorkoutState(
                                                          {
                                                          'workoutState': workoutState,
                                                          'exerciseName':exerciseName,
                                                          'hasNextExercise':$scope.nextExercise ? true : false,
                                                          'hasPreviousExercise':$scope.previousExercise ? true : false,
                                                          'workoutComplete': $scope.endModalOpen ? true : false,
                                                          'avgHeartRate': $scope.avgHeartRate,
                                                          'peakHeartRate': $scope.peakHeartRate,
                                                          'minutesComplete': $scope.timeToAddRounded ? $scope.timeToAddRounded : 0,
                                                          'caloriesBurned': $scope.burnRounded ? $scope.burnRounded : 0,
                                                          'startDate': $scope.startDate,
                                                          },
                                                          function(result){
                                                          console.log('syncWithWatch complete!');
                                                          
                                                          },
                                                          function(){
                                                          console.log('syncWithWatch problem?!');
                                                          }
                                                          );
      } else {
      //Available in browser for testing purposes
      //$scope.healthKitData.healthKitAvailable = true;
      }
    }

  }

  var workoutOnPause = function(){
    $scope.stopTimer();
    $interval.cancel($scope.transitionCountdown);
    $timeout.cancel($scope.delayStart);
    $scope.transitionStatus = false;
    $scope.timerDelay = null;
  }

  document.addEventListener("pause", workoutOnPause, false);

  var orientationChange = function(){
    if (!$scope.isPortrait){
      $scope.isPortrait = true;
    }
    $timeout(function(){
      $scope.setVideo();
    }, 500)
  }
  
  var onResumeWorkout = function(){
    if (!ionic.Platform.isAndroid()){
    
      clearTimeout(inlineVideoTimeout);
      playInlineVideo($scope.advancedTiming.autoPlay, controller.userExercises[$scope.currentWorkout[0]]);
    }
  };
  
  window.addEventListener("orientationchange", orientationChange , false);
  document.addEventListener("resume", onResumeWorkout, false);

  $scope.$on('$ionicView.leave', workoutBack);
})

.controller('RewardsCtrl', function($rootScope, $scope, UserService) {
  $scope.$on('$ionicView.enter', function () {
    angular.element(document.getElementsByClassName('bar-header')).addClass('green-bar');
  });
  $scope.sessionmStatus = sessionmAvailable;
  $scope.rewardStatus = UserService.getUserSettings();
  $scope.sessionMCount = {count:false};

  $scope.getSessionMCount = function(){
    sessionm.phonegap.getUnclaimedAchievementCount(function callback(data) {
        $scope.sessionMCount.count = (data.unclaimedAchievementCount == 0) ? false : data.unclaimedAchievementCount;
        $rootScope.mPointsTotal = data.unclaimedAchievementCount;
        $scope.$apply();
      });
  }
  if (device){
    $scope.getSessionMCount();
    sessionm.phonegap.listenDidDismissActivity(function callback(data2) {
      $scope.getSessionMCount();
    });
  }
  $scope.launchSessionM = function(){
    if (device){
      sessionm.phonegap.presentActivity(2);
    }
  }
  $scope.rewardsFAQ = function(){
    window.open('http://sworkit.com/rewards', 'blank', 'location=yes,AllowInlineMediaPlayback=yes,toolbarposition=top' );
  }
  $scope.disableRewards = function(typeReward){
    if (typeReward == 'sessionm' && $scope.rewardStatus.mPoints == true){
      trackEvent('More Action', 'Disable SessionM', 0);
    }
  }

  $scope.$on('$ionicView.leave', function() {
               angular.element(document.getElementsByClassName('bar-header')).removeClass('green-bar');
               localforage.setItem('userSettings', PersonalData.GetUserSettings);
               });
})

.controller('SettingsCtrl', function($rootScope, $scope, $http, $ionicModal, $translate, $timeout, $ionicPopup, $q, UserService, AppSyncService, WorkoutService, $log) {
  $scope.userSettings = UserService.getUserSettings();
  $scope.googleFitSettings = UserService.getFitSettings();
  $scope.goalSettings = UserService.getGoalSettings();
  $scope.timeSettings = UserService.getTimingIntervals();
  $scope.originalLanguage = $scope.userSettings.preferredLanguage;
  $scope.healthKitAvailable = false;
  $scope.kindleDevice = false;
  if (ionic.Platform.isAndroid()){
    $scope.androidPlatform = true;
    if (isKindle()){
      $scope.kindleDevice = true;
    }
  } else{
    $scope.androidPlatform = false;
    if (device){
      window.plugins.healthkit.available(
                                               function(result){
                                                if (result == true){
                                                  $scope.healthKitAvailable = true;
                                                }
                                               },
                                               function(){
                                                $scope.healthKitAvailable = false;
                                               }
                                               );
    } else {
      //Available in browser for testing purposes
      $scope.healthKitAvailable = true;
    }
  }
  $scope.data = {showInfo:false};
  $scope.lowerAndroid = lowerAndroidGlobal;
  $scope.mfpWeightStatus = {data: $scope.userSettings.mfpWeight}
  $scope.displayWeight = {data: 0};
  $scope.weightTypes = [{id: 0, title:'LBS'}, {id:1, title:'KGS'}]
  $scope.selectedType = {data: $scope.weightTypes[$scope.userSettings.weightType]};
  $scope.languages = [
    {id:0, short:'DE', title:'Deutsch'},
    {id:1, short:'EN', title:'English'},
    {id:2, short:'ES', title:'Español (España)'},
    {id:3, short:'ESLA', title:'Español (América Latina)'},
    {id:4, short:'FR', title:'Français'},
    {id:5, short:'IT', title:'Italiano'},
    {id:6, short:'PT', title:'Português'},
    {id:7, short:'RU', title:'Русский'},
    {id:8, short:'TR', title:'Türkçe'},
    {id:9, short:'HI', title:'हिंदी'},
    {id:10, short:'JA', title:'日本語'},
    {id:11, short:'ZH', title:'简体中文'},
    {id:12, short:'KO', title:'한국어 [韓國語]'}
  ]
  // $scope.languages = [
  //   {id:0, short:'DE', title:'Deutsch'},
  //   {id:1, short:'EN', title:'English'},
  //   {id:2, short:'ES', title:'Español (España)'},
  //   {id:3, short:'ESLA', title:'Español (América Latina)'},
  //   {id:4, short:'FR', title:'Français'},
  //   {id:5, short:'IT', title:'Italiano'},
  //   {id:6, short:'PT', title:'Português'},
  //   {id:7, short:'HI', title:'हिंदी'},
  //   {id:8, short:'JA', title:'日本語'},
  //   {id:9, short:'ZH', title:'简体中文'},
  //   {id:10, short:'KO', title:'한국어 [韓國語]'},
  //   {id:11, short:'RU', title:'Русский'}
  // ]
  $scope.getLanguage = function(){
    var matchLang = '';
    $scope.languages.forEach(function(element, index, array){if (element.short == $scope.userSettings.preferredLanguage){matchLang = element}});
    return matchLang;
  }
  $scope.selectedLanguage = {data: $scope.getLanguage()};
  $scope.changeLanguage = function (langKey) {
    $log.info("changeLanguage()");
    $translate.use(langKey.short);
    $scope.userSettings.preferredLanguage = $scope.selectedLanguage.data.short;
    if (device) {
      WorkoutService.downloadUnlockedExercises("newlocale");
      if (ionic.Platform.isIOS()) {
        window.plugins.sworkitapplewatch.initWatchTranslations(
            {
            'intro': $translate.instant('CHOOSEWATCH'),
            'congrats': $translate.instant('CONGRATS'),
            'bpm': $translate.instant('BPM'),
            'avgbpm': $translate.instant('AVGBPM'),
            'peakbpm': $translate.instant('PEAKBPM'),
            'minutes': $translate.instant('MINUTES_BG'),
            'calories': $translate.instant('CALORIES_BG')
            }
        );
      }

    }

  };
  $scope.convertWeight = function(){
    if ($scope.userSettings.weightType == 0){
      $scope.displayWeight.data = $scope.userSettings.weight;
    } else{
      $scope.displayWeight.data = Math.round(($scope.userSettings.weight / 2.20462));
    }
  }
  $scope.convertWeight();
  $scope.$watch('selectedType.data', function(newValue, oldValue) {
        if (!isNaN(newValue.id)){
          $scope.userSettings.weightType = newValue.id;
        }
        $scope.convertWeight();
  })
  $scope.$watch('displayWeight.data', function(val) {
    if ($scope.userSettings.weightType == 0){
      $scope.userSettings.weight = $scope.displayWeight.data;
    } else{
      $scope.userSettings.weight = Math.round(($scope.displayWeight.data * 2.20462));
    }
  })
  $scope.syncWeight = function(){
    if ($scope.mfpWeightStatus.data){
      getMFPWeight($http, $scope);
    }
  }
  $scope.connectedGoogleFit = function(){
    $scope.googleFitSettings.attempted = true;
    if ($scope.googleFitSettings.enabled){
      $scope.googleFitSettings.enabled = false;
    } else {
      $scope.enableGoogleFit()
    }
  }
  $scope.enableGoogleFit = function(){
    var infoTemplate = '<div class="end-workout-health" style="text-align: center;width:230px;margin:0px auto"><img src="img/googleFit.png" style="height:50px;display: block;margin: 10px auto;"/><div style="width:100%"><p>' + $translate.instant('GFIT_1') + '</p><p>' + $translate.instant('GFIT_2') + '</p><p style="color:#777;font-size:12px">' + $translate.instant('GFIT_3') + '</p><button class="button button-assertive" ng-click="confirmGoogleFit()" style="width:230px">{{"CONNECT_FIT" | translate}}</button></div></div>';
    $scope.googleFitPopup = $ionicPopup.show({
      title: '',
      subTitle: '',
      scope: $scope,
      template: infoTemplate,
      hardwareBackButtonClose: true,
      buttons: [
        { text: $translate.instant('CANCEL_SM') }
      ]
    });
  }
  $scope.hideGoogleFitPopup = function(){
    $scope.googleFitPopup.close();
  }
  $scope.confirmGoogleFit = function(){
    $scope.hideGoogleFitPopup();
    $scope.googleFitSettings.enabled = true;
    $scope.syncLastWorkoutFit();
  }
  $scope.syncLastWorkoutFit = function(){
    db.transaction(function (tx) {
     tx.executeSql('SELECT * FROM Sworkit ORDER BY created_on', [], function (tx, results) {
        if (results.rows.length > 0){
          var fitnessActivity;
          var lastWorkout = results.rows.item(0);
          var lastDate = new Date(lastWorkout.utc_created);
          if (lastWorkout.type == "upperBody" || lastWorkout.type == "fullBody" || lastWorkout.type == "coreExercise" || lastWorkout.type == "lowerBody"){
              fitnessActivity = 'STRENGTH_TRAINING';
            } else if (lastWorkout.type == "stretchExercise" || lastWorkout.type == "backStrength" || lastWorkout.type == "headToToe" || lastWorkout.type == "standingStretches" ||  lastWorkout.type =="officeStretch"){
              fitnessActivity = 'CALISTHENICS';
            } else if (lastWorkout.type == "sunSalutation" || lastWorkout.type == "fullSequence" || lastWorkout.type == 'runnerYoga'){
              fitnessActivity = 'YOGA';
            } else if (lastWorkout.type == "customWorkout" || lastWorkout.type == "anythingGoes" || lastWorkout.type == "bootCamp" || lastWorkout.type == "rumpRoaster" || lastWorkout.type == "bringThePain" || lastWorkout.type == "sevenMinute" || lastWorkout.type == "quickFive"){
              fitnessActivity = 'CIRCUIT_TRAINING';
            } else if (lastWorkout.type == "cardio" || lastWorkout.type == "cardioLight" || lastWorkout.type == "plyometrics"){
              fitnessActivity = 'CIRCUIT_TRAINING';
            } else if (lastWorkout.type == "pilatesWorkout"){
              fitnessActivity = 'PILATES';
            }
            window.plugins.GoogleFit.insertSession(
              [lastDate.getTime(), lastWorkout.minutes_completed * 60 * 60000, "Sworkit", fitnessActivity],
              function(){
                console.log('Success Syncing Last Google Fit Workout')
              },
              function(result){console.log('Google Fit Fail ' + result)}
            )
      }}, null );
    });
  }
  $scope.connectHealthKit = function(){

    $timeout(function(){
      window.plugins.healthkit.requestAuthorization(
                                                          {
                                                          'readTypes'  : [ 'HKQuantityTypeIdentifierBodyMass', 'HKQuantityTypeIdentifierHeartRate'],
                                                          'writeTypes' : [ 'HKQuantityTypeIdentifierActiveEnergyBurned', 'workoutType']
                                                          },
                                                          function(){
                                                            PersonalData.GetUserSettings.healthKit = true;
                                                            $scope.userSettings.healthKit = true
                                                            localforage.setItem('userSettings', PersonalData.GetUserSettings);
                                                            $scope.readWeight();
                                                          },
                                                          function(){}
                                                          );
    }, 1000);
  }
  $scope.reconnectHealthKit = function(){
    $scope.healthPopup = $ionicPopup.show({
      title: $translate.instant('HEALTH_SET'),
      subTitle: '',
      scope: $scope,
      template: '<button class="button button-full button-calm" ng-click="hideHealthPopup();healthKitHelp()">'+ $translate.instant('UPDATE_SET') +'</button><button class="button button-full button-assertive" ng-click="hideHealthPopup();disableHealthKit();">'+ $translate.instant('DISABLE_SM') +'</button>',
      buttons: [
        { text: $translate.instant('CANCEL_SM') }
      ]
    });
  }
  $scope.readWeight = function(){
    window.plugins.healthkit.readWeight({
                                                'requestWritePermission': false,
                                                'unit': 'lb'
                                                },
                                                function(msg){
                                                  if (!isNaN(msg)){
                                                    PersonalData.GetUserSettings.weight = msg;
                                                    $scope.convertWeight();
                                                  }
                                                },
                                                function(){}
                                                );
  }
  $scope.hideHealthPopup = function(){
    $scope.healthPopup.close();
  }
  $scope.healthKitHelp = function(){
    $scope.healthModal.show();
  }
  $ionicModal.fromTemplateUrl('healthkit-help.html', function(modal) {
                                $scope.healthModal = modal;
                                }, {
                                scope:$scope,
                                animation: 'slide-in-up',
                                focusFirstInput: false,
                                backdropClickToClose: true,
                                hardwareBackButtonClose: false
                                });
  $scope.closeHealthModal = function(){
    $scope.healthModal.hide();
  }
  $scope.disableHealthKit = function(){
    PersonalData.GetUserSettings.healthKit = false;
    localforage.setItem('userSettings', PersonalData.GetUserSettings);
  }
  $scope.reconnectMFP = function(){
    $scope.mfpPopup = $ionicPopup.show({
      title: 'MyFitnessPal',
      subTitle: '',
      scope: $scope,
      template: '<button class="button button-full button-calm" ng-click="hidePopup();connectMFP();">'+ $translate.instant('RECONNECT') +'</button><button class="button button-full button-assertive" ng-click="hidePopup();disconnectMFP();">'+ $translate.instant('DISCONNECT') +'</button>',
      buttons: [
        { text: $translate.instant('CANCEL_SM') }
      ]
    });
  }
  $scope.hidePopup = function(){
    $scope.mfpPopup.close();
  }
  $scope.disconnectMFP = function(){
            var refresher = PersonalData.GetUserSettings.mfpRefreshToken;
            var newURL = "https://www.myfitnesspal.com/oauth2/revoke?client_id=sworkit&refresh_token=" + refresher;
            $http({
            method: 'POST',
            url: newURL,
            headers: {'Content-Type': 'application/x-www-form-urlencoded'}
          }).then(function(resp){
            PersonalData.GetUserSettings.mfpAccessToken = false;
            PersonalData.GetUserSettings.mfpRefreshToken = false;
            PersonalData.GetUserSettings.mfpStatus = false;
            PersonalData.GetUserSettings.mfpWeight = false;
            persistMultipleObjects($q,{
              'userSettings': PersonalData.GetUserSettings,
            }, function() {
                // When all promises are resolved
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
            showNotification($translate.instant('DISCONNECT_COMP'), 'button-balanced', 2000);
           }, function(err) {
            showNotification($translate.instant('CONN_ERROR'), 'button-assertive', 2000);
      })
  }
  $scope.connectMFP = function(){
    var randomNumber = (new Date().valueOf()).toString() + Math.floor(Math.random()*900);
    var authUrl = 'https://www.myfitnesspal.com/oauth2/authorize?client_id=sworkit&scope=diary&redirect_uri=http://m.sworkit.com/mfp-auth.html&access_type=offline&response_type=code';
    //TODO: figure out if the clearchace and clearsessioncache are necessary. Should only affect Android. may cause Sessionm connection error after MFP setup
    cb = window.open(authUrl, '_blank', 'location=no,clearcache=yes,clearsessioncache=yes,AllowInlineMediaPlayback=yes');

    cb.addEventListener('loadstart', function(event){$rootScope.interceptFacebook(event.url)});

    cb.addEventListener('loadstop', function(event){$rootScope.locationChanged(event.url)});

    cb.addEventListener('exit', function(event){$rootScope.childBrowserClosed()});

  }

  $rootScope.interceptFacebook = function(url){
      console.log("starting to load: " + url);
      if (url == "http://m.sworkit.com/intercept.html"){
          window.open("https://www.myfitnesspal.com/oauth2/authorize?client_id=sworkit&scope=diary&redirect_uri=http://m.sworkit.com/mfp-auth.html&state=proapp&access_type=offline&response_type=code", "_system", "location=no,AllowInlineMediaPlayback=yes");
      }
  }

  $rootScope.locationChanged = function(url) {
     cb.executeScript({
                     code: '$("#facebook-login-css").click(function() {window.location = "http://m.sworkit.com/intercept.html"})'
      }, function() {
      });
      myObj = deparam(url);
  }

  $rootScope.childBrowserClosed = function(){
      if (myObj.code){
          var newURL = "https://www.myfitnesspal.com/oauth2/token?client_id=sworkit&client_secret=192867e0c606f7a7b953&grant_type=authorization_code&code=" + myObj.code;
          $http({
            method: 'POST',
            url: newURL,
            headers: {'Content-Type': 'application/x-www-form-urlencoded'}
          }).then(function(resp){
            PersonalData.GetUserSettings.mfpAccessToken = resp.data.access_token;
            PersonalData.GetUserSettings.mfpRefreshToken = resp.data.refresh_token;
            PersonalData.GetUserSettings.mfpStatus = true;
            persistMultipleObjects($q,{
              'userSettings': PersonalData.GetUserSettings,
            }, function() {
                // When all promises are resolved
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
            showNotification($translate.instant('AUTH_SUCC'), 'button-balanced', 2000);
            trackEvent('More Action', 'MyFitnessPal Connection', 0);
            logActionSessionM('MyFitnessPal');
           }, function(err) {
              $rootScope.childBrowserRetry();
          })
      }
      else {
        var helpMessage = $translate.instant('TAP_HELP') + ' contact@sworkit.com.'
          navigator.notification.confirm(
                                   helpMessage,
                                   $scope.getHelp,
                                   $translate.instant('CONNECT_ERROR'),
                                   [$translate.instant('CANCEL_SM'),$translate.instant('HELP')]
                                   );
      }

  }
  $rootScope.childBrowserRetry = function(){
      if (myObj.code){
          myObj.code = myObj.code + '%3d%3d';
          var newURL = "https://www.myfitnesspal.com/oauth2/token?client_id=sworkit&client_secret=192867e0c606f7a7b953&grant_type=authorization_code&code=" + myObj.code;
          $http({
            method: 'POST',
            url: newURL,
            headers: {'Content-Type': 'application/x-www-form-urlencoded'}
          }).then(function(resp){
            PersonalData.GetUserSettings.mfpAccessToken = resp.data.access_token;
            PersonalData.GetUserSettings.mfpRefreshToken = resp.data.refresh_token;
            PersonalData.GetUserSettings.mfpStatus = true;
            persistMultipleObjects($q,{
              'userSettings': PersonalData.GetUserSettings,
            }, function() {
                // When all promises are resolved
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
            showNotification($translate.instant('AUTH_SUCC'), 'button-balanced', 2000);
            trackEvent('More Action', 'MyFitnessPal Connection', 0);
            logActionSessionM('MyFitnessPal');
           }, function(err) {
            showNotification($translate.instant('CON_ERROR'), 'button-assertive', 2000);
      })
      }
      else {
          var helpMessage = $translate.instant('TAP_HELP') + ' contact@sworkit.com.'
          navigator.notification.confirm(
                                   helpMessage,
                                   $scope.getHelp,
                                   $translate.instant('CONNECT_ERROR'),
                                   [$translate.instant('CANCEL_SM'),$translate.instant('HELP')]
                                   );
      }

  }
  $scope.getHelp = function(buttonIndex){
    if (buttonIndex == 2){
      window.open('http://sworkit.com/mfp', 'blank', 'location=no,AllowInlineMediaPlayback=yes');
    }
  }
  $scope.rateSworkit = function ($event) {
    $timeout(function(){
       upgradeNotice(2);
      }, 500);
  }
  $scope.downloadVideosChange = function(){
    if ($scope.userSettings.videosDownloaded){
      navigator.notification.confirm(
         $translate.instant('READY_DOWN'),
         $scope.downloadQuestion,
         $translate.instant('DOWNLOAD_VID'),
         [$translate.instant('YES_SM'),$translate.instant('CANCEL_SM')]
      );
    } else{
      navigator.notification.confirm(
         $translate.instant('DELETE_SURE'),
         $scope.deleteQuestion,
         $translate.instant('DELETE_VID'),
         [$translate.instant('YES_SM'),$translate.instant('CANCEL_SM')]
      );
    }
  }

  $scope.downloadQuestion = function(buttonIndex){
    if (buttonIndex == 1){
      downloadProgress($translate.use());
      downloadAllExercise();
      PersonalData.GetUserSettings.downloadDecision = false;
      localforage.setItem('userSettings', PersonalData.GetUserSettings);
    } else if(buttonIndex == 2){
      $scope.userSettings.videosDownloaded = false;
      $scope.$apply();
    }
  }

  $scope.deleteQuestion = function(buttonIndex){
    if (buttonIndex == 1){
      videoDownloader.deleteVideos()
      PersonalData.GetUserSettings.downloadDecision = false;
      PersonalData.GetUserSettings.videosDownloaded = false;
      localforage.setItem('userSettings', PersonalData.GetUserSettings);
    } else if(buttonIndex == 2){
      $scope.userSettings.videosDownloaded = true;
      $scope.$apply();
    }
  }
  if (device){LowLatencyAudio.unload('welcome');}

  $scope.$on('$ionicView.leave', function() {

    if ($scope.mfpWeightStatus.data) {
      PersonalData.GetUserSettings.mfpWeight = true;
    }

    persistMultipleObjects($q,{
      'userSettings': PersonalData.GetUserSettings,
      'userGoals': PersonalData.GetUserGoals,
      'timingSettings': TimingData.GetTimingSettings
    }, function() {
      // When all promises are resolved
      AppSyncService.syncStoredData();
    });

    $log.debug("$ionicView.leave check for audio locale change...");
    if (PersonalData.GetUserSettings.preferredLanguage !== $scope.originalLanguage && device){
      $log.debug("New audio locale");
      downloadAllExerciseAudio(PersonalData.GetUserSettings.preferredLanguage);
    }
    if (device && ionic.Platform.isAndroid()){
      localforage.setItem('googleFitStatus', PersonalData.GetGoogleFit);
    }
    $scope.healthModal.remove();
  });
})

.controller('SettingsAudioCtrl', function($scope, $translate, UserService) {
      $scope.timeSettings = UserService.getTimingIntervals();
      $scope.audioSettings = UserService.getAudioSettings();
      $scope.data = {showInfo:false};
      if (ionic.Platform.isAndroid()){
        $scope.androidPlatform = true;
      } else{
        $scope.androidPlatform = false;
      }
      $scope.changeAudio = function(value){
        switch(value) {
          case 0:
              $scope.audioSettings.ignoreDuck = false;
              $scope.audioSettings.duckEverything = false;
              $scope.audioSettings.duckOnce = true;
              break;
          case 1:
              $scope.audioSettings.duckOnce = false;
              $scope.audioSettings.duckEverything = false;
              $scope.audioSettings.ignoreDuck = true;
              break;
          default:
              $scope.audioSettings.duckOnce = false;
              $scope.audioSettings.ignoreDuck = false;
              $scope.audioSettings.duckEverything = true;
        }
      }
      $scope.$on('$ionicView.leave', function(){
        localforage.setItem('backgroundAudio', PersonalData.GetAudioSettings);
        LowLatencyAudio.turnOffAudioDuck(PersonalData.GetAudioSettings.duckOnce.toString());
      });
})

.controller('ExerciseListCtrl', function($scope, $ionicModal, $http, $sce, $timeout,$translate, $location, $ionicScrollDelegate, WorkoutService, $ionicPlatform, $log) {
  var controller = this;
  $ionicPlatform.ready(function () {
    if (device){
      $scope.deviceBasePath = cordova.file.dataDirectory;
    } else {
      $scope.deviceBasePath = false;
    }
    $log.debug("$scope.deviceBasePath", $scope.deviceBasePath);
  })
      .then(WorkoutService.getUserExercises)
      .then(function (userExercises) {
        controller.userExercises = userExercises;
        $scope.exerciseCategories = [
          {shortName:"upper",longName:"UPPER_SM", exercises: WorkoutService.getExercisesByCategory(userExercises, 'upper') },
          {shortName:"core",longName:"CORE_SM", exercises: WorkoutService.getExercisesByCategory(userExercises, 'core') },
          {shortName:"lower",longName:"LOWER_SM", exercises: WorkoutService.getExercisesByCategory(userExercises, 'lower') },
          {shortName:"stretch",longName:"STRETCH_SM", exercises: WorkoutService.getExercisesByCategory(userExercises, 'stretch') },
          {shortName:"back",longName:"BACK_SM", exercises: WorkoutService.getExercisesByCategory(userExercises, 'back') },
          {shortName:"cardio",longName:"CARDIO_SM", exercises: WorkoutService.getExercisesByCategory(userExercises, 'cardio') },
          {shortName:"pilates",longName:"PILATES_SM", exercises: WorkoutService.getExercisesByCategory(userExercises, 'pilates') },
          {shortName:"yoga",longName:"YOGA_SM", exercises: WorkoutService.getExercisesByCategory(userExercises, 'yoga') }
        ];
        if (ionic.Platform.isAndroid()){
          $scope.androidPlatform = true;
        } else{
          $scope.androidPlatform = false;
        }
        $scope.advancedTiming = WorkoutService.getTimingIntervals();
        $scope.showVideo = false;
        if(device){
          cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        }
        $scope.currentExercise = userExercises['Squats'];
        $scope.allExercises = [];
        for(var eachExercise in userExercises) {
            if (controller.userExercises[eachExercise].category !== "hidden") {
                $scope.allExercises.push($translate.instant(controller.userExercises[eachExercise].name));
            }
        }
        $timeout(function(){
          $scope.allExercises.sort();
        }, 1500);
      });

  $scope.getVideoLocation = function() {
    if ($scope.currentExercise.unlocked) {
      return $scope.deviceBasePath + 'exercises/video/';
    } else {
      return 'video/';
    }
  };

  $ionicModal.fromTemplateUrl('show-video.html', function(modal) {
                              $scope.videoModal = modal;
                              }, {
                              scope:$scope,
                              animation: 'fade-implode',
                              focusFirstInput: false,
                              backdropClickToClose: false
                              });
  $scope.openVideoModal = function(exerciseEl) {
    $scope.currentExercise = exerciseEl;

    $scope.videoModal.show();
      if ($scope.androidPlatform && device){
      if ($scope.advancedTiming.autoPlay){
        window.plugins.html5Video.initialize({
          "videoplayerscreen" : $scope.currentExercise.video,
          "unlocked": $scope.currentExercise.unlocked
        })
        $timeout(function(){
          window.plugins.html5Video.play("videoplayerscreen", function(){})
        }, 1400);
        $timeout(function(){
          angular.element(document.getElementById('videoplayerscreen')).css('opacity','1');
        }, 2500);
        $timeout(function(){
          angular.element(document.getElementById('videoplayerscreen')).css('opacity','0.00001');
        }, 0);
      } else{$timeout(function(){
          var videoPlayerFrame = angular.element(document.getElementById('videoplayerscreen'));
          videoPlayerFrame.css('opacity','0.00001');
          videoPlayerFrame[0].src = 'http://m.sworkit.com/assets/exercises/Videos/' + $scope.currentExercise.video;

          videoPlayerFrame[0].addEventListener("timeupdate", function() {
            if (videoPlayerFrame[0].duration > 0
              && Math.round(videoPlayerFrame[0].duration) - Math.round(videoPlayerFrame[0].currentTime) == 0) {

              //if loop atribute is set, restart video
                if (videoPlayerFrame[0].loop) {
                    videoPlayerFrame[0].currentTime = 0;
                }
            }
          }, false);

          videoPlayerFrame[0].addEventListener("canplay", function(){
            videoPlayerFrame[0].removeEventListener("canplay", this, false);
            videoPlayerFrame[0].play();
            videoPlayerFrame.css('opacity','1');
          }, false);

          videoPlayerFrame[0].play();
        }, 100);
      }

    } else {
      $scope.videoAddress = $scope.getVideoLocation() + $scope.currentExercise.video;
    }
    var calcHeight = (angular.element(document.getElementsByClassName('modal')).prop('offsetHeight'))   * .7;
    calcHeight = calcHeight +'px';
    // if (ionic.Platform.isAndroid() && !isKindle()){
    //   angular.element(document.querySelector('#videoplayer')).html("<video id='video2' poster='img/exercises/"+$scope.currentExercise.image+"' preload='auto' autoplay loop muted webkit-playsinline='webkit-playsinline' ><source src='"+$scope.videoData.videoURL+"'></source></video>");
    // }
    $scope.showVideo = true;

  };
  $scope.cancelVideoModal = function() {
    // if (ionic.Platform.isAndroid() && !isKindle()){
    //   angular.element(document.querySelector('#videoplayer')).html("");
    // }
    $scope.videoData = {youtubeURL: '',videoURL: ''};
    var videoPlayerFrame = angular.element(document.getElementById('videoplayerscreen'));
    if ($scope.androidPlatform){
      videoPlayerFrame[0].src = '';
    }
    $scope.videoModal.hide();
  };

  $scope.searchTyping = function(typedthings){

  }
  $scope.searchSelect = function(suggestion){
    $scope.slideTo($scope.allExercises.indexOf(suggestion), suggestion);
  }
  $scope.slideTo = function(location, suggestion) {
    var newLocation = $location.hash(location);
    document.getElementById('exercise-search').value = '';
    var keyObject = translations[PersonalData.GetUserSettings.preferredLanguage];
    keyObject.getKeyByValue = function( value ) {
      for( var prop in this ) {
        if( this.hasOwnProperty( prop ) ) {
          if( this[ prop ] === value )
          return prop;
        }
      }
    }
    var foundKey = keyObject.getKeyByValue(suggestion);
    var keyInEN = translations['EN'][foundKey];
    $ionicScrollDelegate.$getByHandle('exerciseScroll').anchorScroll("#"+newLocation);
    WorkoutService.getUserExercises()
        .then(function (userExercises) {
          $timeout( function(){
            $scope.openVideoModal(userExercises[keyInEN]);
          },500);
        });
  };

  $scope.$on('$ionicView.leave', function() {
    $scope.videoModal.remove();
    if(device){
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(false);
    }
  });
})

.controller('HelpCtrl', function($scope, $translate, UserService) {
  $scope.$on('$ionicView.enter', function () {
    angular.element(document.getElementsByClassName('bar-header')).addClass('blue-bar');
  });
  $scope.sendFeedback = function ($event) {
      if (ionic.Platform.isAndroid()){
        $scope.appVersion = '5.70.09'
      } else {
        $scope.appVersion = '3.6.3'
      }
      var emailBody = "<p>" + $translate.instant('DEVICE') + ": " + device.model + "</p><p>" + $translate.instant('PLATFORM') + ": "  + device.platform + " " + device.version  + "- " + PersonalData.GetUserSettings.preferredLanguage + "</p>" + "<p>" + $translate.instant('APP_VERSION') + ": " + $scope.appVersion + "</p><p>" + $translate.instant('FEEDBACK') + ": </p>";
      window.plugin.email.open({
                       to:      ['contact@sworkit.com'],
                       subject: $translate.instant('FEEDBACK') + ': Sworkit Pro',
                       body:    emailBody,
                       isHtml:  true
                       });
  };
  $scope.openInstructions = function ($event){
    window.open('http://sworkit.com/about#instructions', '_blank', 'location=yes,AllowInlineMediaPlayback=yes,toolbarposition=top');
  }
  $scope.openTOS = function ($event){
    window.open('http://m.sworkit.com/TOS.html', '_blank', 'location=yes,AllowInlineMediaPlayback=yes,toolbarposition=top');
  }
  $scope.openPrivacy = function ($event){
    window.open('http://m.sworkit.com/privacy.html', '_blank', 'location=yes,AllowInlineMediaPlayback=yes,toolbarposition=top');
  }
  $scope.openRules = function ($event){
    window.open('http://m.sworkit.com/rules.html', '_blank', 'location=yes,AllowInlineMediaPlayback=yes,toolbarposition=top');
  }
  $scope.openFAQ = function() {
    window.open('http://sworkit.com/support', '_blank', 'location=yes,AllowInlineMediaPlayback=yes,toolbarposition=top');
  }
  $scope.shareTwitter = function ($event) {
    if (device){
      var tweetText = $translate.instant('FOR_CUSTOM');
      window.plugins.socialsharing.shareViaTwitter(tweetText, null, null, function(){logActionSessionM('Share')}, function(){window.open('http://twitter.com/sworkit', '_blank', 'location=yes,AllowInlineMediaPlayback=yes,toolbarposition=top');})
    }
  }
  $scope.shareFacebook = function ($event) {
    var facebookText = $translate.instant('FOR_CUSTOM');
    if (device){
      window.plugins.socialsharing.shareViaFacebook(facebookText, null, null, function(){logActionSessionM('Share')}, function(){window.open('http://facebook.com/sworkitapps', '_blank', 'location=yes,AllowInlineMediaPlayback=yes,toolbarposition=top');})
    }
  }
  $scope.shareEmail = function ($event) {
      var emailText = $translate.instant('FOR_CUSTOM');
      window.plugin.email.open({
                       to:      [],
                       subject: $translate.instant('CHECK_OUT'),
                       body:    emailText,
                       isHtml:  true
                       });
  }
  $scope.rateSworkit = function ($event) {
    if (device.platform.toLowerCase() == 'ios') {
      window.open('http://itunes.apple.com/app/id539623568', '_system', 'location=no,AllowInlineMediaPlayback=yes');
    } else if (isAmazon()){
        window.appAvailability.check('com.amazon.venezia', function() {
             window.open('amzn://apps/android?p=sworkitproapp.sworkit.com', '_system')},function(){
             window.open(encodeURI("http://www.amazon.com/gp/mas/dl/android?p=sworkitproapp.sworkit.com"), '_system');}
             );
    } else if (isMobiroo()){
              window.open('mma://app/157a5c50-1599-445e-985b-b8a9ba24e64a', '_system');
    } else {
      window.open('market://details?id=sworkitproapp.sworkit.com', '_system');
    }
  }
  $scope.launchGear = function(){
    window.open('http://www.ntensify.com/sworkit', '_blank', 'location=yes,AllowInlineMediaPlayback=yes,toolbarposition=top');
  }
  var hiddenURL = window.open('http://sworkit.com/app', '_blank', 'hidden=yes,AllowInlineMediaPlayback=yes');

  $scope.$on('$ionicView.leave', function() {
               angular.element(document.getElementsByClassName('bar-header')).removeClass('blue-bar');
               });
})

.controller('PartnerAppsCtrl', function($scope, $location, UserService) {
  $scope.learnNexercise = function (){
    if (device.platform.toLowerCase() == 'ios') {
      window.open('http://nxr.cz/nex-ios', '_system', 'location=no,AllowInlineMediaPlayback=yes');
    } else if (isAmazon()){
        window.appAvailability.check('com.amazon.venezia', function() {
             window.open('amzn://apps/android?p=com.nexercise.client.android', '_system')},function(){
             window.open(encodeURI("http://www.amazon.com/gp/mas/dl/android?p=com.nexercise.client.android"), '_system');}
             );
    } else if (isMobiroo()){
        window.open('mma://app/157a5c50-1599-445e-985b-b8a9ba24e64a', '_system');
    } else {
        window.open('market://details?id=com.nexercise.client.android', '_system')
    }
  }
  $scope.learnMyFitnessPal = function (){
    $location.path('/app/settings');
  }
})

.controller('NexerciseAppCtrl', function($scope, $location, UserService) {
  $scope.mobirooStatus = isMobiroo();
  $scope.$on('$ionicView.leave', function() {
               angular.element(document.getElementsByClassName('bar-stable')).removeClass('blue-bar');
               });
  $scope.downloadNexercise = function (){
    trackEvent('More Action', 'Install Nexercise', 0);
    setTimeout(function(){
      if (device.platform.toLowerCase() == 'ios') {
        window.open('http://nxr.cz/nex-ios', '_system', 'location=no,AllowInlineMediaPlayback=yes');
      }  else if (isAmazon()){
        window.appAvailability.check('com.amazon.venezia', function() {
             window.open('amzn://apps/android?p=com.nexercise.client.android', '_system')},function(){
             window.open(encodeURI("http://www.amazon.com/gp/mas/dl/android?p=com.nexercise.client.android"), '_system');}
             );
      } else if (isMobiroo()){
          window.open('mma://app/157a5c50-1599-445e-985b-b8a9ba24e64a', '_system');
      } else {
          window.open('market://details?id=com.nexercise.client.android', '_system')
      }
    }, 400)
  }
})

.directive('integer', function(){
    return {
        require: 'ngModel',
        link: function(scope, ele, attr, ctrl){
            ctrl.$parsers.unshift(function(viewValue){
                return parseInt(viewValue);
            });
        }
    };
});

function showTimingModal($scope, $ionicModal, $timeout, WorkoutService, $q, AppSyncService, parent){
  $scope.toggleOptions = {data:true};
  if (ionic.Platform.isAndroid()){
    $scope.androidPlatform = true;
  } else{
    $scope.androidPlatform = false;
  }
  if (parent){
    $scope.toggleOptions = {data:false};
  }
  var tempExerciseTime = $scope.advancedTiming.exerciseTime;
    $ionicModal.fromTemplateUrl('advanced-timing.html', function(modal) {
                                $scope.timeModal = modal;
                                }, {
                                scope:$scope,
                                animation: 'slide-in-up',
                                focusFirstInput: false,
                                backdropClickToClose: false
                                });
    $scope.openModal = function() {
      $scope.timeModal.show();
    };
    $scope.closeModal = function() {
      TimingData.GetTimingSettings.breakFreq = parseInt(TimingData.GetTimingSettings.breakFreq);
      TimingData.GetTimingSettings.exerciseTime = parseInt(TimingData.GetTimingSettings.exerciseTime);
      TimingData.GetTimingSettings.breakTime = parseInt(TimingData.GetTimingSettings.breakTime);
      TimingData.GetTimingSettings.transitionTime = parseInt(TimingData.GetTimingSettings.transitionTime);

      if (parent && tempExerciseTime !== $scope.advancedTiming.exerciseTime){
        var singleSeconds = $scope.advancedTiming.exerciseTime;
        if (singleSeconds > 60){
          $scope.singleTimer.minutes = Math.floor(singleSeconds / 60);
          $scope.singleTimer.seconds = singleSeconds % 60;
        } else {
          $scope.singleTimer.minutes = 0;
          $scope.singleTimer.seconds = singleSeconds;
        }
        $scope.updateTime();
        $scope.adjustTimerMinutes();
      } else if (parent){
        if (ionic.Platform.isAndroid() && device){
          playInlineVideo($scope.advancedTiming.autoPlay);
        } else{
          WorkoutService.getUserExercises()
              .then(function (userExercises) {
                playInlineVideo($scope.advancedTiming.autoPlay, userExercises[$scope.currentWorkout[0]]);
              });
        }

        persistMultipleObjects($q,{
          'timingSettings': TimingData.GetTimingSettings
        }, function() {
          // When all promises are resolved
          AppSyncService.syncLocalForageObject('timingSettings', [
            'breakFreq',
            'breakTime',
            'customSet',
            'exerciseTime',
            'randomizationOption',
            'restStatus',
            'transitionTime',
            'workoutLength',
            'sunSalutation',
            'fullSequence',
            'runnerYoga'
          ], TimingData.GetTimingSettings);
        });

        $scope.adjustTimerMinutes();
      } else {
        persistMultipleObjects($q,{
          'timingSettings': TimingData.GetTimingSettings
        }, function() {
          // When all promises are resolved
          AppSyncService.syncLocalForageObject('timingSettings', [
            'breakFreq',
            'breakTime',
            'customSet',
            'exerciseTime',
            'randomizationOption',
            'restStatus',
            'transitionTime',
            'workoutLength',
            'sunSalutation',
            'fullSequence',
            'runnerYoga'
          ], TimingData.GetTimingSettings);
        });
      }
      $scope.timeModal.hide();
      $scope.timeModal.remove();
    };
    $scope.resetDefaults =  function(){
      var getAudio = TimingData.GetTimingSettings.audioOption;
      var getWarning = TimingData.GetTimingSettings.warningAudio;
      var getCountdown = TimingData.GetTimingSettings.countdownBeep;
      var getStyle = TimingData.GetTimingSettings.countdownStyle;
      var getAutoPlay = TimingData.GetTimingSettings.autoPlay;
      var getWelcome = TimingData.GetTimingSettings.welcomeAudio;
      var getAuto = TimingData.GetTimingSettings.autoStart;
      var getSun = TimingData.GetTimingSettings.sunSalutation;
      var getFull = TimingData.GetTimingSettings.fullSequence;
      var getRunner = TimingData.GetTimingSettings.runnerYoga;
      $scope.advancedTiming = {"customSet":true,"breakFreq":5,"exerciseTime":30,"breakTime":30,"transitionTime":0,"randomizationOption":true,"workoutLength":60, "audioOption": getAudio, "warningAudio": getWarning, "countdownBeep": getCountdown, "autoPlay": getAutoPlay, "countdownStyle": getStyle, "welcomeAudio": getWelcome, "autoStart": getAuto, "restStatus": true, "sunSalutation": getSun, "fullSequence": getFull, "runnerYoga": getRunner}
      TimingData.GetTimingSettings = $scope.advancedTiming;
    }
    $scope.enableHIIT = function(){
      $scope.advancedTiming.customSet = true;
      $scope.advancedTiming.breakFreq = 0;
      $scope.advancedTiming.restStatus = false;
      $scope.advancedTiming.exerciseTime = 30;
      $scope.advancedTiming.breakTime = 0;
      $scope.advancedTiming.transitionTime = 15;
    }
    $scope.enableTabata = function(){
      $scope.advancedTiming.customSet = true;
      $scope.advancedTiming.breakFreq = 0;
      $scope.advancedTiming.restStatus = false;
      $scope.advancedTiming.exerciseTime = 20;
      $scope.advancedTiming.breakTime = 0;
      $scope.advancedTiming.transitionTime = 10;
    }
    $scope.toggleNextExercise = function(){
      localforage.setItem('userSettings', PersonalData.GetUserSettings);
    }
    $scope.$on('$ionicView.leave', function() {
               $scope.timeModal.remove();
               });
    $timeout(function(){
             $scope.openModal();
             }, 0);
}

function buildStats($scope, $translate, isWorkout){
  $scope.getTotal = function(){
            window.db.transaction(
                           function(transaction) {
                           transaction.executeSql("SELECT SUM(minutes_completed) AS minutes FROM Sworkit",
                                                  [],
                                                  function(tx, results){
                                                    $scope.totals.totalEver = results.rows.item(0)["minutes"] || 0;
                                                    $scope.$apply();
                                                  },
                                                  null)
                           }
                           );
            window.db.transaction(
                           function(transaction) {
                           transaction.executeSql("SELECT strftime('%Y-%m-%d', created_on) AS day, SUM(minutes_completed) AS minutes, SUM(calories) AS calories FROM Sworkit WHERE created_on > (SELECT DATETIME('now', '-1 day')) GROUP BY strftime('%Y-%m-%d', created_on)",
                                                  [],
                                                  function(tx, results){
                                                    try{
                                                      if (results.rows.item(0)){
                                                       $scope.totals.todayMinutes = results.rows.item(results.rows.length -1)["minutes"];
                                                       $scope.totals.todayMinutesRounded = Math.round($scope.totals.todayMinutes);
                                                       $scope.totals.todayCalories = results.rows.item(results.rows.length -1)["calories"];
                                                      }
                                                    } catch(e){
                                                      $scope.totals.todayMinutes = 0;
                                                      $scope.totals.todayMinutesRounded = 0;
                                                      $scope.totals.todayCalories = 0;
                                                    }
                                                  },
                                                  null)
                           }
                           );
            window.db.transaction(
                         function(transaction) {
                         transaction.executeSql("SELECT strftime('%Y-%m-%d', created_on) AS day, SUM(minutes_completed) AS minutes, SUM(calories) AS calories FROM Sworkit WHERE created_on > (SELECT DATETIME('now', '-7 day')) GROUP BY strftime('%Y-%m-%d', created_on)",
                                                [],
                                                function(tx, results){
                                                    dateHashMin = {}
                                                    dateHashCal = {}
                                                    for (var i = 0; i < results.rows.length; i++) {
                                                    dateHashMin[results.rows.item(i)["day"]] = results.rows.item(i)["minutes"];
                                                    dateHashCal[results.rows.item(i)["day"]] = results.rows.item(i)["calories"]; }

                                                    $scope.graphData7Min = [];
                                                    $scope.graphData7Cal = [];
                                                    $scope.weekGoalTotal = 0;
                                                    $scope.weekGoalTotalRounded = 0;

                                                    for (var i = 0; i < 7; i++) {
                                                        date = new Date();
                                                        date.setTime(date.getTime() - (i * 24 * 60 * 60 * 1000));

                                                        day = (date.getDate() < 10) ? "0" + date.getDate() : date.getDate().toString();
                                                        month = (date.getMonth() < 9) ? "0" + (date.getMonth() + 1) : (date.getMonth() + 1).toString();
                                                        createdOnFormat = date.getFullYear() + "-" + month + "-" + day;

                                                        minutes = dateHashMin[createdOnFormat] || 0;
                                                        calories = dateHashCal[createdOnFormat] || 0;


                                                        displayDate = (i == 0) ? $translate.instant('TODAY') : (date.getMonth() + 1) + "." + date.getDate();

                                                        $scope.graphData7Min.unshift([displayDate, minutes]);
                                                        $scope.graphData7Cal.unshift([displayDate, calories]);
                                                        $scope.weekGoalTotal += minutes;
                                                        $scope.weekGoalTotalRounded = Math.round($scope.weekGoalTotal);
                                                    }
                                                  },
                                                null)
                         }
                         );
            window.db.transaction(
                                     function(transaction) {
                                     transaction.executeSql("SELECT strftime('%Y-%m-%d', created_on) AS day, SUM(minutes_completed) AS minutes, SUM(calories) AS calories FROM Sworkit WHERE created_on > (SELECT DATETIME('now', '-30 day')) GROUP BY strftime('%Y-%m-%d', created_on)",
                                                            [],
                                                            function(tx, results){
                                                                var totalMonthMinutes = 0;
                                                                dateHashMin30 = {}
                                                                dateHashCal30 = {}
                                                                for (var i = 0; i < results.rows.length; i++) { dateHashMin30[results.rows.item(i)["day"]] = results.rows.item(i)["minutes"];
                                                                dateHashCal30[results.rows.item(i)["day"]] = results.rows.item(i)["calories"]; }

                                                                $scope.graphData30Min = [];
                                                                $scope.graphData30Cal = [];
                                                                for (var i = 0; i < 30; i++) {
                                                                    date = new Date();
                                                                    date.setTime(date.getTime() - (i * 24 * 60 * 60 * 1000));

                                                                    day = (date.getDate() < 10) ? "0" + date.getDate() : date.getDate().toString();
                                                                    month = (date.getMonth() < 9) ? "0" + (date.getMonth() + 1) : (date.getMonth() + 1).toString();
                                                                    createdOnFormat = date.getFullYear() + "-" + month + "-" + day;

                                                                    minutes = dateHashMin30[createdOnFormat] || 0;
                                                                    calories = dateHashCal30[createdOnFormat] || 0;


                                                                    displayDate = (i == 0) ? $translate.instant('TODAY') : (date.getMonth() + 1) + "." + date.getDate();
                                                                    if (minutes > 0){
                                                                      totalMonthMinutes++
                                                                    }

                                                                    $scope.graphData30Min.unshift([displayDate, minutes]);
                                                                    $scope.graphData30Cal.unshift([displayDate, calories]);
                                                                }
                                                                $scope.totals.totalMonthMin = totalMonthMinutes;
                                                              },
                                                            null)
                                     }
                                     );
            window.db.transaction(
                                     function(transaction) {
                                     transaction.executeSql("SELECT type, SUM(minutes_completed) AS minutes_completed FROM Sworkit GROUP BY type",
                                                            [],
                                                            function(tx, results){
                                                              if (results.rows.length === 0){
                                                              }
                                                              else{
                                                                  var totalMin=0;

                                                                  for (var i=0; i<results.rows.length; i++){

                                                                      totalMin+=parseFloat(results.rows.item(i)['minutes_completed']);

                                                                  }

                                                                  $scope.dataPie = new Array();

                                                                  for (var i=0; i<results.rows.length; i++){

                                                                      var a = new Array();
                                                                      var typeName = $translate.instant(LocalData.GetWorkoutTypes[results.rows.item(i)['type']].activityNames);
                                                                      a.push({'key': typeName, 'y':results.rows.item(i)['minutes_completed']});

                                                                      if ((results.rows.item(i)['minutes_completed'])/totalMin > 0){
                                                                        $scope.dataPie.push(a[0]);
                                                                      }

                                                                  }

                                                              }

                                                              $scope.drawGraph();
                                                              $scope.$apply();
                                                          },
                                                            null)
                                     }
                                     );
            window.db.transaction(
                           function(transaction) {
                           transaction.executeSql("SELECT strftime('%Y-%m-%d', created_on) AS day, SUM(minutes_completed) AS minutes, SUM(calories) AS calories FROM Sworkit GROUP BY strftime('%Y-%m-%d', created_on) ORDER BY minutes DESC LIMIT 1",
                                                  [],
                                                  function(tx, results){
                                                    try{
                                                      if (results.rows.item(0)){
                                                       $scope.totals.topMinutes = results.rows.item(results.rows.length -1)["minutes"];
                                                       $scope.totals.topDayMins = results.rows.item(results.rows.length -1)["day"];
                                                      }
                                                    } catch(e){
                                                      $scope.totals.topMinutes = 0;
                                                      $scope.totals.topDayMins = '';
                                                    }
                                                  },
                                                  null)
                           }
                           );
            window.db.transaction(
                           function(transaction) {
                           transaction.executeSql("SELECT strftime('%Y-%m-%d', created_on) AS day, SUM(minutes_completed) AS minutes, SUM(calories) AS calories FROM Sworkit GROUP BY strftime('%Y-%m-%d', created_on) ORDER BY calories DESC LIMIT 1",
                                                  [],
                                                  function(tx, results){
                                                    try{
                                                      if (results.rows.item(0)){
                                                       $scope.totals.topCalories = results.rows.item(results.rows.length -1)["calories"];
                                                       $scope.totals.topDayCals = results.rows.item(results.rows.length -1)["day"];
                                                      }
                                                    } catch(e){
                                                      $scope.totals.topCalories = 0;
                                                      $scope.totals.topDayCals = '';
                                                    }
                                                    $scope.$apply();
                                                  },
                                                  null)
                           }
                           );
        }
  $scope.getTotal();
  $scope.weeklyMinutes = parseInt(window.localStorage.getItem('weeklyTotal'));
  $scope.drawGraph = function(){
    $scope.dailyData = [
      {
          "key": "Series1",
          "color": "#FF8614",
          "values": [
              ["You" , $scope.totals.todayMinutes ],
              ["Goal" , $scope.goalSettings.dailyGoal ]
          ]
      }
    ];
    $scope.weeklyData = [
        {
            "key": "Series2",
            "color": "#FF8614",
            "values": [
                ["You" , $scope.weekGoalTotal ],
                ["Goal" , $scope.goalSettings.weeklyGoal ]
            ]
        }
    ];
    $scope.weeklyCals = [
                    {
                        "key": "Series 1",
                        "color": "#FF8614",
                        "values": $scope.graphData7Cal
                    }
              ];
    $scope.weeklyMins = [
                  {
                      "key": "Series 1",
                      "color": "#FF8614",
                      "values": $scope.graphData7Min
                  }
            ];

    $scope.monthlyCals = [
                  {
                      "key": "Series 1",
                      "color": "#FF8614",
                      "values": $scope.graphData30Cal
                  }
            ];

    $scope.monthlyMins = [
                  {
                      "key": "Series 1",
                      "color": "#FF8614",
                      "values": $scope.graphData30Min
                  }
            ];

    $scope.showMedals();
    }

    $scope.xFunction = function(){
        return function(d) {
            return d.key;
        };
    }
    $scope.yFunction = function(){
        return function(d) {
            return d.y;
        };
    }

    $scope.descriptionFunction = function(){
        return function(d){
            return d.key;
        }
    }

    $scope.showMedals = function() {

      if (isWorkout) {

        var autoChangeSlide = setTimeout(function(){
          changeSlide();
        }, 2000);

        var changeSlide = function() {
          $scope.optionSelected.listType = 'session';
          $scope.toggleLists();
          clearTimeout(autoChangeSlide)
        }

        if ($scope.totals.todayMinutes >= 5 && $scope.totals.todayMinutes < 15) {
          if ($scope.totals.todayMinutes - $scope.timeToAdd <= 5) {
            $scope.unlockedToday = false;
            autoChangeSlide;
          } else {
            $scope.unlockedToday = true;
            changeSlide();
          }
          $scope.unlockMedal = 'bronze';
        } else if ($scope.totals.todayMinutes >= 15 && $scope.totals.todayMinutes < 30){
          if ($scope.totals.todayMinutes - $scope.timeToAdd <= 15) {
            $scope.unlockedToday = false;
            autoChangeSlide;
          } else {
            $scope.unlockedToday = true;
            changeSlide();
          }
          $scope.unlockMedal = 'silver';
        } else if ($scope.totals.todayMinutes >= 30){
          if ($scope.totals.todayMinutes - $scope.timeToAdd <= 30) {
            $scope.unlockedToday = false;
            autoChangeSlide;
          } else {
            $scope.unlockedToday = true;
            changeSlide();
          }
          $scope.unlockMedal = 'gold';
        } else {
          $scope.unlockMedal = 'effort';
          changeSlide();
          $scope.toggleLists();
        }
      }
    }
}

function installWorkout(workoutName, workoutList, loc, sidemenu, $translate){
  PersonalData.GetCustomWorkouts.savedWorkouts.unshift({"name": workoutName,"workout": workoutList});
  localforage.setItem('customWorkouts', PersonalData.GetCustomWorkouts);
  trackEvent('URL Scheme', workoutName, 0);
  showNotification($translate.instant('CUSTOM_ADDED'), 'button-balanced', 2000);
  var tempLocation = loc.$$url.slice(-7) || '';
  if (tempLocation !== "workout"){
    loc.path('/app/custom');
    sidemenu.toggleLeft(false);
  }
  logActionSessionM('ImportCustomWorkout');
}
function showNotification(message, style, duration){
  var notifyEl = angular.element(document.getElementById('status-notification'));
  notifyEl.html('<button class="button button-outline button-full '+style+' fade-in-custom">'+message+'</button>');
  setTimeout(function(){
    notifyEl.html('<button class="button button-full button-outline '+style+' fade-out-custom">'+message+'</button>');
    notifyEl.html('');
  }, duration)
}

function getMinutesObj(){
    var minuteObj = {selected: 0, times:[]};
    for (i=0;i<60;i++){
        var stringNum = (i < 10) ? '0' + i : i;
        minuteObj.times.push({'id':i,'time':stringNum});
    }
    return minuteObj;
}
function forceUpdate(){
  if (device){
    navigator.notification.confirm(
                                   'Please update Sworkit Pro',
                                   upgradeNotice,
                                   'Not Available',
                                   ['Cancel','Upgrade']
                                   );
  } else{
    alert('Force Update');
  }
}
function upgradeNotice(button){
  if (button == 2){
    if (device.platform.toLowerCase() == 'ios') {
      window.open('http://itunes.apple.com/app/id539623568', '_system', 'location=no,AllowInlineMediaPlayback=yes');
    } else if (isAmazon()){
        window.appAvailability.check('com.amazon.venezia', function() {
             window.open('amzn://apps/android?p=sworkitproapp.sworkit.com', '_system')},function(){
             window.open(encodeURI("http://www.amazon.com/gp/mas/dl/android?p=sworkitproapp.sworkit.com"), '_system');}
             );
    } else if (isMobiroo()){
        window.open('mma://app/157a5c50-1599-445e-985b-b8a9ba24e64a', '_system');
    } else {
        window.open('market://details?id=sworkitproapp.sworkit.com', '_system')
    }
  }
}
function checkVolume(){
  var volumeNotification = angular.element(document.getElementsByClassName('volume-notification'));
  if (device){
    window.plugin.volume.getVolume(function(volume) {
      if (volume < 0.05){
        volumeNotification.addClass('animate').removeClass('flash');
        if (!ionic.Platform.isAndroid()){
          window.plugin.volume.setVolumeChangeCallback(function() {
            volumeNotification.addClass('flash').removeClass('animate');
          })
        }
        setTimeout(function(){
          volumeNotification.addClass('flash').removeClass('animate');
        }, 4000);
      }
    });
  } else {
    volumeNotification.addClass('animate').removeClass('flash');
    setTimeout(function(){
          volumeNotification.addClass('flash').removeClass('animate');
    }, 4000);
  }
}

var inlineVideoTimeout;
function playInlineVideo(autoState, exerciseObj){
  if (autoState && ionic.Platform.isAndroid() && device){
    window.plugins.html5Video.play("inlinevideo", function(){
    })
  }
  else if(autoState){
    var videoElement = angular.element(document.getElementById('inline-video'))[0];
    videoElement.play();
    videoElement.muted = true;
    //if (autoState && exerciseObj.videoTiming[0]){
    //  inlineVideoTimeout = setTimeout(function(){
    //    videoElement.pause();
    //  }, exerciseObj.videoTiming[0] + 1000);
    //}
  }
}

function continueInlineVideo(autoState, exerciseObj){
  clearTimeout(inlineVideoTimeout);
  if (autoState && ionic.Platform.isAndroid() && device){

  }
  else if(autoState){
    //var videoElement = angular.element(document.getElementById('inline-video'))[0];
    //videoElement.play();
    //videoElement.muted = true;
    //if (autoState && exerciseObj.videoTiming[1]){
    //  inlineVideoTimeout = setTimeout(function(){
    //    videoElement.pause();
    //  }, exerciseObj.videoTiming[1] + 2000 - exerciseObj.videoTiming[0]);
    //}
  }
}

function setBackButton($scope,$location,$ionicPlatform, customLocation){
  $scope.customBack = $ionicPlatform.registerBackButtonAction(
          function () {
              if (customLocation){
                var customString = '/app/' + customLocation;
                $location.path(customString);
              } else{
                $location.path('/app/home');
              }

          }, 100
  );
  $scope.$on('$ionicView.leave', $scope.customBack);
}

function persistMultipleObjects($q, objectsByKeys, callback, timestampOverride) {
  // objectsByKeys is a map of runtime objects by localforage key

  // var qAll = {};
  var qAllPromises = {};

  Object.keys(objectsByKeys).forEach(function(key) {
    var object = objectsByKeys[key];

    var q = $q.defer();
    // qAll[key] = q;
    qAllPromises[key] = q.promise;

    persistObject($q, key, object, function() {
      q.resolve();
    }, timestampOverride);
  });

  $q.all(qAllPromises).then(function() {
    if (callback) callback();
  });

}

function persistObject($q, key, object, callback, timestampOverride) {
  localforage.getItem(key, function(localforageObject, error) {
    if ( !localforageObject || !angular.equals(object, localforageObject) ) {
      localforage.setItem(key, object, function() {
        var timestamp = timestampOverride || (new Date()).getTime();
        console.log('Persisting', key, 'to localforage with timestamp', timestamp);

        qAllPromises = [];
        Object.keys(object).forEach(function(property) {
          var q = $q.defer();
          qAllPromises.push(q.promise)
          localforage.setItem('sync_' + key + '.' + property, timestamp, function() {
            q.resolve();
          })
        })
        $q.all(qAllPromises).then(function() {
          if (callback) callback();
        });

      })

    } else {
      if (callback) callback();
    }
  })
}

