var db = require("./models/Database.js");
var errorHandler = require('./errors.js');
var crypto = require('crypto');
var async = require('async');
var nodemailer 		= require('nodemailer');
var smtpttransport = require('nodemailer-smtp-transport');
var multiparty = require('connect-multiparty');
var multipartyMiddleware = multiparty({ uploadDir: './tmp' });
var fs = require('fs');
var passwordHash = require('password-hash');
var mailer = require("./models/mailer.js");
var CronJob = require('cron').CronJob;

function getDate(){
	var currentdate = new Date();
	var datetime = currentdate.getFullYear() + "-"
		+ (currentdate.getMonth()+1)  + "-"
		+ currentdate.getDate()  + " "
		+ currentdate.getHours() + ":"
		+ currentdate.getMinutes() + ":"
		+ currentdate.getSeconds();
	return datetime;
}



module.exports = function(app) {


	// frontend routes =========================================================
	// route to handle all angular requests



	app.get('/home', function(req, res) {

		res.sendfile('./public/landing/index.html');

	});
	app.get('*', function(req, res) {

		res.sendfile('./public/index.html');

	});


	// server routes ===========================================================
	// db routes
	// authentication routes
	app.post('/reset/:token', function(req, res) {
		var pw;
		for(var key in req.body)
		{
			pw = JSON.parse(key);
		}
		//console.log("Token: " + JSON.stringify(req.params.token));
		//console.log("PW: " + JSON.stringify(pw));

		async.waterfall([
			function(done) {


				db.users.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(er,user) {
					if (!user) {
						return res.send('error');
					}
		 			var tempUser = user.toJSON();
		 			tempUser.passwordHash = passwordHash.generate(pw.passwordHash);

		 			tempUser.resetPasswordToken = undefined;
		 			tempUser.resetPasswordExpires = undefined;

					db.users.findOneAndUpdate({"_id" : tempUser._id},{$set:tempUser},
						function(err, res1){
							if(!err) {
								return res.send(res1);
								done(err, user);
							}
							else {
								return res.send("error");
							}
						});

				});
			},
			function(user, done) {
		 		var tempUser = user.toJSON();
				var smtpTransport = nodemailer.createTransport(smtpttransport({
					host: "mail.o-link.co.za",
					secureConnection: false,
					port: 25,
					auth: {
						user: "no-reply@o-link.co.za",
						pass: "Olink@Noreply2016"
					},
					tls: {rejectUnauthorized: false}
				}));
				var mailOptions = {
					to: tempUser.contact.email,
					from: 'no-reply@o-link.co.za',
					subject: 'Your password has been changed',
					text: 'Hello,\n\n' +
					'This is a confirmation that the password for your account ' + tempUser.contact.email + ' has just been changed.\n'
				};
				smtpTransport.sendMail(mailOptions, function(err) {
		 			done(err, 'done');
				});
			}
		], function(err) {
			res.send('error');
		});
	});
	app.post('/forgot', function(req, res, next) {
		var user;
		for(var key in req.body)
		{
			user = JSON.parse(key);
		}
		
		async.waterfall([
			function(done) {
				crypto.randomBytes(20, function(err, buf) {
					var token = buf.toString('hex');
					done(err, token);
				});
			},
			function(token, done) {

				db.users.findOne({'contact.email':user.email},function(err,User){
					if(!User)  return res.send(false);
					
					var tempUser = User.toJSON();
					tempUser.resetPasswordToken = token;
					tempUser.resetPasswordExpires = Date.now() + 1800000; // 0.5 hour

					db.users.update({"_id" : tempUser._id},tempUser,
					function(err,res){
						new CronJob(new Date(Date.now() + 1800000), function() {
							db.users.findOneAndUpdate({"_id" : tempUser._id},{$unset:{resetPasswordToken: 1}},
									function(err,res) {

										//expiry reset
									});
						});
						done(err,token,User);
					});
					
					res.send(tempUser);
				});
			},
 			function(token, user, done) {
				var tempUser = user.toJSON();

				var args = {link:'http://' + req.headers.host + '/reset/' + token};


				mailer.sendMail('forgotPassword',tempUser._id,args, function(err,res){
					done(err, 'done');
				});

				/*var smtpTransport = nodemailer.createTransport(smtpttransport({
					host: "mail.o-link.co.za",
					secureConnection: false,
					port: 25,
					auth: {
						user: "no-reply@o-link.co.za",
						pass: "Olink@Noreply2016"
					},
					tls: {rejectUnauthorized: false}
				}));
				var mailOptions = {
					to: tempUser.contact.email,
					from: 'no-reply@o-link.co.za',
					subject: 'O-Link Password Reset',
					text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
					  'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
					   + '\n\n' +
					  'If you did not request this, please ignore this email and your password will remain unchanged.\n'
				};
				smtpTransport.sendMail(mailOptions, function(err) {
					done(err, 'done');
				});*/
			} 
		], function(err) {
			if (err) return next(err);

		});
	});



	//Returns the 10 latest job posts for students
	app.post('/jobFeeder', function(req,res){

		db.jobs.find({status:'active','applicationsLeft': { $gt: 0}, 'positionsLeft': {$gt : 0}}).limit(10).populate('employerID').sort('-post.postDate').exec(function(err,rows){
			if(err){

			}
			res.send(rows);
		});

	});
	//done


	//Returns all job posts from logged in employer
	app.post('/myJobFeeder', function(req,res){

		var user = req.body;

		db.jobs.find({employerID: user.id, status: {$ne: "inactive", $ne:"Completed"}}).sort('-post.postDate').exec(function(err,rows){
			if(err){

			}
			res.send(rows);
		});

	});
	//done


	//Gets jobs based on categories and time periods
	app.post('/jobBrowse', function(req,res){

		var temp = req.body;
		if (temp.region == null) {
			temp.region = '';
		}
		//console.log(temp);
		if (temp.radius != null) {

			db.jobs.find({
				status: 'active',
				'applicationsLeft': {$gt: 0},
				'positionsLeft': {$gt: 0},
				'post.location.address': {$regex: temp.region},
				'post.location.geo': {
					$near: {
						coordinates: [temp.userLocation.lng, temp.userLocation.lat],
						type: "Point"
					}, $maxDistance: temp.radius * 1000
				}
			}).where('post.category').in(temp.categories).where('post.timePeriod').in(temp.periods).sort('-post.postDate').populate('employerID').exec(function (err, rows) {
				if (err) throw err;
				else {

					//console.log(1);
					if (rows.length == 0) {

						res.send(false);
					}

					else {

						res.send(rows);
					}

				}
			});
		} else {
			db.jobs.find({
				status: 'active',
				'post.location.address': {$regex: temp.region},
				'applicationsLeft': {$gt: 0},
				'positionsLeft': {$gt: 0}
			}).where('post.category').in(temp.categories).where('post.timePeriod').in(temp.periods).sort('-post.postDate').populate('employerID').exec(function (err, rows) {
				if (err) throw err;
				else {
					//console.log(2);

					if (rows.length == 0)
						res.send(false);
					else
						res.send(rows);
				}
			});
		}
	});
	//done


	//post a job to database
	app.post('/jobPoster', function(req,res) {

		var job = req.body;

		job.post.startingDate = dateConvert(job.post.startingDate);
		if(job.post.endDate){
			job.post.endDate = dateConvert(job.post.endDate);
		}
		job.provisionalLeft = job.post.spotsAvailable;
		job.positionsLeft = job.post.spotsAvailable;
		job.applicationsLeft = job.positionsLeft * job.post.threshold;
		db.jobs.create(job,function(err, jobi){
			var jab = jobi.toObject();
			var args = {};
			if(jab.post.category == 'Other')
			{
				args.category = jab.post.OtherCategory;
			}else
				args.category = jab.post.category;
			db.users.findOne({_id:jab.employerID}).exec(function(err,user){

				if(!err){
					var usr = user.toObject();
					if(usr.emailDisable == undefined || !usr.emailDisable){
						args.name = usr.contact.name;
						args.email = usr.contact.email;

						mailer.sendMail('jobLive',jab.employerID,args, function(err,rss){
							//console.log("mail sent: " + args.email);

						});
					}
						res.send(jobi);


				}
			});


		});

	});
	//done

	// send email from client side
	app.post('/sendEmail', function(req,res){
		var args = req.body.args;
		var template = req.body.template;
		var id = req.body.id;
		//console.log(args);
		//console.log(template);
		//console.log(id);
		mailer.sendMail(template, id, args, function (err, rs) {
			if(err) throw err;
			//console.log(rs);
			res.send(true);
		});
	});

	//update job in database
    app.post('/jobUpdate', function (req, res) {

        var job = req.body.job;
		console.log(job);
        job.post.startingDate = dateConvert(job.post.startingDate);

        if (job.post.endDate) {
            job.post.endDate = dateConvert(job.post.endDate);
        }
        var args = {};
        args.employer = "";
        args.date = convertDateForDisplay(job.post.startingDate);
        db.jobs.findOneAndUpdate({_id: job._id}, {$set: job}, function (err, d) {
            if (job.post.category == "Other")
                args.category = job.post.OtherCategory;
            else
                args.category = job.post.category;
            if (d) {
                db.applications.update({jobID: job._id}, {
                    $set: {
                        edited: true,
                        editTime: Date.now()
                    }
                }, {multi: true},
					function (err, updated) {
                    new CronJob(new Date(Date.now() + 86400000), function () {
                        db.applications.update({
                                "_id": tempUser._id,
                                edited: true
                            }, {$set: {status: "Declined"}}, {multi: true},
                            function (err, res) {

                                //expiry reset

                            });
                    });
                    db.applications.find({jobID: job._id, status: { $ne: "Declined" }}).populate('jobID').populate('studentID').populate('employerID').exec(function (err, rows) {
                        args.applicantCount = rows.length;
                        db.users.findOne({_id: job.employerID}).exec(function (err, user) {

                            if (!err) {

                                var usr = user.toObject();
								args.employer = usr.contact.name + " " + usr.contact.surname;
                                if (usr.emailDisable == undefined || !usr.emailDisable) {
                                    args.name = usr.contact.name;
                                    args.count = rows.length;
                                    args.email = usr.contact.email;
                                    mailer.sendMail('jobEditedEmployer', usr._id, args, function (errr, rs) {

                                    });
                                }
                            }
                        });
						res.send(rows);
                    });
                });
            }
        });


    });
	//done
	//user accepts changes to job
	app.post('/acceptChanges', function(req,res) {

		var app = req.body.app;
		//console.log(app.status);
		if(app.status == "Provisionally accepted"){
			var dat = Date.now();
			db.applications.findOneAndUpdate({_id:app._id},{$unset:{edited:1, editTime: 1},$set:{offerDate:dat}}).populate('jobID').populate('studentID').populate('employerID').exec(function(err,doc){
				if(err) throw err;

				var docs = doc.toObject();
				var emp = docs.employerID;
				var usr = docs.studentID;
				var job = docs.jobID;

				if (usr.emailDisable == undefined || !usr.emailDisable) {
					var args = {};
					args.name = usr.name.name;
					args.date = convertDateForDisplay(job.post.startingDate);
					if (job.post.OtherCategory)
						args.role = job.post.OtherCategory;
					else
						args.role = job.post.category;
					args.email = usr.contact.email;
					if (emp.employerType == 'Company') {
						args.employer = emp.company.name;
					} else
						args.employer = emp.contact.name + " " + emp.contact.surname;

					args.subject = args.role;
					args.link = 'http://' + req.headers.host + '/job?id=' + job._id;

					if (job.post.interviewRequired) {
						mailer.sendMail('offerMadeInterview', usr._id, args, function (err, rr) {
							//console.log("mail sent: " + args.email);
						});
					}
					else {
						mailer.sendMail('offerMade', usr._id, args, function (err, rr) {
							//console.log("mail sent: " + args.email);
						});
					}
				}
				res.send(true);
			});
		}
		else{
			db.applications.update({_id:app._id},{$unset:{edited:1, editTime: 1}} , function(err,rows){
				res.send(true);
			});
		}
	});
	//done

	//sign in to the app
	app.post('/logIn', function(req,res) {
		var user = {};

		for(var key in req.body) {
			user = JSON.parse(key);
		}

		db.users.findOne({'contact.email': user.email, active:true}, function(err,doc){
			if(err){

			}else {

				if (doc) {
					if (passwordHash.verify(user.password, doc.toObject().passwordHash)) {
						res.send(true);
					}else
					res.send(false);
				}else
				res.send(false);
			}
		});
	});
	//done

	//Add a new user to the db
	app.post('/signup', function(req,res) {

		var user = req.body;
		//add activation token and insert into db
		db.users.find({'contact.email': user.contact.email}, function(err,users){
			if(users.length > 0)
			{
				res.send('email');

			}else


		crypto.randomBytes(20, function(err, buf) {
				var token = buf.toString('hex');
				user.activateToken = token;
				user.passwordHash = passwordHash.generate(String(user.passwordHash));
			if(user.type == 'student'){
				user.freeApplications = 2;
			}
				db.users.create(user,function(e,result){

					if(result != 'email' && !err){

						var usr = result;
						var args = {link: 'http://' + req.headers.host + '/activate?token=' + token, email: usr.contact.email};

						if(usr.type == 'student'){
							args.name = usr.name.name;
							mailer.sendMail('welcomeTalent',usr._id,args, function(err,rrs){
								if(!err)
								res.send(result);
								//console.log(rrs);
							});
						}else if(usr.type = 'employer'){
							args.name = usr.contact.name;
							mailer.sendMail('welcomeEmployer',usr._id,args, function(err,rrs){
								if(!err)
									res.send(result);
								//console.log(rrs);
							});
						}

					}
			});


		});
		});

	});
	//done

	//Gets all students
	app.post('/studentFeeder', function(req,res) {

		db.users.find({type: "student"}, function(err, rows){
			res.send(rows);
		});
	});
	//sone

	//load user by email
	app.post('/loadUser', function(req,res) {
		var email = req.body;
		db.users.findOne({'contact.email': email.email}, function(err, rows){
			res.send(rows);
		});

	});
	//done

	//add job to student work experience
	app.post('/addToWorkExp',function(req,res){
		var data = req.body;
		var studentID = data.studentID;
		var job = data.job;
		var employer = data.employer;
		var workExp = {};
		workExp.contact = {name: employer.contact.name, number: employer.contact.contactNo,email: employer.contact.email};
		workExp.jobID = job._id;
		if(data.employer.company.name) {
			workExp.employerType = "Company";
			workExp.contact.company = employer.company.name;
		}
		else {
			workExp.employerType = "Individual";
		}
		workExp.category = job.jobName;
		workExp.roleDescription = job.description;
		workExp.duration = job.duration;

		db.users.update({_id:studentID, 'work.jobID' : {$nin : [job._id]}},{$push:{work:workExp}},function(err,doc){
			if(err) throw err;
			if(doc.nModified == 0)
				res.send("You cannot add the same job twice.");
			else if(err)
				res.send(err);
			else
				res.send(true);
		});
	});

	//get job by id
	app.post('/getJob', function(req,res) {

		var id= req.body;
		db.jobs.findOne({_id: id.id}).populate('employerID').exec(function(err,rows){
			res.send(rows);
		});

	});
	app.post('/getJobName', function(req,res) {

		var id = req.body;
		db.jobs.findOne({_id: id._id},{'post.category': 1,'post.OtherCategory':1,employerID :1,'post.timePeriod':1,'post.description':1}).populate('employerID').exec(function(err,rows){
			res.send(rows);
		});
	});
	//done

	//load a user by id
	app.post('/loadUserById', function(req,res) {
		var id= req.body;

		db.users.findOne({_id: id.id}, function(err, rows){
			res.send(rows);
		});

	});
	//done
	//upload profile picture
	app.post('/upload', multipartyMiddleware, function(req, res){
		var file = req.files.file;
		var id = req.body.user;

		fs.readFile(file.path, function (err, data) {

			var temp = file.path;
			temp = temp.replace("tmp\\", '\\uploads\\');
			temp = temp +".png";
			var newPath = __dirname + temp;

			//remove old profile pic
			if(id) {
				db.users.findOne({_id:id},function(err, doc){
					var ppFile = doc.toObject().profilePicture;

					if(ppFile){
						var oldFile = __dirname + ppFile;
						fs.unlink(oldFile,function(e){
							if(e) throw e;
						});
					}
				});
			}


			fs.writeFile(newPath, data, function (err) {
				if(err) throw err;

				if(id){
					//console.log(newPath);
					db.users.update({_id:id}, {$set: {profilePicture: temp}}, function(err,result){
						if (err) throw err;
						fs.unlink(file.path, function(e){
							if(!e){
								res.send(true);
							}
						});
					});
				}
				else{
					fs.unlink(file.path, function(e){
						if(!e){
							res.send(temp);
						}
					});
				}
			});
		});

	});
	//done

	//upload profile picture
	app.post('/uploadFile', multipartyMiddleware, function(req, res){
		var file = req.files.file;
		saveFile(file, function(rslt){
			res.send(rslt);
		});

	});
	//done

	//get profile picture data
	app.post('/getPp', function(req, res){
		var def = __dirname + "\\uploads\\default.png";
		var path = "";
		//console.log(req.body);
		db.users.findOne({_id:req.body._id},{profilePicture:1},function(err,pp){
			if(pp){
				if(path = pp.toObject().profilePicture){
					path = pp.toObject().profilePicture.toString();
					path = __dirname + path;
					fs.readFile(path, function(err,data){
						if(err) {
							//console.log(err);
							fs.readFile(def, function(err,data){
								if(err) {

								}
								var buf = new Buffer(data).toString('base64');
								res.send(buf);
							});
						}else {
							var buf = new Buffer(data).toString('base64');
							res.send(buf);
						}
					});
				}
				else{
					path = def;
					fs.readFile(path, function(err,data){
						if(err) {
							//console.log(err);
							fs.readFile(def, function(err,data){
								if(err) {

								}
								var buf = new Buffer(data).toString('base64');
								res.send(buf);
							});
						}else {
							var buf = new Buffer(data).toString('base64');
							res.send(buf);
						}
					});
				}
			}
			else{
				res.send(false);
			}
		});
	});

	app.post('/getMFile', function(req, res){

		db.users.findOne({_id:req.body._id},{matricFile:1},function(err,mf){
			var file = mf.toObject().matricFile;
			if(file){
				var path = __dirname + file;
				fs.readFile(path, function(err,data){
					if(err) throw err;
					else{
						var buf = new Buffer(data).toString('base64');
						res.send(buf);
					}
				});
			}
			else{
				res.send(false);
			}
		});
	});
    app.post('/getDFile', function(req, res){

		db.users.findOne({_id:req.body._id},{driversFile:1},function(err,mf){
			var file = mf.toObject().driversFile;
			if(file){
				var path = __dirname + file;
				fs.readFile(path, function(err,data){
					if(err) console.log(err);
					else{
						var buf = new Buffer(data).toString('base64');
						res.send(buf);
					}
				});
			}
			else{
				res.send(false);
			}
		});
	});

	app.post('/getCFile', function(req, res){
		var path = req.body.cert.file;
		path = __dirname + path;

		fs.readFile(path, function(err,data){
			if(err) {
				res.send(false);
			}else {
				var buf = new Buffer(data).toString('base64');
				res.send(buf);
			}
		});
	});
	//done


	//update a user
	app.post('/updateUser', function(req,res){

		var user = req.body;
		db.users.update({_id : user._id}, {$set: user}, function(err, doc){
			if (err) throw err;
			res.send(true);
		} );

	});
	//done

	//Add application to db
	app.post('/apply', function(req,res) {

		var user = req.body.user;
		var job = req.body.job;
		job.applicationsLeft--;
		if (!job.applicants) {
			job.applicants = [];
		}
		job.applicants.push(user._id);

		var application = {
			studentID: user._id,
			jobID: job._id,
			employerID: job.employerID,
			status: 'Pending',
			date: Date.now()
		};

				db.users.findOne({_id: user._id}, function (err, usrr) {
					if (err) throw err;
					var tempPackages = [];
					var usr = usrr.toObject();
					//application stuff
					var flag = false;
					if(usr.freeApplications > 0){
						usr.freeApplications--;
						flag = true;
					}else{

						if(usr.packages) {
							var tempPackages = usr.packages;
							tempPackages.sort(sortPackages);

							for(var k = 0; k < tempPackages.length; k++){
								if(tempPackages[k].active && tempPackages[k].remainingApplications == 'unlimited'){
									flag = true;
									break;
								}
								if(tempPackages[k].active && tempPackages[k].remainingApplications > 0){
									tempPackages[k].remainingApplications--;
									flag = true;
									break;
								}
							}usr.packages = tempPackages;
							//console.log(tempPackages);
						}
					}
					if(!flag){
						res.send('noApps');
					}
					else{
					db.users.findOneAndUpdate({_id:usr._id}, {$set:usr}).exec(function(err,rsss){
						db.applications.create(application, function (app) {
							db.jobs.update({_id: job._id}, {$set: job}, function (err, docs) {

								var args = {};
								//send student email
								if (usr.emailDisable == undefined || !usr.emailDisable) {
									args.name = usr.name.name;
									if(job.post.category != 'Other')
									args.category = job.post.category;
									else
										args.category = job.post.OtherCategory;
									args.date = convertDateForDisplay(job.post.startingDate);

									args.email = usr.contact.email;
									if(!job.post.interviewRequired){
										args.interview = false;
									}else args.interview = true;


									args.applicationsLeft = usr.freeApplications;

									for(var r = 0; r < tempPackages.length; r++){
										if(tempPackages[r].active) {
											if(tempPackages[r].remainingApplications == 'unlimited')
											{
												args.applicationsLeft = 'unlimited';
												break;
											}
											args.applicationsLeft += tempPackages[r].remainingApplications;
										}
									}

									db.users.findOne({_id: job.employerID}, function (err, em) {
										if (err) throw err;
										var emp = em.toObject();
										args.employerName = emp.contact.name + " " + emp.contact.surname;
										mailer.sendMail('applicationMade', usr._id, args, function (errr, rs) {
											//console.log("mail sent: " + args.email);
										});
									});
								}
								//send employer email
								db.users.findOne({_id: job.employerID}, function (err, usre) {
									var emp = usre.toObject();
									if(emp.emailDisable == undefined || !emp.emailDisable){
										args.date = convertDateForDisplay(job.post.startingDate);
										if(job.post.category != 'Other')
											args.category = job.post.category;
										else
											args.category = job.post.OtherCategory;
										args.email = emp.contact.email;
										args.link = 'http://' + req.headers.host + '/applicants';
										args.talentName = usr.name.name;
										args.name = emp.contact.name + " " + emp.contact.surname;
										mailer.sendMail('applicationMadeEmployer', usre._id, args, function (errr, rsss) {
											//console.log("mail sent: " + args.email);
										});
									}
								});
								res.send(usr);
							});

						});
					});


					}

		});
	});
	//done

	//make changes to application
	app.post('/updateApplication', function (req, res) {

		var app = req.body;
		app.offerDate = Date.now();
		var id = app._id;
		delete  app._id;

		db.applications.findOneAndUpdate({_id: id}, {$set: app}).populate('studentID').populate('employerID').populate('jobID').exec(function (err, ap) {
			if (err) throw err;

			var usr = ap.studentID.toObject();
			var emp = ap.employerID.toObject();
			var job = ap.jobID.toObject();

			if(app.status == "Provisionally accepted"){
					job.provisionalLeft--;
					db.jobs.update({_id:job._id}, {provisionalLeft: job.provisionalLeft}, function(err,doc){
						if(err) throw err;
					});
			}

			if (usr.emailDisable == undefined || !usr.emailDisable) {
				var args = {};
				args.name = usr.name.name;
				args.date = convertDateForDisplay(job.post.startingDate);
				if(job.post.OtherCategory)
					args.role = job.post.OtherCategory;
				else
					args.role = job.post.category;
				args.email = usr.contact.email;
				if (emp.employerType == 'Company') {
					args.employer = emp.company.name;
				} else
					args.employer = emp.contact.name + " " + emp.contact.surname;


				if (app.status == "Provisionally accepted") {
					args.subject = args.role;
					args.link = 'http://' + req.headers.host + '/job?id=' + job._id;

					if (job.post.interviewRequired) {
						mailer.sendMail('offerMadeInterview', usr._id, args, function (err, rr) {
							//console.log("mail sent: " + args.email);
						});
					}
					else {
						mailer.sendMail('offerMade', usr._id, args, function (err, rr) {
							//console.log("mail sent: " + args.email);
						});
					}
				}
				else if (app.status == "Declined") {
					args.subject = args.role;
					args.link = 'http://' + req.headers.host + '/browseJobs?timePeriods[]=Once Off&timePeriods[]=Short Term&timePeriods[]=Long Term&categories[]=Assistant&categories[]=Aupair&categories[]=Bartender&categories[]=Coach&categories[]=Cook %2F Chef&categories[]=Delivery Person&categories[]=Host(ess)&categories[]=Internship&categories[]=Model&categories[]=Photographer %2F Videographer&categories[]=Programmer %2F Developer&categories[]=Promoter&categories[]=Retail Worker&categories[]=Tutor&categories[]=Waiter(res)&categories[]=Other';

					db.jobs.findOneAndUpdate({_id: ap.jobID._id}, {$pull: {applicants: ap.studentID._id}}).exec(function (ers, ress) {
						//console.log(ress);
					});

					mailer.sendMail('applicationDenied', usr._id, args, function (err, rr) {
						//console.log(rr);
					});
				}
			}
			res.send(true);
		});

	});
	//done
	//make changes to application
	app.post('/rateStudent', function(req,res){

		var app = req.body;

		var id = app._id;
		delete  app._id;
		var user = app.id;
		delete app.id;
		var newRating = app.studentRating;
		db.applications.findOneAndUpdate({_id : id},{$set: app}).populate('studentID').populate('employerID').populate('jobID').exec(function(err, ap){
			if (err) throw err;

			var usr = ap.studentID.toObject();
			var emp = ap.employerID.toObject();
			var job = ap.jobID.toObject();
			var date;
            var Catergory;
            if(job.post.OtherCategory)
                Catergory = job.post.OtherCategory;
            else
                Catergory = job.post.category
			date = convertDateForDisplay(job.post.startingDate);
			db.users.findOne({_id:user}, function(err,us){
				us = us.toObject();
				var numRatings = 0;
				if(us.numRatings){
					numRatings = us.numRatings;
				}
				var rating = 0;
				if(us.rating){
					var rating = us.rating;

				}
				var tempRating = roundHalf(((rating * numRatings) + newRating)/++numRatings);

				db.users.findOneAndUpdate({_id:us._id}, {$set:{rating:tempRating, numRatings:numRatings}}, function(err, rr){


					if(usr.emailDisable == undefined || !usr.emailDisable){

						var args = {
							link:'http://' + req.headers.host + '/myJobHistory',
								name: usr.name.name,
								employerName: emp.contact.name,
								category : Catergory,
								date: date,
								email: usr.contact.email,
								subject: "You have Received a Rating from " + emp.contact.name
						};

					mailer.sendMail('ratedTalent', rr._id,args,function(err, r){

						//console.log("mail sent: " + args.email);

					});
					}
					res.send(true);
				});

			});

		} );

		} );

	//done
	//make changes to application
	/*
	app.post('/rateEmployer', function(req,res){

		var app = req.body;

		var id = app._id;
		delete  app._id;
		var user = app.id;
		delete app.id;
		var newRating = app.employerRating;
		db.applications.findOneAndUpdate({_id : id},{$set: app}).populate('studentID').populate('employerID').populate('jobID').exec(function(err, ap){
			if (err) throw err;

			var usr = ap.studentID.toObject();
			var emp = ap.employerID.toObject();
			var job = ap.jobID.toObject();
			var date;
			if(job.endDate){
				date = job.endDate;
			}
			else date = job.startingDate;

			db.users.findOne({_id:user}, function(err,us){

				us = us.toObject();
				var numRatings = 0;
				if(us.numRatings){
					numRatings = us.numRatings;
				}
				var rating = 0;
				if(us.rating){
					var rating = us.rating;

				}
				var tempRating = roundHalf(((rating * numRatings) + newRating)/++numRatings);

				db.users.findOneAndUpdate({_id:us._id}, {$set:{rating:tempRating, numRatings:numRatings}}, function(err, rr){

					if(emp.emailDisable == undefined || !emp.emailDisable){

						var args = {
							link:'http://' + req.headers.host + '/employmentHistory',
							name: emp.contact.name,
							talentName: usr.name.name + ' ' + usr.name.surname,
							category : job.post.category,
							date: date,
							email: emp.contact.email,
							subject: "You have Received a Rating from " + usr.name.name
						};

						mailer.sendMail('ratedEmployer', rr._id,args,function(err, r){

							console.log(r);

						});
					}
						res.send(true);

				});

			});

		} );

	});
	*/
	//done

	app.post('/loadApplication', function(req,res){
		var data = req.body;

		db.applications.findOne({studentID: data.studentID, jobID: data.jobID}). exec(function(e,doc){
			res.send(doc);
		});
	});
	//loads applications by student
	app.post('/loadApplications', function(req,res){

		var user = req.body;
		db.applications.find({studentID: user._id}).populate('jobID').populate('employerID').populate('studentID').sort('-date').exec(function (err, docs) {

			res.send(docs);
		});


	});
	app.post('/loadMyApplications', function(req,res){

		var userID = req.body.user;
		var jobID = req.body.job;
		db.applications.findOne({studentID: userID, jobID: jobID},{ _id: 0,status : 1 }).exec(function (err, docs) {
			res.send(docs);
		});
	});
	//done

	//load applications by employer and populate job IDs
	app.post('/loadApplicationsTo', function(req,res){

		var user = req.body;
		db.applications.find({employerID: user._id}).where('status').ne('Completed').populate('jobID').exec(function (err, docs) {

			res.send(docs);
		});


	});
	//done

	//load applicants for applicants page
	app.post('/loadApplicants', function(req,res){
		var jobID = req.body.jobID;
		db.applications.find({jobID: jobID}).where('status').ne('Completed').where('status').ne('Declined').sort({date: -1}).populate('studentID').exec(function (err, docs) {
			res.send(docs);
		});
	});

	//load jobs for applicants page
	app.post('/loadApplicantsJobs', function(req,res){


		var user = req.body;

		db.jobs.find({employerID: user._id, status: {$ne: "inactive", $ne:"Completed"}}).sort({'post.postDate' : -1}).exec(function(err,rws) {
			if(err) throw err;
			res.send(rws);
			/*var ret = [];
			var calls = [];
			var ticks = [rows.count];
			var  i = 0;

			res.send(rows);
			rows.forEach(function(j){
				calls.push(function(callback){
					var job = j.toObject();
					db.applications.find({jobID: job._id}).where('status').ne('Completed').where('status').ne('Declined').sort({date:-1}).populate('studentID').exec(function (err, docs) {
						console.log(job.post.OtherCategory);
						job.applications = docs;
						//ret.splice(ret.length,0,job);
						ret.push(job);
						i++;

						callback(null, job);
					});
				});
			});
			async.parallel(calls, function(err, result) {
				res.send(ret);
				if (err)
					return console.log(err);

			});*/



		});



	});
	//done

	//load applications by job and populate job and student IDs
	app.post('/loadApplicantsByJobId', function(req,res){

		var job = req.body;
		db.applications.find({jobID: job._id}).where('status').ne('Completed').populate('jobID').populate('studentID').exec(function (err, docs) {

			res.send(docs);
		});


	});
	//done

	//load notifications by user
	app.post('/loadNotifications', function(req,res){

		db.notifications.find({userID: req.body.id, seen: false}).sort({dateTime: -1}).exec(function(err, rows){
			res.send(rows);
		});
	});
	//done

	//update a notification to be seen
	app.post('/makeSeen', function(req,res){

		var noti = req.body;
		db.notifications.findOneAndUpdate({_id : noti.id}, {$set: {seen : true}}, function(err, not){
			if (err) throw err;
			res.send(true);
		} );

		/*
		 db.notifications.find({_id : noti.id}).remove().exec( function(err, not){
		 if (err) throw err;
		 res.send(true);
		 } );
		 */
	});
	//done

	//for ratings, called for employers to rate talent
	app.post('/getRatingDataForEmployer', function(req,res){

		var emp = req.body;

		db.applications.find({employerID: emp.id, status:"Completed", offered:"accepted"}).populate('jobID').populate('studentID').exists('studentRating', false).exec(function (err, rows){
			res.send(rows);
		});


	});
	//done

	//for ratings, called for employers to rate talent
	app.post('/getRatingDataForStudent', function(req,res){

		var student = req.body;

		db.applications.find({studentID: student.id, status:"Completed",offered:"accepted"}).populate('jobID').populate('employerID').exists('employerRating', false).exec(function (err, rows){
			res.send(rows);
		});

	});
	//done
	app.post('/getRatings', function(req,res){
		var id = req.body.id;
		db.users.find({_id: id},{numRatings:true,rating:true},function(err,doc){
			res.send(doc);
		});
	});
	//loads a list of completed jobs for students
	app.post('/JobHistory', function(req,res){
		var user = req.body;
		db.applications.find({studentID: user.studentID, status: 'Completed'}).populate('studentID').populate('employerID').populate('jobID').sort({_id:-1}).exec(function (errs, docs) {
			if(errs) throw errs;
			res.send(docs);
		});
	});

	//loads completed jobs for a employer to review and or repost
	app.post('/loadJobHistory', function(req,res){

		var user = req.body;
		db.jobs.find(req.body).where('status').equals('Completed').sort('-post.postDate').exec(function(err,rws) {
			var rows = rws;
			var ret = [];
			var calls = [];
			var ticks = [rows.count];
			var  i = 0;
			rows.forEach(function(j){
				calls.push(function(callback){
					var job = j.toObject();
					db.applications.find({jobID: job._id, status: 'Completed'}).populate('studentID').sort({_id:-1}).exec(function (err, docs) {
						job.applications = docs;
						ret.push(job);
						i++;
						callback(null, job);
					});
				});
			});
			async.parallel(calls, function(err, result) {
				res.send(ret);
				if (err)
					return console.log(err);

			});



		});



	});
	//done


	app.post('/loadPostHistory', function(req,res) {

		var user = req.body;
		db.jobs.find(req.body).where('status').equals('Completed').exec(function (err, docs) {

			res.send(docs);
		});
	});
	//done

	//activate a new user
	app.post('/activateUser', function(req,res){
		var user = req.body;
		//console.log(user);
		db.users.findOneAndUpdate({activateToken: user.token},{$set:{active: true},$unset: {activateToken:""}}, function(err,doc){
			if(err) throw err;
			res.send(doc);
		} );
	});
	//done

	//remove job
	app.post('/removeJob', function(req,res){
		var id = req.body.id;

		//remove job
		db.jobs.remove({_id: id}, function (err,row) {
			//remove applications
				db.applications.remove({jobID:id}, function(err,rows){
					res.send(row);
				});

			
		});
	});
	//done

	//checks Password on chnges
	app.post('/checkPassword', function(req,res){

		var user = req.body;

		db.users.findOne({'contact.email': user.email}, function(err,doc){
			if(err){

			}else {

				if (doc) {
					if (passwordHash.verify(user.password, doc.toObject().passwordHash)) {
						res.send(true);
					}else
						res.send(false);
				}else
					res.send(false);
			}
		});
	});

	//done

	//get dashboard statistics
	app.post('/getStats', function(req,res) {


		var user = req.body;
		var stats = {};
		db.users.count({type:'student'}, function(err, c){
			stats.studentCount = c;
			db.users.count({type:'employer'}, function(err, c){
				stats.employerCount = c;
				db.jobs.count({}, function(err, c){
					stats.jobsCount = c;
					if(user.type == 'student'){
						db.applications.count({studentID:user.id}, function(err, c){
							stats.myApplications = c;
							res.send(stats);
						});
					}
					else if(user.type == 'employer') {
						db.jobs.count({employerID: user.id}, function (err, c) {
							stats.myPosts = c;
							res.send(stats);
						});
					}
					else if(user.type == 'guest'){
						res.send(stats);
					}
				});

			});
		});

	});
	//done
	//make offer functionality
	app.post('/makeOffer', function(req,res) {


		var app = req.body;

		db.applications.findOneAndUpdate(app,{$set: {offered:"offered"}}, function(err, doc){
			res.send(doc);
		});

	});
	//done

	//get all applicants who should be declined when all positions of job are filled
	app.post('/getAllApplicantsOfJob',function(req,res) {
		var jobID = req.body.jobID;
		db.applications.find({jobID: jobID, status: "Pending"}).exec(function (err, rows) {
			if(err) throw (err);
			res.send(rows);
		});
	});

	//accept offer functionality
	app.post('/acceptOffer', function(req,res) {


		var app = req.body;
		//console.log(app);
		db.applications.findOneAndUpdate(app,{$set: {offered:"accepted", status:"Confirmed"}}).populate('studentID').populate('employerID').populate('jobID').exec(function(err, ap){
			if (err) throw err;

			var usr = ap.studentID.toObject();
			var emp = ap.employerID.toObject();
			var job = ap.jobID.toObject();

			job.positionsLeft--;
			db.jobs.update({_id:job._id}, {positionsLeft: job.positionsLeft}, function(err,doc){
				if(err) throw err;
			});

			if(emp.emailDisable == undefined || !emp.emailDisable) {

				var args = {
					name: emp.contact.name,
					talent: usr.name.name + " " + usr.name.surname,
					talentName: usr.name.name,
					talentEmail: usr.contact.email,
					email: emp.contact.email,
					date: convertDateForDisplay(job.post.startingDate),
					link: 'http://' + req.headers.host + '/applicants'
				};
				if(job.post.OtherCategory)
					args.category = job.post.OtherCategory;
				else
					args.category = job.post.category;

				if(job.post.interviewRequired){

					mailer.sendMail('interviewAccepted', emp._id, args, function (er, rss) {
						//console.log("mail sent: " + args.email);
					});
				}
				else{
					mailer.sendMail('offerAccepted', emp._id, args, function (er, rss) {
						//console.log("mail sent: " + args.email);
					});
				}

			}
			res.send(true);

		});

	});
//done

	//withdraw application from edited job
	app.post('/withdrawChanges', function(req,res) {

			var app = req.body.app;
			var job = req.body.job;

			db.applications.remove({_id:app._id},function(err,doc){
				if(err) throw err;
			});
			var jobQry = {};
			switch(app.status){
				case "Application Pending":{
					job.applicationsLeft++;
					break;
				}
				case "Confirmed":{
					job.positionsLeft++;
					job.applicationsLeft++;
					job.provisionalLeft++;
					break;
				}
				case "Provisionally accepted":{
					job.provisionalLeft++;
					job.applicationsLeft++;
					break;
				}
			}

			db.jobs.update({_id: job._id}, {
				positionsLeft: job.positionsLeft,
				applicationsLeft: job.applicationsLeft,
				provisionalLeft: job.provisionalLeft,
				$pull: {applicants: {$in: [app.studentID]}}
			}, function (err, doc) {
				if (err) throw err;
				res.send(true);
			});

	});
	//done

	//decline offer functionality
	app.post('/declineOffer', function(req,res) {
		var app = req.body._id;
		var job = req.body.job;

		job.provisionalLeft++;
		db.jobs.update({_id:job._id}, {provisionalLeft:job.provisionalLeft}, function(err,doc){
			if (err) throw err;
		});


		db.applications.findOneAndUpdate({_id:app},{$set: {offered:"declined", status:"Declined"}, $unset:{edited:1, editTime:1}}).populate('studentID').populate('employerID').populate('jobID').exec(function(err, ap){
			if (err) throw err;

			var usr = ap.studentID.toObject();
			var emp = ap.employerID.toObject();
			var job = ap.jobID.toObject();
			if(emp.emailDisable == undefined || !emp.emailDisable) {
				var args = {
					name: emp.contact.name,
					talent: usr.name.name + " " + usr.name.surname,
                    gender: usr.gender == 'M' ? "his" : "her",
					email: emp.contact.email,
					link: 'http://' + req.headers.host + '/applicants'
				};

				mailer.sendMail('applicationWithdrawn', emp._id, args, function (er, rss) {
					//console.log(rss);

				});
			}
			db.jobs.findOneAndUpdate({_id : ap.jobID._id},  {$pull: { applicants: ap.studentID._id}}).exec(function(ers,ress){
				if(ers) throw ers;
				res.send(true);
			});

		});

	});

	//done

	//get offer count for employer profile
	app.post('/getOfferCount', function(req, res){

		var user = req.body._id;
		//console.log(user);

		db.jobs.count({employerID: user,status:'active'}, function(err, count){
			//console.log(count);
			res.send({count:count});
		});

	});
	//done
	app.post('/toggleEmail', function(req, res){

		var user = req.body;

		db.users.findOneAndUpdate({_id: user.id}, {$set:{emailDisable:user.emailDisable}}, function(err, count){
			if(!err){
				res.send(true);
			}
		});

	});
	app.post('/setEmailToggle', function(req, res){

		var user = req.body;


		db.users.findOne({_id: user.id}, {emailDisable: 1, _id:0}, function(err,data){
			if(!err){
				res.send(data);
			}
		});

	});
	app.post('/getPayment', function(req, res){

		var user = req.body;

		user.packages.paymentToken = passwordHash.generate(user.packages.paymentToken);

		db.users.findOneAndUpdate({_id: user._id}, {$push:{packages:user.packages}}, {new : true}, function(err){
			if(!err){
				res.send(user.packages.paymentToken);
			}
			else
				res.send(false);
		});
	});
	app.post('/checkPaymentToken', function(req, res){

		var user = req.body;
		var now = new Date();
		var remainingApplications = 0;
		switch(user.packageType)
		{
			case "Talent_Basic" :
				now.setDate(now.getDate()+7);remainingApplications = 3;break;
			case "Talent_Classic" :
				now.setDate(now.getDate()+7);remainingApplications = 7;break;
			case "Talent_Ultimate" :
				now.setDate(now.getDate()+31);remainingApplications = "unlimited";break;
		}
		//console.log(now);
		now = now.getTime();

		db.users.findOneAndUpdate(	{_id:user._id,"packages.paymentToken":user.paymentToken,"packages.active":false, "packages.packageType" : user.packageType},
				{$set: {"packages.$.expiryDate" : now, "packages.$.active" : true , "packages.$.remainingApplications" : remainingApplications},$unset : {"packages.$.paymentToken" : 1}},
				{new : true}, function(err,doc){
					if(!err) {
						if(!doc || doc == null){
							res.send('error');
						}else {

							var usr = doc.toObject();

							if(usr.emailDisable == undefined || !usr.emailDisable) {
								//mailer args
								var args = {};

								args.name = usr.name.name;
								args.package = user.packageType.replace("_", " ");
								args.email = usr.contact.email;
								args.applicationsLeft = usr.freeApplications;
								var tempPackages = usr.packages;
								for (var r = 0; r < tempPackages.length; r++) {
									if (tempPackages[r].active) {
										if (tempPackages[r].remainingApplications == 'unlimited') {
											args.applicationsLeft = 'unlimited';
											break;
										}
										args.applicationsLeft += tempPackages[r].remainingApplications;
									}
								}

								mailer.sendMail('paymentReceived', user._id, args, function (err, rss) {
									//console.log("mail sent: " + args.email);
								});
							}
							res.send(doc);
						}

					}
					else
						res.send("error");
				});
	});

	app.post('/cancelPaymentToken', function(req, res){

		var user = req.body;


		db.users.update({_id:user._id},
				{$pull:{packages:{'paymentToken' : user.paymentToken}}}, function(err,doc){
					if(!err) {
						//console.log(doc);
						res.send(doc);
						}
					else
					{
						//console.log(err);
						res.send("error");
					}
				});
	});

	app.post('/getNumApps', function(req, res){


		var user = req.body;

		db.users.findOne({_id: user.id}, function(err,usr){
			if(!err && usr){
				res.send(usr.toObject());
			}
			else
				res.send(false);
		});
	});
};

function roundHalf(num) {
	return Math.round(num*2)/2;
}

function sortPackages(a,b){
	if (a.expiryDate < b.expiryDate) {
		return -1;
	}
	if (a.expiryDate > b.expiryDate) {
		return 1;
	}
	// a must be equal to b
	return 0;
}

function saveFile(file, cb){
var path = require('path');
	fs.readFile(file.path, function (err, data) {

		var temp = file.path;
		temp = temp.replace("tmp\\", '\\uploads\\');

		var newPath = __dirname + temp;

		fs.writeFile(newPath, data, function (err) {
			if(err) throw err;

			else{
				//console.log(temp);
				cb(temp);
			}


		});

	});

}
/*
function test(){
	var args = {link: 'http://olink.co.za/activate?token=', email: 'sean.hill.t@gmail.com'};


		args.name = 'Sean';
		mailer.sendMail('welcomeTalent',1,args, function(err,rrs){
			if(!err)
			console.log(rrs);
		});
}
test();
*/

function dateConvert(inDate){
	var year = inDate.substr(0,4);
	var month =inDate.substr(5,2);
	var day = inDate.substr(8,2);
	var ret = month+"/"+day+"/"+year;

	return ret;
}

function convertDateForDisplay(date){

	var year = date.substr(6,4);
	var day = date.substr(3,2);
	var month = date.substr(0,2);
	var ret = day+"/"+month+"/"+year;

	return ret;
}