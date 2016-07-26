angular.module('starter.services', ['ionic', 'ngCordova', 'pascalprecht.translate', 'firebase', 'angularMoment'])



.factory('UserService', function() {
         return {
         getUserSettings: function() {
         return PersonalData.GetUserSettings;
         }, getCustomWorkoutList: function() {
         return PersonalData.GetCustomWorkouts;
         }, getCurrentCustom: function() {
         return PersonalData.GetWorkoutArray.workoutArray;
         }, getGoalSettings: function() {
         return PersonalData.GetUserGoals;
         }, getTimingIntervals: function() {
         return TimingData.GetTimingSettings;
         }, getAudioSettings: function() {
         return PersonalData.GetAudioSettings;
         }, getFitSettings: function() {
         return PersonalData.GetGoogleFit;
         }
         }
         })

.run(function($rootScope, $timeout, $http, $ionicPlatform, $ionicPopup, $location, $translate, $state, $ionicHistory, AppSyncService, FirebaseService, WorkoutService, RetirementService) { $ionicPlatform.ready(function() {
                                                                                  
                                                                                  if (!ionic.Platform.isWebView()) {
                                                                                    window.device = false;
                                                                                  }

                                                                                  if (window.localStorage.getItem('firstUse') === null){
                                                                                    setupNewUser($translate, RetirementService);
                                                                                  } else if (window.localStorage.getItem('refreshUpdated') === null){
                                                                                    convertUser();
                                                                                  } else{
                                                                                    if (ionic.Platform.isIOS() && device){
                                                                                      migrateData($rootScope, $translate, $timeout, AppSyncService, FirebaseService, WorkoutService, RetirementService);
                                                                                    } else {
                                                                                      loadStoredData($translate, AppSyncService, FirebaseService, RetirementService);
                                                                                    }
                                                                                  }
                                                                                  if (window.localStorage.getItem('showWelcome') === null){
                                                                                    $location.path('/app/auth/welcome');
                                                                                    window.localStorage.setItem('showWelcome', true)
                                                                                    $rootScope.showWelcome = true;
                                                                                  } else {
                                                                                    $rootScope.showWelcome = false;
                                                                                  }
                                                                                  try {
                                                                                  if (device.platform.toLowerCase() !== 'android'){
                                                                                  $timeout(function(){
                                                                                           navigator.splashscreen.hide();
                                                                                           }, 500);
                                                                                  //Just in case :)
                                                                                  $timeout(function(){
                                                                                           navigator.splashscreen.hide();
                                                                                           }, 1200);
                                                                                  }
                                                                                  }
                                                                                  catch (e) {
                                                                                  }
                                                                                  
                                                                                  //Setup Extra data like weekly stats
                                                                                  setupExtraData($http);
                                                                                  //Download custom workouts
                                                                                  getDownloadableWorkouts($http);
                                                                                  //Setup Workout Database
                                                                                  setupDatabase();
                                                                                  $timeout(function(){
                                                                                           if(!window.db){
                                                                                           setupDatabase();
                                                                                           }
                                                                                           }, 3000);
                                                                                  
                                                                                  //Initialize SessionM and call 'visit' activity
                                                                                  //Tell LowLatency session is beginning
                                                                                  if (device){
                                                                                  $timeout(function(){initializeAnalytics()},2000);
                                                                                  $timeout(function(){initializeSessionM($rootScope);},4000);
                                                                                  $timeout(function(){setWelcomeAudio()},5000);
                                                                                  }

                                                                                  if (ionic.Platform.isAndroid()){
                                                                                    if (device) {
                                                                                      checkTotalDownloads();
                                                                                    }
                                                                                    $ionicPlatform.registerBackButtonAction(
                                                                                      function () {
                                                                                          var isDrawerOpen = function(){
                                                                                            if (angular.element(document.getElementsByTagName('body')[0]).hasClass('drawer-open') == true){
                                                                                              return true;
                                                                                            } else {
                                                                                              return false;
                                                                                            }
                                                                                          };
                                                                                          var tempURL = $location.$$url.substring(0,9);                                                                                          var isHome = function(){
                                                                                          if ($location.$$url == '/app/home'){
                                                                                            return true;
                                                                                          } else{
                                                                                            return false;
                                                                                          }
                                                                                          }
                                                                                          if (isDrawerOpen()){
                                                                                            $rootScope.toggleDrawerRoot();
                                                                                          }
                                                                                          else if (isHome()){
                                                                                            ionic.Platform.exitApp();
                                                                                          }
                                                                                          else if (tempURL == '#/app/cust') {
                                                                                            $location.path('/app/custom');
                                                                                          } else if (tempURL == '/app/home'){
                                                                                            $ionicHistory.backView().go();
                                                                                          } else if ($location.$$url == '/app/progress/log'){
                                                                                            $state.go('app.progress');
                                                                                          } else if (tempURL == '/app/swor' && $ionicHistory.backView() !== null){
                                                                                            $ionicHistory.backView().go();
                                                                                          } else {
                                                                                            $state.go('app.home');
                                                                                          }
                                                                                      }, 180
                                                                                      );
                                                                                      document.addEventListener("resume", onResume, false);
                                                                                      document.addEventListener("pause", onPause, false);
                                                                                    }
                                                                                    if (ionic.Platform.isIOS() && device) {
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
                                                                                      document.addEventListener("resume", onResumeIOS, false);
                                                                                      if (device.version < "7") {
                                                                                          ionic.Platform.fullScreen(true, true);
                                                                                      }
                                                                                    } else if (ionic.Platform.isAndroid() && device) {
                                                                                      appAvailability.check(
                                                                                        'com.nexercise.client.android',
                                                                                        function() {
                                                                                          nexerciseInstalledGlobal.status = true;
                                                                                        },
                                                                                        function() {
                                                                                          nexerciseInstalledGlobal.status = false;
                                                                                        }
                                                                                      );
                                                                                      if (ionic.Platform.version() < 4.1){
                                                                                        lowerAndroidGlobal = true;
                                                                                      } else{
                                                                                        lowerAndroidGlobal = false;
                                                                                      }
                                                                                    }
                                                                                    if (lockOrientation() && device){
                                                                                      try{
                                                                                        cordova.plugins.screenorientation.lockOrientation('portrait');
                                                                                      } catch(e){
                                                                                        screen.lockOrientation('portrait');
                                                                                      }
                                                                                    }
                                                                                  });
     });

var nexerciseInstalledGlobal = {status:false};
var lowerAndroidGlobal = {status:false};
var globalExternal = false;
var globalRateOption = false;
var globalShareOption = 0;
var globalRemindOption = false;
var globalNew310Option = false;
var globalFirstOption = false;
var isUSA = true;
var welcomeLoaded = false;
var isPro = true;
function handleOpenURL(url) {
    window.setTimeout(function () {
                      var body = document.getElementsByTagName("body")[0];
                      var appLaunchedController = angular.element(body).scope();
                      appLaunchedController.callCustom(url);
                      }, 2000);
}
function setupNewUser($translate, RetirementService){
    window.localStorage.setItem('firstUse',28);
    window.localStorage.setItem('timesUsed',1);
    window.localStorage.setItem('refreshUpdated',true);
    localforage.setItem('timingSettings', TimingData.GetTimingSettings);
    localforage.setItem('timingSevenSettings', TimingData.GetSevenMinuteSettings);
    localforage.setItem('reminder',{daily: {status:false,time:7,minutes:0}, inactivity: {frequency: 2, status:false,time:7,minutes:0}});
    if (navigator.globalization) {
      navigator.globalization.getPreferredLanguage(
        function(resultLang){
         var returnLang = 'EN';
         var twoLetterISO = resultLang.value.substring(0,2).toUpperCase();
         if (twoLetterISO == 'ES' && resultLang.value.length > 2){
          returnLang = 'ESLA';
         } else if (twoLetterISO == 'DE' || twoLetterISO == 'RU' || twoLetterISO == 'TR' || twoLetterISO == 'FR' || twoLetterISO == 'PT' || twoLetterISO == 'IT' || twoLetterISO == 'ES' || twoLetterISO == 'HI' || twoLetterISO == 'JA' || twoLetterISO == 'ZH' || twoLetterISO == 'KO'){
          returnLang = twoLetterISO.toUpperCase();
         }
         PersonalData.GetUserSettings.preferredLanguage = returnLang;
         $translate.use(returnLang);
         localforage.setItem('userSettings', PersonalData.GetUserSettings);
         if (returnLang !== 'EN'){
          downloadAllExerciseAudio(returnLang);
         }
            RetirementService.checkProRetirement();
         }, 
        function(error){
          PersonalData.GetUserSettings.preferredLanguage = 'EN';
          $translate.use('EN');
          localforage.setItem('userSettings', PersonalData.GetUserSettings);
            RetirementService.checkProRetirement();
        }
      );
    } else {
      $translate.use('EN');
      PersonalData.GetUserSettings.preferredLanguage = 'EN';
      localforage.setItem('userSettings', PersonalData.GetUserSettings);
      RetirementService.checkProRetirement();
    }
    localforage.setItem('userSettings', PersonalData.GetUserSettings);
    localforage.setItem('userGoals', PersonalData.GetUserGoals);
    localforage.setItem('userProfile', PersonalData.GetUserProfile);
    localforage.setItem('userProgress', PersonalData.GetUserProgress);
    var defaultCustom = [{"name":$translate.instant('BEGINNER_FULL'),"workout":["Running in Place", "Jumping Jacks", "Windmill", "Steam Engine",  "Bent Leg Twist", "Forward Lunges", "Wall Push-ups", "Step Touch", "Squats", "Overhead Arm Clap", "Elevated Crunches", "Push-ups", "Plank", "Rear Lunges", "Chest Expander", "Jump Rope Hops", "One Arm Side Push-up"]}]
    localforage.setItem('customWorkouts', {
                        savedWorkouts: defaultCustom
                        });
    PersonalData.GetCustomWorkouts.savedWorkouts = defaultCustom;
    localforage.setItem('currentCustomArray', PersonalData.GetWorkoutArray);
    localforage.setItem('ratingStatus', false);
    localforage.setItem('ratingCategory', {show:false,past:false,shareCount:0,sharePast:false});
    localforage.setItem('remindHome', {show:false,past:false});
    localforage.setItem('new310Home', false);
    localforage.setItem('externalStorage', false);
    localforage.setItem('userLanguages', PersonalData.GetLanguageSettings);
    if (ionic.Platform.isIOS() && device) {
      document.addEventListener("resume", onResumeIOS, false);
      appAvailability.check(
        'sworkit://',
        function() {
          trackEvent('More Action', 'Sworkit Lite Installed', 0);
        },
        function() {
          trackEvent('More Action', 'Sworkit Lite Not Installed', 0);
        }
      );
    } else if (ionic.Platform.isAndroid() && device) {
      appAvailability.check(
        'sworkitapp.sworkit.com',
        function() {
          trackEvent('More Action', 'Sworkit Lite Installed', 0);
        },
        function() {
          trackEvent('More Action', 'Sworkit Lite Not Installed', 0);
        }
      );
    }
}

function convertUser(){
    console.log('Data Test: Converting User');
    window.localStorage.setItem('firstUse',28);
    window.localStorage.setItem('timesUsed',1);
    if (parseInt(window.localStorage.getItem('breakSetting')) == 1){
        window.localStorage.setItem('breakFreq', 0);
    }
    if (parseInt(window.localStorage.getItem('randomizationOption')) == 1){
        window.localStorage.setItem('randomizationOption',true);
    } else if (parseInt(window.localStorage.getItem('randomizationOption')) == 0){
        window.localStorage.setItem('randomizationOption',false);
    }
    if (parseInt(window.localStorage.getItem('audioOption')) == 0){
        window.localStorage.setItem('audioOption',true);
    } else if (parseInt(window.localStorage.getItem('audioOption')) == 1){
        window.localStorage.setItem('audioOption',false);
    }
    if (parseInt(window.localStorage.getItem('customSet')) == 1){
        window.localStorage.setItem('customSet',true);
    } else if (parseInt(window.localStorage.getItem('audioOption')) == 0){
        window.localStorage.setItem('customSet',false);
    }
    if (parseInt(window.localStorage.getItem('kiipRewards')) == 1){
        window.localStorage.setItem('kiipRewards',false);
    } else if (parseInt(window.localStorage.getItem('kiipRewards')) == 0){
        window.localStorage.setItem('kiipRewards',false);
    } else {
      window.localStorage.setItem('kiipRewards',false);
    }
    if (parseInt(window.localStorage.getItem('mfpStatus')) == 1){
        window.localStorage.setItem('mfpStatus',true);
    } else if (parseInt(window.localStorage.getItem('mfpStatus')) == 0){
        window.localStorage.setItem('mfpStatus',false);
    } else {
      window.localStorage.setItem('mfpStatus',false);
    }
    if (parseInt(window.localStorage.getItem('myFitnessReady')) == 1){
        window.localStorage.setItem('myFitnessReady',true);
    } else if (parseInt(window.localStorage.getItem('myFitnessReady')) == 0){
        window.localStorage.setItem('myFitnessReady',false);
    } else {
      window.localStorage.setItem('myFitnessReady',false);
    }
    if (parseInt(window.localStorage.getItem('mfpWeight')) == 0){
        window.localStorage.setItem('mfpWeight',false);
    } else if (window.localStorage.getItem('mfpWeight')){
        window.localStorage.setItem('mfpWeight',true);
    } 
    if (window.localStorage.getItem('savedWorkouts') !== null){
        var savedWorkoutsUnstring = JSON.parse(window.localStorage.getItem('savedWorkouts'));
    } else{
      var savedWorkoutsUnstring = [];
    }
    if (window.localStorage.getItem("workoutArray") !== null){
        var currentCustomWorkout = JSON.parse(window.localStorage.getItem("workoutArray"));
    } else{
      var currentCustomWorkout = [];
    }

    localforage.setItem('timingSettings', {
                        customSet: (window.localStorage.getItem('customSet')  === "true") || true,
                        breakFreq: parseInt(window.localStorage.getItem('breakFreq')) || 5,
                        exerciseTime: parseInt(window.localStorage.getItem('exerciseTime')) || 30,
                        breakTime: parseInt(window.localStorage.getItem('breakTime')) || 30,
                        transitionTime: parseInt(window.localStorage.getItem('transitionTime')) || 5,
                        randomizationOption: (window.localStorage.getItem('randomizationOption')  === "true") || true,
                        workoutLength: parseInt(window.localStorage.getItem('workoutLength')) || 15,
                        audioOption: (window.localStorage.getItem('audioOption')  === "true") || true,
                        warningAudio: true,
                        countdownBeep: true,
                        autoPlay: true,
                        countdownStyle: true,
                        welcomeAudio: true,
                        autoStart: true,
                        restStatus: true,
                        sunSalutation: 8,
                        fullSequence: 21,
                        runnerYoga: 15
                        });
    localforage.setItem('timingSevenSettings', {
                        customSetSeven: true,
                        breakFreqSeven: 0,
                        exerciseTimeSeven: 30,
                        breakTimeSeven: 0,
                        transitionTimeSeven: 10,
                        randomizationOptionSeven: false,
                        workoutLengthSeven: 7
                        });

    localforage.setItem('userSettings', {
                        weight: parseInt(window.localStorage.getItem('weight')) || 150,
                        weightType: parseInt(window.localStorage.getItem('weightType')) || 0,
                        kiipRewards: (window.localStorage.getItem('kiipRewards')  === "true"),
                        mPoints: false,
                        mfpStatus: (window.localStorage.getItem('mfpStatus') === "true"),
                        myFitnessReady: (window.localStorage.getItem('myFitnessReady') === "true"),
                        mfpWeight: (window.localStorage.getItem('mfpWeight')  === "true"),
                        mfpAccessToken: window.localStorage.getItem('mfpAccessToken') || false,
                        mfpRefreshToken: window.localStorage.getItem('mfpRefreshToken') || false,
                        videosDownloaded: false,
                        downloadDecision: true,
                        healthKit: false,
                        lastlength: 5,
                        timerTaps: 0,
                        showNext: true,
                        showAudioTip: true
                        });
    localforage.setItem('userGoals', {
                        dailyGoal: parseInt(window.localStorage.getItem('dailyGoal')) || 15,
                        weeklyGoal: parseInt(window.localStorage.getItem('weeklyGoal')) || 75
                        });
    localforage.setItem('userProgress', {
                        monthlyTotal: 0,
                        weeklyTotal: parseInt(window.localStorage.getItem('weeklyTotal')) || 0,
                        dailyTotal: 0,
                        totalCalories: 0,
                        totalProgress: 0,
                        day: 0,
                        week: parseInt(window.localStorage.getItem('week')) || 0
                        });
    localforage.setItem('customWorkouts', {
                        savedWorkouts: savedWorkoutsUnstring
                        });
    localforage.setItem('reminder',{daily: {status:false,time:7,minutes:0}, inactivity: {frequency: 2, status:false,time:7,minutes:0}});
    localforage.setItem('ratingStatus', false);
    localforage.setItem('ratingCategory', {show:false,past:false,shareCount:0,sharePast:false});
    localforage.setItem('remindHome', {show:false,past:false});
    localforage.setItem('new310Home', true);
    localforage.setItem('userLanguages', PersonalData.GetLanguageSettings);
    //Callback for last item includes loadStoredData()
    localforage.setItem('currentCustomArray', {
                        workoutArray: currentCustomWorkout
                        });
    window.localStorage.setItem('refreshUpdated',true);
}

function migrateData($rootScope, $translate, $timeout, AppSyncService, FirebaseService, WorkoutService, RetirementService){
    if (window.localStorage.getItem('dataMigrated') === null && FirebaseService.authData && true) {
      $timeout(function(){
        //WorkoutService.unlockForCreateUserAccount()
        //                .then(WorkoutService.downloadUnlockedExercises);
        window.localStorage.setItem('dataMigrated',true);
      }, 2500)
    }
    if (window.localStorage.getItem('dataMigrated') === null && localforage.driver() == localforage.LOCALSTORAGE && true) {
        console.log('migrating data');
        window.migrationData = openDatabase('localforage', '1', 'localforage',4980736 );
        window.migrationData.transaction(
          function(tx) {
            tx.executeSql("SELECT * FROM keyvaluepairs WHERE key = ?", ['customWorkouts'],
             function(txs, result){
             localforage.getItem('customWorkouts', function(resultWorkouts){
                                 resultWorkouts.savedWorkouts = resultWorkouts.savedWorkouts.concat(JSON.parse(result.rows.item(0).value).savedWorkouts);
                                 localforage.setItem('customWorkouts', resultWorkouts).then(function(){
                                  loadStoredData($translate, AppSyncService, FirebaseService);
                                 });
                                 })
             },
             function(txs, err){console.log("customWorkout error", err)})
             loadStoredData($translate, AppSyncService, FirebaseService, RetirementService);
          }
        );
        window.localStorage.setItem('dataMigrated',true);
    } else {
        console.log('data migration not needed');
        loadStoredData($translate, AppSyncService, FirebaseService, RetirementService);
        window.localStorage.setItem('dataMigrated',true);    
    }
}

function loadStoredData($translate, AppSyncService, FirebaseService, RetirementService){
    localforage.getItem('new310Home', function (result){
      if (result == null){
        localforage.setItem('new310Home', false);
        globalNew310Option = true;
      } else{
         globalNew310Option = result;
      }
    });
    localforage.getItem('ratingCategory', function (result){
      if (result == null){
        localforage.setItem('ratingCategory', {show:false,past:false,shareCount:0,sharePast:false});
        window.localStorage.setItem('timesUsed',1);
      } else{
         globalRateOption = result.show;
         if (result.shareCount){
          globalShareOption = result.shareCount;
          } else {
           globalShareOption = 0;
          }
        }
    });
    localforage.getItem('remindHome', function (result){
      if (result == null){
        localforage.setItem('remindHome', {show:false,past:false});
      } else{
         globalRemindOption = result.show;
      }
    });
    localforage.getItem('timingSettings', function (result){
      if (result == null){
        localforage.setItem('timingSettings', TimingData.GetTimingSettings);
      } else {
        if (result.welcomeAudio == null){
          result.welcomeAudio = true;
        }
        if (result.autoStart == null){
          result.autoStart = true;
        }
        if (result.restStatus == null){
          if (result.breakFreq == 0 || result.breakTime == 0){
            result.restStatus = false;
          } else {
            result.restStatus = true;
          }
        }
        if (result.sunSalutation == null) {
          result.sunSalutation = 8;
          result.fullSequence = 21;
          result.runnerYoga = 15;
          localforage.setItem('timingSettings', result);
        }
        TimingData.GetTimingSettings = result;
      }
      });
    localforage.getItem('timingSevenSettings', function(result){
      if (result == null){
        localforage.setItem('timingSevenSettings', TimingData.GetSevenMinuteSettings);
      } else{
         TimingData.GetSevenMinuteSettings = result
      }
     });
    localforage.getItem('reminder', function(result){
      if (result == null){
        localforage.setItem('reminder',{daily: {status:false,time:7,minutes:0}, inactivity: {frequency: 2, status:false,time:7,minutes:0}});
      } else{
        LocalData.SetReminder = result;
        checkForNotification();
                            if (LocalData.SetReminder.inactivity.status){
                            window.plugin.notification.local.cancel(2);
                            var nDate = new Date();
                            nDate.setHours(LocalData.SetReminder.inactivity.time);
                            nDate.setMinutes(LocalData.SetReminder.inactivity.minutes);
                            nDate.setSeconds(0);
                            nDate.setDate(nDate.getDate() + LocalData.SetReminder.inactivity.frequency);
                            setTimeout( function (){window.plugin.notification.local.add({
                                                                                         id:         2,
                                                                                         date:       nDate,    // This expects a date object
                                                                                         message:    "It's been too long. Time to Swork Out.",  // The message that is displayed
                                                                                         title:      'Workout Reminder',  // The title of the message
                                                                                         autoCancel: true,
                                                                                         icon: 'ic_launcher',
                                                                                         smallIcon: 'ic_launcher_small'
                                                                                         });console.log('inactivity notification set for: ' + JSON.stringify(nDate))}, 4000);
        } if(LocalData.SetReminder.daily.status){
            setupNotificationDaily();
        }
      }   
    });
    localforage.getItem('userLanguages', function (result){
      if (result == null){
        localforage.setItem('userLanguages', PersonalData.GetLanguageSettings);
      } else if (result.HI == null){
        PersonalData.GetLanguageSettings = result;
        PersonalData.GetLanguageSettings.HI = false;
        PersonalData.GetLanguageSettings.JA = false;
        PersonalData.GetLanguageSettings.ZH = false;
        PersonalData.GetLanguageSettings.KO = false;
        if (result.TR == null){
          PersonalData.GetLanguageSettings.TR = false;
        }
      } else{
         PersonalData.GetLanguageSettings = result;
      }
    });
    localforage.getItem('userSettings', function (result){
      if (result == null){
        PersonalData.GetUserSettings.preferredLanguage = "EN";
        localforage.setItem('userSettings', PersonalData.GetUserSettings);
      } else{
        if (result.healthKit == null){
          result.healthKit = false; 
        }
        if (result.lastLength == null){
          result.lastLength = 5;
        }
        if (result.timerTaps == null){
          result.timerTaps = 0;
        } 
        if (result.showNext == null){
          result.showNext = true;
        }
        if (result.showAudioTip == null){
          result.showAudioTip = true;
        } 
        if (result.preferredLanguage == null){
          result.preferredLanguage = 'EN';
          if (navigator.globalization) {
            navigator.globalization.getPreferredLanguage(
              function(resultLang){
               var returnLang = 'ES';
               var twoLetterISO = resultLang.value.substring(0,2).toUpperCase();
               if (twoLetterISO == 'ES' && resultLang.value.length > 2){
                returnLang = 'ESLA';
               } else if (twoLetterISO == 'DE' || twoLetterISO == 'RU' || twoLetterISO == 'TR' || twoLetterISO == 'FR' || twoLetterISO == 'PT' || twoLetterISO == 'IT' || twoLetterISO == 'ES' || twoLetterISO == 'HI' || twoLetterISO == 'JA' || twoLetterISO == 'ZH' || twoLetterISO == 'KO'){
                returnLang = twoLetterISO.toUpperCase();
               }
               result.preferredLanguage = returnLang;
               $translate.use(returnLang);
               PersonalData.GetUserSettings = result;
               localforage.setItem('userSettings', PersonalData.GetUserSettings);
               if (returnLang !== 'EN'){
                downloadAllExerciseAudio(returnLang);
               }
                  RetirementService.checkProRetirement();
               }, 
              function(error){
                $translate.use('EN');
                PersonalData.GetUserSettings = result;
                localforage.setItem('userSettings', PersonalData.GetUserSettings);
                  RetirementService.checkProRetirement();
              }
            );
          } else {
            $translate.use('EN');
            PersonalData.GetUserSettings = result;
            localforage.setItem('userSettings', PersonalData.GetUserSettings);
              RetirementService.checkProRetirement();
          }
        } else {
          PersonalData.GetUserSettings = result;
          $translate.use(result.preferredLanguage);
          RetirementService.checkProRetirement();
          if (!PersonalData.GetLanguageSettings[PersonalData.GetUserSettings.preferredLanguage]){
            downloadAllExerciseAudio(PersonalData.GetUserSettings.preferredLanguage);
          }
        }
      }
    });
    localforage.getItem('userGoals', function (result){
      if (result == null){
        localforage.setItem('userGoals', PersonalData.GetUserGoals);
      } else{
         PersonalData.GetUserGoals = result;
      }
    });
    localforage.getItem('userProgress', function (result){
      if (result == null){
        localforage.setItem('userProgress', PersonalData.GetUserProgress);
      } else{
         PersonalData.GetUserProgress = result;
      }
    });
    localforage.getItem('customWorkouts', function (result){
      if (result == null){
        localforage.setItem('customWorkouts', PersonalData.GetCustomWorkouts);
      } else{
         PersonalData.GetCustomWorkouts = result;
      } 
      if (PersonalData.GetCustomWorkouts.savedWorkouts == undefined){
        PersonalData.GetCustomWorkouts.savedWorkouts = PersonalData.GetCustomWorkouts;
      }
    });
    localforage.getItem('currentCustomArray', function (result){
      if (result == null){
        localforage.setItem('currentCustomArray', PersonalData.GetWorkoutArray);
      } else{
         PersonalData.GetWorkoutArray = result;
      }
    });
    localforage.getItem('ratingStatus', function (result){
      if (result == null){
        localforage.setItem('ratingStatus', false);
      }
    });
    localforage.getItem('externalStorage', function (result){
      if (result == null){
        localforage.setItem('externalStorage', false);
      } else{
         globalExternal = result;
      }
    });
    localforage.getItem('backgroundAudio', function (result){
      if (result == null){
        localforage.setItem('backgroundAudio', PersonalData.GetAudioSettings);
      } else{
         PersonalData.GetAudioSettings = result;
      }
      if (device){
        LowLatencyAudio.turnOffAudioDuck(PersonalData.GetAudioSettings.duckOnce.toString());       
      }
    });
    localforage.getItem('googleFitStatus', function (result){
      if (result == null){
        localforage.setItem('googleFitStatus', PersonalData.GetGoogleFit);
      } else{
         PersonalData.GetGoogleFit = result;
      }
    });
    localforage.getItem('userProfile', function (result){
      var dateNow = new Date();
      var timeNow = dateNow.getTime();
      if (result == null){
        PersonalData.GetUserProfile.lastLogin = timeNow;
        localforage.setItem('userProfile', PersonalData.GetUserProfile);
      }
      else{
        result.lastLogin = timeNow;
        PersonalData.GetUserProfile = result;
      }
    });
    if (ionic.Platform.isAndroid()){
      localforage.getItem('androidVideoReset', function (result){
        if (result == null){
          localforage.setItem('androidVideoReset', true);
          TimingData.GetTimingSettings.autoPlay = true;
          setTimeout(function(){
            localforage.setItem('timingSettings', TimingData.GetTimingSettings);
          },1000)
          videoDownloader.deleteVideos();
        }
      });      
    }
    var timesUsedVar = parseInt(window.localStorage.getItem('timesUsed'));
    timesUsedVar++;
    window.localStorage.setItem('timesUsed', (timesUsedVar));

    // Timeout helps ensure normal loadStoredData has completed
    setTimeout(function(){
      if (FirebaseService.authData){
        AppSyncService.syncStoredData();
        AppSyncService.syncLocalForageCustomWorkouts();
        AppSyncService.syncWebSqlWorkoutLog();
      }
    }, 1500)

}

function setupExtraData($http){
    var c = new Date();
    var thisWeek = c.getWeek();
    var testWeek = window.localStorage.getItem('week');
    if (thisWeek != testWeek){
        window.localStorage.setItem('weeklyTotal', 0);
        window.localStorage.setItem('week', thisWeek);
        if (PersonalData.GetUserSettings.mfpWeight){
            getMFPWeight($http);
        } else if (PersonalData.GetUserSettings.healthKit){
          window.plugins.healthkit.readWeight({
                                                'requestWritePermission': false,
                                                'unit': 'lb'
                                                },
                                                function(msg){
                                                  if (!isNaN(msg)){
                                                    PersonalData.GetUserSettings.weight = msg;
                                                  }
                                                },
                                                function(){}
                                                );
        }
    }
    window.backendVersion = 1;
    window.myObj = {};
}

function setupDatabase(){
    window.db=false;
    window.db = openDatabase('SworkitDB', '1.0', 'SworkitDB',1048576);

    window.db.transaction(function(tx){
                          tx.executeSql( 'CREATE TABLE IF NOT EXISTS Sworkit(sworkit_id INTEGER NOT NULL PRIMARY KEY, created_on DATE DEFAULT NULL, minutes_completed INTEGER NOT NULL,calories INTEGER NOT NULL, type TEXT NOT NULL, utc_created DATE DEFAULT NULL, exercise_list TEXT NOT NULL DEFAULT "", sync_id TEXT DEFAULT NULL, sync_lastUpdated INTEGER DEFAULT NULL, device_type TEXT NOT NULL DEFAULT "", connected_apps TEXT NOT NULL DEFAULT "", heart_rate TEXT NOT NULL DEFAULT "")', [],window.nullHandler,window.errorHandler);},window.errorHandler,window.successCallBack);

    window.errorHandler = function(transaction, error) {
        console.log('DB Error: ' + error.message + ' code: ' + error.code);
    }
    window.successCallBack = function() {
        //alert("DEBUGGING: success");
        console.log('Data Test - Database success' );
    }
    window.nullHandler = function(){
        //console.log('Data Test - Database null' );
    };
    window.db.transaction(function(tx){
      tx.executeSql( 'SELECT utc_created from Sworkit', [], window.nullHandler,addColumn);},window.nullHandler,window.successCallBack);
    window.db.transaction(function(tx){
      tx.executeSql( 'SELECT exercise_list from Sworkit', [], window.nullHandler,addExerciseColumn);},window.nullHandler,window.successCallBack);

    window.db.transaction(function(tx){
      tx.executeSql( 'SELECT sync_id from Sworkit', [], window.nullHandler,addSyncColumns);},window.nullHandler,window.successCallBack);
    window.db.transaction(function(tx){
      tx.executeSql( 'SELECT heart_rate from Sworkit', [], window.nullHandler,addMetadataColumns);},window.nullHandler,window.successCallBack);

}

var sessionmAvailable = true;
function initializeSessionM($rootScope){
    //Sworkit Pro
    $rootScope.sessionMAvailable = true;
    if (ionic.Platform.isAndroid()){
      sessionm.phonegap.startSession('60227b54c5346c2e6a6f909ba15472e6afc744d2');
    } else{
      sessionm.phonegap.startSession('77a229c578f0ad342e6eff11e49ec7ed6c82ed53');
    }
    sessionm.phonegap.setAutoPresentMode(true);
    
    setTimeout(function(){
        if (PersonalData.GetUserSettings.mPoints){
          logActionSessionM('visit');
          sessionm.phonegap.getUnclaimedAchievementCount(function callback(data) {
            $rootScope.showPointsBadge = (data.unclaimedAchievementCount > 0) ? true : false;
            $rootScope.mPointsTotal = data.unclaimedAchievementCount;
          });
        }
    }, 5000);
    sessionm.phonegap.listenFailures(function(data) {
      //two variables because we prefer not to use $rootScope but it is necessary for menu
      sessionmAvailable = false;
      $rootScope.sessionMAvailable = false;
    });
}
function setWelcomeAudio(){
  var timesUsedVar = parseInt(window.localStorage.getItem('timesUsed'));
  var basicAudioPath;
  if (welcomeLoaded){
    LowLatencyAudio.unload('welcome');
  }
  if (PersonalData.GetUserSettings.preferredLanguage == 'EN'){
    basicAudioPath = 'audio/' 
  } else {
    basicAudioPath = 'audio/' + PersonalData.GetUserSettings.preferredLanguage + '/';
  }
  if (timesUsedVar == 1){
    LowLatencyAudio.preloadAudio('welcome', basicAudioPath + 'welcome-start.mp3', 1);
    globalFirstOption = true;
  } else {
    LowLatencyAudio.preloadAudio('welcome', basicAudioPath + 'welcome-back.mp3', 1);
  }
  welcomeLoaded = true;
}
function logActionSessionM(activity){
    if (PersonalData.GetUserSettings.mPoints && device){
      sessionm.phonegap.logAction(activity);
    }
}
function initializeAnalytics(){
    analytics.startTrackerWithId('UA-38468920-2');
    analytics.trackView('/index.html');
}
function trackEvent(action, label, value){
  if (device){
    var platformCategory = (device.platform.toLowerCase() == 'ios') ? 'Sworkit Pro iOS' : 'Sworkit Pro Google'
    analytics.trackEvent(platformCategory, action, label, value);
  }
}
function addColumn(){
  window.db.transaction(function(transaction) {
                 transaction.executeSql('ALTER TABLE Sworkit ADD utc_created DATE DEFAULT NULL',[] , nullHandler,errorHandler);
                 });
}
function addExerciseColumn(){
  window.db.transaction(function(transaction) {
         transaction.executeSql('ALTER TABLE Sworkit ADD exercise_list TEXT NOT NULL DEFAULT ""',[] , nullHandler,errorHandler);
      });
}
function addSyncColumns(){
  window.db.transaction(function(transaction){
         transaction.executeSql( 'ALTER TABLE Sworkit ADD COLUMN sync_id TEXT DEFAULT NULL', [],window.nullHandler,window.errorHandler);},window.errorHandler,window.successCallBack);
  window.db.transaction(function(transaction){
         transaction.executeSql( 'ALTER TABLE Sworkit ADD COLUMN sync_lastUpdated INTEGER DEFAULT NULL', [],window.nullHandler,window.errorHandler);},window.errorHandler,window.successCallBack);
  window.db.transaction(function(transaction){
         transaction.executeSql( 'CREATE UNIQUE INDEX idx_sync_id ON Sworkit (sync_id)', [],window.nullHandler,window.errorHandler);},window.errorHandler,window.successCallBack);
}
function addMetadataColumns(){
  window.db.transaction(function(transaction) {
         transaction.executeSql('ALTER TABLE Sworkit ADD device_type TEXT NOT NULL DEFAULT ""',[] , nullHandler,errorHandler);});
  window.db.transaction(function(transaction) {
         transaction.executeSql('ALTER TABLE Sworkit ADD connected_apps TEXT NOT NULL DEFAULT ""',[] , nullHandler,errorHandler);});
  window.db.transaction(function(transaction) {
         transaction.executeSql('ALTER TABLE Sworkit ADD heart_rate TEXT NOT NULL DEFAULT ""',[] , nullHandler,errorHandler);});
}
window.downloadableWorkouts = [];
function getDownloadableWorkouts($http, caller, type){
    $http.get('http://sworkitapi.herokuapp.com/workouts?q=featured').then(function(resp){
                                                                    localforage.setItem('downloadableWorkouts', resp.data);
                                                                    window.downloadableWorkouts = resp.data;
                                                                    if (caller){
                                                                      showNotification('Custom workout list updated', 'button-balanced', 1500);
                                                                    }
                                                                    getPopularWorkouts($http, caller, type);
                                                                    }, function(err) {
                                                                      localforage.getItem('downloadableWorkouts', function(result){
                                                                        if (result === null){
                                                                          localforage.setItem('downloadableWorkouts', []);
                                                                        } else {
                                                                          window.downloadableWorkouts = result;
                                                                        }
                                                                      })
                                                                      if (caller){
                                                                      showNotification('Unable to connect. Please try again.', 'button-assertive', 2500);
                                                                      }
                                                                    })
}
window.popularWorkouts = [];
function getPopularWorkouts($http, caller, type){
    $http.get('http://sworkitapi.herokuapp.com/workouts?q=popular').then(function(resp){
                                                                    localforage.setItem('popularWorkouts', resp.data);
                                                                    window.popularWorkouts = resp.data;
                                                                    if (type == 'popular'){
                                                                      window.downloadableWorkouts = resp.data;
                                                                    }
                                                                      }, function(err) {
                                                                      localforage.getItem('popularWorkouts', function(result){
                                                                        if (result === null){
                                                                          localforage.setItem('popularWorkouts', []);
                                                                        } else {
                                                                          window.popularWorkouts = result;
                                                                        }
                                                                      })
                                                                    })
}

function getMFPWeight($http, $scope){
    var d = new Date();
    var dateString = d.getFullYear() + "-" + (d.getMonth() +1) + "-" + d.getDate();
    var actionString = "get_weight";
    var accessString = PersonalData.GetUserSettings.mfpAccessToken;
    var appID = "79656b6e6f6d";
    var unitType = 'US';
    //console.log('MFP Weight Sync time: ' + dateString);
    var dataPost = JSON.stringify({'action' : actionString, 'access_token' : accessString,'entry_date' : dateString, 'units' : unitType, 'app_id': appID});
    $http({
          method: 'POST',
          url: 'https://www.myfitnesspal.com/client_api/json/1.0.0?client_id=sworkit',
          data: dataPost,
          headers: {'Content-Type': 'application/json'}
          }).then(function(resp){
                  PersonalData.GetUserSettings.mfpWeight = resp.data['updated_at'] || false;
                  PersonalData.GetUserSettings.weight = resp.data['weight'] || 150;
                  persistMultipleObjects({
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
                  if ($scope){
                  $scope.mfpWeightStatus.date = resp.data['updated_at'];
                  $scope.mfpWeightStatus.data = true;
                  $scope.convertWeight();
                  }
                  }, function(err) {
                  if ($scope){
                  showNotification('Could not retreive weight.', 'button-assertive', 2000);
                  }
                  })
}

var deparam = function (querystring) {
    // remove any preceding url and split
    querystring = querystring.substring(querystring.indexOf('?')+1).split('&');
    var params = {}, pair, d = decodeURIComponent, i;
    // march and parse
    for (i = querystring.length; i > 0;) {
        pair = querystring[--i].split('=');
        params[d(pair[0])] = d(pair[1]);
    }
    
    return params;
};//--  fn  deparam

function createDateAsUTC(date){
    var now = new Date();
    var now_utc = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
    return now_utc;
}

function js_yyyy_mm_dd_hh_mm_ss() {
    var todayLocal = new Date();
    now = createDateAsUTC(todayLocal);
    year = "" + now.getFullYear();
    month = "" + (now.getMonth() + 1); if (month.length == 1) { month = "0" + month; }
    day = "" + now.getDate(); if (day.length == 1) { day = "0" + day; }
    hour = "" + now.getHours(); if (hour.length == 1) { hour = "0" + hour; }
    minute = "" + now.getMinutes(); if (minute.length == 1) { minute = "0" + minute; }
    second = "" + now.getSeconds(); if (second.length == 1) { second = "0" + second; }
    return year + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second;
}

function checkForNotification(){
    if (device){
      window.plugin.notification.local.onclick = function (id, state, json) {
          if (id == 1 || id == "1"){
              setTimeout(setupNotificationDaily(), 4000);
          }
      }
    }
}
function setupNotificationDaily(){
    window.plugin.notification.local.cancel(1);
    var nDate = new Date();
    var tDate = new Date();
    nDate.setHours(LocalData.SetReminder.daily.time);
    nDate.setMinutes(LocalData.SetReminder.daily.minutes);
    nDate.setSeconds(0);
    if (tDate.getHours() <= nDate.getHours() && tDate.getMinutes() <= nDate.getMinutes()){
        nDate.setDate(nDate.getDate() + 1);
    }
    setTimeout( function (){window.plugin.notification.local.add({
                                                                 id:         1,
                                                                 date:       nDate,    // This expects a date object
                                                                 message:    "Time to Swork Out. Bring it on.",  // The message that is displayed
                                                                 title:      'Workout Reminder',  // The title of the message
                                                                 repeat:     'daily',
                                                                 autoCancel: true,
                                                                 icon: 'ic_launcher',
                                                                 smallIcon: 'ic_launcher_small'
                                                                 });console.log('daily notification set for: ' + JSON.stringify(nDate));}, 4000);
}

function mergeAlternating(array1, array2) {
    var mergedArray = [];

    for (var i = 0, len = Math.max(array1.length, array2.length); i < len; i++) {
        if (i < array1.length) {
            mergedArray.push(array1[i]);
        }
        if (i < array2.length) {
            mergedArray.push(array2[i]);
        }
    }
    return mergedArray;
}

Date.prototype.getWeek = function(){
    var day_miliseconds = 86400000,
    onejan = new Date(this.getFullYear(),0,1,0,0,0),
    onejan_day = (onejan.getDay()==0) ? 7 : onejan.getDay(),
    days_for_next_monday = (8-onejan_day),
    onejan_next_monday_time = onejan.getTime() + (days_for_next_monday * day_miliseconds),
    first_monday_year_time = (onejan_day>1) ? onejan_next_monday_time : onejan.getTime(),
    this_date = new Date(this.getFullYear(), this.getMonth(),this.getDate(),0,0,0),// This at 00:00:00
    this_time = this_date.getTime(),
    days_from_first_monday = Math.round(((this_time - first_monday_year_time) / day_miliseconds));
    
    var first_monday_year = new Date(first_monday_year_time);
    
    return (days_from_first_monday>=0 && days_from_first_monday<364) ? Math.ceil((days_from_first_monday+1)/7) : 52;
}

function getExercisesList(categoryName){var arr = [];
         for(var exercise in exerciseObject) {
         if (exerciseObject[exercise].category == categoryName){
         arr.push(exerciseObject[exercise])
         }
         }
         arr.sort(function(a, b) {
                  var textA = a.name.toUpperCase();
                  var textB = b.name.toUpperCase();
                  return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
                  });
         return arr;}
var downloadStore;
var errorDownloads = [];
var stillErrors = [];
var totalVideosInstalled = 0;
var downloadableCategories = ['upper','core', 'lower', 'stretch', 'back', 'cardio', 'pilates', 'yoga'];
var assetURL = "http://m.sworkit.com.s3.amazonaws.com/assets/exercises/Videos/";
var videoDownloader = {
  updateVideos: function(videoCategory) {
    this.remoteVideos = videoCategory;
    this.downloadVideos();
  },

  updateErrorVideos: function(videoCategory) {
    this.remoteVideos = videoCategory;
    this.retryErrors();
  },

  downloadVideos: function() {
    var _this = this; // for use in the callbacks

    // stop if we've processed all of the videos
    if (this.remoteVideos.length === 0) {
      videoDownloader.updateErrorVideos(errorDownloads);
      return;
    }

    // get the next video from the array
    var videoObject = this.remoteVideos.shift();
    var videoName = videoObject.video;
    // console.log(encodeURI(assetURL + videoName));
    // console.log(encodeURI(downloadStore + videoName));
    window.resolveLocalFileSystemURL(downloadStore + videoName, function(){
      totalVideosInstalled++;
      if (_this.remoteVideos.length === 0) {
          _this.downloadVideos();
        }
    }, function(){
      var fileTransfer = new FileTransfer();
      fileTransfer.download(encodeURI(assetURL + videoName), downloadStore + videoName, 
      function(entry) {
        //console.log("Downloaded: " + videoName);
        if (_this.remoteVideos.length === 0) {
          totalVideosInstalled++;
          _this.downloadVideos();
        }
      }, 
      function(err) {
        console.log("Error downloading: " + videoName);
        errorDownloads.push(videoObject);
        if (_this.remoteVideos.length === 0) {
          _this.downloadVideos();
        }
      }, true);
    });
    if (_this.remoteVideos.length !== 0){
      var videoObject2 = this.remoteVideos.shift();
      var videoName2 = videoObject2.video;
      // console.log(encodeURI(assetURL + videoName2));
      // console.log(encodeURI(downloadStore + videoName2));
      window.resolveLocalFileSystemURL(downloadStore + videoName2, function(){totalVideosInstalled++;_this.downloadVideos()}, function(){
        var fileTransfer = new FileTransfer();
        fileTransfer.download(encodeURI(assetURL + videoName2), downloadStore + videoName2, 
        function(entry) {
          console.log("Downloaded: " + videoName2);
          totalVideosInstalled++;
          _this.downloadVideos();
        }, 
        function(err) {
          console.log("Error downloading: " + videoName2);
          errorDownloads.push(videoObject2);
          _this.downloadVideos();
        }, true);
      });
    }
    
  }, 

  deleteVideos: function(){
    if (globalExternal){
      downloadStore = cordova.file.externalDataDirectory;
    } else{
      downloadStore = cordova.file.dataDirectory;
    }
    window.resolveLocalFileSystemURL(downloadStore, function(entry){
    function success(entries) {
        var i;
        for (i=0; i<entries.length; i++) {
            entries[i].remove();
        }
    }

    function fail(error) {
        alert("Failed to list directory contents: " + error.code);
    }

    // Get a directory reader
    var directoryReader = entry.createReader();

    // Get a list of all the entries in the directory
    directoryReader.readEntries(success,fail);

    }, function(){console.log('Failed to find directory to delete from.')})
  },

  listVideos: function(){
    if (globalExternal){
      downloadStore = cordova.file.externalDataDirectory;
    } else{
      downloadStore = cordova.file.dataDirectory;
    }
    window.resolveLocalFileSystemURL(downloadStore, function(entry){
    function success(entries) {
        var i;
        for (i=0; i<entries.length; i++) {
            console.log(entries[i].name);
        }
    }

    function fail(error) {
        alert("Failed to list directory contents: " + error.code);
    }

    // Get a directory reader
    var directoryReader = entry.createReader();

    // Get a list of all the entries in the directory
    directoryReader.readEntries(success,fail);

    }, function(){console.log('Failed to find directory to delete from.')})
  },

  countVideos: function(){
    if (globalExternal){
      downloadStore = cordova.file.externalDataDirectory;
    } else{
      downloadStore = cordova.file.dataDirectory;
    }
    window.resolveLocalFileSystemURL(downloadStore, function(entry){
    function success(entries) {
        var i;
        var downloadCount = 0;
        for (i=0; i<entries.length; i++) {
            downloadCount++;
            if (i == entries.length-1){
              totalVideosInstalled = downloadCount;
              if (downloadCount > 165){
                PersonalData.GetUserSettings.videosDownloaded = true;
                localforage.setItem('userSettings', PersonalData.GetUserSettings);
              }
            }
        }
    }

    function fail(error) {
        alert("Failed to list directory contents: " + error.code);
    }

    // Get a directory reader
    var directoryReader = entry.createReader();

    // Get a list of all the entries in the directory
    directoryReader.readEntries(success,fail);

    }, function(){console.log('Failed to find directory to delete from.')})
  },

  retryErrors: function() {
    var _this = this; // for use in the callbacks

    // stop if we've processed all of the videos
    if (this.remoteVideos.length === 0) {
      console.log(this.remoteVideos);
      checkTotalDownloads();
      //downloadableCategories.shift();
      if (stillErrors.length > 0){
        console.log('Unable to Download all videos. Please try to finish them later.');
        stillErrors = [];
      } else if (downloadableCategories.length > 0) {
        //videoDownloader.updateVideos(getExercisesList(downloadableCategories[0]));
      }
      return;
    }
    
    // get the next video from the array
    var videoObject3 = this.remoteVideos.shift();
    var videoName3 = videoObject3.video;
    // console.log(encodeURI(assetURL + videoName3));
    // console.log(encodeURI(downloadStore + videoName3));
    window.resolveLocalFileSystemURL(downloadStore + videoName3, function(){_this.downloadVideos()}, function(){
      var fileTransfer = new FileTransfer();
      fileTransfer.download(encodeURI(assetURL + videoName3), downloadStore + videoName3, 
      function(entry) {
        console.log("Downloaded: " + videoName3);
        totalVideosInstalled++;
        _this.retryErrors();
      }, 
      function(err) {
        console.log("Error downloading: " + videoName3);
        stillErrors.push(videoObject3);
        _this.retryErrors();
      }, true);
    });
    
  }
}

function cloneObject(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}

function downloadAllExercise(){
  if (cordova.file.externalRootDirectory !== null){
    downloadStore = cordova.file.externalDataDirectory;
    localforage.setItem('externalStorage', true);
    globalExternal = true;
  } else{
    downloadStore = cordova.file.dataDirectory;
    localforage.setItem('externalStorage', false);
    globalExternal = false;
  }
  totalVideosInstalled = 0;
  var getUpper = cloneObject(videoDownloader);
  var getCore = cloneObject(videoDownloader);
  var getLower = cloneObject(videoDownloader);
  var getStretch = cloneObject(videoDownloader);
  var getBack = cloneObject(videoDownloader);
  var getYoga = cloneObject(videoDownloader);
  var getPilates = cloneObject(videoDownloader);
  var getCardio = cloneObject(videoDownloader);
  var getExtras = cloneObject(videoDownloader);
  getUpper.updateVideos(getExercisesList('upper'));
  getCore.updateVideos(getExercisesList('core'));
  getLower.updateVideos(getExercisesList('lower'));
  getYoga.updateVideos(getExercisesList('yoga'));
  getPilates.updateVideos(getExercisesList('pilates'));
  getCardio.updateVideos(getExercisesList('cardio'));
  getStretch.updateVideos(getExercisesList('stretch'));
  getBack.updateVideos(getExercisesList('back'));
  getExtras.updateVideos([{"name":"Break","image":"restbreak.jpg","youtube":"rN6ATi7fujU","switchOption":false,"video":"Break.mp4","category":false}]);
}
 
function checkTotalDownloads(){
  videoDownloader.countVideos();
  return totalVideosInstalled;
}

function downloadProgress(currentLanguage){
  var timeoutMax = 100000;
  var timeoutCount = 0;
  var notifyEl = angular.element(document.getElementById('status-notification'));
  var downExercise = translations[currentLanguage]['DOWN_EXERCISE'];
  var downMessage = translations[currentLanguage]['DOWN_COMPLETE'];
  var ofMessage = translations[currentLanguage]['OF'];
  var downRetry = translations[currentLanguage]['DOWN_RETRY'];
  var progressInterval = setInterval(function($translate){
      notifyEl.html('<div style="background-color:#2B2B2B;height:45px;width:100%;position:absolute;bottom:0px"><p style="margin-bottom:0px;color:#24CC92;font-size:14px;padding-top:11px;text-align:center;">'+downExercise+' ' + totalVideosInstalled + ' '+ ofMessage + ' 166</p><div style="height:4px;background-color:#24CC92;position: absolute;bottom: 0px;width:' + ((totalVideosInstalled/166)*100)+ '%"></div></div>"');
      if (totalVideosInstalled > 165){
        notifyEl.html('<button class="button button-full button-calm fade-out-custom">'+downMessage+'</button>');
        PersonalData.GetUserSettings.videosDownloaded = true;
        TimingData.GetTimingSettings.autoPlay = true;
        setTimeout(function(){notifyEl.html('')}, 1500);
        clearInterval(progressInterval);
      }
      timeoutCount = timeoutCount + 1500;
      if (timeoutCount > timeoutMax){

        navigator.notification.confirm(
              translations[currentLanguage]['DOWN_LONGER'],
               function(buttonIndex){
                if (buttonIndex == 2){
                  timeoutMax = timeoutMax + 150000;
                  downloadProgress(currentLanguage);
                  downloadAllExercise();
                } else {
                  notifyEl.html('<button class="button button-full button-assertive">'+downRetry+'</button>');
                  setTimeout(function(){notifyEl.html('')}, 2000);
                }
               },
              translations[currentLanguage]['DOWN_PROGRESS'],
              [translations[currentLanguage]['TRY_LATER'],translations[currentLanguage]['CONT_DOWN']]
            );
        clearInterval(progressInterval);
      }
    }, 1500);
}

var audioDownloadStore;
var audioErrorDownloads = [];
var audioStillErrors = [];
var totalAudioInstalled = 0;
var audioAssetURL = "http://m.sworkit.com.s3.amazonaws.com/assets/exercises/Audio/";
var languageSelected = '';

var audioDownloader = {
  updateAudio: function(audioCategory) {
    this.remoteAudio = audioCategory;
    this.downloadAudio();
  },

  updateErrorAudio: function(audioCategory) {
    this.remoteAudio = audioCategory;
    this.retryErrors();
  },

  downloadAudio: function() {
    var _this = this; // for use in the callbacks

    // stop if we've processed all of the audio
    if (this.remoteAudio.length === 0) {
      audioDownloader.updateErrorAudio(errorDownloads);
      return;
    }

    // get the next audio from the array
    var audioObject = this.remoteAudio.shift();
    var audioName = audioObject.audio;
    // console.log(encodeURI(audioAssetURL + audioName));
    // console.log(encodeURI(audioDownloadStore + audioName));
    window.resolveLocalFileSystemURL(audioDownloadStore + audioName, function(){
      totalAudioInstalled++;
      if (_this.remoteAudio.length === 0) {
          _this.downloadAudio();
        }
    }, function(){
      var fileTransfer = new FileTransfer();
      fileTransfer.download(encodeURI(audioAssetURL + audioName), audioDownloadStore + audioName, 
      function(entry) {
        //console.log("Downloaded: " + audioDownloadStore + audioName);
        if (_this.remoteAudio.length === 0) {
          totalAudioInstalled++;
          _this.downloadAudio();
        }
      }, 
      function(err) {
        console.log("Error downloading 1: " + audioName);
        audioErrorDownloads.push(audioObject);
        if (_this.remoteAudio.length === 0) {
          _this.downloadAudio();
        }
      }, true);
    });
    if (_this.remoteAudio.length !== 0){
      var audioObject2 = this.remoteAudio.shift();
      var audioName2 = audioObject2.audio;
      // console.log(encodeURI(audioAssetURL + audioName2));
      // console.log(encodeURI(audioDownloadStore + audioName2));
      window.resolveLocalFileSystemURL(audioDownloadStore + audioName2, function(){totalAudioInstalled++;_this.downloadAudio()}, function(){
        var fileTransfer = new FileTransfer();
        fileTransfer.download(encodeURI(audioAssetURL + audioName2), audioDownloadStore + audioName2, 
        function(entry) {
          console.log("Downloaded: " + audioName2);
          totalAudioInstalled++;
          _this.downloadAudio();
        }, 
        function(err) {
          console.log("Error downloading 2: " + audioName2);
          audioErrorDownloads.push(audioObject2);
          _this.downloadAudio();
        }, true);
      });
    }
    
  }, 

  deleteAudio: function(){
    audioDownloadStore = cordova.file.dataDirectory + languageSelected + '/';
    window.resolveLocalFileSystemURL(audioDownloadStore, function(entry){
    function success(entries) {
        var i;
        for (i=0; i<entries.length; i++) {
            console.log(entries[i].remove());
        }
    }

    function fail(error) {
        alert("Failed to list directory contents: " + error.code);
    }

    // Get a directory reader
    var directoryReader = entry.createReader();

    // Get a list of all the entries in the directory
    directoryReader.readEntries(success,fail);

    }, function(){console.log('Failed to find directory to delete from.')})
  },

  listAudio: function(){
    audioDownloadStore = cordova.file.dataDirectory + languageSelected + '/';
    window.resolveLocalFileSystemURL(audioDownloadStore, function(entry){
    function success(entries) {
        var i;
        for (i=0; i<entries.length; i++) {
            console.log(entries[i].name);
        }
    }

    function fail(error) {
        alert("Failed to list directory contents: " + error.code);
    }

    // Get a directory reader
    var directoryReader = entry.createReader();

    // Get a list of all the entries in the directory
    directoryReader.readEntries(success,fail);

    }, function(){console.log('Failed to find directory to delete from.')})
  },

  countAudio: function(langSent){
    audioDownloadStore = cordova.file.dataDirectory + langSent + '/';
    window.resolveLocalFileSystemURL(audioDownloadStore, function(entry){
    function success(entries) {
        var i;
        var downloadCount = 0;
        for (i=0; i<entries.length; i++) {
            downloadCount++;
            if (i == entries.length-1){
              totalAudioInstalled = downloadCount;
              if (downloadCount > 165){
                PersonalData.GetLanguageSettings = {
                  EN: true,
                  DE: false,
                  FR: false,
                  ES: false,
                  ESLA: false,
                  IT: false,
                  PT: false,
                  HI: false,
                  JA: false,
                  ZH: false,
                  KO: false,
                  RU: false,
                  TR: false
                }
                PersonalData.GetLanguageSettings[langSent] = true;
                localforage.setItem('userLanguages', PersonalData.GetLanguageSettings);
              }
            }
        }
    }

    function fail(error) {
        alert("Failed to list directory contents: " + error.code);
    }

    // Get a directory reader
    var directoryReader = entry.createReader();

    // Get a list of all the entries in the directory
    directoryReader.readEntries(success,fail);

    }, function(){console.log('Failed to find directory to count from.')})
  },

  retryErrors: function() {
    var _this = this; // for use in the callbacks

    // stop if we've processed all of the audio
    if (this.remoteAudio.length === 0) {
      checkTotalAudioDownloads(languageSelected);
      //downloadableCategories.shift();
      if (audioErrorDownloads.length > 0){
        console.log('Unable to Download all audio. Please try to finish them later.');
        audioErrorDownloads = [];
      } else if (downloadableCategories.length > 0) {
        //audioDownloader.updateAudio(getExercisesList(downloadableCategories[0]));
      }
      return;
    }
    
    // get the next audio from the array
    var audioObject3 = this.remoteAudio.shift();
    var audioName3 = audioObject3.audio;
    // console.log(encodeURI(audioAssetURL + audioName3));
    // console.log(encodeURI(audioDownloadStore + audioName3));
    window.resolveLocalFileSystemURL(audioDownloadStore + audioName3, function(){_this.downloadAudio()}, function(){
      var fileTransfer = new FileTransfer();
      fileTransfer.download(encodeURI(audioAssetURL + audioName3), audioDownloadStore + audioName3, 
      function(entry) {
        //console.log("Downloaded: " +audioName3);
        totalAudioInstalled++;
        _this.retryErrors();
      }, 
      function(err) {
        console.log("Error downloading 3: " + audioName3);
        audioStillErrors.push(audioObject3);
        _this.retryErrors();
      }, true);
    });
    
  }
}

function checkTotalAudioDownloads(useLang){
  audioDownloader.countAudio(useLang);
  setTimeout(function(){
    return totalAudioInstalled;
  },1000)
}

function downloadAllExerciseAudio(language){
  console.log("global downloadAllExerciseAudio()");
  languageSelected = language;
  audioAssetURL = "http://m.sworkit.com.s3.amazonaws.com/assets/exercises/Audio/" + languageSelected + '/';
  audioDownloadStore = cordova.file.dataDirectory + language + '/';
  totalAudioInstalled = 0;
  var getUpper = cloneObject(audioDownloader);
  var getCore = cloneObject(audioDownloader);
  var getLower = cloneObject(audioDownloader);
  var getStretch = cloneObject(audioDownloader);
  var getBack = cloneObject(audioDownloader);
  var getYoga = cloneObject(audioDownloader);
  var getPilates = cloneObject(audioDownloader);
  var getCardio = cloneObject(audioDownloader);
  var getExtras = cloneObject(audioDownloader);
  getUpper.updateAudio(getExercisesList('upper'));
  getCore.updateAudio(getExercisesList('core'));
  getLower.updateAudio(getExercisesList('lower'));
  getYoga.updateAudio(getExercisesList('yoga'));
  getPilates.updateAudio(getExercisesList('pilates'));
  getCardio.updateAudio(getExercisesList('cardio'));
  getStretch.updateAudio(getExercisesList('stretch'));
  getBack.updateAudio(getExercisesList('back'));
  getExtras.updateAudio([{"name":"Half","audio":"Half.mp3","category":false}]);
}

function convertImgToBase64URL(url, callback, outputFormat){
    var img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = function(){
        var canvas = document.createElement('CANVAS'),
        ctx = canvas.getContext('2d'), dataURL;
        canvas.height = this.height;
        canvas.width = this.width;
        ctx.drawImage(this, 0, 0);
        dataURL = canvas.toDataURL(outputFormat);
        callback(dataURL);
        canvas = null; 
    };
    img.src = url;
}

function onResume() {
  console.log('On Resume');
  var currentLocation = window.location.hash.slice(-7);
  if (currentLocation == "workout"){
    playInlineVideo(TimingData.GetTimingSettings.autoPlay);
  }
}
function onResumeIOS(){
    LowLatencyAudio.turnOffAudioDuck(PersonalData.GetAudioSettings.duckOnce.toString());
    var currentLocation = window.location.hash.slice(-7);
}
function onPause() {
  console.log('On Pause');
}
function lockOrientation() {
  if (ionic.Platform.isAndroid()){
    return false;
  } else if (ionic.Platform.isIOS() && !ionic.Platform.isIPad()){
    return true;
  } else {
    return false;
  }
}
function isAmazon(){
  var amazonDefault = false;
  var amazonDefaultReplaced = "%%IS_AMAZON%%";
  if (amazonDefaultReplaced.indexOf("%%") === -1) {
    amazonDefault = true;
  }
  return amazonDefault;
}
function isMobiroo(){
  return false;
}
function isSamsung(){
  return false;
}
function isKindle(){
  if(isAmazon()){
    var dModel = device.model;
    if (dModel == 'KFOT' || dModel == 'KFTT' || dModel == 'KFJWI' || dModel == 'KFJWA' || dModel == 'KFSOWI' || dModel == 'KFTHWI' || dModel == 'KFTHWA' || dModel == 'KFAPWI' || dModel == 'KFAPWA' || dModel == 'KFARWI' || dModel == 'KFASWI' || dModel == 'KFSAWI' || dModel == 'KFSAWA' || dModel == 'SD4930UR' || dModel == 'KFMEWI' || dModel == 'KFFOWI' || dModel == 'KFTBWI' || dModel == 'KFJWA'){
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
}