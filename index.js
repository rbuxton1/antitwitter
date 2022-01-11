require("dotenv").config();
const axios = require("axios");
const targets = require("./targets.json");

var tweets = {};

async function getTweets(uid) {
  var params = {
    "max_results": process.env.numTweets,
    "tweet.fields": "created_at,text",
    "expansions": "author_id"
  };

  var res = await axios.get("https://api.twitter.com/2/users/1033551690077589505/tweets", {
    method: "get",
    headers: {
      "authorization": `Bearer ${process.env.bearer}`,
    },
    params: params
  });

  return res.data.data;
}

//Core loop
setInterval(async () => {
  for(var i = 0; i < targets.length; i++) {
    var target = targets[i];
    var data = await getTweets(target);

    if(tweets[target] == null) {
      tweets[target] = data;
      console.log("Initialized " + target + ".");
    }

    //get tweets that are in the record but not in the most recent polling
    var d = tweets[target].filter(obj => {
      return !data.some(obj2 => {
        return obj.id == obj2.id;
      });
    });

    if(d.length > 0) {
      //verify that these tweets were actually deleted
      var ids = "?ids=";
      await d.forEach(t => { ids += t.id + "," });
      ids = ids.substring(0, ids.length - 1);
      var verif = await axios.get(`https://api.twitter.com/2/tweets${ids}`, {
        headers: {
          "authorization": `Bearer ${process.env.bearer}`,
        }
      });

      if(verif.data.data.errors) {
        console.log(`${verif.data.data.errors.length} new antitweets`);
        //We have a live one!!! Match it to the ids
        verif.data.data.errors.forEach(deleted => {
          var tweet = tweets[target].find( ({id}) => id == deleted.value);
          console.log(tweet);
        });

      }

    }

    tweets[target] = data;
  }

}, process.env.interval);

console.log("Starting!");
