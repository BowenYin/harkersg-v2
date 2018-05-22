app.controller("SGControl",function($scope,$rootScope,$mdToast,$mdDialog) {
  $rootScope.navItem="studyguides";
  $rootScope.pageTitle="Notes / Study Guides";
  $rootScope.tabName="Notes/Study Guides - HarkerSG";
  $scope.navItem="home";
  $scope.form={};
  $scope.folderForm={};
  $scope.sort="-time";
  $scope.cats=[];
  auth.onAuthStateChanged(function(user) {
    if (user) {
      var email=auth.currentUser.email;
      if (email.indexOf("@students.harker.org")!=-1) {
        var today=new Date();
        var grad=new Date("07/01/20"+email.substring(0,2));
        var diff=new Date(Date.UTC(grad.getFullYear(), grad.getMonth(), grad.getDate())-Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())).getUTCFullYear()-1970;
        if (diff<4)
          $scope.cats=["math","eng","sci","hist","lang","uso"];
        else if (diff<5)
          $scope.cats=["8th","mso"];
        else if (diff<6)
          $scope.cats=["7th","mso"];
        else if (diff<7)
          $scope.cats=["6th","mso"];
      }
    }
  });
  var cookies=document.cookie.split("; ");
  fs.collection("studyguides").onSnapshot(function(querySnapshot) {
    $scope.studyguides=[];
    querySnapshot.forEach(function(doc) {
      var data=doc.data();
      data.id=doc.id;
      $scope.studyguides.push(data);
    });
    for (var i=0; i<cookies.length; i++) {
      if (cookies[i].split("=")[0]=="countSG") {
        var cookie=cookies[i].split("=")[1];
        var len=$scope.studyguides.length;
        if (parseInt(cookie)==len) {
          $scope.newSG="+0";
          $scope.newSGColor="gray";
        }
        else if (parseInt(cookie)<len) {
          var x=len-cookie;
          $scope.newSG="⬆ +"+x;
          $scope.newSGColor="green";
        }
        else if (parseInt(cookie)>len) {
          var x=cookie-len;
          $scope.newSG="⬇ -"+x;
          $scope.newSGColor="red";
        }
      }
    }
    $scope.$apply();
    document.cookie="countSG="+$scope.studyguides.length+"; expires=Fri, 31 Dec 9999 12:00:00 UTC";
  });
  $scope.hoverFx=function() {
    $("md-grid-tile").hover(
      function() {$(this).addClass("md-whiteframe-3dp");},
      function() {$(this).removeClass("md-whiteframe-3dp");}
    );
  };
  $scope.clear=function() {
    $scope.form.title=undefined;
    $scope.form.link=undefined;
    $scope.form.subject=undefined;
    $scope.form.folder=undefined;
    $scope.form.honor=undefined;
    $scope.addSG.$setPristine();
    $scope.addSG.$setUntouched();
  };
  $scope.submit=function() {
    if ($scope.addSG.$valid) {
      if ($scope.form.folder==undefined || $scope.form.folder=="None")
        $scope.form.folder=null;
      fs.collection("studyguides").add({
        title: $scope.form.title,
        subject: $scope.form.subject.id,
        folder: $scope.form.folder,
        time: new Date(),
        user: fs.collection("users").doc($scope.uid),
        link: $scope.form.link,
        likes: [],
        flags: [],
        teachers: [],
        verified: false
      })
      .then(function(doc) {
        $mdToast.show(
          $mdToast.simple()
            .textContent("Successfully submitted ID# "+doc.id)
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
			setTimeout(function() {
				document.activeElement.blur();
      	$scope.clear();
			}, 100);
    } else if (!$scope.form.honor) {
      document.getElementById("honor-sg").classList.add("md-focused");
      $mdToast.show(
        $mdToast.simple()
          .textContent("Please accept the honor code.")
          .hideDelay(3000)
      );
    }
  };
  $scope.clearFolder=function() {
    $scope.folderForm.name=undefined;
    $scope.folderForm.subject=undefined;
    $scope.addFolder.$setPristine();
    $scope.addFolder.$setUntouched();
  };
  $scope.submitFolder=function() {
    if ($scope.addFolder.$valid) {
      $scope.showLoader=true;
      var now=new Date();
      var str=now.toString();
      now=str.substr(0,24)+"."+now.getMilliseconds()+str.substr(24);
      var folder;
      for (var i=0; i<$scope.subjects.length; i++) {
        if ($scope.subjects[i].id==$scope.folderForm.subject.id) {
          folder=$scope.subjects[i].folders || [];
          for (var j=0; j<folder.length; j++) {
            delete folder[j].$$hashKey;
            delete folder[j].rows;
            delete folder[j].smCols;
            delete folder[j].mdCols;
            delete folder[j].lgCols;
          }
          break;
        }
      }
      console.log(folder.concat({id: now, name: $scope.folderForm.name, user: fs.collection("users").doc($scope.uid)}));
      fs.collection("subjects").doc($scope.folderForm.subject.id).update({
        folders: folder.concat({id: now, name: $scope.folderForm.name, user: fs.collection("users").doc($scope.uid)})
      })
      .then(function(doc) {
        $mdToast.show(
          $mdToast.simple()
            .textContent("Successfully added folder.")
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
			setTimeout(function() {
				document.activeElement.blur();
      	$scope.clearFolder();
        $scope.showLoader=false;
			}, 100);
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
	function TeachersControl($scope,$mdDialog,sg) {
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
  $scope.togglePin=function(subj) {
    var i=$scope.settings.subjects.indexOf(subj);
    if (i!=-1)
      $scope.settings.subjects.splice(i,1);
    else
      $scope.settings.subjects.push(subj);
    fs.collection("users").doc($scope.uid).update({"settings.subjects": $scope.settings.subjects});
  };
  $scope.toggleFolder=function(folder,count) {
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
app.controller("FormSubjectControl",function($element) {
  $element.find('input').on('keydown',function(ev) {ev.stopPropagation();});
});
applyTemplate=function(msg) {return;};