'use strict';

angular.module("dywos.services")
	.service('OAuth2Factory', function($rootScope, $http, $base64, $q) {

	var postData;
	var error = false;
	var base64;

	this.loginOAuth2 = function(username, password)
	{
		console.log("LOGOIN OAUTH2 START");
		var deferred = $q.defer();
		var access_token;
		// Fetch the post data
		postData = generateData(username, password);
		error = false;

		base64 = $base64.encode(username);
		//
		// Request the temporary token
		//
		//$http.defaults.headers.common['Authorization'] = 'Bearer ' + base64;

		var step1 = loginStep1();
		

		step1.then(
				function(resolve)
				{
        			//console.log("STEP 1 " + resolve);
        			var step2 = loginStep2();
					step2.then(
						function(resolve)
						{
        					//console.log("STEP 2 " +resolve);
        					var step3 = loginStep3();
							step3.then(
									function(resolve)
									{
					        			//console.log("STEP 3 " + resolve);
					        			resolve.client_id = base64;
					        			deferred.resolve(resolve);
					        		}, function(reject){
					        			deferred.reject("");
					    			}
					    	);
        				}, function(reject){
        					deferred.reject("");   
    					}
    				);
        		}, function(reject){
        			deferred.reject("");
    			}
    	);

	    return deferred.promise;
	};
	
	function loginStep1(username, password)
	{	
		var deferred = $q.defer();

		$http(
			{
				method: "JSONP",
				url: "https://dywos.com/api/mets?callback=JSON_CALLBACK",
    			params: postData,
    			headers:
    			{
    				'Authorization': 'Bearer ' + base64
    			},
    			timeout : 10000
    		}
		).success(function(data, status, headers, config) {
    		console.log("DOLOGIN STEP 1 SUCCESS");
			// Decode the JSON response
			postData.oauth_code = data.oauth_code;
			postData.oauth_response_type = 'authorise';
			deferred.resolve(postData);
		}).error(function(data, status, headers, config) {
    		console.log("DOLOGIN  STEP 1 ERROR");
    		deferred.reject(data);
		});

		return deferred.promise;
	}
	
	function loginStep2()
	{	
		var deferred = $q.defer();
		
		$http(
			{
				method: "JSONP",
				url: "https://dywos.com/api/mets?callback=JSON_CALLBACK",
    			params: postData,
    			headers:
    			{
    				'Authorization': 'Bearer ' + base64
    			},
    			timeout : 10000
	    	}
		).success(function(data, status, headers, config) {
    		console.log("DOLOGIN STEP 2 SUCCESS");
			// Decode the JSON response
			postData.oauth_code = data.oauth_code;
			postData.oauth_response_type = 'token';
			deferred.resolve(postData);
		}).error(function(data, status, headers, config) {
    		console.log("DOLOGIN  STEP 2 ERROR");
    		deferred.reject(data);
		});
		return deferred.promise;
	}

	function loginStep3()
	{	
		var deferred = $q.defer();
		$http(
			{
				method: "JSONP",
				url: "https://dywos.com/api/mets?callback=JSON_CALLBACK",
    			params: postData,
    			headers:
    			{
    				'Authorization': 'Bearer ' + base64
    			},
    			timeout : 10000
	    	}
		).success(function(data, status, headers, config) {
    		console.log("DOLOGIN STEP 3 SUCCESS");
			// Decode the JSON response
			deferred.resolve(data);
		}).error(function(data, status, headers, config) {
    		console.log("DOLOGIN  STEP 3 ERROR");
    		deferred.reject(data);
		});
		return deferred.promise;
	}

	function generateRandomKey(length, special) 
	{
		var iteration = 0;
		var randomKey = "";
		var randomNumber;
		if(special == undefined)
		{
			var special = false;
		}
		while(iteration < length)
		{
			randomNumber = (Math.floor((Math.random() * 100)) % 94) + 33;
			if(!special)
			{
				if ((randomNumber >=33) && (randomNumber <=47)) 
				{ 
					continue; 
				}
				if ((randomNumber >=58) && (randomNumber <=64)) 
				{ 
					continue; 
				}
				if ((randomNumber >=91) && (randomNumber <=96)) 
				{ 
					continue; 
				}
				if ((randomNumber >=123) && (randomNumber <=126)) 
				{ 
					continue; 
				}
			}
			iteration++;
			randomKey += String.fromCharCode(randomNumber);
		}
		return randomKey;
	};

	function generateData(username, password) 
	{
		// Get the values from html input's
		var random_key = generateRandomKey(36);

		// Encode the data to send
		var user_encode = $base64.encode(username +':'+ random_key);
		var pass_encode = $base64.encode(generateRandomKey(36)) +':'+ $base64.encode(password+':'+ random_key);

		// Prepare the return object
		var postData = {};
		postData.oauth_client_id = user_encode;
		postData.oauth_client_secret = $base64.encode(pass_encode);
		postData.oauth_response_type = 'temporary';
		postData.oauth_signature_method = 'PLAINTEXT';

		return postData;
	}

	
});
