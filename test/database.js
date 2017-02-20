//Not yet in testing format, loose tests sofar

var db = require("./app/models/Database.js");

describe('DatabaseInteraction', function(){

});



var db = require("./app/models/Database.js");

var student  = {name : 'Sean',
    surname : "Hill",
    dob :  "1992-11-24",
    studentNo : "12205689", email: "test@test.te", contactNo : "0786549862",
    ID : "9245687895636", gender : "m", location : "testville", fieldOfStudy: "IT", qualificationName : "BSC IT", currentYear : 3, gradYear: 2015,
    postGraduate : 1, GPA: 3.93, passwordHash: "Blah", signupDate : "2016-02-04 14:27:28"};

db.insertStudent(student, function(res){
    console.log(res);
});

db.checkLogin('test@test.te', 'Blah','students', function (res) {
    console.log(res);
});

db.getUser('test@test.te', 'students', function (res) {
    console.log(res);
});