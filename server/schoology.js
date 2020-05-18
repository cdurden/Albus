var oauth   = require('oauth');
var parseString = require('xml2js').parseString;
const md5File = require('md5-file')
var util = require('util');
const path = require('path');
const fs = require('fs');
const auth = require('./auth');
var request = new oauth.OAuth(null, null, auth.schoology_api_key, auth.schoology_api_secret, '1.0', null, 'HMAC-SHA1');
var requestBinary = new oauth.OAuthBinary(null, null, key, secret, '1.0', null, 'HMAC-SHA1');
var sanitize = require("sanitize-filename");

const assets = require('./assets');
const api = require('./api');
const generateRandomId = require('./utils/util').generateRandomId;

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}   

var sendSchoologyMessage = async function(recipient_ids, subject, message, attachments, file_attachments, thread_id) {
    return new Promise(resolve => {
        data = {
            "subject": subject,
            "message": message,
            "recipient_ids": recipient_ids.join(),
        };
        if (typeof attachments !== 'undefined') {
            data.attachments = [].concat(attachments,file_attachments.map(fid => { return { 'fid': fid } }));
            data["file-attachments"] = file_attachments
        }
        if (typeof thread_id === 'undefined') {
            var url = "https://api.schoology.com/v1/messages"
        } else {
            var url = "https://api.schoology.com/v1/messages/"+thread_id;
        }
        console.log("Sending message to "+recipient_ids);
        console.log(url);
        console.log(data)
        request.post(
            url,
            null,
            null,
            JSON.stringify(data),
            'application/json',
            function (err, data, result) {
                if (err) {
                    console.log("Error getting data : " + util.inspect(err));
                } else {  
                    console.log(data)
                    resolve(JSON.parse(data));
                } 
        });
    });
}
var startFileUpload = function(filepath) {
    return new Promise( resolve => {
        var size = fs.statSync(filepath).size;
        md5File(filepath).then((hash) => {
            data = { "filename" : path.basename(filepath),
                 "filesize" : size,
                 "md5_checksum" : hash 
            };
            console.log(data);
            request.post(
                "https://api.schoology.com/v1/upload",
                null,
                null,
                JSON.stringify(data),
                'application/json',
                function (err, data, result) {
                    if (err) {
                        console.log("Error getting data : " + util.inspect(err));
                        resolve(null);
                    } else {  
                        console.log('returned from post to upload api');
                        console.log(err);
                        console.log(data);
                        resolve(JSON.parse(data));
                        const options = {
                            method: 'PUT',
                            url: JSON.parse(data).upload_location,
                            //qs: {key: 'value'}, // optional 
                            headers: {
                                'content-type': 'application/octet-stream'
                            }
                        };
                    }
                }
            );
        });
    });
}
var transferFile = function(filepath, uploadLocation) {
    return new Promise( resolve => {
        let chunks = [];
        let fileBuffer;
        
        let fileStream = fs.createReadStream(filepath);
        
        fileStream.once('error', (err) => {
            // Be sure to handle this properly!
            console.error(err); 
        });
        
        fileStream.once('end', () => {
            // create the final data Buffer from data chunks;
            fileBuffer = Buffer.concat(chunks);
            request.put(
                uploadLocation,
                null,
                null,
                fileBuffer,
                'image/png',
                function (err, data, result) {
                    if (err) {
                        console.log("Error getting data : " + util.inspect(err));
                        resolve(null);
                    } else {  
                        console.log('Returned from PUT request (for file upload)');
                        console.log(data);
                        //fid = JSON.parse(data).id;
                        resolve(data);
                    }
                }
            );
            
        });
        
        fileStream.on('data', (chunk) => {
            chunks.push(chunk); // push data chunk to array
        
        });
    })
}
var uploadFileAndAttachToMessage = function(filepath, recipient_ids, subject, message) {
    startFileUpload(filepath).then(function(result) {
        transferFile(filepath, result.upload_location).then(function() {
            sendSchoologyMessage(recipient_ids, subject, message, [result.id]);
        });
    });
}
var uploadFilesAndSendWithMessage = function(filepaths, recipient_ids, subject, message, attachments, thread_id) {
    return new Promise(resolve => {
        return Promise.all(filepaths.map(filepath => {
            return new Promise(resolveUploadedFile => {
                startFileUpload(filepath).then(function(result) {
                    transferFile(filepath, result.upload_location).then(function() {
                        resolveUploadedFile(result);
                    });
                });
            });
        })).then(function(results) {
            file_ids = results.map(result => { return result.id; })
            sendSchoologyMessage(recipient_ids, subject, message, attachments, file_ids, thread_id).then(function(message) {
                resolve(message);
            });
        });
    });
}
var getSubmissionsList = function(section_id, grade_item_id, qs) {
    return new Promise( resolve => {
        request.get(
            "https://api.schoology.com/v1/sections/"+section_id+"/submissions/"+grade_item_id+"/"+qs,
            null,
            null,
            function (err, data, result) {
                if (err) {
                    console.log("Error getting data : " + util.inspect(err));
                } else {  
                    resolve(data)
                }
            }
        );
    })
}
var getMessage = function(folder, message_id) {
    return new Promise( resolve => {
        request.get(
            "https://api.schoology.com/v1/messages/"+folder+"/"+message_id+"?with_attachments=TRUE",
            null,
            null,
            function (err, data, result) {
                if (err) {
                    console.log("Error getting data : " + util.inspect(err));
                } else {  
                    resolve(data)
                }
            }
        );
    });
}
var getDocument = function(section_id, id) {
    return new Promise( resolve => {
        request.get(
            "https://api.schoology.com/v1/sections/"+section_id+"/documents/"+id,
            null,
            null,
            function (err, data, result) {
                if (err) {
                    console.log("Error getting data : " + util.inspect(err));
                } else {  
                    resolve(data)
                }
            }
        );
    });
}
var downloadSubmission = async function(url) {
    return new Promise( resolve => {
        requestBinary.get(
            url,
            null,
            null,
            function (err, data, response) {
                if (err) {
                    console.log("Error getting data : " + util.inspect(err));
                } else {  
                    resolve(data)
                }
            }
        )
    });
}

module.exports = {
    sendSchoologyMessage: sendSchoologyMessage,
    uploadFilesAndSendWithMessage: uploadFilesAndSendWithMessage,
    getSubmissionsList: getSubmissionsList,
    downloadSubmission: downloadSubmission,
}
