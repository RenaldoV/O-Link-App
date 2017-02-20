/**
 * Created by Sean on 2016/04/01.
 */

app.service('constants', function(){

    this.tertiaryInstitutions = ["AFDA",
        "Boston City Campus and Business College",
        "Cape Peninsula University of Technology",
        "Central University of Technology",
        "Cornerstone Institute",
        "CTCFD",
        "Damelin",
        "Durban University of Technology",
        "FEDISA",
        "Helderberg College",
        "IMM Graduate School of Marketing",
        "Inscape Design College",
        "Management College of Southern Africa",
        "Mangosuthu University of Technology",
        "Midrand Graduate Institute",
        "Milpark Business School",
        "Monash South Africa",
        "Nelson Mandela Metropolitan University",
        "North-West University",
        "Rhodes University",
        "Rosebank College",
        "SACAP",
        "Sol Plaatje University",
        "Southern Business School",
        "Stenden University South Africa",
        "The Design School Southern Africa",
        "Tshwane University of Technology",
        "University of Cape Town",
        "University of Fort Hare",
        "University of Johannesburg",
        "University of KwaZulu-Natal",
        "University of Limpopo",
        "University of Mpumalanga",
        "University of Pretoria",
        "University of South Africa",
        "University of Stellenbosch",
        "University of the Free State",
        "University of the Western Cape",
        "University of the Witwatersrand",
        "University of Venda",
        "University of Zululand",
        "Vaal University of Technology",
        "Varsity College",
        "Vega",
        "Walter Sisulu University",
        "Other"];

    this.companyCategories = ["Bar",
        "Catering",
        "Film and Media",
        "Financial",
        "Information Technology",
        "Model Agency",
        "Promotion / Events",
        "Restaurant / Café",
        "Retail",
        "School",
        "Take-out Restaurant",
        "Tutoring",
        "University",
        "Other"];

    this.categories = [
        "Assistant",
        "Aupair",
        "Bartender",
        "Coach",
        "Cook / Chef",
        "Delivery Person",
        "Host(ess)",
        "Internship",
        "Model",
        "Photographer / Videographer",
        "Programmer / Developer",
        "Promoter",
        "Retail Worker",
        "Tutor",
        "Waiter(res)",
        "Other"];

    this.timePeriods = [
        {name: "Once Off", description: "< 1 week"},
        {name:"Short Term",description: "> 1 week and < 1 month"},
        {name:"Long Term", description: "> 1 month"}];

    this.requirements = [
        "Mathematics",
        "English",
        "Afrikaans",
        "Physics",
        "Chemistry",
        "Accounting",
        "Business Studies",
        "Biology",
        "Computing",
        "Consumer Studies",
        "Design Technology",
        "Dramatic Arts",
        "Economics",
        "Geography",
        "History",
        "Music",
        "Psychology",
        "Sociology ",
        "Technical Drawing",
        "Information Technology",
        "Physical Science",
        "Life Science",
        "Intro to Criminology",
        "Mercantile Law",
        "Travel and Tourism",
        "IsiZulu",
        "Sesotho",
        "Design",
        "Hospitality Studies",
        "IsiXhosa",
        "Other"
    ];

    this.Cambridge = [
        "Mathematics",
        "English",
        "Afrikaans",
        "Physics",
        "Chemistry",
        "Accounting",
        "Business Studies",
        "Biology",
        "Computing",
        "Design Technology",
        "Economics",
        "Geography",
        "History",
        "Music",
        "Psychology",
        "Sociology ",
        "Technical Drawing",
        "Other"
            ];

    this.NSC = [
        "Mathematics",
        "English",
        "Afrikaans",
        "Physical Science",
        "Life Science",
        "Information Technology",
        "Business Studies",
        "Biology",
        "Intro to Criminology",
        "Economics",
        "Geography",
        "History",
        "IsiZulu",
        "Mercantile Law",
        "Travel and Tourism",
        "Technical Drawing",
        "Other"
            ];

    this.IEB = [
        "Mathematics",
        "English",
        "Afrikaans",
        "Physical Science",
        "Life Science",
        "Information Technology",
        "Design",
        "Hospitality Studies",
        "Economics",
        "Geography",
        "IsiXhosa",
        "IsiZulu",
        "Sesotho",
        "Music",
        "Other"
            ];

    this.studentPackages = [
        {name:'Basic', cost: 29, timeframe:'1 WEEK', description:'3 Further Applications'},
        {name:'Classic', cost: 39, timeframe:'1 WEEK', description:'7 Further Applications'},
        {name:'Ultimate', cost: 49, timeframe:'1 MONTH', description:'UNLIMITED Applications'}
    ];
    this.employerPackages = [   ];

});