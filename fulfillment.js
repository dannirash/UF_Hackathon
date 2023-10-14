// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';
 
const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');

//Added for tutorial
const axios = require('axios');
 
process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements
 
exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
 
  function welcome(agent) {
    agent.add(`Welcome to my agent!`);
  }
 
  function fallback(agent) {
    agent.add(`I didn't understand`);
    agent.add(`I'm sorry, can you try again?`);
  }

  function Tradein(agent){
    //Here we get the type of the utterance
    const smartphone = agent.parameters.smartphone;

    if (smartphone) {
      return axios({
        method: "GET",
        url: "https://raw.githubusercontent.com/dannirash/UF_Hackathon/iphone_prices.json",
        data: "",
      })
        .then((response) => {
          var json = response.data.iphone_prices;
          var phone = smartphone;
          var price = json[phone];
          agent.add(`The price of ${phone} is ${price}`);
        })
        .catch((error) => {
          console.log(error);
        });
    }
  }

  function Upgrade(agent){
    //Here we get the type of the utterance
    const smartphone = agent.parameters.smartphone;

    if (smartphone) {
      return axios({
        method: "GET",
        url: "https://raw.githubusercontent.com/dannirash/UF_Hackathon/iphone_prices.json",
        data: "",
      })
        .then((response) => {
          var json = response.data.iphone_prices;
          var phone = smartphone;
          var price1 = json[phone[0]];
          var price2 = json[phone[1]];
          var result = price2 - price1;
          agent.add(`The price diffrence is ${result}`);
        })
        .catch((error) => {
          console.log(error);
        });
    }
  }

  // Run the proper function handler based on the matched Dialogflow intent name
  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', fallback);
  intentMap.set('Trade-in', Tradein);
  intentMap.set('Upgrade', Upgrade);
  // intentMap.set('your intent name here', yourFunctionHandler);
  // intentMap.set('your intent name here', googleAssistantHandler);
  agent.handleRequest(intentMap);
});