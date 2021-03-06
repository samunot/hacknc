var auth_slack_token = "xoxb-267111720244-y8buNECTAQMNJox8f6zrRF4M";

function getUserName(email_id, callback) {
    var url = 'https://slack.com/api/users.list?token=' + auth_slack_token;
    var request = require('request');
    var userName = null;
    request(url, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            var body = JSON.parse(response.body);
            for (var i = 0; i < body.members.length; i++) {
                var email = body.members[i].profile.email;
                if (email == email_id) {
                    userName = body.members[i].id;
                    console.log(userName);
                    callback(userName);
                }
            }
        }
        callback(null);
    });
}

function getAllUserNames(callback) {
    var url = 'https://slack.com/api/users.list?token=' + auth_slack_token;
    var request = require('request');
    var userName = [];
    request(url, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            var body = JSON.parse(response.body);
            for (var i = 0; i < body.members.length; i++) {
                userName.push(body.members[i].id);
            }
        }
        callback(userName);
    });
}

function getFullName(userid, callback) {
    var url = 'https://slack.com/api/users.list?token=' + auth_slack_token;
    var request = require('request');
    var userName = null;
    request(url, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            var body = JSON.parse(response.body);
            for (var i = 0; i < body.members.length; i++) {
                var id = body.members[i].id;
                if (userid == id) {
                    fullName = body.members[i].profile.real_name;
                    console.log(fullName);
                    callback(fullName);
                }
            }
        }
        callback(null);
    });
}

exports.getUserName = getUserName;
exports.getFullName = getFullName;
exports.getAllUserNames = getAllUserNames;