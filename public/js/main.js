'use strict';

// Using Realeyesit Environment Checker for webcam and browser compatibility 

var notCapableErrorCodes = [4, 5, 6, 7]; // excluding flash

function environmentalDetectionCallback(result) {
	if (notCapableErrorCodes.indexOf(result.failureReasonCode) != -1)	{
		$('#non-capable').show();
		$('#capable').hide();
		console.log('Environment non-capable: ' + result.failureReasonString);
	}
	else
		$('#non-capable').hide();
}

var _RealeyesitEnvDetectParams = _RealeyesitEnvDetectParams || {};
_RealeyesitEnvDetectParams._callback = environmentalDetectionCallback;

// Using WebRTC adapter.js for streaming webcam to video element

var video = document.getElementById('video');

var constraints = {
	audio: false,
	video: true
};

function handleSuccess(stream) {
	video.srcObject = stream;
	$('#camera-allowed').show();
}

function handleError(error) {
	$('#camera-denied').show();
	console.log('navigator.getUserMedia error: ', error);
}

navigator.mediaDevices.getUserMedia(constraints).
    then(handleSuccess).catch(handleError);

// Draw captured image to canvas and post image blob to server for face detection

var canvas = window.canvas = document.getElementById('canvas');
var button = $('#captureBtn');

button.click(function() {
  canvas.width = video.width;
  canvas.height = video.height;
  canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
  getCanvasBlob();
});
	
function getCanvasBlob() {
	canvas.toBlob(function (blob) {
		var data = new FormData();
		data.append('img', blob);

		$.ajax({
			url :  "./detect",
			type: 'POST',
			data: data,
			contentType: false,
			processData: false,
			success: function(data) { 
				var json = JSON.parse(data);
				console.log(json);
				displayResult(json);
			},    
			error: function(error) {
				console.log(error);
			}
		});
	});
}

// Display results from Amazon Rekognition
function displayResult(json) {
	$('#analysis').html('<p>Faces detected: ' + json.FaceDetails.length + '</p>');
	
	var strokeColor = [ 255, 255, 255 ];
	$.each( json.FaceDetails, function( i, face ) {
		// display faces only over 50 confidence level
		if (face.Confidence > 50) {
			
			var box = face.BoundingBox;
			var ctx = canvas.getContext("2d");
			
			ctx.lineWidth=4;
			strokeColor[i % 3] -= 51; // unique frame color for each face
			var color = "rgb("+strokeColor[0]+","+strokeColor[1]+"," +strokeColor[2]+")";
			ctx.strokeStyle = color;
			
			ctx.strokeRect(canvas.width * box.Left, canvas.height * box.Top, canvas.width * box.Width, canvas.height * box.Height);
			
			// iterate through emotions
			var emotions = '<ul>Emotions: ';
			$.each( face.Emotions, function( i, emotion ) {
				emotions += '<li>' + emotion.Type + " (" + (Math.round(emotion.Confidence * 100) / 100) + "%)</li>";
			});
			emotions += '</ul>';
			
			// append face attributes to #analysis
			var line = '<p><div style="display:inline-block;width:12px;height:12px;background:'+color+'"></div> <strong>Face '+ (i + 1) + '</strong> &ndash; ' + face.AgeRange.Low + '-' + face.AgeRange.High + ' yrs old, ' + face.Gender.Value + '</p>' + emotions;
			$('#analysis').append(line);
		}
	});
}
