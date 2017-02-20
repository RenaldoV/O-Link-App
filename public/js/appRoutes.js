angular.module('appRoutes', []).config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {

	$routeProvider

		// home page
		.when('/', {
			templateUrl: 'views/home.html'
		})
		.when('/dashboard', {
			templateUrl: 'views/dashboard.html'
		})
			.when('/guest', {
				templateUrl: 'views/dashboard.html'
			})
		.when('/logIn', {
			templateUrl: 'views/page_signin.html'
		})

		.when('/signUp', {
			templateUrl: 'views/page_signup.html'
		})
		.when('/postJob', {
			templateUrl: 'views/postJob.html'
		})
		.when('/browseJobs', {
		templateUrl: 'views/browseJobs.html'
		})
		.when('/job', {
			templateUrl: 'views/job.html'
		})
		.when('/profile', {
			templateUrl: 'views/profile.html'
		})
		.when('/reset/:token', {
			templateUrl: 'views/reset.html'
		})
		.when('/forgot', {
			templateUrl: 'views/forgot.html'
		})
		.when('/myProfile', {
			templateUrl: 'views/profile.html'
		})
		.when('/editProfile', {
			templateUrl: 'views/editProfile.html'
		})
		.when('/applicants', {
			templateUrl: 'views/blocks/applicants.html'
		})
		.when('/myJobPosts', {
			templateUrl: 'views/blocks/employerJobPosts.html'
		})

		.when('/applications', {
		templateUrl: 'views/blocks/applications.html'
		})
			.when('/myJobHistory', {
				templateUrl: 'views/blocks/jobHistory.html'
			})
			.when('/employmentHistory', {
				templateUrl: 'views/blocks/employmentHistory.html'
			})

			.when('/activate', {
				templateUrl: 'views/activate.html'
			})

			.when('/pastJobPosts', {
				templateUrl: 'views/blocks/postHistory.html'

			})

			.when('/buy', {
				templateUrl: 'views/blocks/buy.html'
			})

			.when('/confirmPayment', {
				templateUrl: 'views/blocks/confirmPay.html'
			})
			.when('/paymentSuccessful', {
				templateUrl: 'views/blocks/paymentSuccessful.html'

			})
			.when('/paymentCanceled', {
				templateUrl: 'views/blocks/paymentCanceled.html'
			})
	.when('/gallery',{
		templateUrl: 'views/blocks/gallery.html'
	});



	$locationProvider.html5Mode(true);

}]);