app.controller("SGControl", function($scope, $rootScope, $mdToast, $mdDialog) {
  $rootScope.navItem="studyguides";
  $rootScope.pageTitle="Notes / Study Guides";
  $rootScope.tabName="Notes/Study Guides - HarkerSG";
  //$scope.navItem="home";
  $scope.sgForm={showName: true};
  $scope.folderForm={};
  $scope.sort="-time";
  $scope.hoverFx=function() {
    $("md-grid-tile").hover(
      function() {$(this).addClass("md-whiteframe-3dp");},
      function() {$(this).removeClass("md-whiteframe-3dp");}
    );
  };
  $scope.clearSG=function() {
    $scope.sgForm={showName: $scope.sgForm.showName};
    $scope.addSG.$setPristine();
    $scope.addSG.$setUntouched();
    setTimeout(function() {$scope.$broadcast("md-resize-textarea");}, 100);
  };
  $scope.submitSG=function() {
    if ($scope.addSG.$valid) {
      $scope.sgLoading=true;
      if ($scope.sgForm.folder==undefined) $scope.sgForm.folder=null;
      $scope.sgForm.info=$scope.sgForm.info || "";
      var addSG=functions.httpsCallable("addSG");
      addSG({
        title: $scope.sgForm.title,
        info: $scope.sgForm.info,
        course: $scope.sgForm.course,
        folder: $scope.sgForm.folder,
        url: $scope.sgForm.url,
        honorCode: $scope.sgForm.honorCode,
        showName: $scope.sgForm.showName,
      }).then(function(result) {
        $mdToast.show(
          $mdToast.simple()
            .textContent("Successfully added study guide to "+$scope.sgForm.course+".")
            .hideDelay(4000)
            .action("OK")
            .highlightAction(true)
        );
        setTimeout(function() {
          document.activeElement.blur();
          $scope.clearSG();
        }, 100);
      }).catch(function(error) {
        console.error(error);
        $mdToast.show(
          $mdToast.simple()
            .textContent("An unexpected error has occurred.")
            .hideDelay(4000)
            .action("OK")
            .highlightAction(true)
        );
      }).finally(function() {
        $scope.sgLoading=false;
      });
    } else if (!$scope.sgForm.honorCode) {
      document.getElementById("honor-sg").classList.add("md-focused");
      $mdToast.show(
        $mdToast.simple()
          .textContent("Please accept the honor code.")
          .hideDelay(3000)
      );
    }
  };
  $scope.clearFolder=function() {
    $scope.folderForm={};
    $scope.addFolder.$setPristine();
    $scope.addFolder.$setUntouched();
  };
  $scope.submitFolder=function() {
    if ($scope.addFolder.$valid) {
      $scope.folderLoading=true;
      var addFolder=functions.httpsCallable("addFolder");
      addFolder({
        course: $scope.folderForm.course,
        title: $scope.folderForm.title,
      }).then(function(result) {
        $mdToast.show(
          $mdToast.simple()
            .textContent("Successfully added folder to "+$scope.folderForm.course+".")
            .hideDelay(4000)
            .action("OK")
            .highlightAction(true)
        );
        setTimeout(function() {
          document.activeElement.blur();
          $scope.clearFolder();
        }, 100);
      }).catch(function(error) {
        console.error(error);
        $mdToast.show(
          $mdToast.simple()
            .textContent("An unexpected error has occurred.")
            .hideDelay(4000)
            .action("OK")
            .highlightAction(true)
        );
      }).finally(function() {
        $scope.folderLoading=false;
      });
    }
  };
  $scope.click=function(link) {
    setTimeout(function() {
      window.open(link, "_blank");
    }, 250);
  };
  $scope.like=function(id,l,uid) {
    if (!$scope.allowed) {
      $mdToast.show(
				$mdToast.simple()
					.textContent("Please sign in with a school account to like study guides.")
					.hideDelay(4000)
					.action("OK")
					.highlightAction(true)
			);
    } else {
      l.push(uid);
      fs.collection("studyguides").doc(id).update({likes: l})
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
    }
  };
  $scope.flag=function(id,l,uid) {
    if ($scope.flags>2) {
      $mdToast.show(
				$mdToast.simple()
					.textContent("You cannot flag study guides since your account is disabled.")
					.hideDelay(4000)
					.action("OK")
					.highlightAction(true)
			);
    } else if (!$scope.allowed) {
      $mdToast.show(
				$mdToast.simple()
					.textContent("Please sign in with a school account to flag study guides.")
					.hideDelay(4000)
					.action("OK")
					.highlightAction(true)
			);
    } else {
      l.push(uid);
    	fs.collection("studyguides").doc(id).update({flags: l})
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
    }
  };
  $scope.getImage=function(url) {
    if (url.indexOf("quizlet.com")!=-1)
      return "/images/quizlet.png";
    if (url.indexOf("docs.google.com")!=-1)
      return "/images/docs.png";
    else
      return "/images/link.png";
  };
	function TeachersControl($scope, $mdDialog, sg) {
		$scope.tsg=sg;
    $scope.teachers=sg.teachers.slice();
		$scope.cancel=function() {
			$mdDialog.cancel();
		};
		$scope.save=function() {
      fs.collection("studyguides").doc(sg.id).update({teachers: $scope.teachers})
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
			$mdDialog.hide();
		};
    $scope.resize=function() {
      var input=document.querySelector('[aria-label="Add Teachers"]');
      setTimeout(function() {
        input.setAttribute("size",input.getAttribute("placeholder").length);
      }, 100);
    };
	}
	$scope.addTeachers=function(event,studyguide) {
    if ($scope.flags>2) {
      $mdToast.show(
				$mdToast.simple()
					.textContent("You cannot add teachers since your account is disabled.")
					.hideDelay(4000)
					.action("OK")
					.highlightAction(true)
			);
    } else if (!$scope.allowed) {
      $mdToast.show(
				$mdToast.simple()
					.textContent("Please sign in with a school account to add teachers.")
					.hideDelay(4000)
					.action("OK")
					.highlightAction(true)
			);
    } else {
  		$mdDialog.show({
        templateUrl: "teachers.tmpl.html",
        parent: angular.element(document.body),
        targetEvent: event,
  			controller: TeachersControl,
  			locals: {sg: studyguide},
  			fullscreen: true
      });
    }
	};
  $scope.toggleFolder=function(folder, count) {
    folder.mdCols=3-(folder.mdCols||1);
    folder.smCols=2-(folder.smCols||1);
    folder.lgCols=5-(folder.lgCols||1);
    folder.rows=((folder.rows>1)?1:(Math.ceil(count/3)*3+2));
    $("#flip-"+folder.id).toggleClass("flip");
  }
  $scope.filterSG=function() {
		return function(item) {return $scope.cats.length==0 || $scope.cats.indexOf(item.cat)!=-1;};
	};
});
//applyTemplate=function(msg) {return;};