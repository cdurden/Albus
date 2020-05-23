var redis = require("redis");
var client = redis.createClient();

client.hmsetOrig = client.hmset;
client.hmset = function() {
    if(arguments.includes(undefined)) {
        throw Error("undefined argument passed to hmset. Arguments: "+arguments.join());
    }
    client.hmsetOrig.apply(null, arguments);
}

client.on("error", function (err) {
  console.log("Error " + err);
});

module.exports = client;
