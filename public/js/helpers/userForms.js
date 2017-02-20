////Renaldo se user form scripts, uit sodat dit makliker is om te edit(gebruik vir edit profile ook)


//===========================INIT TABS=============================
$(document).ready(function ($) {
    $('#tabs').tab();
});

$(".talentSelected").on("click",function(){
    $(".signupBox").css("border-color", "#33B6CC");
});
$(".employerSelected").on("click",function(){
    $(".signupBox").css("border-color", "#00b488");
});
//==================================================================

//========================TALENT FORM================================================================

//=================ABOUTME CHARS LEFT================
$(function () {
    var text_max = 500;
    $('#textarea_feedback').html(text_max + ' remaining');

    $('#aboutMe').keyup(function() {
        var text_length = $('#aboutMe').val().length;
        var text_remaining = text_max - text_length;

        $('#textarea_feedback').html(text_remaining + ' remaining');
    });
});

//====================================================

$(function () {

    $(".reveal2").mousedown(function() {
        $(".pwd2").get(0).type='text';
    })
        .mouseup(function() {
            $(".pwd2").get(0).type='password';
        })
        .mouseout(function() {
            $(".pwd2").get(0).type='password';
        });

    $(".reveal3").mousedown(function() {
        $(".pwd3").get(0).type='text';
    })
        .mouseup(function() {
            $(".pwd3").get(0).type='password';
        })
        .mouseout(function() {
            $(".pwd3").get(0).type='password';
        });

});
//========================TALENT FORM================================================================


//========================EMPLOYER FORM==============================================================


$(".reveal").mousedown(function() {
        $(".pwd").get(0).type='text';
    })
    .mouseup(function() {
        $(".pwd").get(0).type='password';
    })
    .mouseout(function() {
        $(".pwd").get(0).type='password';
    });

$(".reveal1").mousedown(function() {
        $(".pwd1").get(0).type='text';
    })
    .mouseup(function() {
        $(".pwd1").get(0).type='password';
    })
    .mouseout(function() {
        $(".pwd1").get(0).type='password';
    });

//========================EMPLOYER FORM VALIDATION================================================================









