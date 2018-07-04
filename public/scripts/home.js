var app=angular.module("App", ["ngMaterial", "ngMessages", "ngRoute", "ngSanitize"]);
app.controller("MainControl", function($scope, $mdSidenav, $mdDialog) {
  $scope.toggleLeftMenu=function() {
    $mdSidenav("left").toggle();
  };
  $scope.toggleRightMenu=function() {
    $mdSidenav("right").toggle();
  };
  $scope.reset=function() {
    $scope.navItem=null;
  };
  auth.onAuthStateChanged(function(user) {
    if (user) {
      $scope.signedIn=true;
      $scope.uid=user.uid;
      $scope.allowed=/.+(?:@students\.|@staff\.|@)harker.org$/.test(auth.currentUser.email);
      document.getElementById("user-info-l").style.display="";
      document.getElementById("user-info-r").style.display="";
      document.getElementById("sign-in").style.display="none";
      document.getElementById("profile-pic-l").src=auth.currentUser.photoURL || "/images/profile-pic.jpg";
      document.getElementById("profile-pic-r").src=auth.currentUser.photoURL || "/images/profile-pic.jpg";
      document.getElementById("user-name-l").innerText=auth.currentUser.displayName.substring(0, auth.currentUser.displayName.indexOf(" ")+2)+".";
      document.getElementById("user-name-r").innerText=auth.currentUser.displayName.substring(0, auth.currentUser.displayName.indexOf(" ")+2)+".";
      ga("set", "userId", user.uid);
      fs.collection("users").doc(user.uid).get().then(function(doc) {
        if (doc.exists) {
          const data=doc.data();
          $scope.fbNo=(new Date())-data.lastFb<3600000;
          $scope.flags=data.flags;
          $scope.courses={};
          $scope.saved={};
          $scope.selected={};
          for (let i=0; i<data.courses.length; i++)
            $scope.saved[data.courses[i]]=true;
          Object.assign($scope.selected, $scope.saved);
          $scope.settings=data.settings; // remove
          $scope.$apply();
          for (let i=0; i<data.courses.length; i++) {
            fs.collection("courses").doc(data.courses[i]).onSnapshot(function(courseDoc) {
              $scope.courses[courseDoc.id]={folders: courseDoc.data().folders, sg: []};
              if (i==data.courses.length-1) $scope.loaded=true;
              $scope.$apply();
              fs.collection("courses").doc(data.courses[i]).collection("sg").where("folder", "==", null).onSnapshot(function(snapshot) {
                snapshot.docChanges().forEach(function(change) {
                  let sg=change.doc.data();
                  if (change.type==="added") {
                    sg.id=change.doc.id;
                    $scope.courses[courseDoc.id].sg.splice(change.newIndex, 0, sg);
                  } else if (change.type==="modified") {
                    sg.id=change.doc.id;
                    $scope.courses[courseDoc.id].sg[change.oldIndex]=sg;
                  } else if (change.type==="removed")
                    $scope.courses[courseDoc.id].sg.splice(change.oldIndex, 1);
                  $scope.$apply();
                });
              });
            });
          }
        }
      });
      if (!$scope.allowed) {
        $mdDialog.show(
          $mdDialog.alert()
            .clickOutsideToClose(false)
            .title("You are not using a school email address")
            .textContent("If you have one, please sign out and switch to it. Otherwise, some features (like adding study guides) will be disabled.")
            .ariaLabel("Non-School Account")
            .ok("Got It")
        );
      }
    } else {
      $scope.signedIn=false;
      $scope.allowed=false;
      $scope.loaded=true;
    }
  });
  var CURRENT_VERSION=1.1;
  var cookieVersion=0.0;
  if (navigator.cookieEnabled) {
    var cookies=document.cookie.split("; ");
    for (var i=0; i<cookies.length; i++)
      if (cookies[i].split("=")[0]=="latestVersion") {
        cookieVersion=parseFloat(cookies[i].split("=")[1]);
        break;
      }
  } else
    cookieVersion=100.0;
  if (cookieVersion<CURRENT_VERSION) {
    $mdDialog.show(
      $mdDialog.alert()
        .clickOutsideToClose(false)
        .title("New Features in Version 1.1")
        .htmlContent("<b>PIN TO TOP:</b> You can pin specific subjects to the top by clicking the checkbox at the right side.<br><b>TEACHERS:</b> You can add teachers to any study guide using the plus button.<br><b>SETTINGS:</b> Theme colors and dark mode are now available on the Settings page (click on your profile name).<br><b>SG COUNTER:</b> The SG counter now shows the number of new study guides since your last visit.<br><br>Please use the feedback form if you have any suggestions or issues.")
        .ok("Got It")
    ).then(function() {
      document.cookie="latestVersion="+CURRENT_VERSION.toString()+"; expires=Fri, 31 Dec 9999 12:00:00 UTC";
    });
  }
});
var cookies=document.cookie.split("; ");
var primary="blue", accent="orange";
for (var i=0; i<cookies.length; i++) {
  if (cookies[i].split("=")[0]=="dark" && cookies[i].split("=")[1]=="true") {
    app.config(function($mdThemingProvider) {
      $mdThemingProvider.theme("default").dark();
    });
  }
  else if (cookies[i].split("=")[0]=="primary")
    primary=cookies[i].split("=")[1];
  else if (cookies[i].split("=")[0]=="accent")
    accent=cookies[i].split("=")[1];
}
app.config(function($mdThemingProvider) {
  $mdThemingProvider.theme("default").primaryPalette(primary, {"default": "700"}).accentPalette(accent);
  $mdThemingProvider.enableBrowserColor();
});
app.config(function($locationProvider, $routeProvider) {
  $routeProvider
    .when("/", {templateUrl: "home.html", controller: "HomeControl"})
    .when("/studyguides", {templateUrl: "studyguides.html", controller: "SGControl"})
    .when("/notes", {redirectTo: "/studyguides"})
    .when("/sg", {redirectTo: "/studyguides"})
    .when("/courses", {templateUrl: "courses.html", controller: "CoursesControl"})
    .when("/settings", {templateUrl: "settings.html", controller: "SettingsControl"})
    .when("/about", {templateUrl: "about.html", controller: "AboutControl"})
    .when("/feedback", {templateUrl: "feedback.html", controller: "FeedbackControl"})
    .when("/ads", {templateUrl: "submit.html", controller: "AdsControl"})
    .when("/privacy", {templateUrl: "privacy.html", controller: "PrivacyControl"})
    .otherwise({template: "<md-content layout-margin>404 Page Not Found :(</md-content>", controller: "NFControl"});
  $locationProvider.hashPrefix("");
  $locationProvider.html5Mode(true);
});