// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0 


awsConfig = {
	region : "region", //AWS Region
	userPool : "UPID", //Cognito User Pool ID
	userPoolClientID : "UPClientID", //Cognito User Pool App Client ID
	tokenExpiration : 60, //Cognito User Pool App Client Token Expiration time in minutes
	identityPool : "IpoolID", //Cognito Identity Pool ID
	cognitoDomainName : "domainname", //Cognito User Pool App Integration Domain Name
	webPage : "https://URL/index.html" //Redirect URL after logged in
}

function logintoAWS() { //Para hacer login, llamar esta función, logoutAWS()
	AWS.config = {
		region: awsConfig.region
	};
	if (window.location.hash != "") useHash();
	else if (document.cookie) getAWScredentials(getCookie("idtoken"),getCookie("actoken"));
	else toLoginURL()
}

function getCookie(name) {
	var cookiename = name + "="
	var decodedCookie = decodeURIComponent(document.cookie);
	var ca = decodedCookie.split(';');
	for(var i = 0; i <ca.length; i++) {
		var c = ca[i];
		while (c.charAt(0) == ' ') c = c.substring(1);
		if (c.indexOf(cookiename) == 0) {
			return ( c.substring(cookiename.length, c.length) );
		}
	}
};

function useHash() {
	token = window.location.hash
	idtoken = token.substr(0,token.indexOf('&access')).replace('#id_token=','')
	actoken = token.substr(token.indexOf('&access') + 14).replace('&expires_in=' + (awsConfig.tokenExpiration*60).toString() + '&token_type=Bearer','')
	document.cookie = "idtoken=" + idtoken + "; expires=" + new Date(new Date().getTime() + 1000*60*awsConfig.tokenExpiration).toUTCString() + ";";
	document.cookie = "actoken=" + actoken + "; expires=" + new Date(new Date().getTime() + 1000*60*awsConfig.tokenExpiration).toUTCString() + ";";
	getAWScredentials(idtoken,actoken)
	window.location.hash = "";
};

function getAWScredentials(idtoken,actoken) {
	var someVar = "cognito-idp." + awsConfig.region + ".amazonaws.com/" + awsConfig.userPool
	AWS.config.credentials = new AWS.CognitoIdentityCredentials({
		IdentityPoolId: awsConfig.identityPool,
		Logins: {
			[someVar]: idtoken
		}
	})
	var cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();
	var params = {
		AccessToken: actoken
	};
	cognitoidentityserviceprovider.getUser(params, function(err, data) {
		if (err) toLoginURL();
		else {
			// username = data.Username
			// user attributes ----- 
			//for (i = 0; i < data.UserAttributes.length; i++) // 
			//	if (data.UserAttributes[i].Name == "attributetofind") attributevalue = data.UserAttributes[i].Value
		}
	});
};

function toLoginURL() {
	var loginURL = "https://" + awsConfig.cognitoDomainName + ".auth." + awsConfig.region + ".amazoncognito.com/login?client_id=" + awsConfig.userPoolClientID + "&response_type=token&scope=aws.cognito.signin.user.admin+openid&redirect_uri=" + awsConfig.webPage;
	window.location.replace(loginURL)
}

function logoutAWS() { //Para hacer logout, llamar esta función, logoutAWS()
	document.cookie = "idtoken=invalid; expires=" + new Date(new Date().getTime() - 1000*60*60*24).toUTCString() + ";";
	document.cookie = "actoken=invalid; expires=" + new Date(new Date().getTime() - 1000*60*60*24).toUTCString() + ";";
	var logoutURL = "https://" + awsConfig.cognitoDomainName + ".auth." + awsConfig.region + ".amazoncognito.com/logout?client_id=" + awsConfig.userPoolClientID + "&response_type=token&scope=aws.cognito.signin.user.admin+openid&redirect_uri=" + awsConfig.webPage;
	window.location.replace(logoutURL)
};

// On Your AWS Request calls, this following code is recommended to send to login page if credentials expire
// if (err) {
// 	if (err.code == "CredentialsError") toLoginURL()
// 	console.log(err.code, err.message)
// 	return
// }