///////////////////////////////////////////////////////
//////Controllers for the job related activities///////
///////////////////////////////////////////////////////

app.controller('postJob',function($scope, $http, $window, authService, session, $compile, $location, constants, notify, $rootScope){

    $('#startTime').timepicker({ 'step': 15  , 'minTime' : '05:00am'});
    $('#endTime').timepicker({ 'step': 15});

    $('#startTime').on('changeTime', function() {
        $('#endTime').timepicker({'minTime' : $(this).val(), 'step' : 15});
    });

    $scope.changeTimePeriod = function(){
        $scope.job.post.startingDate = "";
        $scope.job.post.endDate = "";
    };
    $scope.clickCommPer = function(){
        $scope.job.post.comPer = "Per ";
    };
    $scope.blurCommPer = function(){
            $scope.job.post.comPer = "";
    };

    $scope.startDate = {
        dateFormat: "dd/mm/yy",
        changeMonth: true,
        changeYear: true,
        minDate: 1,
        numberOfMonths: 1,
        onSelect: function(selected) {
            $scope.job.post.endDate = "";
            var tmp = selected.split("/");
            tmp = new Date(tmp[2],tmp[1] -1,tmp[0]);

            switch ($scope.job.post.timePeriod){
                case 'Short Term':
                {
                    var date1 = new Date(tmp.getFullYear(), tmp.getMonth(), tmp.getDate() + 8);
                    var date2 = new Date(tmp.getFullYear(), tmp.getMonth(), tmp.getDate() + 30);
                    $scope.endDate = {
                        dateFormat: "dd/mm/yy",
                        changeMonth: true,
                        changeYear: true,
                        minDate : date1,
                        maxDate : date2,
                        onSelect: function(selected){
                            var tmp = new Date(selected);
                        }
                    };
                    break;
                }
                case 'Long Term':
                {
                    var date1 = new Date(tmp.getFullYear(), tmp.getMonth(), tmp.getDate()+ 31);
                    $scope.endDate = {
                        dateFormat: "dd/mm/yy",
                        changeMonth: true,
                        changeYear: true,
                        minDate : date1,
                        maxDate: null,
                        onSelect: function(selected){
                            var tmp = new Date(selected);

                        }
                    };
                    break;
                }
                case 'Once Off':
                {
                    var date1 = new Date(tmp.getFullYear(), tmp.getMonth(), tmp.getDate());
                    var date2 = new Date(tmp.getFullYear(), tmp.getMonth(), tmp.getDate() + 7);
                    $scope.endDate = {
                        dateFormat: "dd/mm/yy",
                        changeMonth: true,
                        changeYear: true,
                        minDate : date1,
                        maxDate: date2,
                        onSelect: function(selected){
                            var tmp = new Date(selected);

                        }
                    };
                    break;
                }
            }
        }
    };

    $scope.autocompleteOptions = {
        componentRestrictions: { country: 'za' }
    };
    var geocoder = new google.maps.Geocoder();
    $scope.$on('g-places-autocomplete:select', function (event, param) {
        $scope.job.post.location ={};
        $scope.job.post.location.address = param.formatted_address;
        geocoder.geocode({'address': $scope.job.post.location.address}, function(results, status) {
            if (status === google.maps.GeocoderStatus.OK) {
                $scope.job.post.location.geo = {type:"Point", coordinates:[results[0].geometry.location.lng(),results[0].geometry.location.lat()]};
                //console.log($scope.job.post.location.geo);
            } else {
                console.log('Geocode was not successful for the following reason: ' + status);
            }
        });
    }); // Save location and geometry


    if(!authService.isAuthenticated())
        $window.location.href= '/';
    if(session.user.type != 'employer')
        $window.location.href= '/';

    $rootScope.$broadcast('postJob', 1);
    var categories = constants.categories.slice(0);
    $scope.timePeriods = constants.timePeriods;
    $scope.categories = constants.categories;
    $scope.reqNames = constants.requirements.splice(0,constants.requirements.length-1);
    $scope.expNames = categories.splice(0,categories.length-1);



    //remove requirement from selectable if selected
    var tempReqList = [];
    for(var k = 0; k < $scope.reqNames.length;k++){
        tempReqList.push($scope.reqNames[k]);
    }
    $scope.tempReq = tempReqList;
    $scope.changeSub = function(){


        tempReqList = [];
        for(var k = 0; k < $scope.reqNames.length;k++){
            tempReqList.push($scope.reqNames[k]);
        }

        for(var i = 0; i < $scope.job.post.requirements.length; i++) {
            if ($scope.job.post.requirements[i].name) {

                tempReqList.splice(tempReqList.indexOf($scope.job.post.requirements[i].name), 1);
                $scope.tempReq = tempReqList;


            }
        }
    };

    //remove experience from selectable if selected
    var tempExpList = [];
    for(var l = 0; l < $scope.expNames.length;l++){
        tempExpList.push($scope.expNames[l]);
    }
    $scope.tempExp = tempExpList;
    $scope.changeExp = function(){


        tempExpList = [];
        for(var k = 0; k < $scope.expNames.length;k++){
            tempExpList.push($scope.expNames[k]);
        }

        for(var i = 0; i < $scope.job.post.experience.length; i++) {
            if ($scope.job.post.experience[i].category) {

                tempExpList.splice(tempExpList.indexOf($scope.job.post.experience[i].category), 1);
                $scope.tempExp = tempExpList;


            }
        }
    };



    var reqCount = 0;
    //add requirement

    var btnGrp = $("#reqButtonGrp");
    var inputGrp = $("#reqInputs");

    var now = new Date();

    var user = session.user;
   // console.log(user._id);
    $scope.job = {};
    $scope.job.post = {};
    $scope.job.post.requirements = [];
    $scope.job.post.experience = [];
    $scope.job.employerID = user._id;

    $scope.close = function(reqs){

       $scope.job.post.requirements.pop();
    };
    $scope.add = function(){

        if(!$scope.job.post.requirements){
            $scope.job.post.requirements = [{}];
        }else
            $scope.job.post.requirements.push({});

    };

    $scope.closeExp = function(reqs){
       $scope.job.post.experience.pop();
    };
    $scope.addExp = function(){
        if(!$scope.job.post.experience){
            $scope.job.post.experience = [{}];
        }else
           $scope.job.post.experience.push({});

    };

    var temp = $location.url();

    if(temp.indexOf("/postJob?id=") > -1) {
        temp = temp.replace("/postJob?id=", '');
        if (temp.trim() != '') {


            $http({
                method: 'POST',
                url: '/getJob',
                data: {id: temp}
            })
                .then(function (res) {

                    $scope.job = res.data;
                    $scope.job.post.startingDate = null;
                    $scope.job.post.endDate = null;
                });
        }
    }

    $scope.submitForm = function () {


        $scope.submitted = true;
        if ($scope.jobForm.$valid) {
            $scope.disableBtns = true;
            var job = jQuery.extend(true, {}, $scope.job);
            job.post.startingDate = new Date(job.post.startingDate.getFullYear(), job.post.startingDate.getMonth(), job.post.startingDate.getDate() + 1);

            if (job.post.endDate)
                job.post.endDate = new Date(job.post.endDate.getFullYear(), job.post.endDate.getMonth(), job.post.endDate.getDate() + 1);


            if (!$scope.job.status) {
                $scope.job.employerID = user._id;
                //console.log(job);

            job.post.spotsAvailable = Number(job.post.spotsAvailable);
            job.post.threshold = Number(job.post.threshold);
                job.status = 'active';
                $http({
                    method: 'POST',
                    url: '/jobPoster',
                    data: job
                })
                    .then(function (response) {
                        {
                            swal({title: "Posted", type: "success", timer: 2000, showConfirmButton: false});
                            $location.url("/dashboard");
                        }
                    });
            }
            else if ($scope.job.status == 'inactive' || $scope.job.status == 'Completed') {

                delete job._id;
                delete job.applicants;

                job.status = 'active';
                $http({
                    method: 'POST',
                    url: '/jobPoster',
                    data: job
                })
                    .then(function (response) {
                        {
                            swal({title: "Reposted", type: "success", timer: 2000, showConfirmButton: false});
                            $location.url("/myJobPosts");
                        }
                    });
            }
            else if ($scope.job.status == 'active' || $scope.job.status == 'filled') {

                swal({
                        title: "Are you sure?",
                        type: "input",
                        text: "This update your post and notify all applicants. Please type your password to confirm",
                        showCancelButton: true,
                        confirmButtonColor: "#00b488",
                        confirmButtonText: "Yes, I'm sure!",
                        closeOnConfirm: false
                    },
                    function (inputValue) {

                        $http
                            .post('/checkPassword', {email: user.contact.email, password: inputValue})
                            .then(function (res, err) {

                                if (!res.data) {
                                    swal.showInputError("Incorrect Password!");
                                    return false;
                                }
                                else {
                                    var applicants = $scope.job.applicants;
                                    delete job.applicants;
                                    job.status = 'active';

                                    $http({
                                        method: 'POST',
                                        url: '/jobUpdate',
                                        data: {job: job}
                                    })// send mails to all applicants
                                        .then(function (response) {
                                            {
                                                var apps = response.data;
                                                apps.forEach(function(app){
                                                    var usr = app.studentID;
                                                    var emp = app.employerID;
                                                    var args = {};
                                                    if($scope.job.post.OtherCategory)
                                                        args.category = $scope.job.post.OtherCategory;
                                                    else
                                                        args.category = $scope.job.post.category;

                                                    notify.go({
                                                        type: 'jobEdited',
                                                        jobID: $scope.job._id,
                                                        userID: app.studentID._id,
                                                        status: 'edited',
                                                        title: args.category
                                                    });
                                                    if (usr.emailDisable == undefined || !usr.emailDisable) {
                                                        var mail = "";
                                                        //set applicant's name parameter
                                                        args.student = usr.name.name;
                                                        switch (app.status){
                                                            case "Pending":{
                                                                args.pending = "You have 24 hours to either accept the changes or withdraw your application.";
                                                                break;
                                                            }
                                                            case "Confirmed":{
                                                                args.confirmed = "You have 24 hours to either accept the changes or withdraw your commitment.";
                                                                break;
                                                            }
                                                            case "Provisionally accepted":{
                                                                args.prov = "You now have 24 hours to either commit to the job or withdraw your application.";
                                                                break;
                                                            }
                                                        }
                                                        if(isVowel(args.category))
                                                            var article = "an ";
                                                        else
                                                            var article = "a ";
                                                        args.subject = "Job Offer to Work as " + article + args.category + " has been Edited - You have 24 hours to respond to the changes";
                                                        args.link = 'http://' + location.host + '/job?id=' + job._id;
                                                        args.email = usr.contact.email;
                                                        args.employer = emp.contact.name + " " + emp.contact.surname;
                                                        args.date = convertDateForDisplay(app.jobID.post.startingDate);

                                                        $http
                                                            .post('/sendEmail', {args : args, template : 'jobEditedTalent', id : usr._id})
                                                            .then(function(res){
                                                                //console.log("sent to : " + args.student);
                                                            });
                                                    }

                                                });
                                                swal({
                                                    title: "Edited",
                                                    type: "success",
                                                    timer: 2000,
                                                    showConfirmButton: false
                                                });
                                                $location.url("/myJobPosts");
                                            }
                                        });

                                }

                            });
                    });
            }
        }
    };


});

app.controller('jobBrowser',function($scope, $location, $http, $rootScope, session, constants, $timeout){
    //=======================================================================
    //====================Mobile
    //========================================================================
    //==========filter box functionality
    $scope.hideFilter = true;
    $scope.glyphForDropdown = "glyphicon-chevron-down";
    $scope.hideMobiFilter = function(){
        if($scope.hideFilter){
            $scope.hideFilter = false;
            $scope.glyphForDropdown = "glyphicon-chevron-up";
        }
        else{
            $scope.hideFilter = true;
            $scope.glyphForDropdown = "glyphicon-chevron-down";
        }
    };
    //=======================================================================

    var radius = 15;
    //=======================================================================
    //====================Filter box init
    //========================================================================
    $scope.slider = {
        rangeSlider: 0,
        minValue: 15,
        options: {
            floor: 0,
            ceil: 30,
            minLimit: 2,
            showSelectionBar: true,
            translate: function(value, sliderId, label) {
                switch (label) {
                    case 'model':
                    {
                        if(value >= 30 || value <= 0)
                            return '<b>' + value +'+</b>  kms';
                        else
                            return '<b>' + value +'</b>  kms';
                    }

                    case 'floor':
                        return "<b>" + value + "</b>km and";
                    default:
                        return value + "+ kms";
                }
            },
            onEnd: function() {
                var x = $scope.slider.minValue;
                rad = x;
                //console.log(x + ' km');
                //=======================================================================
                //====================Call apply filter here (range is 1km - "x"km)
                //========================================================================
                radius = x;
            applyFilters();
            }
        }
    };

    //Filter function
    function applyFilters(geo){
        if(radius == 30)
            radius = null;

        var data = {};
        data.categories = [];
        data.timePeriods = [];
        for(var i = 0; i < $scope.catModel.length; i++){
            data.categories.push($scope.catModel[i].id);
        }
        for(var i = 0; i < $scope.timeModel.length; i++){
            data.timePeriods.push($scope.timeModel[i].id);
        }
        if(radius){
            data.radius = radius;
        if(!geo)
                data.userLocation = session.user.location.geo;
        else
            data.userLocation = geo;
        }
       getJobs(data);
    }


    $scope.autocompleteOptions = {
        componentRestrictions: { country: 'za' }
    };
    var geocoder = new google.maps.Geocoder();
    $scope.$on('g-places-autocomplete:select', function (event, param) {
        $scope.resAddress = param.formatted_address;
        $scope.resAddress = $scope.resAddress.split(/,(.+)?/)[0];
        if($scope.resAddress.length > 26)
        {
            $scope.resAddress = $scope.resAddress.substring(0,24)+"...";
        }
        geocoder.geocode({'address':param.formatted_address}, function(results, status) {
            if (status === google.maps.GeocoderStatus.OK) {
                swal({
                        title: "Are you sure?",
                        type: "input",
                        text: "This will change your residential address. Please type your password to confirm.",
                        showCancelButton: true,
                        confirmButtonColor: "#00b488",
                        confirmButtonText: "Yes, I'm sure!",
                        closeOnConfirm: false
                    },
                    function (inputValue) {

                        $http
                            .post('/checkPassword', {email: session.user.contact.email, password: inputValue})
                            .then(function (res, err) {
                               // console.log(res.data);
                                if (!res.data) {
                                    $scope.resAddress = session.user.location.address;
                                    $scope.resAddress = $scope.resAddress.split(/,(.+)?/)[0];
                                    if($scope.resAddress.length > 26)
                                    {
                                        $scope.resAddress = $scope.resAddress.substring(0,24)+"...";
                                    }
                                    swal.showInputError("Incorrect Password!");
                                    return false;
                                }
                                else {
                                    $scope.resAddress = param.formatted_address;
                                    $scope.resAddress = $scope.resAddress.split(/,(.+)?/)[0];
                                    if($scope.resAddress.length > 26)
                                    {
                                        $scope.resAddress = $scope.resAddress.substring(0,24)+"...";
                                    }
                                    var usr = {_id: session.user._id, location:{geo:{lng:results[0].geometry.location.lng(),lat:results[0].geometry.location.lat()},address :param.formatted_address}};
                                    var tmp = session.user;
                                    tmp.location = {geo:{lng:results[0].geometry.location.lng(),lat:results[0].geometry.location.lat()},address :param.formatted_address};
                                    $http({
                                        method: 'POST',
                                        url: '/updateUser',
                                        data: usr
                                    })
                                        .then(function (response) {
                                            {
                                                swal({
                                                    title: "Edited",
                                                    type: "success",
                                                    timer: 2000,
                                                    showConfirmButton: false
                                                });
                                                session.update(tmp, function(t){
                                                    applyFilters(usr.location.geo);
                                                });
                                                //=======================================================================
                                                //Call apply filter here with new location info if other filters have been applied
                                                //========================================================================

                                            }
                                        });

                                }

                            });
                    });

            } else {
                console.log('Geocode was not successful for the following reason: ' + status);
            }
        });
    }); // Save location and geometry
    $("#searchTextField").focus(function(){
        $(this).select().mouseup(function (e) {
            e.preventDefault();
            $(this).unbind("mouseup");
        });
    });
    $scope.editLocation = function(){
        $scope.editLoc = true;
        $scope.resAddress = session.user.location.address;
    };
    $scope.locFocusOut = function(){
        $scope.editLoc = false;
        $scope.resAddress = $scope.resAddress.split(/,(.+)?/)[0];
        if($scope.resAddress.length > 26)
        {
            $scope.resAddress = $scope.resAddress.substring(0,24)+"...";
        }
    };
    $scope.resAddress = session.user.location.address.split(/,(.+)?/)[0];
    if($scope.resAddress.length > 26)
    {
        $scope.resAddress = $scope.resAddress.substring(0,24)+"...";
    }

    // Multi dropdown INIT
    $scope.catModel = [];
    $scope.catData = [];
    $scope.timeModel = [];
    $scope.timeData = [];
    $scope.categories = constants.categories;
    $scope.timePeriods = constants.timePeriods;
    for(var i = 0; i < $scope.categories.length; i++){
        $scope.catData.push({id: $scope.categories[i], label: $scope.categories[i]});
    }
    for(var i = 0; i < $scope.timePeriods.length; i++){
        $scope.timeData.push({id: $scope.timePeriods[i].name, label: $scope.timePeriods[i].name + " (" + $scope.timePeriods[i].description + ")"});
    }
    $scope.dropSettingsCat = {
        scrollableHeight: 'auto',
        scrollable: true,
        idProp: 'label',
        buttonClasses: "btn btn-block form-control blueBack filterButtons",

    };
    $scope.dropSettingsTime = {
        scrollableHeight: 'auto',
        scrollable: true,
        idProp: 'label',
        buttonClasses: "btn btn-block form-control blueBack filterButtons"
    };
    $scope.catLabel = {buttonDefaultText: 'Categories',dynamicButtonTextSuffix: "Categories"};
    $scope.timeLabel = {buttonDefaultText: 'Time Periods',dynamicButtonTextSuffix: "Time Periods"};
    $scope.catSelectEvent = {
        onItemSelect: function(){
            applyFilters(null);
        },
        onItemDeselect: function(){
            applyFilters(null);
        },
        onDeselectAll: function(){
            applyFilters(null);
        },
        onDeselectAll: function(){
            $scope.catModel = [];
            applyFilters(null);
        }
    };
    $scope.timeSelectEvent = {
        onItemSelect: function(){
            applyFilters(null);
        },
        onItemDeselect: function(){
            applyFilters(null);
        },
        onDeselectAll: function(){
            $scope.timeModel = [];
            applyFilters(null);
        }
    };
    //=======================================================================
    //====================Filter box init
    //========================================================================


    //=======================================================================
    //====================Filter box filter functions
    //========================================================================


//runtime work
    $scope.jobs = [];
    $rootScope.$broadcast('browse', 1);
    $scope.sortBy = 0;
    var me = session.user;
    var ob = $.deparam.querystring();
    ob.radius = 15;
    ob.userLocation = session.user.location.geo;
    var region = '';
    //console.log(ob.timePeriods);
    //================LOAD DROPDOWNS MODEL ON PAGE LOAD========================
    for(var i = 0; i < ob.categories.length; i++){
        for(var k = 0; k < $scope.categories.length; k++)
        {
            if(ob.categories[i] == $scope.categories[k])
                $scope.catModel.push({id: $scope.categories[k]});
        }
    }
    for(var i = 0; i < ob.timePeriods.length; i++){
        for(var k = 0; k < $scope.timePeriods.length; k++)
        {
            if(ob.timePeriods[i] == $scope.timePeriods[k].name)
                $scope.timeModel.push({id: $scope.timePeriods[i].name});
        }
    }

    getJobs(ob);
    //get the jobs
    function getJobs(temp){
        var data = {'categories': temp.categories, 'periods' : temp.timePeriods, 'region': temp.region};
        if(temp.radius){
            data.radius = temp.radius;
            data.userLocation = temp.userLocation;
        }
        var locat = session.user.location.geo;
        //console.log(data);
    $http({
        method  : 'POST',
        url     : '/jobBrowse',
        data : data
    })
        .then(function(res) {

                $scope.jobs = res.data;
            if(!res.data) {
                $scope.message = "No Job Offers match your search criteria.";
            }
            else{
                $scope.message = "";
            }

            angular.forEach($scope.jobs, function(job){
                $http
                    .post('/loadMyApplications', {"user" : session.user._id,"job":job._id})
                    .then(function (res, err) {
                        if(res.data.status == "Pending")
                            job.appStat = "Application Pending";
                        else if(res.data.status == "Provisionally accepted")
                            job.appStat = "Provisional Acceptance";
                        else if(res.data.status == "Confirmed")
                            job.appStat = "Job Confirmed";
                        else if(res.data.status == "Declined")
                            job.appStat = res.data.status;

                        $scope.isDeclined = function(status){
                            if(status == "Declined"){
                                return true;
                            }
                            return false;
                        };
                        $scope.isProv = function(status){
                            if(status == "Provisional Acceptance"){
                                return true;
                            }
                            return false;
                        };
                        $scope.isPending = function(status){
                            if(status == "Application Pending"){
                                return true;
                            }
                            return false;
                        };
                        $scope.isConfirmed = function(status){
                            if(status == "Job Confirmed"){
                                return true;
                            }
                            return false;
                        };
                    });
                job.post.postDate = job.post.postDate.substr(0,10);
                job.post.postDate = job.post.postDate.split("-");
                job.post.postDate = job.post.postDate[2] + "/" + job.post.postDate[1] + "/" + job.post.postDate[0];

                job.post.startingDate = convertDateForDisplay(job.post.startingDate);

                var user = {_id:job.employerID._id};

                $http.post('/getPp', user)
                    .then(function (res) {
                        job.logo =  res.data;
                    });



                job.distance = distance(locat.lat,locat.lng, job.post.location.geo.coordinates[1], job.post.location.geo.coordinates[0]);
                job.post.location.address = job.post.location.address.split(',')[0]+", " + job.post.location.address.split(',')[1];
                if(job.post.location.address.length > 30)
                {
                    job.post.location.address = job.post.location.address.substring(0,job.post.location.address.lastIndexOf(" ")) + "...";
                }
            });

                $scope.getPer = function(cat){
                    if(cat == "Once Off"){
                        return "/hr";
                    }
                    else return "/hr"
                };
                $scope.gotoJob = function(id){
                    $location.url("/job?id="+id);
                }
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

    $scope.applyFilters = function(){

        var radius = { max:parseInt($scope.radius)};

        switch(radius.max){
            case 5:{
                radius.min = 0;
                break;
            }
            case 10:{
                radius.min = 5;
                break;
            }
            case 20:{
                radius.min = 10;
                break;
            }
            case 50:
            {
                radius.min = 20;
                break;
            }
            case 2000:{
                radius.min = 50;
                break;
            }
        }

        if($scope.radius) {
            ob.radius = radius;
        }
            if(!$scope.region){
                ob.region = '';
            }
            else{
                ob.region = $scope.region;
            }
            getJobs(ob);



    };

    $scope.sort = function(by){
        if(by == 0){

            $scope.jobs.sort(comparePostDate);
        }
        else
        if(by == 1){

            $scope.jobs.sort(comparePeriod);
        }
        else
        if(by == 2){

            $scope.jobs.sort(compareCategories);
        }

    };

    function comparePostDate(a,b) {
        if (a.post.postDate > b.post.postDate)
            return -1;
        else if (a.post.postDate < b.post.postDate)
            return 1;
        else
            return 0;
    }
    function comparePeriod(a,b) {
        if (a.post.timePeriod < b.post.timePeriod)
            return -1;
        else if (a.post.timePeriod > b.post.timePeriod)
            return 1;
        else
            return 0;
    }
    function compareCategories(a,b) {
        if (a.post.category < b.post.category)
            return -1;
        else if (a.post.category > b.post.category)
            return 1;
        else
            return 0;
    }


});
function getPp(user,cb){

}
app.controller('jobCtrl', function($scope, $location, $window,$http, session, notify, cacheUser, $rootScope){

    $scope.goBack = function(){
        window.history.back();
    };
    var temp = $location.url();
    var user = session.user;
    temp = temp.replace("/job?id=", '');
    id = {id: temp};
    var job = {};
    $scope.canApply = true;
    $scope.edit = function(id){
        $window.location.href= '/postJob?id='+id;
    };
    $http({
        method  : 'POST',
        url     : '/getJob',
        data : id
    })
        .then(function(res) {
            $rootScope.$broadcast('job', cacheUser.user);
            $scope.job = res.data;
            
            $scope.job.post.startingDate = convertDateForDisplay($scope.job.post.startingDate);
            if($scope.job.post.endDate)
            {
                $scope.job.post.endDate = convertDateForDisplay($scope.job.post.endDate);
            }


            var loc = $scope.job.post.location.address.split(' ').join('+');
            $("#location").prop('src',"https://www.google.com/maps/embed/v1/place?key=AIzaSyDXnlJCOOsZVSdd-iUvTejH13UcZ0-jN0o&q="+loc+"&zoom=13");
            job = res.data;

            cacheUser.create(res.data.employerID);
//get profile Picture
            $http
                .post('/getPp', {_id:job.employerID._id})
                .then(function (res) {
                    $scope.image = res.data;
                });

            if($.inArray(user._id, job.applicants) != -1)
            {
                $scope.hasApplied=true;
                $scope.canApply = false;

            }else

            if(job.employerID._id == user._id){
                $scope.canApply = false;
                $scope.admin = true;

            }else $scope.canApply = true;


            if($scope.hasApplied){
                //console.log(user._id + " " +job._id);
                $http
                    .post('/loadApplication', {studentID: user._id, jobID: job._id})
                    .then(function (res, err) {
                        $scope.application = res.data;
                        if($scope.application.status == "Pending")
                            $scope.application.status = "Application Pending";
                       // console.log($scope.application);

                    }
                    );
            }

        });
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

    $scope.decline = function(id, employerID, jobID, job){

        swal({
                title: "Are you sure?",
                text: "This will notify the user that you have withdrawn",
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
                            swal("Offer declined.", "The user has been notified.", "success");
                            location.reload();

                        });
                }
            });


    };

    $('.maps').click(function () {
        $('.maps iframe').css("pointer-events", "auto");
    });
    $('.maps').mouseleave(function () {
        $('.maps iframe').css("pointer-events", "none");
    });
    $scope.acceptChanges = function(app){
        $http
            .post('/acceptChanges', {app: app})
            .then(function (res, err) {

                swal("Changes accepted.", "", "success");
                location.reload();

            });
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
                    if(--job.positionsLeft == 0){
                        //alert();
                        //console.log("declining all other applicants");
                        //Decline all other applicants not Confirmed
                        //get all applicants not confirmed or already declined
                        $http
                            .post('/getAllApplicantsOfJob' , {jobID: job._id})
                            .then(function (res,er) {
                                var apps = res.data;
                                $.each(apps,function(i,app){
                                    declineAll(app._id,$http,notify,app.studentID,job);
                                });
                                $timeout(function(){
                                    location.reload();
                                },1000);
                            });
                    }else
                        location.reload();

                }

            });
    };

    $scope.delete = function(){

        swal({
                title: "Are you sure?",
                type: "input",
                text: "This will permanently delete this job post. Please type your password to confirm",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: "Yes, I'm sure!",
                closeOnConfirm: false
            },
            function(inputValue) {

                $http
                    .post('/checkPassword', {email: user.contact.email, password: inputValue})
                    .then(function (res, err) {

                        if (!res.data) {
                            swal.showInputError("Incorrect Password!");
                            return false;
                        }
                        else{
                            $http
                                .post('/removeJob', {id: job._id})
                                .then(function (res, err) {



                                    sweetAlert("Job has beed deleted", "", "success");
                                    if(job.applicants) {
                                        for (var i = 0; i < job.applicants.length; i++) {

                                            if(job.post.OtherCategory)
                                                var Cat = job.post.OtherCategory;
                                            else
                                                var Cat = job.post.category;

                                            notify.go({
                                                type: 'jobDeleted',
                                                jobID: job._id,
                                                userID: job.applicants[i],
                                                status: 'deleted',
                                                title: Cat
                                            });
                                        }
                                    }
                                    $window.location.href = '/myJobPosts';

                                });
                        }

                    });


            });
    };

    $scope.apply = function() {
        $scope.clicked = true;
        job = $scope.job;

        var meets = [];
        var crit = [];
        if (typeof job.post.requirements == 'undefined'){
            job.post.requirements = [];

        }else{
            for(var x = 0; x < job.post.requirements.length ; x++)
            {
                meets.push(false);
            }
        }
        if (typeof job.post.experience == 'undefined'){
            job.post.experience = [];

        }else{
            for(x = 0; x < job.post.experience.length ; x++)
            {
                meets.push(false);
            }
        }

        $.each(job.post.requirements, function (key, value) {
            if(user.results) {
                $.each(user.results, function (i, val) {
                    if (value.name == val.name) {
                        if (val.symbol <= value.symbol) {
                            meets[key] = true;
                        }
                    }
                });
                if (meets[key] == false)
                    crit.push("Matric Results");
                /*console.log("Key: " + key);
                console.log("Subject: " + value.name);
                console.log("meets: " + meets[key]);
                console.log("Crit: " + crit);*/
            }
            else
            {
                crit.push("Matric Results");
                //console.log("Crit: no matric results" + crit);
            }
        });

        $.each(job.post.experience, function (key, value) {
            if(user.work) {
                $.each(user.work, function (i, val) {
                    if (value.category == val.category) {
                        meets[key + job.post.requirements.length] = true;
                    }
                });
                if(meets[key + job.post.requirements.length] == false){
                    crit.push("Work Experience");
                }
                /*console.log("Key: " + (key + job.post.requirements.length));
                console.log("Exp: " + value.category);
                console.log("meets: " + meets[key + job.post.requirements.length]);
                console.log("Crit: " + crit);*/
            }
            else{
                crit.push("Work Experience");
                //console.log("Crit: no work exp" + crit);
            }
        });


        if((job.post.gender == "M" || job.post.gender == "F") && job.post.gender != user.gender)
        {
            meets.push(false);
            crit.push("Gender");
        }
        var met = true;

        if(meets.length > 0){

        $.each(meets, function(key, value){
           // console.log(value);
            if(value == false)
            {
                met = false;

            }

        });

        }
        if(job.post.driversLicense != 'undefined')
        {
            //console.log("job license: " + job.post.driversLicense);
            //console.log("user license: " + user.driversLicence);

            if(!user.driversLicence && job.post.driversLicense)
            {
                met = false;
                crit.push("Transport");
            }

        }
        if(!met){
            sweetAlert("You lack the following requirements: ", reduceArray(crit), "error");

        }
        else {
            job.post.startingDate = convertDateForDisplay(job.post.startingDate);
            if(job.post.endDate)
                job.post.endDate = convertDateForDisplay(job.post.endDate);
            $http({
                method  : 'POST',
                url     : '/apply',
                data : {user : user, job : job }
            })
                .then(function(res) {

                    if(res.data == 'noApps'){
                        swal({
                                title: "Error",
                                text: "You have no applications remaining today.",
                                type: "error",
                                showCancelButton: true,
                                confirmButtonColor: "#00b488",
                                confirmButtonText: "Buy Applications",
                                closeOnConfirm: true
                            },
                            function(){
                                $window.location.href = '/buy';
                            });
                    }
                    else {
                        $scope.hasApplied = true;
                        swal({
                            title: "Success",
                            text: 'Application Successful.',
                            type: "success"
                        }, function () {
                            session.create(res.data);
                            $window.location.href="/dashboard";
                        });

                        if(job.post.OtherCategory)
                            var Cat = job.post.OtherCategory;
                        else
                            var Cat = job.post.category;

                        notify.go({
                            type: 'application',
                            jobID: job._id,
                            userID: job.employerID._id,
                            status: 'Made',
                            title: Cat
                        });
                    }
                });
        }

    };

    function reduceArray(a) {
        //console.log(a);
        var seen = {};
        return a.filter(function(item) {
            return seen.hasOwnProperty(item) ? false : (seen[item] = true);
        });
        //return a.toString();
    }


});

app.controller('pastJobFeed', function($scope,$http, session,$window, $rootScope, $location){

    var user = session.user;

    $scope.highlightChildren = function(event){
        angular.element(event.currentTarget).children().addClass("hover");
    };
    $scope.unhighlightChildren = function(event){
        angular.element(event.currentTarget).children().removeClass("hover");
    };

    if($location.path() == "/pastJobPosts"){
        $rootScope.$broadcast('myJobHistory',user);
    }

    $scope.repost = function(id){
        $window.location.href= '/postJob?id='+id;
    };
    $scope.getEmployees = function(id){
        $window.location.href= '/employmentHistory?id='+id;
    };
    $http({
        method  : 'POST',
        url     : '/loadPostHistory',
        data : {employerID: user._id}
    })
        .then(function(res) {
            {
                //console.log(res.data);
                $scope.jobs = res.data;
                $.each($scope.jobs, function(key,value){
                    if(!value.applicants)
                    {
                        value.applicants=[];
                    }
                });
                if($scope.jobs.length == 0){
                    $scope.message = "No jobs have been completed, yet.";
                }
            }
        });
});

app.controller('jobHistory', function ($scope,$http,$location,cacheUser, session, $rootScope, $window) {

    var temp = $location.url();
    if(temp.includes("?id=")){
        temp = temp.replace("/myJobHistory?id=", '');
        var id = {_id: temp};
        if(temp){
            $http
                .post('/getJobName',id)
                .then(function(res){
                   var job = res.data;
                    var jobName = "";
                    var empName = job.employerID.contact.name;
                    if(job.post.OtherCategory)
                        jobName = job.post.OtherCategory;
                    else
                        jobName = job.post.category;

                    swal({
                            title: "Add "+jobName+" to work experience?",
                            text: "Do you want to add "+empName+"'s job, "+ jobName + " to your work experience on your profile?",
                            type: "info",
                            showCancelButton: true,
                            confirmButtonColor: "#00b488",
                            closeOnConfirm: false,
                            showLoaderOnConfirm: true
                        },
                        function(){
                            $http
                                .post('/addToWorkExp',{     studentID : session.user._id,
                                                            job : {_id:job._id,jobName:jobName,description:job.post.description, duration: job.post.timePeriod},
                                                            employer : {contact : job.employerID.contact, company : job.employerID.company}})
                                .then(function(res){
                                    if(res.data == true) {
                                        swal("Successfully added job to your profile.");
                                        $location.url("/myProfile");
                                    }
                                    else {
                                        swal(res.data);
                                        $location.url("/myJobHistory");
                                    }
                                });
                        });
                });
        }
    }
    $scope.getJob = function(id){
        $window.location.href= '/job?id='+id;
    };
    $scope.highlightChildren = function(event){
        angular.element(event.currentTarget).children().addClass("hover");
    };
    $scope.unhighlightChildren = function(event){
        angular.element(event.currentTarget).children().removeClass("hover");
    };

    var user = cacheUser.user;
    if(!user){
        user = session.user;
    }
    $scope.user = user;

    $rootScope.$broadcast('jobHistory', 1);

    $http
        .post('/JobHistory', {studentID : user._id})
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

            if($scope.applications.length == 0)
            {
                $scope.message = "You haven't completed any jobs, yet.";
            }



        });

});


app.controller('employmentHistory', function ($scope,$http,cacheUser, session, $rootScope, $location, $window) {

    $scope.highlightChildren = function(event){
        angular.element(event.currentTarget).children().addClass("hover");
    };
    $scope.unhighlightChildren = function(event){
        angular.element(event.currentTarget).children().removeClass("hover");
    };
    var temp = $location.url();
    var user = cacheUser.user;
    if(!user){
        user = session.user;
    }
    $scope.user = user;

    $rootScope.$broadcast('empHistory', 1);
    var numbers = [];
    for(var i = 0.5; i < 5.5; i+=0.5){
        numbers.push(i);
    }

    $http
        .post('/loadJobHistory', {employerID : user._id})
        .then(function (res) {
            $scope.applications = {};
            $scope.jobs = res.data;
            $.each($scope.jobs,function(i,job){
                job.post.startingDate = convertDateForDisplay(job.post.startingDate);
                $.each(job.applications,function(i,app){

                    app.filled = [];
                    for(var k = 0; k <= numbers.length; k++)
                    {
                        if(app.studentRating >= numbers[k])
                            app.filled[k] = "filled";
                        else
                            app.filled[k] = "";
                    }

                    $http
                        .post('/getPp', {_id:app.studentID._id})
                        .then(function (res) {

                            app.image = res.data;
                        });
                });
            });


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
            temp = temp.replace("/employmentHistory?id=", '');
            if(temp != '/employmentHistory'){
                $scope.toggleApplicants(temp);
            }
            else {
                toggleAll();
            }
            $scope.getAge = function (dob) {
                return getAge(dob);
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

            if($scope.jobs.length == 0)
            {
                $scope.message = "No jobs completed yet.";
            }

        });

});

function isVowel(string){
    var vowels = ['a','e','o','i','u'];
    for(var i = 0; i< vowels.length; i++){
        if(string[0] == vowels[i] || string[0]== vowels[i].toUpperCase())
        {
            return true;
        }
    }
    return false;
};