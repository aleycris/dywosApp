angular.module('starter.services').factory('RetirementService', function ($rootScope, $http, $ionicModal, FirebaseService, $q, $log) {

    return {
        checkProRetirement: function () {
            var $scope = $rootScope.$new();
            var textLangauge = PersonalData.GetUserSettings.preferredLanguage || 'EN';
            var fireUID = FirebaseService.authData ? FirebaseService.authDatauid || false : false;
            var checkProStatus = PersonalData.GetUserProfile.proAccess || null;
            var proURL = 'http://sworkitads.herokuapp.com/pro?lang=' + textLangauge + '&uid=' + fireUID + '&proAccess=' + checkProStatus;
            $http.get(proURL).then(function (resp) {
                if (resp.data.isProRetired) {

                    localforage.getItem('dontAskRetirement', function (result){
                        if (result == null){

                            $ionicModal.fromTemplateUrl('templates/modals/pro-retirement.html', {
                                scope: $scope,
                                animation: 'slide-in-up'
                            }).then(function(modal) {
                                $scope.androidPlatform = ionic.Platform.isAndroid();
                                $scope.pro_retirement_modal = modal;
                                $scope.pro_retirement_modal.show();
                                $scope.hideRetirementModal = function() {
                                    $scope.pro_retirement_modal.hide();
                                }
                                $scope.retirementText = resp.data;
                                $scope.userHasAccount = fireUID || false;
                                $scope.launchFAQ = function() {
                                    window.open('http://sworkit.com/support#retirement', '_blank', 'location=yes,AllowInlineMediaPlayback=yes,toolbarposition=top');
                                }
                                $scope.downloadSworkit = function() {
                                    $scope.hideRetirementModal();
                                    if (device.platform.toLowerCase() == 'ios') {
                                        window.open('http://itunes.apple.com/app/id527219710', '_system', 'location=no,AllowInlineMediaPlayback=yes');
                                    } else if (isAmazon()){
                                        window.appAvailability.check('com.amazon.venezia', function() {
                                                window.open('amzn://apps/android?p=sworkitapp.sworkit.com', '_system')},function(){
                                                window.open(encodeURI("http://www.amazon.com/gp/mas/dl/android?p=sworkitapp.sworkit.com"), '_system');}
                                        );
                                    } else if (isMobiroo()){
                                        window.open('mma://app/157a5c50-1599-445e-985b-b8a9ba24e64a', '_system');
                                    } else {
                                        window.open('market://details?id=sworkitapp.sworkit.com', '_system');
                                    }
                                }
                                $scope.dontAskAgain = function() {
                                    localforage.setItem('dontAskRetirement', true);
                                    $scope.hideRetirementModal();
                                }
                            });

                        }
                    })

                }
            }, function (err) {
                $log.debug('checkProRetirement failed', err);
            })
        }
    }

});

