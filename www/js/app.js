console.log(">>> RELOAD >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");

angular.module('dywos.filters', []);
angular.module('dywos.directives', []);
angular.module('dywos.controllers', ['dywos.services']);
angular.module('dywos.services', ['ngResource', 'base64']);
angular.module('dywos.schemas', ['validation', 'validation.rule','validation.schema']);

angular.module('dywos', 
                ['ngCordova', 
                'ngAria',
                'ionic.contrib.drawer',
                'ionic', 
                'dywos.directives', 
                'dywos.controllers', 
                'dywos.services',
                'dywos.schemas',
                'nvd3ChartDirectives',
                'ngCookies', 
                'pascalprecht.translate',
                'angular-progress-arc', 
                'AutoFontSize', 
                'underscore',
                'ngIOS9UIWebViewPatch'])

.run(function($ionicPlatform,  $log) 
{
  $ionicPlatform.ready(function() 
  {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) 
    {
      //cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) 
    {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
})

.config(function($stateProvider, $urlRouterProvider) 
{
  $stateProvider
    
    .state('app', 
    {
        url: "/app",
        abstract: true,
        templateUrl: "templates/menu.html",
        controller: 'AppCtrl'
    })
    .state('app.login', 
    {
      url: "/login",
      views: 
      {
        'menuContent' :
        {
          templateUrl: "templates/login/login.html",
          controller: 'LoginCtrl'
        }
      }
    })
    .state('app.signup', 
    {
      url: '/auth/signup',
        views: 
        {
          'menuContent' :
          {
            templateUrl: "templates/login/signup.html",
            controller: 'SignUpCtrl'
          }
        }
    })
    .state('app.home', 
    {
      url: "/home",
      views: 
      {
        'menuContent' :
        {
          templateUrl: "templates/home.html",
          controller: 'LoginCtrl'
        }
      }
    })

/*
    .state('app.workout-category', {
      url: "/home/:categoryId",
      views: {
        'menuContent' :{
          templateUrl: "templates/category.html",
          controller: 'WorkoutCategoryCtrl'
        }
      }
    })

    .state('app.workout-custom', {
      url: "/custom",
      views: {
        'menuContent' :{
          templateUrl: "templates/custom.html",
          controller: 'WorkoutCustomCtrl'
        }
      }
    })

    .state('app.workout-custom2', {
      url: "/custom/featured",
      views: {
        'menuContent' :{
          templateUrl: "templates/custom2.html",
          controller: 'WorkoutCustom2Ctrl'
        }
      }
    })

    .state('app.workout-length', {
      url: "/home/:categoryId/:typeId",
      views: {
        'menuContent' :{
          templateUrl: "templates/time.html",
          controller: 'WorkoutTimeCtrl'
        }
      }
    })

    .state('app.workout', {
      url: "/home/:categoryId/:typeId/:timeId/workout",
      views: {
        'menuContent' :{
          cache:false,
          templateUrl: "templates/workout.html",
          controller: 'WorkoutCtrl'
        }
      }
    })

    .state('app.progress', {
      url: "/progress",
      views: {
        'menuContent' :{
          templateUrl: "templates/progress.html",
          controller: 'ProgressCtrl'
        }
      }
    })

    .state('app.log', {
      url: "/auth/log",
      views: {
        'menuContent' :{
          templateUrl: "templates/logs.html",
          controller: 'LogCtrl'
        }
      }
    })

    .state('app.settings', {
      url: "/settings",
      views: {
        'menuContent' :{
          templateUrl: "templates/settings.html",
          controller: "SettingsCtrl"
        }
      }
    })

    .state('app.settings-audio', {
      url: "/settings/audio",
      views: {
        'menuContent' :{
          templateUrl: "templates/settings-audio.html",
          controller: "SettingsAudioCtrl"
        }
      }
    })

    .state('app.rewards', {
      url: "/rewards",
      views: {
        'menuContent' :{
          templateUrl: "templates/rewards.html",
          controller: "RewardsCtrl"
        }
      }
    })

    .state('app.reminders', {
      url: "/reminders",
      views: {
        'menuContent' :{
          templateUrl: "templates/reminders.html",
          controller: "RemindersCtrl"
        }
      }
    })

    .state('app.exercises', {
      url: "/exercises",
      views: {
        'menuContent' :{
          templateUrl: "templates/exercises.html",
          controller: "ExerciseListCtrl"
        }
      }
    })

    .state('app.apps', {
      url: "/apps",
      views: {
        'menuContent' :{
          templateUrl: "templates/apps.html",
          controller: "PartnerAppsCtrl"
        }
      }
    })

    .state('app.nexercise', {
      url: "/nexercise",
      views: {
        'menuContent' :{
          templateUrl: "templates/nexercise.html",
          controller: "NexerciseAppCtrl"
        }
      }
    })

    .state('app.help', {
      url: "/help",
      views: {
        'menuContent' :{
          templateUrl: "templates/help.html",
          controller: "HelpCtrl"
        }
      }
    })

  .state('app.auth', {
    url: "/auth",
      views: {
        'menuContent' :{
          templateUrl: "templates/login/auth.html"
        }
      }
  })

  .state('app.welcome', {
    url: '/auth/welcome',
      views: {
        'menuContent' :{
          templateUrl: "templates/login/welcome.html",
          controller: 'WelcomeCtrl'
        }
      }
  })

  .state('app.login', {
    url: '/auth/login',
      views: {
        'menuContent' :{
          templateUrl: "templates/login/login.html",
          controller: 'LoginCtrl'
        }
      }
  })

 

  .state('app.extra-info', {
    url: '/auth/extra-info',
      views: {
        'menuContent' :{
          templateUrl: "templates/login/extra-info.html",
          controller: 'ExtraInfoCtrl'
        }
      }
  })

  .state('app.extra-info-goals', {
    url: '/auth/extra-info-goals',
      views: {
        'menuContent' :{
          templateUrl: "templates/login/extra-info-goals.html",
          controller: 'ExtraInfoGoalsCtrl'
        }
      }
  })

  .state('app.forgot-password', {
    url: '/auth/forgot-password',
      views: {
        'menuContent' :{
          templateUrl: "templates/login/forgot-password.html",
          controller: 'ForgotPasswordCtrl'
        }
      }
  })

  .state('app.profile', {
    url: '/auth/profile',
      views: {
        'menuContent' :{
          templateUrl: "templates/login/profile.html",
          controller: 'ProfileCtrl'
        }
      }
  })
*/
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/login');
})

.config(function($ionicConfigProvider) 
{
  $ionicConfigProvider.views.swipeBackEnabled(false);
  $ionicConfigProvider.backButton.previousTitleText(false).text(' ').icon('ion-ios-arrow-left');
  $ionicConfigProvider.views.transition('platform');
  $ionicConfigProvider.navBar.alignTitle('platform');
  $ionicConfigProvider.views.maxCache(1);
})

.config(function($stateProvider, $urlRouterProvider, $translateProvider) 
{
  for(lang in translations)
  {
    $translateProvider.translations(lang, translations[lang]);
  }
  if (window.localStorage['NG_TRANSLATE_LANG_KEY'] == undefined || !window.localStorage['NG_TRANSLATE_LANG_KEY'])
  {
    var useLang = 'ES';
    var nav = window.navigator, browserLanguagePropertyKeys = [
          'language',
          'browserLanguage',
          'systemLanguage',
          'userLanguage'
        ], i, language;
      if (angular.isArray(nav.languages)) 
      {
        for (i = 0; i < nav.languages.length; i++) 
        {
          language = nav.languages[i];
          if (language && language.length) 
          {
            useLang = language;
          }
        }
      }
      for (i = 0; i < browserLanguagePropertyKeys.length; i++) 
      {
        language = nav[browserLanguagePropertyKeys[i]];
        if (language && language.length) 
        {
          useLang = language;
        }
      }

    var firstLang = 'ES';
    var twoLetterISO = useLang.substring(0,2).toUpperCase();
    if (twoLetterISO == 'ES' && useLang.length > 2)
    {
      firstLang = 'ESLA';
    } 
    else if (twoLetterISO == 'PT' || twoLetterISO == 'ES' || twoLetterISO == 'EN')
    {
      firstLang = twoLetterISO;
    }

    $translateProvider.preferredLanguage(firstLang);
    $translateProvider.useLocalStorage();
  } 
  else
  {
    $translateProvider.preferredLanguage('ESLA');
    $translateProvider.useLocalStorage();
  }
})

.config(function ($provide) 
{
    $provide.decorator("$exceptionHandler", function ($delegate) 
    {
        return function (exception, cause) 
        {
            $delegate(exception, cause);
            var platformCategory = ionic.Platform.isAndroid() ? 'Sworkit Pro Google' : 'Sworkit Pro iOS';
            //var jsMessage = exception.message + " - " + exception.stack + ' - ' +  PersonalData.GetUserSettings.preferredLanguage;
            if (ionic.Platform.isWebView())
            {
              analytics.trackEvent(platformCategory, "AngularJS Error", jsMessage, 0);
            }
        };
    });
});



angular.module("dywos.controllers")
  .controller('AppCtrl', function($rootScope,$scope,$ionicModal,$ionicSlideBoxDelegate,$translate, $timeout,$location,$stateParams) 
  {
    $scope.clickHome = function()
    {
      var tempURL = $location.$$url.substring(0,9);
      if (tempURL == '#/app/cust') 
      {
        $location.path('/app/custom');
      }
      else if (tempURL !== '/app/home')
      {
        $location.path('/app/home');
      }
    }
    $scope.isItemActive = function(shortUrl) 
    {
      var tempURL = '/app/' + shortUrl;
      return (tempURL == $location.$$path.substring(0,9));
    };
    $scope.showWelcome = function()
    {
      $ionicModal.fromTemplateUrl('welcome.html', function(modal) 
      {
        $scope.welcomeModal = modal;
      }, 
      {
        scope:$scope,
        animation: 'slide-in-up',
        focusFirstInput: false,
        backdropClickToClose: false
      });
      
      $scope.slideChanged = function(index) 
      {
        $scope.slideIndex = index;
      };
      
      $scope.next = function() 
      {
        $ionicSlideBoxDelegate.next();
      };
      
      $scope.previous = function() 
      {
        $ionicSlideBoxDelegate.previous();
      };
    
      $scope.closeOpenNexercise = function()
      {
        $scope.closeModal();
      }
    
      $scope.openModal = function() 
      {
        $scope.welcomeModal.show();
      };
    
      $scope.closeModal = function() 
      {
        $scope.welcomeModal.hide();
      };
      
      $scope.$on('$ionicView.leave', function() 
      {
        $scope.welcomeModal.remove();
      });

      $timeout(function()
      {
        $scope.openModal();
      }, 0);
  }

  $scope.launchStore = function()
  {
    window.open('http://www.ntensify.com/sworkit', '_blank', 'location=yes,AllowInlineMediaPlayback=yes,toolbarposition=top');
  }
});