// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';

const functions = require('firebase-functions');
const { WebhookClient } = require('dialogflow-fulfillment');
const { Card, Suggestion } = require('dialogflow-fulfillment');

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

  function Tradein(agent) {
    const smartphone = agent.parameters.smartphone;

    if (smartphone) {
      return axios({
        method: "GET",
        url: "https://raw.githubusercontent.com/dannirash/UF_Hackathon/main/iphone_prices.json",
        data: "",
      })
        .then((response) => {
          var json = response.data.iphone_prices;
          var phone = smartphone.data;
          var price = json[phone];
          if (price) {
            agent.add(`The price of ${smartphone} is ${price}`);
          } else {
            agent.add(`The price for ${smartphone} is not available. Please check back later.`);
          }
        })
        .catch((error) => {
          console.error('Error fetching data:', error);
          agent.add("There was an error fetching pricing information. Please try again later.");
        });
    }
  }

  // Run the proper function handler based on the matched Dialogflow intent name
  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', fallback);
  intentMap.set('Trade-in', Tradein);
  // intentMap.set('your intent name here', yourFunctionHandler);
  // intentMap.set('your intent name here', googleAssistantHandler);
  agent.handleRequest(intentMap);
});