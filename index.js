var express = require('express');
var ParseServer = require('parse-server').ParseServer;
var path = require('path');
var fileUpload = require('express-fileupload');
var photos = require('./app/photos.js');
var im = require('imagemagick');

//var databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;

/*if (!databaseUri) {
  console.log('DATABASE_URI not specified, falling back to localhost.');
}*/

var api = new ParseServer({
    databaseURI: 'mongodb://localhost:27017/dev',
    cloud: process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
    appId: process.env.APP_ID || 'myAppId',
    masterKey: process.env.MASTER_KEY || 'master', //Add your master key here. Keep it secret!
    serverURL: process.env.SERVER_URL || 'http://localhost:1337/parse', // Don't forget to change to https if needed
    liveQuery: {
        //classNames: ["Posts", "Comments"] // List of classes to support for query subscriptions
    }
});
// Client-keys like the javascript key or the .NET key are not necessary with parse-server
// If you wish you require them, you can set them as options in the initialization above:
// javascriptKey, restAPIKey, dotNetKey, clientKey

var app = express();

app.use(fileUpload());

// Serve static assets from the /public folder
app.use('/public', express.static(path.join(__dirname, '/public')));
app.use('/storage', express.static(path.join(__dirname, '/storage')));

app.set('view engine', 'pug');

// Serve the Parse API on the /parse URL prefix
var mountPath = process.env.PARSE_MOUNT || '/parse';
app.use(mountPath, api);

// Parse Server plays nicely with the rest of your web routes
app.get('/', function(req, res) {
    // Get photo from db
    console.log("SLASH");
    var photoData;
    var Photo = Parse.Object.extend("Photo");
    var query = new Parse.Query(Photo);

    query.find({
        success: function(results) {
            console.log("HEYYYY " + results.length);
            photoData = results;
        },
        error: function(object, error) {
            console.log("HOW");
            console.log("Error " + error);
        }
    }).then(function() {
        // Render page with photo data

        if(req.query.json) { res.json(photoData); }

        res.render('main', {
            title: 'Hey!',
            photos: photoData
        });
    });
});

app.get('/years', function(req, res) {
  photos.getYears().then(function(data){
    res.json(data);
  });
});

app.get('/photo/:id', function(req, res) {
    // Get photo from db
    var photoData;
    var Photo = Parse.Object.extend("Photo");
    var query = new Parse.Query(Photo);
    query.equalTo("objectId", req.params.id);
    query.find({
        success: function(results) {
            if (results.length > 0) {
                //console.log("Successfully retrieved " + results.length + " objects.");
                //console.log(object.id + ' - ' + object.get('tags'));
                photoData = results[0];
            }
        },
        error: function(object, error) {
            console.log("HOW");
            console.log("Error " + error);
        }
    }).then(function() {
        // Render page with photo data
        res.render('photo', {
            photo: photoData
        });
    });


});


app.get('/upload', function(req, res) {
    //res.sendFile(path.join(__dirname, '/public/upload.html'));
    res.render('upload');
});

app.post("/upload", function(req, res) {
    if (!req.files) {
        res.send('No files were uploaded.');
        return;
    }

    var file = req.files.photoupload;
    photos.handleUpload(file, function(result) {
        console.log("CALLBACK CALLED:" + result.success);
    });

    res.status(200).send("Yeh");
});



// There will be a test page available on the /test path of your server url
// Remove this before launching your app
app.get('/test', function(req, res) {
    res.sendFile(path.join(__dirname, '/public/test.html'));
});

app.get('/tmp', function(req, res) {

    photos.test();

    console.log("HIT");

    var query = new Parse.Query(GameScore);
    query.equalTo("tags", 2016);
    console.log("HIT2");
    query.find({
        success: function(results) {
            console.log("Successfully retrieved " + results.length + " objects.");
            // Do something with the returned Parse.Object values
            for (var i = 0; i < results.length; i++) {
                var object = results[i];
                console.log(object.id + ' - ' + object.get('tags'));
            }
        },
        error: function(object, error) {
            console.log("HOW");
            console.log("Error " + error);
        }
    });
    console.log("HIT3");

    res.status(200).send("OK");
});




var port = process.env.PORT || 1337;
var httpServer = require('http').createServer(app);
httpServer.listen(port, function() {
    console.log('Photos server running on port ' + port + '.');
});

// This will enable the Live Query real-time server
//ParseServer.createLiveQueryServer(httpServer);
