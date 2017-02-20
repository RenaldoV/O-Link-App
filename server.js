// modules =================================================
var express        = require('express');
var app            = express();
var bodyParser     = require('body-parser');
var methodOverride 	= require('method-override');
var session 		= require('express-session');
var nodemailer 		= require('nodemailer');
var cookieParser 	= require('cookie-parser');
var mailer = require('./app/models/mailer.js');
const fs = require('fs');




// configuration ===========================================


//file upload
// Requires multiparty



var port = process.env.PORT || 8080; // set our port
// mongoose.connect(db.url); // connect to our mongoDB database (commented out after you enter in your own credentials)

// get all data/stuff of the body (POST) parameters
app.use(bodyParser.json({limit: '10mb'})); // parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
app.use(bodyParser.urlencoded({ extended: true })); // parse application/x-www-form-urlencoded
app.use(cookieParser());
app.use(session({ secret: 'session secret key' , resave : false , saveUninitialized : false})); //Add secret to session
app.use(methodOverride('X-HTTP-Method-Override')); // override with the X-HTTP-Method-Override header in the request. simulate DELETE/PUT
app.use(express.static(__dirname + '/public')); // set the static files location /public/img will be /img for users

// routes ==================================================
require('./app/routes')(app); // pass our application into our routes

// start app ===============================================
var io = require('socket.io').listen(app.listen(port));
console.log('Magic happens on port ' + port);
exports = module.exports = app; 						// expose app

//test


//io

var db = require("./app/models/Database.js");

io.on('connection', function(socket){
    socket.on('notify', function(data){
        db.notifications.create(data, function(err,res){

            socket.emit('notified'+ data.userID, data, function(err){
                if (err) throw err;
            });
        });
    } );
});

var CronJob = require('cron').CronJob;

//function happens once every hour
new CronJob('00 00 * * * *', function() {

    //remove all applications of offers not accepted by students in time // warn provisionally accepted applicants about expiry in 2 hours
    db.applications.find({status:"Provisionally accepted"}).exec(function(err, rows){
        rows.forEach(function(app){
            app = app.toObject();

            // 2 hours left to accept provisional acceptance
            if(app.offerDate + 79200000 <= Date.now() && Date.now() <= app.offerDate + 82800000) {
                //console.log("2 hours left to accept offer");
                db.applications.findOne({_id: app._id}).populate('studentID').populate('jobID').exec(function (err, ap) {
                    var usr = ap.studentID.toObject();
                    var job = ap.jobID.toObject();

                    if(job.post.OtherCategory)
                        var Cat = job.post.OtherCategory;
                    else
                        var Cat = job.post.category;

                    var notiStud = {
                        userID: ap.studentID._id.toString(),
                        jobID: ap.jobID._id,
                        seen: false,
                        status: '',
                        type: 'offer expiry',
                        title: Cat
                    };
                    db.notifications.create(notiStud,function(err, res){

                    });
                    if (usr.emailDisable == undefined || !usr.emailDisable) {
                        var args = {};
                        args.name = usr.name.name;
                        args.date = convertDateForDisplay(job.post.startingDate);
                        if (job.post.OtherCategory)
                            args.category = job.post.OtherCategory;
                        else
                            args.category = job.post.category;
                        args.email = usr.contact.email;

                        args.subject = args.category + " will automatically decline in 2 hours!";
                        args.link = 'http://' + "154.66.197.62:8080" + '/applications';
                        mailer.sendMail('offerExpiry', ap.studentID._id, args, function (err, rr) {
                            //console.log("Send email: " + rr);
                        });
                    }
                });

            }

            if(app.offerDate + 86400000 <= Date.now())
            {
                db.applications.findOne({_id: app._id}).populate('studentID').populate('employerID').populate('jobID').exec(function (err, ap) {
                    if (err) throw err;
                    db.applications.remove({_id: app._id},function(err,res){
                       if(err) throw err;
                    });

                    var usr = ap.studentID.toObject();
                    var emp = ap.employerID.toObject();
                    var job = ap.jobID.toObject();

                    db.jobs.update({_id: job._id}, {$pull: {applicants: usr._id.toString()}}).exec(function (ers, res) {
                        if (ers) throw ers;
                    });
                    db.notifications.remove({
                        'jobID': ap.jobID._id,
                        'userID': ap.studentID._id.toString(),
                        'status': "Provisionally accepted"
                    }, function (err, rs) {
                        if (err) throw err;
                    });

                    if(job.post.OtherCategory)
                        var Cat = job.post.OtherCategory;
                    else
                        var Cat = job.post.category;

                    var notiStud = {
                        userID: ap.studentID._id.toString(),
                        jobID: ap.jobID._id,
                        seen: false,
                        status: 'Declined',
                        type: 'status change',
                        title: Cat
                    };
                    db.notifications.create(notiStud,function(err, res){

                    });
                    var notiEmploy = {
                        userID: ap.employerID._id.toString(),
                        jobID: ap.jobID._id,
                        seen: false,
                        status: 'Withdrawn',
                        type: 'withdrawn',
                        title: Cat
                    };
                    db.notifications.create(notiEmploy,function(err, res){

                    });

                    // send email to students and employers
                    if (usr.emailDisable == undefined || !usr.emailDisable) {
                        var args = {};
                        args.name = usr.name.name;
                        args.date = convertDateForDisplay(job.post.startingDate);
                        if (job.post.OtherCategory)
                            args.category = job.post.OtherCategory;
                        else
                            args.category = job.post.category;
                        args.email = usr.contact.email;

                        if (isVowel(args.category))
                            var article = "an ";
                        else
                            var article = "a ";
                        args.subject = "Automatically Declined Provisional Acceptance / Job Commitment to Work as "+ article + args.category + " – Missed Response Deadline";
                        args.link = 'http://' + "154.66.197.62:8080" + '/browseJobs?timePeriods[]=Once Off&timePeriods[]=Short Term&timePeriods[]=Long Term&categories[]=Assistant&categories[]=Aupair&categories[]=Bartender&categories[]=Coach&categories[]=Cook %2F Chef&categories[]=Delivery Person&categories[]=Host(ess)&categories[]=Internship&categories[]=Model&categories[]=Photographer %2F Videographer&categories[]=Programmer %2F Developer&categories[]=Promoter&categories[]=Retail Worker&categories[]=Tutor&categories[]=Waiter(res)&categories[]=Other';

                        mailer.sendMail('offerTimeUp', ap.studentID._id, args, function (err, rr) {
                            //console.log("Send email: " + rr);
                        });
                    }
                    if (emp.emailDisable == undefined || !emp.emailDisable) {
                        var args = {
                            name: emp.contact.name,
                            talent: usr.name.name + " " + usr.name.surname,
                            email: emp.contact.email,
                            link: 'http://154.66.197.62:8080/applicants'
                        };

                        mailer.sendMail('applicationWithdrawn', emp._id, args, function (er, rss) {
                            console.log(rss);
                        });
                    }
                });
            }
        });
    });

    //check for edited posts that weren't accepted
    db.applications.find({edited:true}).populate('employerID').populate('studentID').populate('jobID').exec(function(err, rows){

        rows.forEach(function(app){
            var str = JSON.stringify(app);
            var newApp = JSON.parse(str);
            // Don't know why the doc has to be converted to string and back to obj... Weird
            //console.log(app.editTime); gives undefined
            var d = new Date();
            if(newApp.editTime + 86400000 <= d.getTime()){
                db.applications.remove({_id:newApp._id}, function(err, res){
                    if(err) throw err;
                    console.log("apps removed " + res);
                });
                db.notifications.remove({jobID: newApp.jobID, type:'jobEdited',userID : app.studentID},function(err,rs){
                    if(err) throw err;
                    console.log("notis removed " + rs);
                });
                db.jobs.update({_id:newApp.jobID},{$pull:{applicants: {$in : [newApp.studentID]}}}, function(err,rs){
                   if(err) throw err;
                    console.log("Pulled apps from job " + rs);
                });
                if(newApp.jobID.post.OtherCategory)
                    var Cat = newApp.jobID.post.OtherCategory;
                else
                    var Cat = newApp.jobID.post.category;
                var noti = {
                    userID: newApp.studentID,
                    jobID: newApp.jobID,
                    seen: false,
                    status: 'Expired',
                    type: 'expired',
                    title: Cat
                };

                db.notifications.create(noti,function(err, res){
                    if(err) throw err;
                    console.log("Notis created " + res);
                });

                // send email to students and employers
                var usr = newApp.studentID;
                var emp = newApp.employerID;

                if (usr.emailDisable == undefined || !usr.emailDisable) {
                    var args = {};
                    args.name = usr.name.name;
                    args.date = convertDateForDisplay(newApp.jobID.post.startingDate);
                    if (newApp.jobID.post.OtherCategory)
                        args.category = newApp.jobID.post.OtherCategory;
                    else
                        args.category = newApp.jobID.post.category;
                    args.email = usr.contact.email;
                    if(isVowel(args.category))
                        var article = "an ";
                    else
                        var article = "a ";
                    args.subject =  "Automatically Withdrawn Application to Work as "+ article + args.category +" – Missed Response Deadline";
                    args.link = 'http://' + "154.66.197.62:8080" + '/browseJobs?timePeriods[]=Once Off&timePeriods[]=Short Term&timePeriods[]=Long Term&categories[]=Assistant&categories[]=Aupair&categories[]=Bartender&categories[]=Coach&categories[]=Cook %2F Chef&categories[]=Delivery Person&categories[]=Host(ess)&categories[]=Internship&categories[]=Model&categories[]=Photographer %2F Videographer&categories[]=Programmer %2F Developer&categories[]=Promoter&categories[]=Retail Worker&categories[]=Tutor&categories[]=Waiter(res)&categories[]=Other';
                    mailer.sendMail('jobEditedTimeUp', usr._id, args, function (err, rr) {
                        console.log("Send email: " + rr);
                    });
                }
            }
        });
    });

    //remove all seen notifications
    db.notifications.remove({seen: true}, function(err,rs){
        if(err) throw err;
    });

    console.log('Hourly check');
}, null, true);


//function executes once a day
new CronJob('00 00 00 * * *', function() {
dailyCheck();

}, null, true);

function dailyCheck(){

    //Make list of files in use and delete all unused files
    db.users.find({},{_id:0,matricFile:1,profilePicture:1,certifications:1,driversFile:1}, function(err,docs){
        var result = [];
        docs.forEach(function(usr){
            var usrFiles = usr.toObject();

            if(usrFiles.driversFile)
                result.push(usrFiles.driversFile);
            if(usrFiles.profilePicture)
                result.push(usrFiles.profilePicture);
            if(usrFiles.matricFile)
                result.push(usrFiles.matricFile);
            if(usrFiles.certifications)
                usrFiles.certifications.forEach(function(cert){
                    if(cert.file)
                        result.push(cert.file);
                });
        });

        fs.readdir(__dirname + '/app/uploads', function(err,files){
            if(err) console.log(err);
            else{
                files.forEach(function(file){
                    if(file != "default.png")
                    {
                        var used = false;
                        result.forEach(function(res){
                            res = res.replace("\\uploads\\","");
                            if(res == file)
                                used = true;
                        });
                        if(!used){
                            // file not used by anyone, delete
                            fs.unlink(__dirname + "\\app\\uploads\\"+file, function(e){
                                if(err) throw err;
                            })
                        }
                    }
                });
            }
        });
    });

    db.users.update({type:'student'},{$set:{freeApplications:2}}, {multi:true}).exec(function(err,res){
        console.log(res);
    });

    //remove expired packages
    db.users.update({type:'student'},{$pull:{packages:{ expiryDate:{$lt:Date.now()}}}}, {multi:true}).exec(function(err,res){
        console.log(res);
    });

    //check for jobs that starts today
    db.jobs.find({status: 'active'},function(err,rows){
        if(err) throw err;
        rows.forEach(function(ro){
            var row = ro.toObject();
            if(hasStarted(row.post.startingDate))
            {
                db.jobs.findOneAndUpdate({_id:row._id}, {$set:{status: 'Started'}}, function(err, dox){
                    if(err) throw err;
                });
            }
        });
    });

    db.jobs.find({status:"Started"},function(err,jobs){
        jobs.forEach(function(row){
            row = row.toObject();
            // Check for jobs at the end of their first day to decline all their applicants
            if(hasFinished(row.post.startingDate)) {
                var done = [];
                // Decline all unconfirmed applicants
                if(row.applicants){
                    row.applicants.forEach(function(applicant){
                        db.applications.findOneAndUpdate({studentID: applicant,jobID:row._id, $and : [{status:{$ne:"Confirmed"}},{status:{$ne:"Completed"}},{status:{$ne:"Declined"}}]},
                            {$set:{status:"Declined"}}).populate('studentID').populate('employerID').exec(function(err,app){
                            if(err) throw err;

                            if(app){

                                var usr = app.studentID.toObject();
                                var emp = app.employerID.toObject();
                                console.log(usr.name.name);

                                if (usr.emailDisable == undefined || !usr.emailDisable) {
                                    var args = {};
                                    args.name = usr.name.name;
                                    args.date = convertDateForDisplay(row.post.startingDate);
                                    if(row.post.OtherCategory)
                                        args.role = row.post.OtherCategory;
                                    else
                                        args.role = row.post.category;
                                    args.email = usr.contact.email;
                                    if (emp.employerType == 'Company') {
                                        args.employer = emp.company.name;
                                    } else
                                        args.employer = emp.contact.name + " " + emp.contact.surname;

                                    args.subject = args.role;
                                    args.link = 'http://' + "154.66.197.62:8080" + '/browseJobs?timePeriods[]=Once Off&timePeriods[]=Short Term&timePeriods[]=Long Term&categories[]=Assistant&categories[]=Aupair&categories[]=Bartender&categories[]=Coach&categories[]=Cook %2F Chef&categories[]=Delivery Person&categories[]=Host(ess)&categories[]=Internship&categories[]=Model&categories[]=Photographer %2F Videographer&categories[]=Programmer %2F Developer&categories[]=Promoter&categories[]=Retail Worker&categories[]=Tutor&categories[]=Waiter(res)&categories[]=Other';
                                    //console.log("mailer args " + args + " " + applicant);
                                    mailer.sendMail('applicationDenied', applicant, args, function (err, rr) {
                                        //console.log("Send email: " + rr);
                                    });
                                }

                                db.jobs.update({_id: app.jobID}, {$pull: {applicants: applicant}}).exec(function (ers, res) {
                                    if (ers) throw ers;
                                });

                                if(row.post.OtherCategory)
                                    var Cat = row.post.OtherCategory;
                                else
                                    var Cat = row.post.category;

                                var noti = {
                                    type: 'status change',
                                    jobID: app.jobID,
                                    userID: applicant,
                                    status: "Declined",
                                    title: Cat,
                                    seen: false
                                };
                                db.notifications.create(noti,function(err, res){
                                    //expired
                                });
                                db.applications.update({_id:app._id},{$set:{status:"Declined"}}, function(err,doc){
                                    if(err) throw err;
                                });
                            }
                        });
                    });
                }
            }
            // Check for jobs that have been completed

            if (!row.post.endDate) {
                completeJob(row);
            }
            else if (hasFinished(row.post.endDate)){
                completeJob(row);
            }
        });
    });

    console.log('Daily check');
}
dailyCheck();

function convertDateForDisplay(date){

    var year = date.substr(6,4);
    var day = date.substr(3,2);
    var month = date.substr(0,2);
    var ret = day+"/"+month+"/"+year;

    return ret;
}

function completeJob(job) {

    db.jobs.update({_id:job._id}, {$set:{status: 'Completed'}}, function(err, dox){
        if(err) throw err;
    });
    db.applications.update({
        jobID: job._id,
        status: 'Confirmed'
    }, {$set: {status: "Completed"}}, {multi: true}).exec(function (errs, res) {
        if (errs) throw err;

        db.applications.find({
            jobID: job._id,
            status: 'Completed'
        }).populate('studentID').populate('employerID').populate('jobID').exec(function (err, aps) {
            if (err) throw err;
            if(aps.length > 0){
                var usr = aps[0].studentID.toObject();
                var emp = aps[0].employerID.toObject();
                var job = aps[0].jobID.toObject();

                if(job.post.OtherCategory)
                    var Cat = job.post.OtherCategory;
                else
                    var Cat = job.post.category
                var args = {
                    link: 'http://localhost:8080/dashboard/',
                    employerName: emp.contact.name,
                    category: Cat,
                    date: convertDateForDisplay(job.post.startingDate)
                };
                if (emp.emailDisable == undefined || !emp.emailDisable) {
                    args.email = emp.contact.email;
                    mailer.sendMail('rateStudents', emp._id, args, function (err, rs) {
                        //console.log(rs);
                    });
                }
            }
        });
    });
}

function hasFinished(date){
    if(!date) return false;
    var dateTemp = date.split('/');
    var datearr = [parseInt(dateTemp[0] -1),parseInt(dateTemp[1]),parseInt(dateTemp[2])];
    var now = new Date();

    if(now.getFullYear() > datearr[2]){
        return true;
    }
    if(now.getFullYear() == datearr[2]){

        if(now.getMonth() > datearr[0])
        {
            return true;
        }else if(now.getMonth() == datearr[0])
        {

            if(now.getDate() >= datearr[1]+1)
            {
                return true;
            }
        }
    }
    return false;

}
function hasStarted(date){
    if(!date) return false;
    var dateTemp = date.split('/');
    var datearr = [parseInt(dateTemp[0] -1),parseInt(dateTemp[1]),parseInt(dateTemp[2])];
    var now = new Date();

    if(now.getFullYear() > datearr[2]){
        return true;
    }
    if(now.getFullYear() == datearr[2]){

        if(now.getMonth() > datearr[0])
        {
            return true;
        }else if(now.getMonth() == datearr[0])
        {

            if(now.getDate() >= datearr[1])
            {
                return true;
            }
        }
    }
    return false;

}
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