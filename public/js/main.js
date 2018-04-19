app.controller("HomeControl",function($scope,$rootScope) {
	$rootScope.navItem="home";
	$rootScope.pageTitle="HarkerSG Home";
	$rootScope.tabName="HarkerSG Home";
});
app.controller("NFControl",function($rootScope) {
	$rootScope.navItem=null;
	$rootScope.pageTitle="404 Page Not Found";
	$rootScope.tabName="Page Not Found - HarkerSG";
});
app.controller("SettingsControl",function($rootScope,$scope,$mdToast) {
	$rootScope.navItem=null;
	$rootScope.pageTitle="User Settings";
	$rootScope.tabName="Settings - HarkerSG";
	var cookies=document.cookie.split("; ");
	for (var i=0; i<cookies.length; i++) {
		if (cookies[i].split("=")[0]=="dark")
			$scope.dark=cookies[i].split("=")[1]=="true";
		if (cookies[i].split("=")[0]=="primary")
			$scope.settings.primary=cookies[i].split("=")[1];
		if (cookies[i].split("=")[0]=="accent")
			$scope.settings.accent=cookies[i].split("=")[1];
	}
	$scope.darkTheme=function() {
		document.cookie="dark="+$scope.dark.toString()+"; expires=Fri, 31 Dec 9999 12:00:00 UTC";
		$mdToast.show(
			$mdToast.simple()
				.textContent("Refresh this page to see changes.")
				.hideDelay(5000)
				.action("Reload")
				.highlightAction(true)
				.position("top right")
		).then(function(response) {
			if (response=="ok")
				window.location.reload(false);
		});
	};
	$scope.setPrimary=function() {
		document.cookie="primary="+$scope.settings.primary.toString()+"; expires=Fri, 31 Dec 9999 12:00:00 UTC";
		fs.collection("users").doc($scope.uid).update({ "settings.primary": $scope.settings.primary });
		$mdToast.show(
			$mdToast.simple()
				.textContent("Refresh this page to see changes.")
				.hideDelay(5000)
				.action("Reload")
				.highlightAction(true)
				.position("top right")
		).then(function(response) {
			if (response=="ok")
				window.location.reload(false);
		});
	};
	$scope.setAccent=function() {
		document.cookie="accent="+$scope.settings.accent.toString()+"; expires=Fri, 31 Dec 9999 12:00:00 UTC";
		fs.collection("users").doc($scope.uid).update({ "settings.accent": $scope.settings.accent });
		$mdToast.show(
			$mdToast.simple()
				.textContent("Refresh this page to see changes.")
				.hideDelay(5000)
				.action("Reload")
				.highlightAction(true)
				.position("top right")
		).then(function(response) {
			if (response=="ok")
				window.location.reload(false);
		});
	};
});
app.controller("AboutControl",function($rootScope) {
	$rootScope.navItem="about";
	$rootScope.pageTitle="About / Changelog";
	$rootScope.tabName="About - HarkerSG";
});
app.controller("FeedbackControl",function($scope,$rootScope,$mdToast) {
	$rootScope.navItem="feedback";
	$rootScope.pageTitle="User Feedback";
	$rootScope.tabName="Feedback - HarkerSG";
	$scope.fb={
		type: "comment"
	};
	$scope.submit=function() {
		if ($scope.feedback.$valid) {
			fs.collection("feedback").add({
				type: $scope.fb.type,
				text: $scope.fb.text,
				user: fs.collection("users").doc($scope.uid)
			})
				.then(function(doc) {
					$mdToast.show(
						$mdToast.simple()
							.textContent("Successfully submitted feedback.")
							.hideDelay(4000)
							.action("OK")
							.highlightAction(true)
					);
				})
				.catch(function(error) {
					console.error(error);
					$mdToast.show(
						$mdToast.simple()
							.textContent("An error has occurred.")
							.hideDelay(4000)
							.action("OK")
							.highlightAction(true)
					);
				});
			$scope.fb.type="comment";
			$scope.fb.text=undefined;
			$scope.feedback.$setPristine();
			$scope.feedback.$setUntouched();
			$scope.fbNo=true;
		}
	};
});
app.controller("AdsControl",function($scope,$rootScope) {
	$rootScope.navItem=null;
	$rootScope.pageTitle="Submit an Advertisement";
	$rootScope.tabName="Advertisements - HarkerSG";
});