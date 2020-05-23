var redis = require("redis");
var client = redis.createClient();

client.hmsetOrig = client.hmset;
client.hmset = function() {
    arr = [arguments[0]];
    for (var field in arguments[1]) {
        arr.push(field, arguments[1][field]);
    }

    if(arr.includes(undefined)) {
        console.log(arr);
        throw Error("undefined argument passed to hmset. Arguments: "+arr.join());
    }
    client.hmsetOrig.apply(this, arguments);
}

client.on("error", function (err) {
  console.log("Error " + err);
});

module.exports = client;
