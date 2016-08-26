var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var rout = require('./routes/index');
var users = require('./routes/users');
var firebaseConnect=require("./modules/firebaseConnect");

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', rout);
app.use('/users', users);
app.post('/joggingApp/settings/update', function(request, response) {
        firebaseConnect.update_settings(request, response);



    }
);
app.post('/joggingApp/settings/update_token', function(request, response) {
        firebaseConnect.update_token(request, response);



    }
);

app.post('/joggingApp/notify/:facebook_id', function(request, response) {
        firebaseConnect.notify(request, response);
    }
);
app.post('/joggingApp/join_session/:facebook_id', function(request, response) {
        firebaseConnect.join_session(request, response);
    }
);
app.get('/joggingApp/get_sessions_list/:facebook_id', function(request, response) {
        firebaseConnect.get_sessions_list(request, response);




    }
);

app.post('/joggingApp/get_session_details/:facebook_id', function(request, response) {
        firebaseConnect.get_session_details(request, response);
}
);
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});




module.exports = app;
