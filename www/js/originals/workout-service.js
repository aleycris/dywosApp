// window.resolveLocalFileSystemURL(cordova.file.dataDirectory + 'exercises/audio/en/push-upandclap2.mp3', function(result){console.log('Found', result.remove())}, function(){console.log('Missing')});

//window.resolveLocalFileSystemURL(cordova.file.dataDirectory + 'exercises/audio/en/vbalance2.mp3',
//    function (resultFound) {
//      console.log("resolveLocalFileSystemURL() > Found", resultFound);
//    }, function (resultMissing) {
//      console.log("resolveLocalFileSystemURL() > Missing", resultMissing);
//    }
//);

angular.module('starter.services').factory('WorkoutService', function ($ionicPlatform, $cordovaFile, $cordovaFileTransfer, $timeout, $ionicLoading, $q, $log) {

  const _LF_UNLOCKED_EXERCISES_KEY = 'unlockedExercises';

  var _getBundledExercises = function () {
    return exerciseObject;
  };

  var _getUnlockedExercises = function () {
    return localforage.getItem(_LF_UNLOCKED_EXERCISES_KEY)
        .then(function (lfValue) {
          //$log.debug("lfValue for '" + _LF_UNLOCKED_EXERCISES_KEY + "'", lfValue);
          if (lfValue) {
            Object.keys(lfValue).forEach(function (key) {
              lfValue[key].unlocked = true;
            });
          }
          return lfValue;
        })
        .catch(function (reject) {
          $log.warn("_getUserExercises() > catch()", reject);
        });
  };

  var _getUserExercises = function () {
    $log.info("_getUserExercises()");
    return _getUnlockedExercises()
        .then(function (unlockedExercisesReadyToPlay) {
          $log.debug("unlockedExercisesReadyToPlay", unlockedExercisesReadyToPlay);

          // Before Fixer
          //return unlockedExercisesReadyToPlay ? angular.extend({}, _getBundledExercises(), unlockedExercisesReadyToPlay) : _getBundledExercises();

          // After Fixer: This should remove unlocked exercises that are not fully downloaded
          var readyUnlockedExercises = {};
          var readyCheckPromises = [];
          _.each(unlockedExercisesReadyToPlay, function (unlockedExercise, key) {
            //$log.debug("unlockedExercise key", key);
            unlockedExercise.associativeKey = key;
            //$log.debug("unlockedExercise", unlockedExercise);
            readyCheckPromises.push(_isExerciseCompletelyDownloaded(unlockedExercise));
          });
          return $q.all(readyCheckPromises)
              .then(function (resolvedValues) {
                //$log.debug("resolvedValues", resolvedValues); // []
                //$log.debug("resolvedValues.length", resolvedValues.length); // 55
                _.each(resolvedValues, function (resolvedValue) {
                  //$log.debug("resolvedValue", resolvedValue);
                  if (resolvedValue.found) {
                    readyUnlockedExercises[resolvedValue.exercise.associativeKey] = resolvedValue.exercise;
                  }
                });
                $log.info("readyUnlockedExercises (" + Object.keys(readyUnlockedExercises).length + ")", readyUnlockedExercises);
                var allBundledAndUnlockedReadyExercises = readyUnlockedExercises ? angular.extend({}, _getBundledExercises(), readyUnlockedExercises) : _getBundledExercises()
                //$log.debug(allBundledAndUnlockedReadyExercises);
                return allBundledAndUnlockedReadyExercises;
              });
        })
        .catch(function (reject) {
          $log.warn("_getUserExercises() > catch()", reject);
        });
  };

  //var _isFileReallyThere = window._isFileReallyThere = function (fullFilePath) {
  //  var checkFile2Deferred = $q.defer();
  //  window.resolveLocalFileSystemURL(fullFilePath,
  //      function (resultFound) {
  //        $log.debug("resolveLocalFileSystemURL() > Found", resultFound);
  //        resultFound.file(function (file) {
  //          var isFileWithContent = file.size > 0;
  //          if (isFileWithContent) {
  //            checkFile2Deferred.resolve(file);
  //          } else {
  //            checkFile2Deferred.reject(file);
  //          }
  //        });
  //      }, function (resultMissing) {
  //        $log.debug("resolveLocalFileSystemURL() > Missing", resultMissing);
  //        checkFile2Deferred.reject(resultMissing);
  //      }
  //  );
  //  return checkFile2Deferred.promise;
  //};

  var _downloadStateManager = {};

  var _setDownloadStart = function (exerciseName, localeFolder) {
    //$log.info("_setDownloadStart()");
    _downloadStateManager[exerciseName] = {
      keyframe_first: {isStarted: true},
      keyframe_middle: {isStarted: true},
      video: {isStarted: true},
      audio_en: {isStarted: true}
    };
    if (localeFolder && localeFolder !== 'en') {
      _downloadStateManager[exerciseName]['audio_' + localeFolder] = {isStarted: true};
    }
  };

  var _setDownloadComplete = function (exerciseName, downloadType) {
    $log.info("_setDownloadComplete()", _downloadStateManager[exerciseName]);
    _downloadStateManager[exerciseName][downloadType].isComplete = true;
  };

  var _isDownloadNotInProgress = window._isExerciseFullyDownloaded = function (exerciseName, localeFolder) {
    var deferred = $q.defer();
    //$log.info("_isDownloadNotInProgress()");
    var inProgress = false;
    if (_downloadStateManager[exerciseName]) {
      inProgress = (_downloadStateManager[exerciseName].keyframe_first.isStarted && !(_downloadStateManager[exerciseName].keyframe_first.isComplete))
      || (_downloadStateManager[exerciseName].keyframe_middle.isStarted && !(_downloadStateManager[exerciseName].keyframe_middle.isComplete))
      || (_downloadStateManager[exerciseName].video.isStarted && !(_downloadStateManager[exerciseName].video.isComplete))
      || (_downloadStateManager[exerciseName].audio_en.isStarted && !(_downloadStateManager[exerciseName].audio_en.isComplete))
      || (
        localeFolder && localeFolder !== 'en'
        && _downloadStateManager[exerciseName]['audio_' + localeFolder].isStarted
        && !(_downloadStateManager[exerciseName]['audio_' + localeFolder].isComplete)
      );
    }
    if (inProgress) {
      deferred.reject({inProgress: inProgress});
    } else {
      deferred.resolve({inProgress: inProgress});
    }
    return deferred.promise;
  };

  var _isExerciseCompletelyDownloaded = function (exercise) {
    //$log.info("_isExerciseCompletelyDownloaded()", exercise.name);
    var deviceBasePath;
    var exerciseFolderName = 'exercises/';
    var videoFolderName = 'video/';
    var videoFileName = exercise.video;
    var audioFolderName = 'audio/';
    var audioFileName = exercise.audio;
    var keyframeStartFolderName = 'keyframe-first/';
    var keyframeStartFileName = exercise.image;
    var keyframeMiddleFolderName = 'keyframe-middle/';
    var keyframeMiddleFileName = keyframeStartFileName;

    return $ionicPlatform.ready(function () {
      deviceBasePath = cordova.file.dataDirectory;
      //$log.debug("deviceBasePath", deviceBasePath);
    })
        .then(function () {
          var promises = [];
          var localeFolder = PersonalData.GetUserSettings.preferredLanguage.toLowerCase();
          var deviceVideoFolderPath = deviceBasePath + exerciseFolderName + videoFolderName;
          var deviceAudioFolderPath = deviceBasePath + exerciseFolderName + audioFolderName;
          var deviceKeyframeStartFolderPath = deviceBasePath + exerciseFolderName + keyframeStartFolderName;
          var deviceKeyframeMiddleFolderPath = deviceBasePath + exerciseFolderName + keyframeMiddleFolderName;

          promises.push(_isDownloadNotInProgress(exercise.name, localeFolder));

          promises.push($cordovaFile.checkFile(deviceKeyframeStartFolderPath, keyframeStartFileName));
          // TODO: Remove these if it proves unnecessary
          //promises.push(_isFileReallyThere(deviceKeyframeStartFolderPath + keyframeStartFileName));

          promises.push($cordovaFile.checkFile(deviceKeyframeMiddleFolderPath, keyframeMiddleFileName));
          //promises.push(_isFileReallyThere(deviceKeyframeMiddleFolderPath + keyframeMiddleFileName));

          promises.push($cordovaFile.checkFile(deviceVideoFolderPath, videoFileName));
          //promises.push(_isFileReallyThere(deviceVideoFolderPath + videoFileName));

          promises.push($cordovaFile.checkFile(deviceAudioFolderPath + 'en/', audioFileName));
          //promises.push(_isFileReallyThere(deviceAudioFolderPath + 'en/' + audioFileName));

          if (localeFolder !== 'en') {
            promises.push($cordovaFile.checkFile(deviceAudioFolderPath + localeFolder + '/', audioFileName));
            //promises.push(_isFileReallyThere(deviceAudioFolderPath + localeFolder + '/' + audioFileName));
          }

          var isFound = false;
          // TODO: I'm not sure if we need these returns from then() and catch() and finally(), but its working so leaving that for another day.
          return $q.all(promises)
              .then(function () {
                isFound = true;
                //$log.debug("_isExerciseCompletelyDownloaded > FOUND");
                return {found: isFound, exercise: exercise};
              })
              .catch(function (reject) {
                isFound = false;
                //$log.warn("_isExerciseCompletelyDownloaded() > MISSING");
                //$log.debug("reject", reject);
                return {found: isFound, exercise: exercise};
              })
              .finally(function () {
                return {found: isFound, exercise: exercise};
              });
        });
  };

  var _downloadExercise = function (exercise, isNewLocale) {
    //$log.info("_downloadExercise()");
    var sourceWebUrlFolder = 'http://m.sworkit.com.s3.amazonaws.com/assets/exercises/accounts/';
    var exerciseFolderName = 'exercises/';
    var platformSpecificVideoSourceFolder = '';
    var localeFolder = PersonalData.GetUserSettings.preferredLanguage.toLowerCase();
    _setDownloadStart(exercise.name, localeFolder);
    if (isNewLocale !== "newlocale") {
      if (ionic.Platform.isIOS()) {
        platformSpecificVideoSourceFolder = 'ios/';
      }
      else {
        platformSpecificVideoSourceFolder = 'android/';
      }
      _downloadFileToDevice(exercise.name, exercise.image, exerciseFolderName + 'keyframe-first/', sourceWebUrlFolder + 'first-frame/', 'keyframe_first');
      _downloadFileToDevice(exercise.name, exercise.image, exerciseFolderName + 'keyframe-middle/', sourceWebUrlFolder + 'middle-frame/', 'keyframe_middle');
      _downloadFileToDevice(exercise.name, exercise.video, exerciseFolderName + 'video/', sourceWebUrlFolder + platformSpecificVideoSourceFolder, 'video');
      _downloadFileToDevice(exercise.name, exercise.audio, exerciseFolderName + 'audio/en/', sourceWebUrlFolder + 'audio/en/', 'audio_en');
    }
    if (localeFolder !== 'en') {
      _downloadFileToDevice(exercise.name, exercise.audio, exerciseFolderName + 'audio/' + localeFolder + '/', sourceWebUrlFolder + 'audio/' + localeFolder + '/', 'audio_' + localeFolder);
    }
  };

  var _downloadFileToDevice = function (exerciseName, fileName, deviceFileFolderRelativePath, sourceWebUrlFolder, downloadType) {
    //$log.info("_downloadFileToDevice()", {
    //  fileName: fileName,
    //  deviceFileFolderRelativePath: deviceFileFolderRelativePath,
    //  sourceWebUrlFolder: sourceWebUrlFolder
    //});
    var deviceBasePath;
    $ionicPlatform.ready(function () {
      deviceBasePath = cordova.file.dataDirectory;
      //$log.debug("deviceBasePath", deviceBasePath);
    })
        .then(function () {
          //$log.debug("then() createDir() device folders", deviceFileFolderRelativePath);
          // NB: This can handle up to three folder levels, e.g., '.../exercise/audio/en/'
          var folderNames = deviceFileFolderRelativePath.split('/');
          folderNames.pop();
          //$log.debug("folderNames", folderNames);
          return $cordovaFile.createDir(deviceBasePath, folderNames[0], true)
              .then(function () {
                return $cordovaFile.createDir(deviceBasePath + folderNames[0] + '/', folderNames[1], true)
                    .then(function (firstDir) {
                      if (folderNames.length > 2) {
                        return $cordovaFile.createDir(deviceBasePath + folderNames[0] + '/' + folderNames[1] + '/', folderNames[2], true);
                      } else {
                        return firstDir;
                      }
                    });
              });
        })
        .then(function (fileDir) {
          //$log.debug("then() createFile() fileName", [fileName, fileDir]);
          var deviceFileFolderPath = deviceBasePath + deviceFileFolderRelativePath + '/';
          return $cordovaFile.createFile(deviceFileFolderPath, fileName, true);
        })
        .then(function (newFile) {
          //$log.debug("then() downloadFile() newFile", newFile);
          var sourceWebUrl = sourceWebUrlFolder + fileName;
          //$log.debug("sourceWebUrl", sourceWebUrl);
          // TODO: Try this without trustAllHosts as true
          return $cordovaFileTransfer.download(sourceWebUrl, newFile.nativeURL, null, true);
        })
        .then(function (result) {
          $log.debug("download file SUCCESS", result);
        }, function (err) {
          $log.error("download file ERROR");
          $log.error(err);
        }, function (progress) {
          // NB: Use with caution, if at all; Constant progress updates really slow down the download process
          //$log.info("Download PROGRESS: " + ((progress.loaded / progress.total) * 100).toFixed() + "%");
          //$log.info(progress);
          if (progress.loaded === progress.total) {
            $log.info("downloadType()", downloadType);
            _setDownloadComplete(exerciseName, downloadType);
          }
        });
  };

  var _lockForLogOutAccount = function () {
    localforage.removeItem(_LF_UNLOCKED_EXERCISES_KEY);
  }

  return {
    LF_EXERCISES_KEY: _LF_UNLOCKED_EXERCISES_KEY,

    getWorkoutsByCategories: function (categoryId) {
      return LocalData.GetWorkoutCategories[categoryId].workoutTypes;
    },
    getCategoryName: function (categoryId) {
      return LocalData.GetWorkoutCategories[categoryId].fullName;
    },
    getTypeName: function (typeId) {
      return LocalData.GetWorkoutTypes[typeId].activityNames;
    },
    getWorkoutsByType: function () {
      return LocalData.GetWorkoutTypes;
    },
    getTimingIntervals: function () {
      return TimingData.GetTimingSettings;
    },
    getSevenIntervals: function () {
      return TimingData.GetSevenMinuteSettings;
    },
    getExercisesByCategory: function (userExercises, categoryName) {
      var arr = [];
      for (var exercise in userExercises) {
        if (userExercises[exercise].category == categoryName) {
          arr.push(userExercises[exercise])
        }
      }
      arr.sort(function (a, b) {
        var textA = a.name.toUpperCase();
        var textB = b.name.toUpperCase();
        return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
      });
      return arr;
    },
    getUserExercises: _getUserExercises,
    lockForLogOutAccount: _lockForLogOutAccount,
    unlockForCreateUserAccount: function () {
      $log.info("unlockForCreateUserAccount()");
      return _getUnlockedExercises()
          .then(function (alreadyUnlockedExercises) {
            $log.debug("alreadyUnlockedExercises", alreadyUnlockedExercises);
            return angular.extend({}, alreadyUnlockedExercises, exerciseUnlockedObject);
          })
          .then(function (mergedExercises) {
            return localforage.setItem(_LF_UNLOCKED_EXERCISES_KEY, mergedExercises)
                .then(function (itemSet) {
                  $log.info("Unlock COMPLETE for " + Object.keys(itemSet).length + " exercises");
                  return true;
                });
          })
          .catch(function (reject) {
            $log.warn("unlockForCreateUserAccount() > catch()", reject);
          })
    },
    downloadUnlockedExercises: function (isNewLocale) {
      $log.info("downloadUnlockedExercises()");
      return _getUnlockedExercises()
          .then(function (unlockedExercises) {
            _.each(unlockedExercises, function (exercise) {
              // NB: This downloads only the single matching unlocked exercise,
              //     so that we can test behavior of player when one is ready and others are not.
              //if (exercise.name === "SNOWANGEL2") {
              $log.debug("exercise", exercise);
              if (isNewLocale === "newlocale") {
                return _downloadExercise(exercise, isNewLocale);
              } else {
                $ionicPlatform.ready()
                    .then(function () {
                      return _isExerciseCompletelyDownloaded(exercise);
                    })
                    .then(function (isAllDownloaded) {
                      //$log.debug("isAllDownloaded", isAllDownloaded);
                      if (!isAllDownloaded.found) {
                        $log.info("Need to download '" + exercise.name + "'");
                        return _downloadExercise(exercise);
                      } else {
                        $log.info("Already have '" + exercise.name + "'");
                      }
                    })
                    .catch(function (reject) {
                      $log.warn("downloadUnlockedExercises > catch()", reject);
                    });
              }
              //}
            });
          });
    },

    deleteAllDownloadedExercises: function () {
      $log.info("deleteAllDownloadedExercises()");
      var deviceBasePath;
      var exerciseFolderName = 'exercises';
      return $ionicPlatform.ready(function () {
        deviceBasePath = cordova.file.dataDirectory;
        $log.debug("deviceBasePath", deviceBasePath);
      })
          .then(function () {
            $log.debug("then() removeRecursively()", deviceBasePath + ' + ' + exerciseFolderName);
            return $cordovaFile.removeRecursively(deviceBasePath, exerciseFolderName)
                .then(function (success) {
                  $log.debug("Folder existed, and was deleted");
                  return true;
                }, function (error) {
                  if (error.code === 1) {
                    $log.debug("Folder did NOT exist");
                    return true;
                  } else {
                    $log.error("Error deleting folder '" + deviceBasePath + ' + ' + exerciseFolderName + "'", error);
                    return false;
                  }
                });
          })
          .catch(function (reject) {
            $log.warn("deleteAllDownloadedExercises() > catch()", reject);
          })
          .finally(function () {
            $log.info("Delete COMPLETE");
          });
    }
  }
});