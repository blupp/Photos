// photos.js
var path = require('path');
var fileUpload = require('express-fileupload');
var im = require('imagemagick');
var fs = require('fs');
var async = require("async");

var tmpStoragePath = path.join(__dirname + "/../storage/tmp/");
var storagePath = path.join(__dirname + "/../storage/user/");


module.exports.test = function() {
    console.log("test");
}

/*
- Upload photo
- Make sure it’s a valid photo
- Extract Exif data and make sure we have a date
- Convert photo
    - Thumbnail 256x256
    - Photo size 1500x1500
- Move converted thumbnail and photo to
    - /storage/[userid]/[year]/[month]/[day]/yyyymmddhhss.jpg
    - /storage/[userid]/[year]/[month]/[day]/yyyymmddhhss-thumb.jpg
- Save data to DB
    - Photo path
    - Thumb path
    - Tags
        - year (2016)
        - month (04)
        - day (25)
        - starred
        - cover
        - album:[album name]
    - date
- Return success!
*/

module.exports.handleUpload = function(file, callback) {
    /* Upload photo */
    var tmpPath = tmpStoragePath + "tmp-photo-userid-" + Math.floor(Math.random() * 10000000) + ".jpg";
    file.mv(tmpPath, function(err) {
        if (err) throw err;
        console.log("FILE UPLOADED");

        /* Make sure it’s a valid photo */
        im.readMetadata(tmpPath, function(err, metadata) {
            if (err) throw err;

            /* Extract Exif data and make sure we have a date */
            var date;
            if (metadata && metadata.exif && metadata.exif.dateTimeOriginal) {
                date = new Date(metadata.exif.dateTimeOriginal);
            } else {
                date = new Date();
            }

            var fileName = date.yyyymmddhhmmss() + "-userid-" + Math.floor(Math.random() * 10000000) + ".jpg";
            var thumbFilePath = storagePath + "thumb-" + fileName;
            var filePath = storagePath + fileName;
            var webThumbFilePath = "/storage/" + "user/" + "thumb-" + fileName;
            var webFilePath = "/storage/" + "user/" + fileName;

            /* Create thumbnail */
            im.resize({
                srcPath: tmpPath,
                dstPath: thumbFilePath,
                width: 300,
                quality: 0.95,
                sharpening: 0.4

            }, function(err, stdout, stderr) {
                if (err) throw err;
                console.log("THUMB CONVERTED");

                /* Create photo */
                im.resize({
                    srcPath: tmpPath,
                    dstPath: filePath,
                    width: 1500,
                    quality: 0.90,
                    sharpening: 0.3

                }, function(err, stdout, stderr) {
                    if (err) throw err;
                    console.log("PHOTO CONVERTED");

                    fs.unlink(tmpPath);
                    savePhoto("user", date, webThumbFilePath, webFilePath, callback);
                });

            });



        });
    });
}

function savePhoto(user, date, thumbPath, photoPath, callback) {
    var Photo = Parse.Object.extend("Photo");
    var photo = new Photo();

    photo.set("date", date);
    photo.set("user", "user");
    photo.set("thumbPath", thumbPath);
    photo.set("path", photoPath);

    photo.set("year", date.getFullYear());
    photo.set("month", date.getMonthName());
    photo.set("day", date.getDate());

    var tags = [

    ];
    photo.set("tags", tags);

    photo.save(null, {
        success: function(photo) {
            // Execute any logic that should take place after the object is saved.
            console.log('New photo created with objectId: ' + photo.id);
        },
        error: function(photo, error) {
            // Execute any logic that should take place if the save fails.
            // error is a Parse.Error with an error code and message.
            console.log('Failed to create new photo, with error code: ' + error.message);
        }
    });

    console.log("SAVING DO DB");
    var result = {
        success: true
    }
    callback(result);
}

// Photo querys
module.exports.getYears = function() {

    return new Promise(function(resolve, reject) {

        var Photo = Parse.Object.extend("Photo");
        var year = 2016; //parseInt(new Date().getFullYear());

        // loop years
        var years = [2016, 2015, 2014, 2013, 2012];
        var datas = [];

        async.each(years, function(year, callback) {
                var query = new Parse.Query(Photo);
                query.equalTo("year", parseInt(year));
                query.limit(1);
                query.find({
                    success: function(results) {
                        console.log("found years" + year);
                        console.log(results);
                        datas.push(results);
                        callback();
                    },
                    error: function(object, error) {
                        console.log("Error " + error);
                        reject(error);
                    }
                });
            },
            function() {
              console.log("DONE BROH");
              resolve(datas);
            });

    });
}


function getYear(year) {

}


/* TOOLS */
Date.prototype.yyyymmddhhmmss = function() {
    var mm = this.getMonth() + 1; // getMonth() is zero-based
    var dd = this.getDate();

    return [this.getFullYear(), !mm[1] && '0', mm, !dd[1] && '0', dd, this.getHours(), this.getMinutes(), this.getSeconds()].join(''); // padding
};

Date.prototype.monthNames = [
    "January", "February", "March",
    "April", "May", "June",
    "July", "August", "September",
    "October", "November", "December"
];

Date.prototype.getMonthName = function() {
    return this.monthNames[this.getMonth()];
};
Date.prototype.getShortMonthName = function() {
    return this.getMonthName().substr(0, 3);
};
