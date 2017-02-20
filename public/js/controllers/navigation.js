///////////////////////////////////////////////////////
//////////////Controllers for the nav bar//////////////
///////////////////////////////////////////////////////
app.controller('logoClick', function(authService,$scope,$window){
    if(authService.isAuthenticated()) {
        $scope.toDash = function () {
            $window.location.href = "/dashboard";
            $(".appbg").addClass('dashBG');
        };
    }
    else
    {
        $scope.toDash = function () {
            $window.location.href = "/logIn";
        };
    }
});
app.controller('navControl',function($scope, authService, session, $location, $window, $timeout,$rootScope, cacheUser,$http) {


    $scope.browse = false;
    if(!session.user) {
        $scope.type = 'grey';
        $scope.userType = 'guest';
    }
    else{
        $scope.userType = session.user.type;
    }

// Set header message of signup $ login pages


    if ($location.path() == "/signUp" || $location.path() == "/" || $location.path() == "/logIn" || $location.path() == "/forgot" || $location.path() == "/reset") {
        disableHeadings();
        $scope.slogan = true;
        $scope.slog = true;
        $scope.slog1 = "Today's Talent.";
        $scope.slog2 = "Tomorrow's Success."
    }
    else

    if ($location.path() == "/guest") {
        $(".appbg").addClass('dashBG');
        var user = {id: 'guest', type: 'guest'};
        $scope.loggedIn = true;
        $http.post('/getPp', user)
            .then(function (res) {

                $scope.image = res.data;


            });

    } else {
        if (authService.isAuthenticated()) {
            var user = session.user;
            $scope.browse = false;
            $scope.type = session.user.type;
            $scope.userType = user.type;
            $(".appbg").addClass('dashBG');
            headings();
        }
        else if ($location.path() != "/" && $location.path() != "/logIn" && $location.path() != "/signUp" && $location.path() != "/activate" && $location.path().indexOf("/reset/") != 0&& $location.path() != "/guest" && $location.path() != "/forgot") {
            //swal({title: "Log in first", type: "error", timer: 2000, showConfirmButton: false});
            $location.url("/logIn");

        }
    }

    function headings() {
        var user = session.user;
        $scope.userType = user.type;
        $scope.loggedIn = true;
        if($scope.userType == 'employer')
        {
            $scope.disableNumApps = true;
        }
        else
        {
            var unlim = false;
            $http.post('/getNumApps', {id:user._id})
                .then(function (res) {
                    var tempNum = res.data.freeApplications;
                    //console.log(res.data);
                    user.packages = res.data.packages;
                    if(user.packages){
                        for(var i = 0; i < user.packages.length; i++){
                            if(user.packages[i].active){
                                if(user.packages[i].remainingApplications == 'unlimited'){
                                    unlim = true;
                                }
                                else{
                                    tempNum += user.packages[i].remainingApplications;

                                }
                            }
                        }

                    }
                    if(unlim){
                        $scope.numApps = 'unlimited';
                    }else
                        $scope.numApps = tempNum;

                });

            var tempPack = user.packages;
        }

        $rootScope.$on('profile', function (re, data) {
            if(cacheUser.user.type == 'student' && session.user.type == 'employer')
            {
                $scope.disableNumApps = true;
            }
            disableHeadings();

            $timeout(function () {
                $scope.cache = data;
                if (cacheUser.user.type == 'student') {
                    $scope.studentProfile = true;

                } else if (cacheUser.user.type == 'employer') {
                    if (cacheUser.user.employerType == 'Individual') {
                        $scope.individualProfile = true;
                    }
                    else if (cacheUser.user.employerType == 'Company') {
                        $scope.companyProfile = true;
                    }



                }
            });
        });

        $rootScope.$on('empHistory', function () {

            disableHeadings();
            $scope.empHistory = true;

        });
        $rootScope.$on('dashboard', function () {
            $scope.disableNumApps = false;
            disableHeadings();
            $scope.empHistory = true;

        });
        $rootScope.$on('browse', function () {

            disableHeadings();
            $scope.browse = true;

        });
        $rootScope.$on('buyApplications', function () {

            disableHeadings();
            $scope.buyApplications = true;


        });
        $rootScope.$on('empBuy', function () {

            disableHeadings();
            $scope.empBuy = true;

        });

        $rootScope.$on('myApplicants', function () {

            disableHeadings();
            $scope.myApplicants = true;

        });

        $rootScope.$on('myApplications', function () {

            disableHeadings();
            $scope.myApplications = true;
        });
        $rootScope.$on('myJobs', function () {

            disableHeadings();
            $scope.myJobs = true;

        });
        $rootScope.$on('myJobHistory', function () {

            disableHeadings();
            $scope.myJobHistory = true;

        });

        $rootScope.$on('jobHistory', function () {
            disableHeadings();
            $scope.jobHistory = true;

        });

        $rootScope.$on('job', function () {
            disableHeadings();
            $scope.job = true;
           /* $timeout(function () {
                $scope.cache = cacheUser.user;
                if (cacheUser.user.type == 'student') {
                    $scope.studentProfile = true;
                }
                else if (cacheUser.user.type == 'employer') {
                    if (cacheUser.user.employerType == 'Individual')
                        $scope.individualProfile = true;
                    else if (cacheUser.user.employerType == 'Company')
                        $scope.companyProfile = true;

                }
            });*/
        });


        $rootScope.$on('postJob', function (re, data) {
            disableHeadings();

            $timeout(function () {
                $scope.cache = session.user;
                if (session.user.type == 'student') {
                    $scope.studentProfile = true;

                } else if (session.user.type == 'employer') {
                    if (session.user.employerType == 'Individual')
                        $scope.individualProfile = true;
                    else if (session.user.employerType == 'Company')
                        $scope.companyProfile = true;

                }
            });
        });

        $http.post('/getPp', user)
            .then(function (res) {
                $scope.image = res.data;
            });

        $scope.myProfile = function () {
            $window.location.href = "/myProfile";
        };
        if (user.type == "student") {
            // Set header message of Dash
            console.log($location.path());
            disableHeadings();
            $timeout(function () {
                $scope.welcoming = true;
                if ($location.path() == "/dashboard") {
                    $scope.welcome = "Welcome ";
                    $scope.talent = user.name.name + "!";
                }
            });
            $scope.getNav = function () {

                return "../views/blocks/studentNav.html";
            }
        }
        else if (user.type == "employer") {
            // Set header message of Dash
            disableHeadings();
            $timeout(function () {
                if ($location.path() == "/dashboard") {
                    $scope.welcoming = true;
                    $scope.welcome = "Welcome ";
                    if (!user.company)
                        $scope.employer = user.contact.name + "!";
                    else
                        $scope.employer = user.company.name + "!";

                }
            });
            $scope.getNav = function () {
                return "../views/blocks/employerNav.html";
            }
        }
    }
        function disableHeadings() {
            $scope.myApplications = false;
            $scope.jobHistory = false;
            $scope.welcoming = false;
            $scope.slogan = false;
            $scope.studentProfile = false;
            $scope.individualProfile = false;
            $scope.companyProfile = false;
            $scope.browse = false;
            $scope.myApplicants = false;
            $scope.myJobs = false;
            $scope.myJobHistory = false;
            $scope.empHistory = false;
            $scope.buyApplications = false;
            $scope.empBuy = false;
            $scope.job = false;
        }






    $scope.$on('auth-login-success',function(){
        
        $timeout(function() {
       headings();
        },200);
    } );





});


app.controller('studentNav',function($scope,$rootScope, $window, session, authService, $cookies, AUTH_EVENTS, $http, $location, $timeout,ModalService){

    var user = session.user;
    $scope.user = user;

    $http
        .post('/setEmailToggle', {id: session.user._id})
        .then(function (res) {
            if(res){
                $scope.emailNoti = !res.data.emailDisable;
                if($scope.emailNoti)
                    $scope.toggle = "fa-toggle-on blueText";
                else
                    $scope.toggle = "fa-toggle-off";
            }
        });

    $scope.gooiHITStudent = function(){
        ModalService.showModal({
            templateUrl: "../views/blocks/studentWorks.html",
            controller: "worksControl"
        }).then(function(modal) {
            // The modal object has the element built, if this is a bootstrap modal
            // you can call 'modal' to show it, if it's a custom modal just show or hide
            // it as you need to.
            modal.element.modal();
        });
    };
    $scope.toggleEmail = function(){
        $scope.emailNoti = !$scope.emailNoti;
        var message;
        if($scope.emailNoti){
            $scope.toggle = "fa-toggle-on blueText";
            message = "enabled";
        }
        if(!$scope.emailNoti){
            $scope.toggle = "fa-toggle-off";
            message = "disabled";
        }

        return $http
            .post('/toggleEmail', {id: session.user._id, emailDisable:!$scope.emailNoti})
            .then(function (res) {
                if(res){
                    swal("Email Notifications Changed", "Your email notifications have been "+message+".", "success");

                }


            });
    };

    if ($location.path() == "/dashboard") {
        $timeout(function() {
            $scope.welcome = "Welcome ";
            $scope.talent = user.name.name + "!";
        });
    }

    $http.post('/getPp', user)
        .then(function (res) {

            $scope.image=res.data;


        });

    $scope.logOut = function() {
        swal({
                title: "Are you sure?", text: "The browser won't remember you next time you log in.",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: "Yes, log out!", closeOnConfirm: false
            },
            function () {
                session.destroy();

                $cookies.remove("user");
                $rootScope.$broadcast(AUTH_EVENTS.logoutSuccess);
                $window.location.href="/";
                swal({title:"You have been logged out.", text: "",showConfirmButton: false});
            });
    };
    $scope.myProfile = function(){
        $window.location.href="/myProfile";
    };



});

app.controller('employerNav',function($scope,$rootScope, $window, session, authService, $cookies, AUTH_EVENTS,$http,$timeout,ModalService){

    var user = session.user;
    $scope.user = user;

    $http
        .post('/setEmailToggle', {id: session.user._id})
        .then(function (res) {
            if(res){
                $scope.emailNoti = !res.data.emailDisable;
                if($scope.emailNoti)
                    $scope.toggle = "fa-toggle-on blueText";
                else
                    $scope.toggle = "fa-toggle-off";
            }
        });

    $scope.gooiHITemployer = function(){
        ModalService.showModal({
            templateUrl: "../views/blocks/employerWorks.html",
            controller: "worksControl"
        }).then(function(modal) {
            // The modal object has the element built, if this is a bootstrap modal
            // you can call 'modal' to show it, if it's a custom modal just show or hide
            // it as you need to.
            modal.element.modal();
        });
    };

    $scope.toggleClicked = function(){
        $scope.emailNoti = !$scope.emailNoti;
    };

    $scope.toggleEmail = function(){
        $scope.emailNoti = !$scope.emailNoti;
        var message;
        if($scope.emailNoti){
            message = "enabled";
            $scope.toggle = "fa-toggle-on blueText";
        }
        if(!$scope.emailNoti){
            message = "disabled";
            $scope.toggle = "fa-toggle-off";
        }

        return $http
            .post('/toggleEmail', {id: session.user._id, emailDisable:!$scope.emailNoti})
            .then(function (res) {
                if(res){
                    swal("Email Notifications Changed", "Your email notifications have been "+message+".", "success");
                }


            });
    };

    $http.post('/getPp', user)
        .then(function (res) {

            $scope.image=res.data;


        });


    $scope.logOut = function() {
        swal({
                title: "Are you sure?", text: "The browser won't remember you next time you log in.",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: "Yes, log out!", closeOnConfirm: false
            },
            function () {
                session.destroy();

                $cookies.remove("user");
                $rootScope.$broadcast(AUTH_EVENTS.logoutSuccess);
                $window.location.href="/";
                swal({title:"You have been logged out.", text: "",showConfirmButton: false});
            });
    };
    $scope.myProfile = function(){
        $window.location.href="/myProfile";
    }

});
