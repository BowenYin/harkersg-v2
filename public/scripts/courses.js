app.controller("CoursesControl",function($scope,$rootScope) {
	$rootScope.navItem="courses";
	$rootScope.pageTitle="Course Catalog";
	$rootScope.tabName="Courses - HarkerSG";
	$scope.loaded=false;
	db.ref("/courses").once("value").then(function(snapshot) {
		$scope.courses=snapshot.val();
		$scope.loaded=true;
		$scope.$apply();
	}).catch(function(error) {
		$scope.loaded=true;
	});
});