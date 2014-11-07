var request = require('request');

function send(roomId, authToken, message, callback) {
    callback = callback || function() {};
    var options = {
        url: 'https://api.hipchat.com/v2/room/' + roomId + '/notification?auth_token=' + authToken,
        headers: {
            'Content-Type': 'application/json'
        },
        body: '{"message_format": "html", "message": "' + message.replace(/"/g, '\\"') + '"}'
    };

    request.post(
        options,
        function(error, result) {
            if(error) {
                callback(error);
                return;
            }
            else if(result.body.length) {
                result = JSON.parse(result.body);

                if(result.error) {
                    callback(error);
                    return;
                }
            }
            callback(null, result);
        }
    );
}

exports.send = send;
