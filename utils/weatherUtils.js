  const request = require('request');
  const CONSTANTS = new(require('./CONSTANTS'))();

    function weatherUtil() {
    };

    weatherUtil.prototype.getWeather = function(location, cb) {
        let reqObj = {
            url: CONST_KEY_WEATHER_ENDPOINT + location + CONST_KEY_WEATHER_ENDPOINT_SUFFIX,
            rejectUnauthorized: false
        };
        request.get(reqObj, function (err, result) {
            if (err) {
                console.log(err);
                cb("error getting weather");
            } else if (result.statusCode == 200) {
                let resp = JSON.parse(result.body);
                cb(null,{ temp: resp.main.temp });
            }else if(result.statusCode == 404){
                cb("City not found , please provide a valid city.")
            } 
            else {
                cb("invalid weather response");
            }
        });
    }
module.exports = weatherUtil;
