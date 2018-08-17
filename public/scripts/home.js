var app=angular.module("App", ["ngMaterial", "ngMessages", "ngRoute", "ngSanitize"]);
app.controller("MainControl", function($scope, $mdSidenav, $mdDialog, $mdToast) {
  $scope.toggleLeftMenu=function() {
    $mdSidenav("left").toggle();
  };
  $scope.toggleRightMenu=function() {
    $mdSidenav("right").toggle();
  };
  $scope.reset=function() {$scope.navItem=null;};
  $scope.goToFeedback=function() {$scope.navItem="feedback";};
  $scope.goToCourses=function() {$scope.navItem="courses";};
  auth.onAuthStateChanged(function(user) {
    if (user) {
      $scope.signedIn=true;
      $scope.uid=user.uid;
      $scope.isSchool=/.+(?:@students\.|@staff\.|@)harker.org$/.test(auth.currentUser.email);
      document.getElementById("user-info-l").style.display="";
      document.getElementById("user-info-r").style.display="";
      document.getElementById("sign-in").style.display="none";
      document.getElementById("profile-pic-l").src=auth.currentUser.photoURL || "/images/profile-pic.jpg";
      document.getElementById("profile-pic-r").src=auth.currentUser.photoURL || "/images/profile-pic.jpg";
      document.getElementById("user-name-l").innerText=auth.currentUser.displayName.substring(0, auth.currentUser.displayName.indexOf(" ")+2)+".";
      document.getElementById("user-name-r").innerText=auth.currentUser.displayName.substring(0, auth.currentUser.displayName.indexOf(" ")+2)+".";
      $scope.profilePic=auth.currentUser.photoURL || "/images/profile-pic.jpg";
      $scope.fullName=auth.currentUser.displayName;
      $scope.email=auth.currentUser.email;
      fs.collection("users").doc(user.uid).get().then(function(doc) {
        if (doc.exists) {
          const data=doc.data();
          $scope.coursesList=data.courses;
          $scope.numCourses=data.courses.length;
          $scope.locked=data.locked;
          $scope.courses={};
          $scope.saved={};
          $scope.selected={};
          for (let i=0; i<data.courses.length; i++)
            $scope.saved[data.courses[i]]=true;
          Object.assign($scope.selected, $scope.saved);
          $scope.$apply();
          for (let i=0; i<data.courses.length; i++) {
            $scope.courses[data.courses[i]]={sg: []};
            fs.collection("courses").doc(data.courses[i]).onSnapshot(function(courseDoc) {
              $scope.courses[courseDoc.id].folders=courseDoc.data().folders;
              if (i==data.courses.length-1) $scope.loaded=true;
              $scope.lastUpdated=new Date();
              $scope.$apply();
            });
            fs.collection("courses").doc(data.courses[i]).collection("sg").where("folder", "==", null).onSnapshot(function(snapshot) {
              snapshot.docChanges().forEach(function(change) {
                let sg=change.doc.data();
                if (change.type==="added") {
                  sg.id=change.doc.id;
                  $scope.courses[data.courses[i]].sg.splice(change.newIndex, 0, sg);
                } else if (change.type==="modified") {
                  sg.id=change.doc.id;
                  $scope.courses[data.courses[i]].sg[change.oldIndex]=sg;
                } else if (change.type==="removed")
                  $scope.courses[data.courses[i]].sg.splice(change.oldIndex, 1);
              });
              $scope.lastUpdated=new Date();
              $scope.$apply();
            });
          }
        } else {
          $mdToast.show(
            $mdToast.simple().textContent("Creating account...").hideDelay(0)
          );
          setTimeout(function() {window.location.reload(true);}, 3000);
        }
      });
      db.ref("/message").on("value", function(snapshot) {
        $scope.message=snapshot.val();
        $scope.$apply();
      });
      ga("set", "userId", user.uid);
      if (!$scope.isSchool)
        $mdDialog.show(
          $mdDialog.alert()
            .clickOutsideToClose(false)
            .title("You are not using a school email address.")
            .textContent("If you have one, please sign out and switch to it. Otherwise, many features (like saving your courses and viewing study guides) will be disabled.")
            .ariaLabel("Non-School Account")
            .ok("Got It")
        );
    } else {
      $scope.signedIn=false;
      $scope.isSchool=false;
      $scope.loaded=true;
    }
  });
});
var cookies=document.cookie.split("; ");
var primary="blue", accent="orange", dark=false;
for (var i=0; i<cookies.length; i++) {
  if (cookies[i].split("=")[0]=="dark" && cookies[i].split("=")[1]=="true") {
    dark=true;
    app.config(function($mdThemingProvider) {$mdThemingProvider.theme("default").dark();});
  } else if (cookies[i].split("=")[0]=="primary")
    primary=cookies[i].split("=")[1];
  else if (cookies[i].split("=")[0]=="accent")
    accent=cookies[i].split("=")[1];
}
app.config(function($mdThemingProvider) {
  $mdThemingProvider.theme("default").primaryPalette(primary, {default: "700"}).accentPalette(accent, {default: "A400"});
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
    .when("/privacy", {templateUrl: "privacy.html", controller: "PrivacyControl"})
    .otherwise({template: "<md-content layout-margin>404 Page Not Found :(</md-content>", controller: "NFControl"});
  $locationProvider.hashPrefix("");
  $locationProvider.html5Mode(true);
});