var firebase = require("firebase");
var distanceLib = require("./CalculateDistance");
var FCM = require('fcm-push');
var async = require('async');
var CryptLib = require('cryptlib');
firebase.initializeApp({
    serviceAccount: "Jogging App-46204fec7650.json",
    databaseURL: "https://jogging-app.firebaseio.com/"
});
var db = firebase.database();
var ref = db.ref("server/saving-data/my-Android-internship-App");
var usersRef = ref.child("users");
var sessionsRef = ref.child("sessions");
var joinedRef = ref.child("joined");

exports.user_exists=function (facebook_id,callback) {

    // var myUserRef = usersRef.child(facebook_id);
    var res=false;
    usersRef.on("value", function(snapshot) {
        // console.log(snapshot.exists()) ;
        snapshot.forEach(function (data) {
            if (data.key == facebook_id)
                res = true;


        });
        callback(res) ;

    }) ;


};





exports.update_settings = function (request, response) {
    var facebook_id = request.body.facebook_id;
    var longitude = request.body.longitude_center;
    var latitude = request.body.latitude_center;
    var name = request.body.username;
    var radius = request.body.radius;
    var token = request.body.token;
    console.log(facebook_id) ;

    // var iv = "uP9BVSJ9JTU1zH0w" ; //16 bytes = 128 bit
    // var key = "b16920894899c7780b5fc7161560a412" ;//32 bytes = 256 bits
    // var originalText = CryptLib.decrypt(name, key, iv);


    var myUserRef = usersRef.child(facebook_id);
    myUserRef.update({
        Username: name,
        radius: radius,
        longitude_center: longitude,
        latitude_center: latitude,
        token: token
    }, function (error) {
        if (error) {
            console.log("errorrr");


            response.writeHead(404,
                {'Content-Type': 'text/plain'});
            response.end('Data could not be saved.');
        } else {
            if(!response.headersSent) {
                response.writeHead(200,
                    {'Content-Type': 'text/plain'});
                response.end('Updated');
            }


        }
    });

};

exports.notify = function (request, response) {

    var facebook_id = request.params.facebook_id;
    var longitude_start_point = request.body.longitude_start_point;
    var latitude_start_point = request.body.latitude_start_point;
    var longitude_end_point = request.body.longitude_end_point;
    var latitude_end_point = request.body.latitude_end_point;
    var username = request.body.username;
    var startAt = request.body.startAt;
    var finishAt = request.body.finishAt;
    var serverKey = "AIzaSyDA13SNIdF-FzBM0ePSKb1SDHW3n-drMJ8";

    // First thing to do is performing push to save details of the new session

    var MySessionRef = sessionsRef.push();
    var id_session = MySessionRef.key;
    console.log(id_session);
    MySessionRef.set({
        id_session: id_session,
        facebook_id: facebook_id,
        SessionStarter: username,
        startAt: startAt,
        finishAt: finishAt,
        longitude_start_point: longitude_start_point,
        latitude_start_point: latitude_start_point,
        longitude_end_point: longitude_end_point,
        latitude_end_point: latitude_end_point,
        joiners_list: []

    }, function (error) {
        if (error) {
            console.log("errorrr");

        } else {


// If no error while updating database, we notify all concerned people

            usersRef.on("value", function (snapshot) {
                var i = 0;
                snapshot.forEach(function (data) {
                    var distToStart = distanceLib.getDistanceFromLatLonInKm(data.val().latitude_center, data.val().longitude_center,
                        latitude_start_point, longitude_start_point);
                    var distToEnd = distanceLib.getDistanceFromLatLonInKm(data.val().latitude_center, data.val().longitude_center,
                        latitude_end_point, longitude_end_point);

                    if ((distToStart < data.val().radius || distToEnd < data.val().radius) && data.key !== facebook_id) {
                        console.log(distToStart);
                        console.log(distToEnd);
                        console.log(data.val().Username);
                        console.log(data.key);
                        console.log(facebook_id);

                        var fcm = new FCM(serverKey);

                        var message = {
                            to: data.val().token, // required
                            // collapse_key: 'your_collapse_key',
                            data: {
                                longitude_start_point: longitude_start_point,
                                latitude_start_point: latitude_start_point,
                                longitude_end_point: longitude_end_point,
                                latitude_end_point: latitude_end_point
                            },
                            notification: {
                                title: 'Somebody is running',
                                body: 'wanna joy me ? ;)'
                            }
                        };

                        fcm.send(message, function (err, response) {
                            if (err) {
                                console.log("Something has gone wrong!");
                            } else {
                                console.log("Successfully sent with response: ", response);
                            }
                        });


                    }
                    i++;


                });
                if(!response.headersSent) {
                    response.writeHead(200,
                        {'Content-Type': 'text/plain'});
                    response.end('Everybody is notified');
                }




            }, function (errorObject) {


                    console.log("The read failed: " + errorObject.code);




            });


            // response.writeHead(200,
            //     {'Content-Type': 'text/plain'});
            // response.end('Everybody is notified');

        }
    });


};


exports.join_session = function (request, response) {
    var facebook_id = request.params.facebook_id;
    var username = request.body.username;
    var sessionId = request.body.sessionId;


// Take session ID from post request then search for the child and perform push to add new person
    // Later on clients can retrieve the list using get request

    var MysessionRef = sessionsRef.child(sessionId);
    var list_ref=MysessionRef.child("joiners_list").child(facebook_id) ;
    list_ref.update({
        username: username

    }, function (error) {
        if (error)
        {
            console.log(error);
            response.writeHead(404,
                {'Content-Type': 'text/plain'});
            response.end('Data could not be saved.');

        }



    });
    if(!response.headersSent) {
        response.writeHead(200,
            {'Content-Type': 'text/plain'});
        response.end('joined successfully');
    }




};



exports.quit_session = function (request, response) {
    var facebook_id = request.params.facebook_id;
    var sessionId = request.body.sessionId;


// Take session ID from post request then search for the child and perform push to add new person
    // Later on clients can retrieve the list using get request

    var MysessionRef = sessionsRef.child(sessionId);
    var list_ref=MysessionRef.child("joiners_list").child(facebook_id) ;
    list_ref.remove();
    if(!response.headersSent) {
        response.writeHead(200,
            {'Content-Type': 'text/plain'});
        response.end('deleted successfully');
    }




};

exports.get_sessions_list = function (request, response) {
    // The user sends his facebook id from the client side using get request.
    // A json object will be returned containing which sessions are currently available.

    var facebook_id = request.params.facebook_id;
    var current_time = new Date().getTime();
    console.log(current_time);
    var json;

    sessionsRef.orderByChild('startAt').on("value", function (snapshot) {

            var ids_session_array = [];
        var i=0;
            snapshot.forEach(function (data) {

                if (data.val().finishAt > current_time) {
                    console.log(data.val().SessionStarter);
                    ids_session_array[i]={
                        id_session: data.val().id_session,
                        username: data.val().SessionStarter,
                        startAt: data.val().startAt
                    } ;
                    i++;
                }

            });



                json = JSON.stringify({
                    ids_session_array: ids_session_array,

                });
            if(!response.headersSent) {
                response.writeHead(200, {"Content-Type": "application/json"});
                response.end(json);




            }



        }
        ,
        function (errorObject) {
            if (errorObject)
            {

                response.writeHead(404, {'Content-Type': 'text/plain'});
                response.end('Not Found');
                console.log("The read failed: " + errorObject.code);

            }



        }
    );


};

exports.get_joiners_list = function (request, response) {

    
        // simple post to retrieve joiners list

        var facebook_id = request.params.facebook_id;
        var session_id = request.body.sessionId;
        var joiners_array = [];
        var index = 0;
        var json;

        var sessionRef = sessionsRef.child(session_id);


        sessionRef.child("joiners_list").on("value", function (snapshot) {
            snapshot.forEach(function (data) {
                joiners_array[index] = {username: data.val().username};
                index++;
            });

            json = JSON.stringify({
                joiners_array: joiners_array

            });
            if (!response.headersSent) {
                response.writeHead(200, {"Content-Type": "application/json"});
                response.end(json);


            }


        }, function (errorObject) {
            if (errorObject) {
                response.writeHead(404,
                    {'Content-Type': 'text/plain'});
                response.end('Not Found');
                console.log("The read failed: " + errorObject.code);

            }


        });



};


exports.get_session_details = function (request, response) {
    var facebook_id = request.params.facebook_id;
    var sessionId = request.body.sessionId;
    var json;
    var people_joined_session = [];
    var i = 0;


// The user sends his facebook id and a particular session id from the client side using get request.
    // A json object will be returned containing All details of a the corresponding session.


    //First of all we retrieve the list of people who whave hit "Join this jogger!"

    var MyjoinedRef = joinedRef.child(sessionId);
    MyjoinedRef.on("value", function (snapshot) {

        snapshot.forEach(function (data) {
            people_joined_session[i] = {username: data.val().username};
            i++;


        });
        console.log(people_joined_session);

        // Then we make a json that contains all info including array we made a moment ago



        sessionsRef.child(sessionId).on("value", function (snapshot) {

            json = JSON.stringify({
                SessionStarter: snapshot.val().SessionStarter,
                finishAt: snapshot.val().finishAt,
                startAt: snapshot.val().startAt,
                latitude_start_point: snapshot.val().latitude_start_point,
                longitude_start_point: snapshot.val().longitude_start_point,
                latitude_end_point: snapshot.val().latitude_end_point,
                longitude_end_point: snapshot.val().longitude_end_point,
                people_joined_session: snapshot.val().joiners_list


            });
            if(!response.headersSent) {
                response.writeHead(200, {"Content-Type": "application/json"});
                response.end(json);
            }




        }, function (errorObject) {
            if (errorObject) {

                console.log("The read failed: " + errorObject.code);
            }


        });





    }, function (errorObject) {
        if (errorObject) {

            console.log("The read failed: " + errorObject.code);
        }


    });



};

exports.delete_session = function (request, response) {
    var facebook_id = request.params.facebook_id;
    var sessionId = request.body.sessionId;


     sessionsRef.child(sessionId).remove() ;
    if(!response.headersSent) {
        response.writeHead(200, {'Content-Type': 'text/plain'});
        response.end("session deleted");
    }



};

exports.get_user_sessions_list = function (request, response) {
    // The user sends his facebook id from the client side using get request.
    // A json object will be returned containing which sessions he participated in.

    var facebook_id = request.params.facebook_id;
    var current_time = new Date().getTime();
    console.log(current_time);
    var json;


    sessionsRef.orderByChild('finishAt').on("value", function (snapshot) {

            var ids_user_session_array = [];
            var i=0;

            snapshot.forEach(function (data) {



                if (data.val().finishAt < current_time  ) {
                    if (data.val().facebook_id== facebook_id) {

                        console.log(data.val().SessionStarter);
                        ids_user_session_array[i] = {
                            id_session: data.val().id_session,
                            username: data.val().SessionStarter,
                            startAt: data.val().startAt,
                            finishAt: data.val().finishAt
                        };
                        i++;
                    }
                    else {

                        if (typeof data.val().joiners_list != "undefined") {
                            var session_id=data.val().id_session ;
                            console.log(session_id);

                            var sessionRef = sessionsRef.child(session_id);


                            sessionRef.child("joiners_list").on("value", function (snapshot) {
                                snapshot.forEach(function (data_joiners_leaf) {

                                    if (data_joiners_leaf.key== facebook_id)
                                    {
                                        ids_user_session_array[i]={
                                            id_session: data.val().id_session,
                                            username: data.val().SessionStarter,
                                            startAt: data.val().startAt,
                                            finishAt:data.val().finishAt
                                        } ;
                                        i++;

                                    }

                                });

                            }, function (errorObject) {
                                if (errorObject)
                                {
                                    if (!response.headersSent)
                                    {
                                        response.writeHead(404,
                                            {'Content-Type': 'text/plain'});
                                        response.end('Not Found');

                                    }


                                }




                            });


                        }

                    }

                }

            });



            json = JSON.stringify({
                ids_session_array: ids_user_session_array

            });
            if(!response.headersSent) {
                response.writeHead(200, {"Content-Type": "application/json"});
                response.end(json);




            }



        }
        ,
        function (errorObject) {
            if (errorObject)
            {
                if(!response.headersSent) {

                    response.writeHead(404, {'Content-Type': 'text/plain'});
                    response.end('Not Found');
                    console.log("The read failed: " + errorObject.code);
                }

            }



        }
    );


};

exports.get_recent_sessions_list = function (request, response) {
    // The user sends his facebook id from the client side using get request.
    // A json object will be returned containing which sessions he participated in.

    var facebook_id = request.params.facebook_id;
    var current_time = new Date().getTime();
    console.log(current_time);
    var json;

    sessionsRef.orderByChild('finishAt').on("value", function (snapshot) {

            var ids_user_session_array = [];
            var i=0;
            snapshot.forEach(function (data) {

                if (data.val().finishAt < current_time) {

                    ids_user_session_array[i]={
                        id_session: data.val().id_session,
                        username: data.val().SessionStarter,
                        startAt: data.val().startAt
                    } ;
                    i++;
                }

            });



            json = JSON.stringify({
                ids_session_array: ids_user_session_array

            });
            if(!response.headersSent) {
                response.writeHead(200, {"Content-Type": "application/json"});
                response.end(json);




            }



        }
        ,
        function (errorObject) {
            if (errorObject)
            {
                if(!response.headersSent) {

                    response.writeHead(404, {'Content-Type': 'text/plain'});
                    response.end('Not Found');
                    console.log("The read failed: " + errorObject.code);
                }

            }



        }
    );


};
  
