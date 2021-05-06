$('.dropdown').click(function(){

    $('.dropdown-menu').toggleClass('show');

});
var app = angular.module('myApp', ["ngRoute"]);
// load using http , using filter form
    // config file 
    app.config(function($routeProvider) {
        
        $routeProvider
            .when("/", {
                templateUrl: "home.html"
            })
            .when("/about", {
                templateUrl: "about.html"
            })
            .when("/contact", {
                templateUrl: "contact.html"
            })
            .when("/subjects", {
                templateUrl: "subjects.html",
                controller:'subjectsCtrl'
            })
            .when("/quiz/:id/:name", {
                templateUrl: "quiz-app.html" ,
                controller:'quizCtrl'
            })
            .when("/faq", {
                templateUrl: "faq.html"
            })
            .when("/account", {
                templateUrl: "account.html",
                controller:'student'
            })
            .when("/list_subject", {
                templateUrl: "account/list_subject.html"
            })
            .when("/exam", {
                templateUrl: "account/test_exam.html"
            })
            .otherwise({
                redirectTo:"home"
            })
    });
    app.run(function($rootScope) {
        $rootScope.$on('$routeChangeStart', function() {
            $rootScope.loading = true;
        })
        $rootScope.$on('$routeChangeSuccess', function() {
            $rootScope.loading = false;
        })
        $rootScope.$on('$routeChangeError', function() {
            $rootScope.loading = false;
            alert("Lỗi không tải được Template!")
        })
    });
    app.directive("quizfpoly",function(quizFactory,$routeParams,$timeout,$http){
        return{
            restrict : "AE",
            scope:{},
            templateUrl:'template-quiz.html',
            link : function(scope,elem,attrs){
                scope.start = function(){
                    quizFactory.getQuestions().then(function(){
                        scope.nameSubject =$routeParams.name;
                        scope.id=0;
                        scope.quizOver = false;//chua hoan thanh
                        scope.inProfess = true;
                        scope.getQuestion();
                        scope.startTime();
                    });
                };

                scope.saveHistory = function() {
                    if (localStorage.getItem("account")) {
                        scope.auth = JSON.parse(localStorage.getItem("account"));
    
                    }
                    scope.subjectName = $routeParams.name;
    
                    var data = {
                            user: scope.auth.username,
                            user_id: scope.auth.id,
                            subject_name: scope.subjectName,
                            score: scope.score,
                            date: new Date
                        }
                        console.log(data)
    
                    $http.post("http://localhost:3000/history", JSON.stringify(data))
                        .then(function(res) {
                            alert('succes');
                            console.log(data)
                        }),
                        function(error) {
                            alert("false");
                            console.log(data)
                        }
    
                };

                scope.onTimeout = function() {
                    scope.counter--;
                    mytimeout = $timeout(scope.onTimeout, 1000);
                    if (scope.counter == -1) {
                        $timeout.cancel(mytimeout);
                        scope.quizOver = true;
                        alert('end time!');
                        scope.saveHistory();
                    }
                };

                scope.startTime = function() {
                    scope.counter = 600;
                    $timeout(scope.onTimeout, 1000);
                };

                scope.reset = function(){
                    scope.inProfess = false;
                    scope.score =0 ;
                };
                scope.getQuestion = function(){
                    var quiz = quizFactory.getQuestion(scope.id);
                    if(quiz){
                        scope.question = quiz.Text;
                        scope.options = quiz.Answers;
                        scope.answer = quiz.AnswerId;
                        scope.answerMode = true;
                    }else{
                        scope.quizOver=true;
                        scope.saveHistory();
                    }
                };
                scope.checkAnswer =function(){
                    if(!$('input[name=answer]:checked').length) return;
                    var ans = $('input[name=answer]:checked').val();
                    if(ans == scope.answer){
                        scope.score++;
                        scope.correctAns = true;
                    }else{
                        scope.correctAns = false;
                    }
                    scope.answerMode =false;
                };
                scope.nextQuestion = function(){
                    scope.id++;
                    scope.getQuestion();
                }

                if (localStorage.getItem("account")) {
                    scope.check_log = JSON.parse(localStorage.getItem("account"));
                    scope.reset();
                    scope.check_login = true;
                }else{
                    scope.check_login=false;
                }
                
            }
        }
    });

    app.factory('quizFactory',function($http,$routeParams){

        return {
            getQuestions:function(){
                return $http.get('db/Quizs/'+$routeParams.id+'.js').then(function(res){
                    questions =  res.data;
                });
            },
            getQuestion:function(id){
                var randomItem = questions[Math.floor(Math.random()*questions.length)];
                var count = questions.length;
                if(count>10){
                    count = 10;
                };
                
                if(id<count){
                    return randomItem;
                }else{
                    return false;
                };
            }
        }
    })

    // controller subjects
    app.controller("subjectsCtrl", function($scope,$http){
        $scope.list_subject = [];
        $http.get('db/Subjects.js')
        .then(function(res){
            $scope.list_subject = res.data;
        })
        .then(()=>{
            $scope.begin = 0;
        $scope.pageCount = Math.ceil($scope.list_subject.length / 4);
        $scope.last = function() {
            $scope.begin = ($scope.pageCount - 1) * 4;
        };
        $scope.first = function() {
            $scope.begin = 0;
        }
        $scope.next = function() {
            if ($scope.begin < ($scope.pageCount - 1) * 4) {
                $scope.begin += 4;
            };
        };

        $scope.prev = function() {
            if ($scope.begin > 0) {
                $scope.begin -= 4;
            };
        };
        })
    });

    // controller quiz
    app.controller("quizCtrl", function($scope,$http, $routeParams, quizFactory){
        $http.get('db/Quizs/'+$routeParams.id+'.js')
        .then(function(res){
            quizFactory.questions = res.data;
        });
    });

    app.filter('Timer', function($filter) {
        return function(number) {
            var minutes = Math.round((number - 30) / 60);
            var remainingSeconds = number % 60;
            if (remainingSeconds < 10) {
                remainingSeconds = "0" + remainingSeconds;
            }
            var timer = (minutes = (minutes < 10) ? "0" + minutes : minutes) + ":" + remainingSeconds;
            return timer;
        }
    });

    // controller student
    app.controller("student", function($scope,$http,$rootScope){
        // login account
        
        $scope.login_acc=function(){
            $scope.list_student.forEach(element => {
                if ($scope.username == element.username && $scope.pass==element.password) {
                    alert("login successfully !");
                    $scope.acc = {username:$scope.username,password:$scope.pass,id:element.id};
                    localStorage.setItem("account",JSON.stringify($scope.acc));
                    $scope.success = true;
                }else{
                    if($scope.username != element.username && $scope.pass!=element.password){
                        alert("account didn't register");
                    }
                }
            });
        };

        // register account
        $scope.Register=function(){
            var data={
                id:'',
                username:$scope.re_username,
                password:$scope.password,
                full_name:$scope.full_name,
                email:$scope.email
            };
            
            $http.post("http://localhost:3000/user/", JSON.stringify(data))
            .then(function(res) {
                alert('succes');
            }),
            function(error) {
                alert("false");
            }
            
        }

        $scope.logout_acc = function(){
            localStorage.removeItem("account");
            location.reload();
        }

        $scope.change_password = function(){
            var user = JSON.parse(localStorage.getItem("account"));
            if($scope.old_password == user.password){
                var data={
                    id:'',
                    username:$scope.change_username,
                    password:$scope.new_pass,
                    full_name:$scope.change_full_name,
                    email:$scope.change_email
                };
                $http.put('http://localhost:3000/user/' + user.id, JSON.stringify(data))
                .then(function(response) {
                    $scope.data = response.data
                    localStorage.setItem("account", JSON.stringify(response.data));
                    alert("update successfully")
                });
            }else{
                alert("wrong old pass");
            }
        };


        $scope.change_info=function(){
            var data={
                username:$scope.changeInfo_username,
                password:$scope.changeInfo_password,
                full_name:$scope.changeInfo_full_name,
                email:$scope.changeInfo_email
            };
            var user = JSON.parse(localStorage.getItem("account"));
            $http.put('http://localhost:3000/user/' + user.id, JSON.stringify(data))
                .then(function(response) {
                    localStorage.setItem("account", JSON.stringify(response.data));
                    alert("update successfully");
                    location.reload();
            })
        };
        $http.get("http://localhost:3000/user")
        .then(function(res){
            $scope.list_student = res.data;
            if (localStorage.getItem("account") === null) {
                $scope.success=false;
            }else{
                $scope.success=true; 
                var user = JSON.parse(localStorage.getItem("account"));
                $scope.list_student.forEach(element => {
                    if(element.id == user.id){
                        // change info
                        $scope.changeInfo_username=element.username;
                        $scope.changeInfo_password=element.password;
                        $scope.changeInfo_full_name=element.full_name;
                        $scope.changeInfo_email=element.email;
                        // change password
                        $scope.change_username=element.username;
                        $scope.old_password=element.password;
                        $scope.change_full_name=element.full_name;
                        $scope.change_email=element.email;

                        $http.get('http://localhost:3000/history?user_id='+user.id)
                        .then(function(res){
                            $scope.list_subject_history=res.data;
                        })
                    }
                });     
            }
        })
    });

    