var fs = require('fs');
var exec = require('child_process').exec;
var path = require('path');


//////////////////////////////////
// ROUTES
//////////////////////////////////
module.exports = [
	// Serve up index.html
	{ 	method: 'GET', 
		path: '/', 
		config: { handler: serveIndex } 
	},
	// Serve up png's
	{ 	method: 'GET', 
		path: '/thumbs/{filename}', 
		handler: { directory: { path: 'thumbs'} } 
	},
	// Provide urls for converted png's
	{	method: 'POST',
		path: '/upload',
		config: {
			payload: {
				output: 'stream',
				parse: true,
				allow: 'multipart/form-data'
			},
			handler: savePdfConvertToPngsAndSendBackToClient
		}
	}
]




/////////////////////////////////////////
// UTILITY FUNCTIONS
////////////////////////////////////////

// Does what the name says
function savePdfConvertToPngsAndSendBackToClient(request, reply) {
	var data = request.payload;
	var filename = data.uploadedfile.hapi.filename

	// Only accept pdf's
	if(path.extname(filename) !== ".pdf") {
		reply('Please submit pdf only');
		return;
	}

	// Write pdf to '/uploads'
	var fileStream = data['uploadedfile'].pipe(fs.createWriteStream('./uploads/'+filename));
	fileStream.on('close', function () {
		console.log('file uploaded')
		var name = getFileName(filename)

		// Convert pdf to png's using ImageMagick, and write the thumbnails to '/thumbs'
		exec('convert '+'./uploads/'+filename+' ./thumbs/'+name+'_thumb_page.png', function (err, stdout) {	
			if(err){ console.log('error ',err) }

			// Search thumbnail archive and respond with only the png's that have
			// the same filename as the given pdf
			getThumbnails('./thumbs/', filename, function (urls) {
				reply(urls)
			})
		})
	})
}

// Searches archive for thumbnails with given filename 
function getThumbnails (directory,filename, callback) {
	fs.readdir(directory, function (err, files) {
		var urls = [];
		for(var i=0; i<files.length; i++) {
			if(getFileName2(files[i]) === getFileName(filename)) {
				urls.push({
					name: getFileName(filename),
					url: 'http://localhost:8000/thumbs/'+files[i]
				})
			}
		}
		// reply(urls)
		callback(urls);
	})
}

// Extracts title characters from pdf filename
function getFileName (string) {
	var arr = string.split('');
	var i = 0;
	var name = [];
	while(arr[i] != ".") {
		name.push(arr[i]);
		i++;
	}
	return name.join("");
}

// Extracts title characters from thumbnail file names
function getFileName2 (string) {
	var arr = string.split('_thumb');
	return arr[0]
}

// Serves index.html
function serveIndex (request, reply) {
	reply.file('./index.html')
}