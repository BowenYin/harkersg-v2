app.controller("CoursesControl", function($scope, $rootScope, $mdMedia, $mdToast) {
	$rootScope.navItem="courses";
	$rootScope.pageTitle="Course Catalog";
	$rootScope.tabName="Course Catalog - HarkerSG";
	$scope.loading=true;
	$scope.unsaved=false;
	$scope.search="";
	$scope.gtXs=$mdMedia("gt-xs");
	db.ref("/courses").once("value").then(function(snapshot) {
		$scope.list=snapshot.val();
		$scope.$apply();
	}).finally(function() {
		$scope.loading=false;
	});
	$scope.update=function(course) {
		if ($scope.selected[course]!==true) delete $scope.selected[course];
		$scope.unsaved=!angular.equals($scope.saved, $scope.selected);
		$scope.max=Object.keys($scope.selected).length>7;
	};
	$scope.reset=function() {
		$scope.selected={};
		Object.assign($scope.selected, $scope.saved);
		$scope.update();
	};
	$scope.save=function() {
		$scope.loading=true;
		let arr=[];
		for (let name in $scope.selected)
			if ($scope.selected[name]===true) arr.push(name);
		var updateCourses=functions.httpsCallable("updateCourses");
		$mdToast.show(
			$mdToast.simple().textContent("Saving courses... (This may take up to 30 seconds.)").hideDelay(0)
		);
		updateCourses({courses: arr}).then(function(result) {
			$scope.loading=false;
			$mdToast.hide();
			window.location.reload(false);
		}).catch(function(error) {
			$scope.loading=false;
			$mdToast.hide();
			console.log(error);
			$mdToast.show(
				$mdToast.simple()
				.textContent("An unexpected error has occurred.")
				.hideDelay(4000)
				.action("OK")
				.highlightAction(true)
			);
		});
	};
});