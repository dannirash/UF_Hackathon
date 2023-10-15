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
          const json = response.data.iphone_prices;
          const phone = smartphone;
          const price = json[phone];
          const upgradeInfo = getUpgradeInfo(phone);
          agent.add(`The price of ${phone} is ${price}. Here is the plan upgrade information: ${upgradeInfo}`);
        })
        .catch((error) => {
          console.error('Error fetching data:', error);
          agent.add("There was an error fetching pricing information. Please try again later.");
        });
    }
  }

  function getUpgradeInfo(phone) {
    const betterPromotionPhones = ["iPhone 8", "iPhone 9", "iPhone 10", "iPhone 11", "iPhone 12",
      "iPhone 13", "iPhone 14", "iPhone 15"];
    if (betterPromotionPhones.includes(phone)) {
      return "For the eligible phones, the trade-in values are $1000 for the Unlimited Ultimate plan, $830 for the Unlimited Plus plan, and $415 for the Unlimited Welcome plan.";
    } else {
      return "For other phones, the maximum trade-in value is $830 for the Unlimited Ultimate plan, $415 for the Unlimited Plus plan, and $100 for the Unlimited Welcome plan.";
    }
  }


  function Upgrade(agent) {
    const smartphones = agent.parameters.smartphone;

    if (smartphones && smartphones.length >= 2) {
      const phone1 = smartphones[0]; // Current phone
      const phone2 = smartphones[1]; // New phone
      agent.add(phone1 + phone2)
      console.log(phone1 + phone2)
      return axios({
        method: "GET",
        url: "https://raw.githubusercontent.com/dannirash/UF_Hackathon/iphone_prices.json",
        data: "",
      })
        .then((response) => {
          const json = response.data.iphone_prices;
          const price2 = getPrice(json, phone2);

          agent.add(`Trading in your ${phone1} for an ${phone2} would be:`);
          calculatePromotion("Unlimited Ultimate plan", 1000, 90, price2);
          calculatePromotion("Unlimited Plus plan", 850, 80, price2);
          calculatePromotion("Unlimited Welcome plan", 415, 65, price2);

        })
        .catch((error) => {
          console.error('Error fetching data:', error);
          agent.add("There was an error fetching pricing information. Please try again later.");
        });
    } else {
      agent.add("Please provide at least two valid phones for comparison.");
    }
  }

  function getPrice(json, phone) {
    return json[phone] || null;
  }

  function calculatePromotion(plan, tradeInValue, monthlyPrice, price) {
    const result = tradeInValue - price + monthlyPrice;
    agent.add(`- ${result}$ under ${plan}`);
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