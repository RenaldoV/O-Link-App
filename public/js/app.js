///////////////////////////////////////////////////////
//////////Front-end entry and dash controllers/////////
///////////////////////////////////////////////////////

var app = angular.module('o-link', ['ng','ngCookies','lr.upload','ngRoute','appRoutes','ngFileUpload','ngImgCrop', 'ngDialog','infinite-scroll','toggle-switch','ui.date','ui.validate','google.places','ui.bootstrap', 'rzModule', 'angularjs-dropdown-multiselect','angular-loading-bar','mgo-angular-wizard','angularModalService','thatisuday.ng-image-gallery','jkAngularRatingStars']);
//Starts when the app starts

app.config(function(ngImageGalleryOptsProvider){
    ngImageGalleryOptsProvider.setOpts({
        thumbnails  :   true,
        inline      :   false,
        imgBubbles  :   false,
        bgClose     :   true,
        bubbles     :   true,
        imgAnim     :   'fade'
    });
});
app.run(function($cookies,$rootScope, session, authService, AUTH_EVENTS, rate){

    if ($cookies.get("user")){
        session.create(JSON.parse($cookies.get("user")));
        $rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
    }




});

//feed on student dashboard
app.controller('jobFeed', function($scope,$http, $window){

    $http({
        method  : 'POST',
        url     : '/jobFeeder'
    })
        .then(function(res) {
            {

                var jobs = res.data;
                //console.log(jobs);
                //console.log(jobs.length);
                var len = jobs.length;
                $.each(jobs,function(i,job){


                    $http
                        .post('/getPp', {_id:job.employerID._id})
                        .then(function (res) {

                            job.image = res.data;


                        });
                });
                $scope.jobs = jobs;


                $scope.getPer = function(cat){
                if(cat == "Once Off"){
                    return "hr";
                }
                    else return "hr"
            }

            }
        });

    $scope.getPp = function(pp){

    };
    $scope.getJob = function(id){
        $window.location.href= '/job?id='+id;
    };

});

app.controller('galleryControll', function($scope,$http, $window,session){

    $http
        .post('/getPp', {_id:"580defccf2385c8c13221527"})
        .then(function (res) {
            $scope.image = res.data
            $scope.images = [
                {
                    url : "data:image/png;base64,"+$scope.image
                },
                {
                    url : 'https://pixabay.com/static/uploads/photo/2016/06/10/22/25/ortler-1449018_960_720.jpg'
                },
                {
                    thumbUrl : 'https://pixabay.com/static/uploads/photo/2016/04/11/18/53/aviator-1322701__340.jpg',
                    url : 'https://pixabay.com/static/uploads/photo/2016/04/11/18/53/aviator-1322701_960_720.jpg'
                }
            ];
            console.log($scope.images);
        });


});

app.controller('worksControl',function($scope,$element,close,WizardHandler,$window,$location){

    $scope.dismissModal = function() {
        $element.modal('hide');
        close(null,200); // close, but give 200ms for bootstrap to animate
        if($location.url().replace("/dashboard", '') == "?tutorial=true"){
            $window.location = "/dashboard";
        }
    };

    $scope.goNext = function(){
        WizardHandler.wizard().next();
    };
    $scope.goBack = function(){
        WizardHandler.wizard().previous();
    };

});


//controller for all dashboards
app.controller('dashControl',function($scope,ModalService, authService, session, rate, $http, $window,$location){

    var temp = $location.url();
    temp = temp.replace("/dashboard", '');

    function studentBoxes(arr, i){

        rate.makeStudentBox(arr[i], function(res){
            if(i < arr.length -1)
            {
                studentBoxes(arr, ++i);
            }
        });

    }


    $(".appbg").removeClass('signupBG');

    if(authService.isAuthenticated()){
        var user = session.user;
        if(user.type == "student")
        {
            if(temp == "?tutorial=true"){
                    // Just provide a template url, a controller and call 'showModal'.
                    ModalService.showModal({
                        templateUrl: "../views/blocks/studentWorks.html",
                        controller: "worksControl"
                    }).then(function(modal) {
                        // The modal object has the element built, if this is a bootstrap modal
                        // you can call 'modal' to show it, if it's a custom modal just show or hide
                        // it as you need to.
                        modal.element.modal();
                    });
            }
            $scope.getDash= function() {
                return "../views/blocks/studentDash.html";
            }
        }
        else if(user.type == "employer"){
            if(temp == "?tutorial=true"){
                    // Just provide a template url, a controller and call 'showModal'.
                    ModalService.showModal({
                        templateUrl: "../views/blocks/employerWorks.html",
                        controller: "worksControl"
                    }).then(function(modal) {
                        // The modal object has the element built, if this is a bootstrap modal
                        // you can call 'modal' to show it, if it's a custom modal just show or hide
                        // it as you need to.
                        modal.element.modal();
                    });
            }
            $http
                .post('/getRatingDataForEmployer', {id: user._id})
                .then(function (res) {

                    var notifications = res.data;
                    if(notifications.length>0)
                    studentBoxes(notifications,0);
                });
            $scope.getDash= function() {
                return "../views/blocks/employerDash.html";
            }
        }
    }
    else
    {
        $scope.getDash= function() {
            return "../views/blocks/guestDash.html";
        };
    }

    $scope.$on('auth-login-success',function(){
        var user = session.user;
        if(user.type == "student")
        {
            $scope.getDash= function() {
                return "../views/blocks/studentDash.html";
            }}
        else if(user.type == "employer"){
            $scope.getDash= function() {
                return "../views/blocks/employerDash.html";
            }
        }
    } );


    });

//dashboard selection box for browsing jobs
app.controller('goBrowse',function($scope, $location, constants, $timeout, $window){



    $scope.categories = constants.categories;
    $scope.timePeriods = constants.timePeriods;
        $scope.selectionC = [];
    $scope.selectionP = [];

    $scope.allCat = "Select All";
    $scope.allPer = "Select All";


    $scope.toBrowser = function(){
        var dat = {};
        dat.timePeriods = [];
        for(var i = 0; i < $scope.timePeriods.length; i++){
            dat.timePeriods.push($scope.timePeriods[i].name);
        }
        dat.categories = $scope.categories;
        var parm = $.param(dat);
        $window.location.href = '/browseJobs?'+ parm;
    };

    $scope.selectAllP = function(){
        if(!$('#selectAllP').is(':checked')){
            $timeout(function () {
                $('.periods').each(function(){
                    if(!$(this).is(':checked')){
                        $(this).trigger('click');
                        $scope.allPer = "Unselect All";
                    }
                });
            });
        }else {
            $timeout(function () {
                $('.periods').each(function(){
                    if($(this).is(':checked')){
                        $(this).trigger('click');
                        $scope.allPer = "Select All";
                    }
                });
            });
        }

    };
    $scope.selectAllC = function(){

        if(!$('#selectAllC').is(':checked')){
        $timeout(function () {
            $('.categories').each(function(){
                if(!$(this).is(':checked')){
                    $(this).trigger('click');
                    $scope.allCat = "Unselect All";
                }
            });
        });
        }else {
            $timeout(function () {
                $('.categories').each(function(){
                    if($(this).is(':checked')){
                        $(this).trigger('click');
                        $scope.allCat = "Select All";
                    }
                });
            });
        }

    };

    $scope.toggleSelectionP = function(category) {

        var idx = $scope.selectionP.indexOf(category);

        // is currently selected
        if (idx > -1) {
            $scope.selectionP.splice(idx, 1);
            if($scope.selectionP.length == $scope.timePeriods.length - 1 && $('#selectAllP').is(':checked')) {
                angular.element('#selectAllP').trigger('click');
                $scope.allPer = "Select All";
            }
        }

        // is newly selected
        else {
            $scope.selectionP.push(category);
            if($scope.selectionP.length == $scope.timePeriods.length && !$('#selectAllP').is(':checked')) {
                angular.element('#selectAllP').trigger('click');
                $scope.allPer = "Unselect All";
            }
        }
    };
    $scope.toggleSelectionC = function(category) {

        var idx = $scope.selectionC.indexOf(category);

        // is currently selected
        if (idx > -1) {
            $scope.selectionC.splice(idx, 1);
            if($scope.selectionC.length == $scope.categories.length - 1 && $('#selectAllC').is(':checked')){
                angular.element('#selectAllC').trigger('click');
                $scope.allCat = "Select All";
            }

        }

        // is newly selected
        else {
            $scope.selectionC.push(category);
            if($scope.selectionC.length == $scope.categories.length && !$('#selectAllC').is(':checked')){
                angular.element('#selectAllC').trigger('click');
                $scope.allCat = "Unselect All";
            }
        }
    };

    $scope.submit = function () {
        if($location.url() == '/guest'){
            window.location = '/logIn';
        }

        var dat = {};
        dat.timePeriods = $scope.selectionP;
        dat.categories = $scope.selectionC;
        var parm = $.param(dat);
        $window.location.href= '/browseJobs?'+ parm;

        var temp = JSON.stringify($scope.selectionC);
        var temp2 = JSON.stringify($scope.selectionP);


    }

});

//employer dash jobs and /myJobs' controller
app.controller('myJobFeed', function($scope,$http, session, $window, $location, $rootScope){

    var user = session.user;
    $scope.message = "You have no open job offers to display.";
    $scope.highlightChildren = function(event){
        angular.element(event.currentTarget).children().addClass("hover");
    };
    $scope.unhighlightChildren = function(event){
        angular.element(event.currentTarget).children().removeClass("hover");
    };

    if($location.path() == "/myJobPosts"){
        $rootScope.$broadcast('myJobs',user);
    }
    $http({
        method  : 'POST',
        url     : '/myJobFeeder',
        data : {id: user._id}
    })
        .then(function(res) {
            {
                $scope.jobs = res.data;
                $.each($scope.jobs, function(key,value){
                    if(!value.applicants)
                    {
                        value.applicants=[];
                    }
                    value.post.startingDate = convertDateForDisplay(value.post.startingDate);
                });
            }
        });
    $scope.getJob = function(id){
        $window.location.href= '/job?id='+id;
    };
});

//controller for boxes on dash
app.controller('stats', function($scope,$http, session, $location){
    if($location.path() == "/guest")
    {
        var user = {id:'guest', type:'guest'}
    }
    else{
    var user = session.user;
    }
    var temp = {id: user._id, type: user.type };
    $http
        .post('/getStats', temp)
        .then(function (res, err) {
            //console.log(res.data);
            $scope.stats = res.data;
        });

});

