# BandonFEWS-Serverless
A Serverless AWS Lambda function that runs every 15 minutes, checks the Bandon river level at http://www.bandonfloodwarning.ie/ and saves it to Google Fusion Tables.

## Setup

(Assuming you have your AWS access credentials already setup)

```bash
git clone git@github.com:conoro/bandonfews-serverless.git
cd bandonfews-serverless
npm install -g serverless
npm install
serverless deploy
```


Notes: 
1. You can also invoke it manually by accessing the GET URL returned by the successful serverless deploy
2. You can check manually invoked logs with: 

```bash
serverless logs -f check
```

and Cron logs with

```bash
serverless logs -f cron
```

3. If you make minor changes to just the function code, you can do a quick re-deploy with: 

```bash
serverless deploy function -f check
```

4. Change FUSIONTABLES_ID in serverless.yml to use this code with your own Fusion Table

5. This code now uses JWT-based auth for simplicity. Here's how to setup for yourself:
    * See here: https://github.com/google/google-api-nodejs-client/
    * And here: https://github.com/google/google-api-nodejs-client/blob/master/samples/jwt.js
    * Go to https://console.developers.google.com/ and create a new project
    * Go to https://console.developers.google.com/apis/library and search for Fusion Tables
    * Enable it for your project
    * Go to https://console.developers.google.com/iam-admin/serviceaccounts/project
    * Click Create Service Account
    * Give it a name and click "Furnish a new private key" and select JSON
    * Ignore Role and Delegation
    * Note the Service Account ID Email address
    * Click Create and it'll start downloading the JSON Key file.
    * Once you get the JSON key file, save it in the project dir as jwt_key.json (do not lose it or leak it!)
    * Add the Service Account ID email as a "Writer" in the sharing settings for your Fusion Table
    * You can now easily read/write to your table without any of the OAuth2 faffing around.


LICENSE Apache-2.0



Copyright Conor O'Neill 2017, conor@conoroneill.com
