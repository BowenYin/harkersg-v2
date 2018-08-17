app.controller("SGControl", function($scope, $rootScope, $mdToast, $mdDialog, $mdBottomSheet) {
  $rootScope.navItem="studyguides";
  $rootScope.pageTitle="Notes / Study Guides";
  $rootScope.tabName="Notes/Study Guides - HarkerSG";
  //$scope.navItem="home"; ???
  $scope.sgForm={showName: true};
  $scope.folderForm={};
  $scope.sort="-time";
  $scope.hoverFx=function() {
    $("md-grid-tile").hover(
      function() {$(this).addClass("md-whiteframe-2dp");},
      function() {$(this).removeClass("md-whiteframe-2dp");}
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
      if ($scope.sgForm.folder=="None" || $scope.sgForm.folder==undefined) $scope.sgForm.folder=null;
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
      }).then(function() {
        $mdToast.show(
          $mdToast.simple().textContent("Successfully added study guide to "+$scope.sgForm.course+".").hideDelay(4000).action("OK").highlightAction(true)
        );
        setTimeout(function() {
          document.activeElement.blur();
          $scope.clearSG();
        }, 100);
      }).catch(function(error) {
        console.error(error);
        $mdToast.show(
          $mdToast.simple().textContent("An unexpected error has occurred.").hideDelay(4000).action("OK").highlightAction(true)
        );
      }).finally(function() {$scope.sgLoading=false;});
      $scope.sgLoading=true;
    } else if (!$scope.sgForm.honorCode) {
      document.getElementById("honor-sg").classList.add("md-focused");
      $mdToast.show(
        $mdToast.simple().textContent("Please accept the honor code.").hideDelay(3000)
      );
    }
  };
	$scope.editSG=function(event, course, studyguide) {
    if ($scope.locked) {
      $mdToast.show(
				$mdToast.simple().textContent("You cannot edit since your account is locked.").hideDelay(4000).action("OK").highlightAction(true)
			);
    } else {
  		$mdDialog.show({
        templateUrl: "edit-sg.html",
        parent: angular.element(document.body),
        targetEvent: event,
  			controller: EditSGControl,
        locals: {sg: studyguide, course: course},
      });
    }
	};
  $scope.clearFolder=function() {
    $scope.folderForm={};
    $scope.addFolder.$setPristine();
    $scope.addFolder.$setUntouched();
  };
  $scope.submitFolder=function() {
    if ($scope.addFolder.$valid) {
      var addFolder=functions.httpsCallable("addFolder");
      addFolder({
        course: $scope.folderForm.course,
        title: $scope.folderForm.title,
      }).then(function() {
        $mdToast.show(
          $mdToast.simple().textContent("Successfully added folder to "+$scope.folderForm.course+".").hideDelay(4000).action("OK").highlightAction(true)
        );
        setTimeout(function() {
          document.activeElement.blur();
          $scope.clearFolder();
        }, 100);
      }).catch(function(error) {
        console.error(error);
        $mdToast.show(
          $mdToast.simple().textContent("An unexpected error has occurred.").hideDelay(4000).action("OK").highlightAction(true)
        );
      }).finally(function() {$scope.folderLoading=false;});
      $scope.folderLoading=true;
    }
  };
  $scope.editFolder=function(event, course, folder) {
    if ($scope.locked) {
      $mdToast.show(
				$mdToast.simple().textContent("You cannot edit since your account is locked.").hideDelay(4000).action("OK").highlightAction(true)
			);
    } else {
  		$mdDialog.show({
        templateUrl: "edit-folder.html",
        parent: angular.element(document.body),
        targetEvent: event,
  			controller: EditFolderControl,
        locals: {folder: folder, course: course},
      });
    }
	};
  $scope.click=function(link) {
    setTimeout(function() {
      window.open(link, "_blank");
    }, 250);
  };
  $scope.like=function(id, course) {
    var likeSG=functions.httpsCallable("likeSG");
    likeSG({
      id: id,
      course: course,
    }).then(function() {
      $mdToast.show(
        $mdToast.simple().textContent("Saved.").hideDelay(1000)
      );
    }).catch(function(error) {
      console.error(error);
      $mdToast.show(
        $mdToast.simple().textContent("An unexpected error has occurred.").hideDelay(4000).action("OK").highlightAction(true)
      );
    });
    $mdToast.show(
      $mdToast.simple().textContent("Saving...").hideDelay(0)
    );
  };
  $scope.flag=function(id, course) {
    if ($scope.locked) {
      $mdToast.show(
        $mdToast.simple().textContent("You cannot flag study guides since your account is locked.").hideDelay(4000).action("OK").highlightAction(true)
			);
    } else {
      var flagSG=functions.httpsCallable("flagSG");
      flagSG({
        id: id,
        course: course,
      }).then(function() {
        $mdToast.show(
          $mdToast.simple().textContent("Saved.").hideDelay(1000)
        );
      }).catch(function(error) {
        console.error(error);
        $mdToast.show(
          $mdToast.simple().textContent("An unexpected error has occurred.").hideDelay(4000).action("OK").highlightAction(true)
        );
      });
      $mdToast.show(
        $mdToast.simple().textContent("Saving...").hideDelay(0)
      );
    }
  };
  $scope.move=function(id, course, folders, currentFolder) {
    if ($scope.locked) {
      $mdToast.show(
				$mdToast.simple().textContent("You cannot move study guides since your account is locked.").hideDelay(4000).action("OK").highlightAction(true)
			);
    } else {
  		$mdBottomSheet.show({
        templateUrl: "move-sg.html",
  			controller: MoveSGControl,
        locals: {course: course, folders: folders, id: id, currentFolder: currentFolder},
      });
    }
  };
  $scope.getImage=function(url) {
    if (url.indexOf("quizlet.com")!=-1) return "/images/quizlet.png";
    if (url.indexOf("docs.google.com")!=-1) return "/images/docs.png";
    else return "/images/link.png";
  };
	function EditSGControl($scope, $mdDialog, sg, course) {
    $scope.sg={};
    Object.assign($scope.sg, sg);
		$scope.cancel=function() {
			$mdDialog.cancel();
		};
		$scope.save=function() {
      if ($scope.editSG.$valid) {
        var editSG=functions.httpsCallable("editSG");
        editSG({
          id: $scope.sg.id,
          course: course,
          title: $scope.sg.title,
          info: $scope.sg.info,
        }).then(function() {
          $mdToast.show(
            $mdToast.simple().textContent("Saved.").hideDelay(3000).action("OK").highlightAction(true)
          );
        }).catch(function(error) {
          console.error(error);
          $mdToast.show(
            $mdToast.simple().textContent("An unexpected error has occurred.").hideDelay(4000).action("OK").highlightAction(true)
          );
        });
        $mdDialog.hide()
        $mdToast.show(
          $mdToast.simple().textContent("Saving changes...").hideDelay(0)
        );
      }
		};
  }
  function EditFolderControl($scope, $mdDialog, folder, course) {
    $scope.folder={};
    Object.assign($scope.folder, folder);
		$scope.cancel=function() {
			$mdDialog.cancel();
		};
		$scope.save=function() {
      if ($scope.editFolder.$valid) {
        var editFolder=functions.httpsCallable("editFolder");
        editFolder({
          course: course,
          folder: folder.time,
          title: $scope.folder.title,
        }).then(function() {
          $mdToast.show(
            $mdToast.simple().textContent("Saved.").hideDelay(3000).action("OK").highlightAction(true)
          );
        }).catch(function(error) {
          console.error(error);
          $mdToast.show(
            $mdToast.simple().textContent("An unexpected error has occurred.").hideDelay(4000).action("OK").highlightAction(true)
          );
        });
        $mdDialog.hide();
        $mdToast.show(
          $mdToast.simple().textContent("Saving changes...").hideDelay(0)
        );
      }
		};
  }
  function MoveSGControl($scope, $mdBottomSheet, id, course, folders, currentFolder) {
    $scope.folders=folders;
    $scope.currentFolder=currentFolder;
    $scope.save=function(folder) {
      var moveSG=functions.httpsCallable("moveSG");
      moveSG({
        id: id,
        course: course,
        folder: folder,
      }).then(function() {
        $mdToast.show(
          $mdToast.simple().textContent("Saved.").hideDelay(1000)
        );
      }).catch(function(error) {
        console.error(error);
        $mdToast.show(
          $mdToast.simple().textContent("An unexpected error has occurred.").hideDelay(4000).action("OK").highlightAction(true)
        );
      });
      $mdBottomSheet.hide();
      $mdToast.show(
        $mdToast.simple().textContent("Saving...").hideDelay(0)
      );
    }
  }
  $scope.toggleFolder=function(course, folder) {
    folder.cols=3-(folder.cols || 1);
    folder.xlCols=5-(folder.xlCols || 1);
    $("#flip-"+folder.time).toggleClass("flip");
    if (folder.sg===undefined) {
      folder.sg=[];
      folder.rows=2;
      folder.loading=true;
      fs.collection("courses").doc(course).collection("sg").where("folder", "==", folder.time).onSnapshot(function(snapshot) {
        snapshot.docChanges().forEach(function(change) {
          let sg=change.doc.data();
          if (change.type==="added") {
            sg.id=change.doc.id;
            folder.sg.splice(change.newIndex, 0, sg);
          } else if (change.type==="modified") {
            sg.id=change.doc.id;
            folder.sg[change.oldIndex]=sg;
          } else if (change.type==="removed")
            folder.sg.splice(change.oldIndex, 1);
        });
        if (folder.cols>1) {
          folder.xsRows=Math.max(2, folder.sg.length*3+1);
          folder.rows=Math.max(2, Math.ceil(folder.sg.length/2)*3+1);
          folder.lgRows=Math.max(2, Math.ceil(folder.sg.length/3)*3+1);
          folder.xlRows=Math.max(2, Math.ceil(folder.sg.length/5)*3+1);
          folder.loading=false;
        }
        $scope.lastUpdated=new Date();
        $scope.$apply();
      });
    } else if (folder.rows>1) {
      folder.xsRows=1;
      folder.rows=1;
      folder.lgRows=1;
      folder.xlRows=1;
    } else {
      folder.xsRows=Math.max(2, folder.sg.length*3+1);
      folder.rows=Math.max(2, Math.ceil(folder.sg.length/2)*3+1);
      folder.lgRows=Math.max(2, Math.ceil(folder.sg.length/3)*3+1);
      folder.xlRows=Math.max(2, Math.ceil(folder.sg.length/5)*3+1);
    }
  }
});
//applyTemplate=function(msg) {return;}; ???