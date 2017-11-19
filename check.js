// BandonFEWS-Serverless - Copyright Conor O'Neill 2017, conor@conoroneill.com
// LICENSE Apache-2.0
// A Serverless AWS Lambda function that runs every 15 minutes, checks the Bandon river level at http://www.bandonfloodwarning.ie/ and saves it to Google Fusion Tables.

"use strict";

const AWS = require("aws-sdk"); 

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.check = (event, context, callback) => {
  var prevTime;
  var currTime = new Date().getTime();

  console.log("DisSlack ran on ", new Date().toUTCString());

  const setParams = {
    TableName: process.env.DYNAMODB_TABLE,
    Item: {
      id: "1",
      updatedAt: currTime
    }
  };

  const getParams = {
    TableName: process.env.DYNAMODB_TABLE,
    Key: {
      id: "1"
    }
  };

  dynamoDb.get(getParams, (error, result) => {
    // See if this is first time run. If so, don't process, just save timestamp for next run
    if (error || result.Item == null) {
      console.error(error);
    } else {
      // extract prev run time from DB
      prevTime = result.Item.updatedAt;

      var disqus = new Disqus({
        api_secret: process.env.DISSLACK_DISQUS_API_SECRET,
        api_key: process.env.DISSLACK_DISQUS_API_KEY,
        access_token: process.env.DISSLACK_DISQUS_ACCESS_TOKEN
      });

      var IncomingWebhook = require("@slack/client").IncomingWebhook;
      var url = process.env.DISSLACK_SLACK_WEBHOOK || "";
      var webhook = new IncomingWebhook(url);

      disqus.request(
        "posts/list",
        { forum: process.env.DISSLACK_DISQUS_FORUM, related: "thread" },
        function(data) {
          if (data.error) {
            console.error("Something went wrong...", err);
          } else {
            var response = JSON.parse(data).response;

            if (!response.length) {
              return console.log("[" + forum + "] No comments found.");
            }

            var lastCommentTime = new Date(prevTime);

            var i;
            for (i = 0; i < response.length; i++) {
              var commentTime = new Date(response[i].createdAt);
              var url = response[i].thread.link + "#comment-" + response[i].id;

              var message =
                response[i].author.name +
                " blog received <" +
                url +
                "|a new comment> " +
                "on <" +
                response[i].thread.link +
                "|" +
                response[i].thread.title +
                ">:" +
                "\n" +
                response[i].raw_message.substr(0, 100);

              if (commentTime > lastCommentTime) {
                webhook.send(message, function(err, header, statusCode, body) {
                  if (err) {
                    console.log("Error:", err);
                  } else {
                    console.log("Sent", message, "to Slack");
                    console.log("Received", statusCode, "from Slack");
                  }
                });
              }
            }
          }
        }
      );
    }
    // write the time to the database
    dynamoDb.put(setParams, error => {
      // handle potential errors
      if (error) {
        console.error(error);
        callback(null, {
          statusCode: error.statusCode || 501,
          headers: { "Content-Type": "text/plain" },
          body: "Couldn't save timestamp in DB"
        });
        return;
      } else {
        // create a response
        const response = {
          statusCode: 200,
          body: "Checked Disqus OK"
        };
        callback(null, response);
      }
    });
  });
};
