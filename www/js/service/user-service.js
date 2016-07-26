'use strict';

angular.module("dywos.services")
	.service('UserServices', function ($resource)
{
    return $resource('https://dywos.com/api/mets::action/', { action: '@action', oauth_access_token: '@access_token',  oauth_client_id: '@client_id'},
	{
    	get: {
		}
	})
});
