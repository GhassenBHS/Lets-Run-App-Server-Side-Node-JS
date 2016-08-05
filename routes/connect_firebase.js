/**
 * Created by SPEED on 8/1/2016.
 */
var express = require('express');
var router = express.Router();

router.get('/joggingApp/settings/update', function(request, response) {

        response.writeHead(200,
            {'Content-Type' : 'text/plain'});
        response.end("OK fella");
        console.log("req");

    }
);
module.exports = router;