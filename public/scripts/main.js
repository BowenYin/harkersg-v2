app.controller("HomeControl", function($rootScope) {
  $rootScope.navItem="home";
  $rootScope.pageTitle="HarkerSG Home";
  $rootScope.tabName="HarkerSG - Harker Study Guides";
});
app.controller("NFControl", function($rootScope) {
  $rootScope.navItem=null;
  $rootScope.pageTitle="404 Page Not Found";
  $rootScope.tabName="Page Not Found - HarkerSG";
});
app.controller("SettingsControl", function($rootScope, $scope, $mdToast) {
  $rootScope.navItem=null;
  $rootScope.pageTitle="User Settings";
  $rootScope.tabName="Settings - HarkerSG";
  $scope.dark=dark, $scope.primary=primary, $scope.accent=accent;
  $scope.darkTheme=function() {
    document.cookie="dark="+$scope.dark+"; expires=Fri, 31 Dec 9999 12:00:00 UTC";
    $scope.showToast();
  };
  $scope.setPrimary=function() {
    document.cookie="primary="+$scope.primary+"; expires=Fri, 31 Dec 9999 12:00:00 UTC";
    $scope.showToast();
  };
  $scope.setAccent=function() {
    document.cookie="accent="+$scope.accent+"; expires=Fri, 31 Dec 9999 12:00:00 UTC";
    $scope.showToast();
  };
  $scope.showToast=function() {
    $mdToast.show(
      $mdToast.simple().textContent("Refresh this page to see changes.").hideDelay(5000).action("Reload").highlightAction(true).position("top right")
    ).then(function(response) {
      if (response==="ok") window.location.reload(false);
    });
  };
});
app.controller("AboutControl", function($rootScope) {
  $rootScope.navItem="about";
  $rootScope.pageTitle="About HarkerSG";
  $rootScope.tabName="About - HarkerSG";
});
app.controller("PrivacyControl", function($rootScope) {
  $rootScope.navItem=null;
  $rootScope.pageTitle="Privacy Policy";
  $rootScope.tabName="Privacy Policy - HarkerSG";
});
app.controller("FeedbackControl", function($scope, $rootScope, $mdToast) {
  $rootScope.navItem="feedback";
  $rootScope.pageTitle="Feedback / Support";
  $rootScope.tabName="Feedback - HarkerSG";
  $scope.fb={type: "comment"};
  $scope.submit=function() {
    if ($scope.feedback.$valid) {
      var sendFeedback=functions.httpsCallable("sendFeedback");
      sendFeedback({
        type: $scope.fb.type,
        text: $scope.fb.text,
        rating: $scope.fb.rating,
      }).then(function() {
        $mdToast.show(
          $mdToast.simple().textContent("Thank you for your feedback.").hideDelay(4000).action("OK").highlightAction(true)
        );
        $scope.fb={type: "comment"};
        $scope.feedback.$setPristine();
        $scope.feedback.$setUntouched();
      }).catch(function(error) {
        console.error(error);
        $mdToast.show(
          $mdToast.simple().textContent("An unexpected error has occurred.").hideDelay(4000).action("OK").highlightAction(true)
        );
      }).finally(function() {$scope.fbLoading=false;});
      $scope.fbLoading=true;
      $mdToast.show(
        $mdToast.simple().textContent("Sending feedback...").hideDelay(0)
      );
    }
  };
});