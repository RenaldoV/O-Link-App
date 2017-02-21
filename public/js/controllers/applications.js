/**
 * Created by Sean on 2016/02/29.
 */


app.controller('studentApplications', function ($scope,$http,cacheUser, session, notify,$rootScope, $window,$timeout) {

    $scope.highlightChildren = function(event){
        angular.element(event.currentTarget).children().addClass("hover");
    };
    $scope.unhighlightChildren = function(event){
        angular.element(event.currentTarget).children().removeClass("hover");
    };

    var user = cacheUser.user;
    $scope.user = user;
    $scope.getJob = function(id){
        $window.location.href= '/job?id='+id;
    };
    if(user == session.user) {
        $scope.getApps = function(){
            return "../views/blocks/studentApplication.html";
        };

        $http
            .post('/loadApplications', user)
            .then(function (res) {

                $scope.applications = res.data;
                $.each($scope.applications,function(i,app){
                    app.jobID.post.startingDate = convertDateForDisplay(app.jobID.post.startingDate);
                     $http
                     .post('/getPp', {_id:app.employerID._id})
                     .then(function (res) {

                         app.image = res.data;
                     });
                 });

                $rootScope.$broadcast('myApplications', 1);



                $scope.isDeclined = function(status){
                    if(status == "Declined"){
                        return true;
                    }
                    return false;
                };
                $scope.isProv = function(status){
                    if(status == "Provisionally accepted"){
                        return true;
                    }
                    return false;
                };
                $scope.isPending = function(status){
                    if(status == "Pending"){
                        return true;
                    }
                    return false;
                };
                $scope.isConfirmed = function(status){
                    if(status == "Confirmed"){
                        return true;
                    }
                    return false;
                };

                $scope.accept = function(id, employerID, jobID, job){

                    swal({
                            title: "Are you sure?",
                            text: "This will notify the user and that you have accepted",
                            showCancelButton: true,
                            confirmButtonColor: "#00b488",
                            confirmButtonText: "Yes, I'm sure!",
                            closeOnConfirm: false
                        },
                        function (isConfirm) {
                            if (isConfirm) {
                                $http
                                    .post('/acceptOffer', {_id: id})
                                    .then(function (res, err) {
                                        if(job.post.OtherCategory)
                                            var Cat = job.post.OtherCategory;
                                        else
                                            var Cat = job.post.category;
                                        notify.go({
                                            type: 'accepted',
                                            jobID: jobID,
                                            userID: employerID,
                                            status: 'accepted',
                                            title: Cat
                                        });
                                        swal("Offer accepted.", "The user has been notified.", "success");
                                    });
                                if(--job.positionsLeft == 0) {
                                    //Decline all other applicants not Confirmed
                                    //get all applicants not confirmed or already declined
                                    //console.log("declining all other applicants");
                                    $http
                                        .post('/getAllApplicantsOfJob', {jobID: job._id})
                                        .then(function (res, er) {
                                            var apps = res.data;
                                            $.each(apps, function (i, app) {
                                                declineAll(app._id, $http, notify, app.studentID, job);
                                            });
                                            $timeout(function(){
                                                location.reload();
                                            },2000);

                                        });

                                }
                                else{
                                    $timeout(function(){
                                        location.reload();
                                    },2000);
                                }
                            }
                        });

                };

                $scope.decline = function(id, employerID, jobID, job){
                    swal({
                            title: "Are you sure?",
                            text: "This will notify the user and that you have withdrawn",
                            showCancelButton: true,
                            confirmButtonColor: "#DD6B55",
                            confirmButtonText: "Yes, I'm sure!",
                            closeOnConfirm: false
                        },
                        function (isConfirm) {

                            if (isConfirm) {
                                $http
                                    .post('/declineOffer', {_id: id,job:job})
                                    .then(function (res, err) {
                                        if(job.post.OtherCategory)
                                            var Cat = job.post.OtherCategory;
                                        else
                                            var Cat = job.post.category;


                                        notify.go({
                                            type: 'withdrawn',
                                            jobID: jobID,
                                            userID: employerID,
                                            status: 'withdrawn',
                                            title: Cat
                                        });
                                        swal({
                                                title: "Offer declined.",
                                                text: "The user has been notified."
                                            },
                                            function(){
                                                setTimeout(function(){
                                                    location.reload();
                                                }, 2000);
                                            });
                                    });
                            }
                        });

                };

                $scope.withdraw = function(app, job){
                    swal({
                            title: "Are you sure?",
                            text: "This will pull your application from the system",
                            showCancelButton: true,
                            confirmButtonColor: "#DD6B55",
                            confirmButtonText: "Yes, I'm sure!",
                            closeOnConfirm: false
                        },
                        function (isConfirm) {

                            if (isConfirm) {
                                $http
                                    .post('/withdrawChanges', {app: app,job:job})
                                    .then(function (res, err) {
                                        if(job.post.OtherCategory)
                                            var Cat = job.post.OtherCategory;
                                        else
                                            var Cat = job.post.category;
                                        notify.go({
                                            type: 'withdrawn',
                                            jobID: job._id,
                                            userID: app.employerID,
                                            status: 'withdrawn',
                                            title: Cat
                                        });
                                        swal("Offer withdrawn.", "", "success");
                                        location.reload();
                                    });
                            }
                        });
                };

                $scope.acceptChanges = function(app){
                    alert(app);
                    $http
                        .post('/acceptChanges', {app: app})
                        .then(function (res, err) {

                            swal("Changes accepted.", "", "success");
                            location.reload();

                        });
                };
                if($scope.applications.length == 0)
                {
                    $scope.message = "You haven't applied for any jobs.";
                }


            });
    }
    else if(session.user.type == 'employer'){

        $http
            .post('/loadApplicationsTo', session.user)
            .then(function (res) {

              if(res.data.length == 0)
                    $scope.message = "Has yet to apply to any of your job posts.";

                $scope.applications = res.data;
                $scope.isDisabled = function(status){
                    if(status != "Declined"){
                        return false;
                    }
                    return true;
                };



                $scope.changeStatus = function(app, oldstat) {

                    changeStatus(app,oldstat, $scope, $http, notify, app.studentID._id);
                };

            });
    }
    else{

        $scope.message = "You are not allowed to view other students' applications.";
    }

    $scope.offer = function(id, studentID, jobID, category){
        swal({
                title: "Are you sure?",
                text: "This will notify the user and he will accept or decline",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: "Yes, I'm sure!",
                closeOnConfirm: false
            },
            function (isConfirm) {

                if (isConfirm) {
                    $http
                        .post('/makeOffer', {_id: id})
                        .then(function (res, err) {
                            notify.go({
                                type: 'offer',
                                jobID: jobID,
                                userID: studentID,
                                status: 'offered',
                                title: category
                            });
                            swal("Offer made.", "The user has been notified.", "success");
                            location.reload();

                        });
                }
            });

    }


});

app.controller('myApplications', function ($scope,$http,cacheUser, session) {

    var user = session.user;
    cacheUser.user = user;
    $scope.user = user;

        $scope.getApps = function () {
            return "../views/blocks/studentApplication.html";
        };
        $http
            .post('/loadApplications', user)
            .then(function (res) {

                $scope.applications = res.data;
                if($scope.applications.length == 0)
                {
                    $scope.message = "You haven't applied for any jobs.";
                }



            });

});



app.controller('employerApplicants', function ($scope,$http,cacheUser, session, $location, notify, $rootScope,$window) {

    $scope.highlightChildren = function(event){
        angular.element(event.currentTarget).children().addClass("hover");
    };
    $scope.unhighlightChildren = function(event){
        angular.element(event.currentTarget).children().removeClass("hover");
    };
    var user = session.user;
    $scope.user = user;

    var temp = $location.url();

    $rootScope.$broadcast('myApplicants', 1);


        $http
            .post('/loadApplicantsJobs', user)
            .then(function (res) {
                $scope.jobs = res.data;
                $scope.applications = {};
                $scope.hasApps = false;
                $scope.jobs.forEach(function(job){
                    job.post.startingDate = convertDateForDisplay(job.post.startingDate);
                    $http
                        .post('/loadApplicants', {jobID : job._id})
                        .then(function(res) {
                            job.applications = res.data;
                            job.applications.forEach(function(app){
                                $scope.hasApps = true;
                                $http
                                    .post('/getPp', {_id:app.studentID._id})
                                    .then(function (res) {
                                        app.image = res.data;
                                    });
                                $scope.gotoProfile = function(){
                                    $location.url("/profile?user="+app.studentID._id);
                                };
                                console.log(app.studentID);
                                app.distance = distance(app.studentID.location.geo.lat,app.studentID.location.geo.lng,job.post.location.geo.coordinates[1],job.post.location.geo.coordinates[0]);
                            });
                        });
                });
                $scope.message = "There are no applicants to display.";
                $scope.toggleApplicants = function(id){
                    $.each($scope.jobs, function(idx,job){
                       if(job._id == id){
                           if(job.show == undefined){
                               job.show = true;
                           }
                           else job.show = !job.show;
                       }
                    });
                };
                function toggleAll(){
                    $.each($scope.jobs, function(idx,job){
                        if(job.show == undefined){
                            job.show = true;
                        }
                        else job.show = !job.show;
                    });
                }
                function distance(lat1, lon1, lat2, lon2) {
                    var radlat1 = Math.PI * lat1/180;
                    var radlat2 = Math.PI * lat2/180;
                    var theta = lon1-lon2;
                    var radtheta = Math.PI * theta/180;
                    var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
                    dist = Math.acos(dist);
                    dist = dist * 180/Math.PI;
                    dist = dist * 60 * 1.1515;
                    dist = dist * 1.609344;

                    return Math.round( dist * 10 ) / 10;
                }
                temp = temp.replace("/applicants?jobID=", '');
                if(temp != '/applicants'){
                    $scope.toggleApplicants(temp);
                }
                else {
                    toggleAll();
                }
                $scope.getAge = function (d) {
                    var today = new Date();
                    var todayYear = today.getFullYear();
                    var todayMonth = today.getMonth();
                    var todayDate = today.getDate();
                    var dob = new Date(d);
                    var dobYear = dob.getFullYear();
                    var dobMonth = dob.getMonth();
                    var dobDate = dob.getDate();
                    var yearsDiff = todayYear - dobYear ;
                    var age;
                    if ( todayMonth < dobMonth )
                    {
                        age = yearsDiff - 1;
                    }
                    else if ( todayMonth > dobMonth )
                    {
                        age = yearsDiff ;
                    }
                    else //if today month = dob month
                    { if ( todayDate < dobDate )
                    {
                        age = yearsDiff - 1;
                    }
                    else
                    {
                        age = yearsDiff;
                    }
                    }
                    return age;
                };

                $scope.isDisabled = function(status){
                    if(status != "Declined"){
                        return false;
                    }
                    return true;
                };
                $scope.getApplicant = function(id) {
                    $window.location.href= '/profile?user='+id;
                };

                $scope.isDeclined = function(status){
                    if(status == "Declined"){
                        return true;
                    }
                    return false;
                };
                $scope.isProv = function(status){
                    if(status == "Provisionally accepted"){
                        return true;
                    }
                    return false;
                };
                $scope.isPending = function(status){
                    if(status == "Pending"){
                        return true;
                    }
                    return false;
                };
                $scope.isConfirmed = function(status){
                    if(status == "Confirmed"){
                        return true;
                    }
                    return false;
                };
            });


    $scope.decline = function(ap, job){
        var app = jQuery.extend(true, {}, ap);
        app.status = "Declined";
        $scope.col = '#DD6B55';
        changeStatus(app, 'Pending', $scope,$http,notify,app.studentID._id,job);
    };
    $scope.makeOffer = function(ap, job){
        var app = jQuery.extend(true, {}, ap);
        app.status = "Provisionally accepted";
        $scope.col = '#00b488';
        changeStatus(app,  'Pending', $scope, $http,notify, app.studentID._id,job);
    };
    $scope.offer = function(id, studentID, jobID, category){
        swal({
                title: "Are you sure?",
                text: "This will notify the user and he will accept or decline",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: "Yes, I'm sure!",
                closeOnConfirm: false
            },
            function (isConfirm) {

                if (isConfirm) {
                    $http
                        .post('/makeOffer', {_id: id})
                        .then(function (res, err) {
                            notify.go({
                                type: 'offer',
                                jobID: jobID,
                                userID: studentID,
                                status: 'offered',
                                title: category
                            });
                            swal("Offer made.", "The user has been notified.", "success");
                            location.reload();

                        });
                }
            });

    }
});



function declineAll(appID, $http, notify, studentID, job){
    $http
        .post('/updateApplication', {_id: appID, status: "Declined", jobID: job._id})
        .then(function (err, res) {
            if(job.post.OtherCategory)
                var Cat = job.post.OtherCategory;
            else
                var Cat = job.post.category;

            notify.go({
                type: 'status change',
                jobID: job._id,
                userID: studentID,
                status: "Declined",
                title: Cat
            });


        });
}

function changeStatus(app,oldstat, $scope, $http, notify, userID, job) {
    var check = false;
    if($scope.col){
        var col = $scope.col;
    }
    else var col = "#00b488";

    if(app.status == "Provisionally accepted" && job.provisionalLeft == 1){
        var text = "This will change the status of this application from " + oldstat + " to " + app.status + ". After making this offer you will not be allowed to make any more offers for this job.";
        var title = "Warning!";
    }
    else{
        var text = "This will change the status of this application from " + oldstat + " to " + app.status;
        var title = "Are you sure?";
    }
    swal({
            title: title,
            text: text,
            showCancelButton: true,
            confirmButtonColor: col,
            confirmButtonText: "Yes, I'm sure!",
            closeOnConfirm: true
        },
        function (isConfirm) {

            delete $scope.col;
            if (isConfirm) {
                $http
                    .post('/updateApplication', {_id: app._id, status: app.status, jobID: job._id})
                    .then(function (err, res) {
                        if(job.post.OtherCategory)
                            var Cat = job.post.OtherCategory;
                        else
                            var Cat = job.post.category;

                        notify.go({
                            type: 'status change',
                            jobID: job._id,
                            userID: userID,
                            status: app.status,
                            title: Cat
                        });
                        swal("Status updated.", "The user has been notified.", "success");
                        location.reload();

                    });

            }

        }
    );
}