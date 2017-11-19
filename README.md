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
2. You can check logs with: 

```bash
serverless logs -f check
```

3. If you make minor changes to just the function code, you can do a quick re-deploy with: 

```bash
serverless deploy function -f check
```


LICENSE Apache-2.0



Copyright Conor O'Neill 2017, conor@conoroneill.com
