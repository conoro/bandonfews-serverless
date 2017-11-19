// BandonFEWS-Serverless - Copyright Conor O'Neill 2017, conor@conoroneill.com
// LICENSE Apache-2.0
// A Serverless AWS Lambda function that runs every 15 minutes, checks the Bandon river level at http://www.bandonfloodwarning.ie/ and saves it to Google Fusion Tables.

"use strict";

const AWS = require("aws-sdk");

module.exports.check = (event, context, callback) => {
  var google = require("googleapis");
  var fusiontables = google.fusiontables("v2");

  var moment = require("moment");
  var request = require("request");
  var cheerio = require("cheerio");

  var gerr;
  var gstat;

  var key = require("./jwt_key.json");
  var jwtClient = new google.auth.JWT(
    key.client_email,
    null,
    key.private_key,
    ["https://www.googleapis.com/auth/fusiontables"], // an array of auth scopes
    null
  );

  jwtClient.authorize(function(err, tokens) {
    if (err) {
      console.log(err);
      gerr = err;
    } else {
      // Get current water level and last update time
      request(process.env.FEWS_URL, function(error, response, body) {
        if (error) {
          console.log("error back from Bandon FEWS", error);
          gerr = error;
        } else {
          var $ = cheerio.load(body);
          var waterLevel = $("td")
            .eq(8)
            .text()
            .trim();
          // Make sure we parsed a number. If not, do not save in Fusion Tables
          if (!isNaN(waterLevel)) {
            console.log(waterLevel);
            var lastUpdate = $("div")
              .eq(1)
              .text()
              .trim()
              .split(" ");
            if (lastUpdate) {
              var lastMoment = moment(
                lastUpdate[1] +
                  " " +
                  lastUpdate[2].substring(0, lastUpdate[2].length - 1) +
                  " " +
                  lastUpdate[3] +
                  " " +
                  lastUpdate[5] +
                  " GMT",
                "DD MMM YYYY HH:mm z"
              );
              var fusionDate = lastMoment.format("DD-MMM-YYYY HH:mm");

              var checkLast =
                "SELECT * FROM " +
                process.env.FUSIONTABLES_ID +
                " WHERE datetime='" +
                fusionDate +
                "'";

              fusiontables.query.sqlGet(
                {
                  auth: jwtClient,
                  sql: checkLast
                },
                function(err, resp) {
                  if (err) {
                    console.log("A query error occured", err);
                    gerr = err;
                  } else {
                    // if not in Fusion Tables then insert
                    if (!resp.rows) {
                      var insertNew =
                        "INSERT INTO " +
                        process.env.FUSIONTABLES_ID +
                        " (riverlevel, datetime) VALUES ('" +
                        waterLevel +
                        "', '" +
                        fusionDate +
                        "')";

                      fusiontables.query.sql(
                        {
                          auth: jwtClient,
                          sql: insertNew
                        },
                        function(err, resp) {
                          if (err) {
                            console.log("An insert error occured", err);
                            gerr = err;
                          } else {
                            console.log("inserted new row", resp.rows[0]);
                            gstat = "inserted new row";
                          }
                        }
                      );
                    } else {
                      console.log("no new updates");
                      gstat = "no new updates";
                    }
                  }
                }
              );
            } else {
              console.log("error parsing the datetime");
              gerr = "error parsing the datetime";
            }
          } else {
            console.log("error parsing the water level");
            gerr = "error parsing the water level";
          }
        }
      });
    }

    if (gerr) {
      callback(null, {
        statusCode: error.statusCode || 501,
        headers: { "Content-Type": "text/plain" },
        body: gerr
      });
      return;
    } else {
      // create a response
      const response = {
        statusCode: 200,
        body: gstat
      };
      callback(null, response);
    }
  });
};
