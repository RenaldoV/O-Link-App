

app.constant('AUTH_EVENTS', {
    loginSuccess: 'auth-login-success',
    loginFailed: 'auth-login-failed',
    logoutSuccess: 'auth-logout-success',
    sessionTimeout: 'auth-session-timeout',
    notAuthenticated: 'auth-not-authenticated',
    notAuthorized: 'auth-not-authorized'
});
app.constant('USER_TYPES', {
    student: 'student  ',
    employer: 'employer'
});

app.factory('authService', function($http,session){
    var authService ={};

    authService.login = function (credentials) {
        return $http
            .post('/loadUser', credentials)
            .then(function (res) {
                delete res.data.passwordHash;
                session.create(res.data);


                return res.data;

            });
    };


    authService.isAuthenticated = function () {
        return !!session.user;
    };


    return authService;
});

app.service('session', function ($cookies, $timeout) {
    this.create = function (user) {
        delete user.packages;
        this.user = user;
        $cookies.put("user", JSON.stringify(user));
    };
    this.destroy = function () {
        this.user  = null;
    };
    this.update = function (user,cb) {
        $timeout(function () {
            delete user.packages;
            this.user = user;
            $cookies.put("user", JSON.stringify(user));
            cb(true);
        });
    };
});

app.controller('ApplicationController', function ($scope,authService) {
    $scope.currentUser = null;
    $scope.isAuthorized = authService.isAuthorized;

    $scope.setCurrentUser = function (user) {
        $scope.currentUser = user;
    };
});

app.service('cacheUser', function () {
    this.create = function (user) {
        delete user.packages;
        this.user = user;
    };
    this.destroy = function () {
        delete user.packages;
        this.user  = null;
    };
});