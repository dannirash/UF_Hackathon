// See github.com/dialogflow/dialogflow-fulfillment-nodejs
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
  function UpgradeSelectNum(agent) {
    let num = agent.parameters.number;
    if (num == 1)
        agent.add("Great choice! visit this link to get your trade in with an Unlimited Ultimate plan today! www.verizon.com/tradein");
    else if(num == 2)
        agent.add("Great choice! visit this link to get your trade in with an Unlimited Plus plan today! www.verizon.com/tradein");
    else if (num == 3)
        agent.add("Great choice! visit this link to get your trade in with an Unlimited Welcome plan today! www.verizon.com/tradein");
    else
        agent.add("Choose a valid plan");
  }

  function Upgrade(agent) {
    const smartphones = agent.parameters.smartphone;
    const phone1 = smartphones[0]; // Current phone
    const phone2 = smartphones[1]; // New phone
    return axios({
      method: "GET",
      url: "https://raw.githubusercontent.com/dannirash/UF_Hackathon/main/iphone_prices.json",
      data: "",
    })
      .then((response) => {
        const json = response.data.iphone_prices;
        // Extract the number from the string
        const numModel1 = parseInt(phone1.match(/\d+/));
        const numModel2 = parseInt(phone2.match(/\d+/));
        // Check if the number is greater than or equal to 8
        if (numModel1 >= 8 && numModel2 >= 8 && numModel1 < numModel2) {
          let price2 = json[phone2];
          const quote1 = calculatePromotion("Unlimited Ultimate plan", 1000, 90, price2);
          const quote2 = calculatePromotion("Unlimited Plus plan", 850, 80, price2);
          const quote3 = calculatePromotion("Unlimited Welcome plan", 415, 65, price2);
          agent.add(`When upgrading from your ${phone1} to the ${phone2}, your costs would be as follows:\n
          1) ${quote1}\n
          2) ${quote2}\n
          3) ${quote3}\n.
          Do any of these options interest you?`);
        } else{
          agent.add(`Sorry we do not support ${phone1} trade in for ${phone2}`);
        }
      })
      .catch((error) => {
        console.error('Error fetching data:', error);
        agent.add("There was an error fetching pricing information. Please try again later.");
      });
  }

  function PlansInfo(agent) {
    const plan = agent.parameters.phone_plan;
    const plansDictionary = {
      "Unlimited Ultimate": {
        "data": "Unlimited 5G premium data",
        "call_and_text": "Unlimited",
        "mobile_hotspot": "60GB",
        "cost": "$90 per month"
      },
      "Unlimited Plus": {
        "data": "Unlimited 5G premium data",
        "call_and_text": "Unlimited",
        "mobile_hotspot": "30GB",
        "cost": "$80 per month"
      },
      "Unlimited Welcome": {
        "data": "Unlimited",
        "call_and_text": "Unlimited",
        "mobile_hotspot": "Not Available",
        "cost": "$65 per month"
      }
    };

    if (plan) {
      if (plan.toLowerCase() === 'all') {
        let response = 'Here are the details for all plans:';
        for (const [plan, details] of Object.entries(plansDictionary)) {
          response += `\n${plan}: Data - ${details.data}, Call and Text - ${details.call_and_text}, Mobile Hotspot - ${details.mobile_hotspot}, Cost - ${details.cost}. Please visit our website for more informantion www.verizon.com/unlimited`;
        }
        agent.add(response);
      } else if (plansDictionary.hasOwnProperty(plan)) {
        const planDetails = plansDictionary[plan];
        const data = planDetails.data;
        const callAndText = planDetails.call_and_text;
        const mobileHotspot = planDetails.mobile_hotspot;
        const cost = planDetails.cost;

        agent.add(`Here are the details for the ${plan} plan: Data - ${data}, Call and Text - ${callAndText}, Mobile Hotspot - ${mobileHotspot}, Cost - ${cost}`);
      } else {
        agent.add(`Sorry, we do not have information for the ${plan} plan.`);
      }
    } else {
      agent.add(`Please specify a plan or ask about all the plans.`);
    }
  }

  function getPrice(json, phone) {
    return json[phone] || null;
  }

  function calculatePromotion(plan, tradeInValue, monthlyPrice, price) {
    let result = price - tradeInValue;
    if (result < 0) {
      result = 0;
      return(`Enjoy the seamless transition at no cost when you opt for the ${plan} $${monthlyPrice}/month`);
    }
    return(`For the ${plan}, a one time payment of $${result} and $${monthlyPrice}/month`);
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

  // Run the proper function handler based on the matched Dialogflow intent name
  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', fallback);
  intentMap.set('Trade-in', Tradein);
  intentMap.set('Upgrade', Upgrade);
  intentMap.set('Plans-info', PlansInfo);
  intentMap.set('Upgrade - select.number', UpgradeSelectNum);
  agent.handleRequest(intentMap);
});