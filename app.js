var express = require("express");
var bodyParser = require("body-parser");

var multer  = require('multer');
var storage = multer.memoryStorage();
var upload = multer({ storage: storage });

var app = express();

// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
// Load credentials and set region from JSON file
AWS.config.loadFromPath('./aws-config.json');

var rekognition = new AWS.Rekognition({apiVersion: '2016-06-27'});
var s3 = new AWS.S3({apiVersion: '2006-03-01'});

app.use(bodyParser.json({limit: '5mb'})); // Amazon Rekognition limits image size at 5MB
app.use(bodyParser.urlencoded({ limit: '5mb', extended: true }));
app.use(express.static('public')); // serving static files

// Handle POST request 
// Copy captured image blob to memoryStorage
app.post('/detect', upload.single('img'), function (req, res, next) {
	
	var params = {
		"Image": {
			"Bytes": req.file.buffer // Retrieving image Buffer from memoryStorage
		},
		"Attributes": ["ALL"] // Get all facial attributes from Rekognition
	};

	rekognition.detectFaces(params, function(err, data) {
		if (err) {
			console.log(err, err.stack); // an error occurred
			res.status(500).send(err)
		}
		else {
			var str = JSON.stringify(data, null, '\t');
			console.log(str); // successful response
			return res.send(str);
		}
   });
});
 
var server = app.listen(3000, function () {
    console.log("Listening on port %s...", server.address().port);
});