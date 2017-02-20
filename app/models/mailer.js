var nodemailer = require('nodemailer');
var smtpttransport = require('nodemailer-smtp-transport');
var hbs = require('nodemailer-express-handlebars');
var db = require('./Database');
var options = {
    viewEngine: {
        extname: '.hbs',
        layoutsDir: 'emails/templates',
        defaultLayout : 'template',
        partialsDir : 'emails/partials/'
    },
    viewPath: 'emails/views/',
    extName: '.hbs'
};

var mailer = nodemailer.createTransport(smtpttransport({
    host: "mail.o-link.co.za",
    secureConnection: true,
    port: 465,
    auth: {
        user: "no-reply@o-link.co.za",
        pass: "Olink@Noreply2017"
    },
    tls: {rejectUnauthorized: false}
}));

function send(template,args, cb){

 mailer.use('compile', hbs(options));
mailer.sendMail({
    from: 'no-reply@o-link.co.za',
    to: args.email,
    subject: args.subject,
    template: template,
    context: args
}, function (error, response) {
    if(error) console.log(error);
    mailer.close();
    cb(error,response);

});
}
/* tests
var args = {email:'...', subject:'sub', link:'www.google.com',
    name: 'Sean',
    category: 'Android',
    applicantCount: 8,
interview: false,
employerName: "John",
applicationsLeft: 2,
date: '2/3/12',
employer: 'John Swanson',
talent: 'Saan Hall',
talentName: 'Saan'
};
args.vowel = isVowel(args.category);
send('welcomeTalent',args, function(e,r){
    console.log('test email sentwelcomeTalent');
    send('welcomeEmployer',args, function(e,r){
        console.log('test email sentwelcomeEmployer');
        send('forgotPassword',args, function(e,r){
            console.log('test email sentforgotPassword');
            send('jobLive',args, function(e,r){
                console.log('test email sentjobLive');
                send('jobEditedEmployer',args, function(e,r){
                    console.log('test email sentjobEditedEmployer');
                    send('jobEditedTalent',args, function(e,r){
                        console.log('test email sentjobEditedTalent');

                    });
                });
            });

        });

    });
});

*/
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

module.exports ={

    sendMail: function(template,userID,arg, cb){

        var args = arg;

        switch(template){
            case 'welcomeTalent':{

                args.subject = 'Welcome To O-Link';
                send(template,args,cb);
                console.log(userID + ", "+arg);
                break;
            }
            case 'welcomeEmployer':{

                args.subject = 'Welcome To O-Link';
                send(template,args,cb);
                console.log(userID + ", "+arg);
                break;
            }
            case 'forgotPassword':{

                db.users.findOne({_id:userID}, function(err,row){
                    var res = row.toObject();
                   var args = arg;
                    if(!err){
                        args.email = res.contact.email;
                        args.subject = 'O-Link Password Reset Requested';
                        if(res.type == 'student'){
                            args.name = res.name.name;
                        }
                        else if(res.type == 'employer'){
                            args.name = res.contact.name;
                        }

                        send(template,args,cb);
                    }
                });

                break;
            }
            case 'jobLive':{

                args.subject = 'Job Offer Now Live';
                args.vowel = isVowel(args.category);
                send(template,args,cb);
                break;
            }
            case 'jobEditedEmployer':{
                args.vowel = isVowel(args.category);
                args.subject = 'O-Link: Edited Job Offer Is Now Live';
                send(template,args,cb);
                break;
            }
            case 'jobEditedTalent':{
                args.vowel = isVowel(args.category);
                send(template,args,cb);
                break;
            }
            case 'offerExpiry':{
                args.vowel = isVowel(args.category);
                send(template,args,cb);
                break;
            }
            case 'jobEditedTimeUp':{
                args.vowel = isVowel(args.category);
                send(template,args,cb);
                break;
            }
            case 'offerTimeUp':{
                args.vowel = isVowel(args.category);
                send(template,args,cb);
                break;
            }
            case 'applicationMade':{
                var article;
                args.vowel = isVowel(args.category);
                if(args.vowel)
                    article = "an";
                else
                    article = "a";
                args.subject = 'Application Has Been Made For '+article+" "+args.category;
                send(template,args,cb);
                break;
            }
            case 'applicationMadeEmployer':{
                var article;
                args.vowel = isVowel(args.category);
                if(args.vowel)
                    article = "an";
                else
                    article = "a";
                args.subject = 'Application Has Been Made For '+article+" "+args.category;
                send(template,args,cb);
                break;
            }
            case 'offerMade':{
                var article = "";
                if(isVowel(args.subject))
                    article = "an";
                else
                    article = "a";
                args.subject = "Provisionally Accepted As " + article + " " + args.subject;
                send(template,args,cb);
                break;
            }
            case 'offerMadeInterview':{
                var article = "";
                if(isVowel(args.subject))
                    article = "an";
                else
                    article = "a";
                args.subject = "Provisionally Accepted As " + article + " " + args.subject;
                send(template,args,cb);
                break;
            }
            case 'applicationDenied':{
                var article = "";
                if(isVowel(args.subject))
                    article = "an";
                else
                    article = "a";
                args.subject = "Declined For a Job As " +  article + " " + args.subject;
                send(template,args,cb);
                break;
            }
            case 'applicationWithdrawn':{
                args.subject = "Withdrawn Application";
                send(template,args,cb);
                break;
            }
            case 'rateStudents':{
                args.subject = "Please Rate Your Past Employees";
                send(template,args,cb);
                break;
            }
            case 'ratedTalent':{
                send(template,args,cb);
                break;
            }
            case 'offerAccepted':{
                args.vowel = isVowel(args.category);
                args.subject = args.talentName +" Has Accepted Your Offer";
                send(template,args,cb);
                break;
            }
            case 'interviewAccepted':
            {
                args.vowel = isVowel(args.category);
                args.subject = args.talentName +" Has Accepted Your Offer";
                send(template,args,cb);
                break;
            }
            case 'paymentReceived':{
                args.subject = args.package + " Package Purchased";
                send(template,args,cb);
                break;
            }
        }




        }

};