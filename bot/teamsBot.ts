import {
  TeamsActivityHandler,
  CardFactory,
  TurnContext,
  Attachment,
  AdaptiveCardInvokeValue,
  AdaptiveCardInvokeResponse,
  TeamsInfo,
} from "botbuilder";

import axios from "axios";
import {
  getHourlyForecast,
  weatherIconUrl,
  getCardinalDirection,
  tzlookup,
  getAllInOneForecast,
} from "./weather";

const rawWelcomeCard = require("./adaptiveCards/welcome.json");
const rawLearnCard = require("./adaptiveCards/learn.json");
const rawStepCard = require("./adaptiveCards/step-example.json");
const rawWeatherInputCard = require("./adaptiveCards/weather-input.json");
const rawWeatherTodayForecastCard = require("./adaptiveCards/weather-forecast-today.json");
const rawWeatherDailyForecastCard = require("./adaptiveCards/weather-forecast-daily.json");
const ACData = require("adaptivecards-templating");

export class TeamsBot extends TeamsActivityHandler {
  // record the likeCount
  likeCountObj: { likeCount: number };
  stepObj: { textVal: string };

  constructor() {
    super();

    this.likeCountObj = { likeCount: 0 };
    this.stepObj = { textVal: "" };

    this.onMessage(async (context, next) => {
      console.log("Running with Message Activity.");

      let txt = context.activity.text;
      const removedMentionText = TurnContext.removeRecipientMention(
        context.activity
      );
      if (removedMentionText) {
        // Remove the line break
        txt = removedMentionText.toLowerCase().replace(/\n|\r/g, "").trim();
      }

      // Trigger command by IM text
      switch (txt) {
        case "welcome": {
          const card = this.renderAdaptiveCard(rawWelcomeCard);
          await context.sendActivity({ attachments: [card] });
          break;
        }
        case "learn": {
          this.likeCountObj.likeCount = 0;
          const card = this.renderAdaptiveCard(rawLearnCard, this.likeCountObj);
          await context.sendActivity({ attachments: [card] });
          break;
        }
        case "step example": {
          this.stepObj.textVal = "Initial text";
          const card = this.renderAdaptiveCard(rawStepCard, this.stepObj);
          await context.sendActivity({ attachments: [card] });
          break;
        }
        case "daily forecast": {
          const card = this.renderAdaptiveCard(rawWeatherInputCard, {
            forecastType: "daily",
          });
          await context.sendActivity({ attachments: [card] });
          break;
        }
        case "today's forecast": {
          const card = this.renderAdaptiveCard(rawWeatherInputCard, {
            forecastType: "today",
          });
          await context.sendActivity({ attachments: [card] });
          break;
        }
        case "req": {
          // Ref: https://www.freecodecamp.org/news/here-is-the-most-popular-ways-to-make-an-http-request-in-javascript-954ce8c95aaa/

          const response = await axios("https://httpbin.org/get");

          console.log("Data:", response.data);

          await context.sendActivity(
            `**Here is the response:**<br>\`\`\`${JSON.stringify(
              response.data
            )}\`\`\``
          );
          // console.log(`Data: ${JSON.stringify(response.data, null, 2)}`);
          // console.table(response.data);
          break;
        }
        case "uinfo": {
          const [lastName, firstName] = context.activity.from.name.split(", ");

          await context.sendActivity(
            `User: ${firstName} ${lastName}<br>
             AAD ID: ${context.activity.from.aadObjectId}`
          );
          break;
        }
        case "uinfo full": {
          // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
          const member = await TeamsInfo.getMember(
            context,
            context.activity.from.aadObjectId
          );

          await context.sendActivity(
            `User: ${member.givenName} ${member.surname}<br>
             Role: ${member.userRole}<br>
             AAD ID: ${member.aadObjectId}<br>
             Email: ${member.email}<br>
             Tenant ID: ${member.tenantId}`
          );

          break;
        }
        default:
          await context.sendActivity(
            "I don't know that request, but I'm still learning."
          );
          break;
      }

      // By calling next() you ensure that the next BotHandler is run.
      await next();
    });

    this.onMembersAdded(async (context, next) => {
      const membersAdded = context.activity.membersAdded;
      for (let cnt = 0; cnt < membersAdded.length; cnt++) {
        if (membersAdded[cnt].id) {
          const card = this.renderAdaptiveCard(rawWelcomeCard);
          await context.sendActivity({ attachments: [card] });
          break;
        }
      }
      await next();
    });
  }

  async renderCoords(
    forecastType: "hourly" | "daily",
    lat: number = null,
    lon: number = null,
    cityName: string = null,
    countryCode: string = null
  ) {
    if (!lat || !lon) {
      console.log("Retrieving Longitude and Latitude Coordinates");
      const weatherResp = await getHourlyForecast(cityName, countryCode);
      lat = weatherResp.city.coord.lat;
      lon = weatherResp.city.coord.lon;

      console.log(`LAT: ${lat}, LON: ${lon}`);
    }

    console.log("Retrieving All-In-One Forecast");

    const res = await getAllInOneForecast(lat, lon);

    res.loc = cityName;

    console.log("Result:", JSON.stringify(res));

    let card = null,
      data = null;

    switch (forecastType) {
      case "daily":
        card = rawWeatherDailyForecastCard;
        res.daily[0].wind_cdir = getCardinalDirection(res.daily[0].wind_deg);
        data = res.daily;
        break;

      case "hourly":
        card = rawWeatherTodayForecastCard;
        res.hourly[0].wind_cdir = getCardinalDirection(res.hourly[0].wind_deg);
        data = res.hourly.slice(0, 12);
        break;
    }

    return this.renderAdaptiveCard(card, {
      ...res,
      data: data,
    });
  }

  // Invoked when an action is taken on an Adaptive Card. The Adaptive Card sends an event to the Bot and this
  // method handles that event.
  async onAdaptiveCardInvoke(
    context: TurnContext,
    invokeValue: AdaptiveCardInvokeValue
  ): Promise<AdaptiveCardInvokeResponse> {
    // The verb "userlike" is sent from the Adaptive Card defined in adaptiveCards/learn.json

    switch (invokeValue.action.verb) {
      case "userlike": {
        this.likeCountObj.likeCount++;
        const card = this.renderAdaptiveCard(rawLearnCard, this.likeCountObj);
        await context.updateActivity({
          type: "message",
          id: context.activity.replyToId,
          attachments: [card],
        });
        break;
      }
      case "dailyForecastForReston": {
        const card = await this.renderCoords(
          "daily",
          38.9687,
          -77.3411,
          "Reston, VA"
        );

        await context.updateActivity({
          type: "message",
          id: context.activity.replyToId,
          attachments: [card],
        });
        break;
      }

      case "todayForecastForReston": {
        const card = await this.renderCoords(
          "hourly",
          38.9687,
          -77.3411,
          "Reston, VA"
        );

        await context.updateActivity({
          type: "message",
          id: context.activity.replyToId,
          attachments: [card],
        });
        break;
      }
      case "todayForecastForSacramento": {
        const card = await this.renderCoords(
          "hourly",
          38.4666,
          -121.3177,
          "Sacramento, CA"
        );

        await context.updateActivity({
          type: "message",
          id: context.activity.replyToId,
          attachments: [card],
        });
        break;
      }
      case "dailyForecastForSacramento": {
        const card = await this.renderCoords(
          "daily",
          38.4666,
          -121.3177,
          "Sacramento, CA"
        );

        await context.updateActivity({
          type: "message",
          id: context.activity.replyToId,
          attachments: [card],
        });
        break;
      }
      case "todayForecastWithCity": {
        const { city, country } = invokeValue.action.data as Dictionary<string>;
        const card = await this.renderCoords(
          "hourly",
          null,
          null,
          city,
          country
        );

        await context.updateActivity({
          type: "message",
          id: context.activity.replyToId,
          attachments: [card],
        });

        break;
      }
      case "dailyForecastWithCity": {
        const { city, country } = invokeValue.action.data as Dictionary<string>;
        const card = await this.renderCoords(
          "daily",
          null,
          null,
          city,
          country
        );

        await context.updateActivity({
          type: "message",
          id: context.activity.replyToId,
          attachments: [card],
        });

        break;
      }
      case "action1": {
        this.stepObj.textVal = "Action: **ONE**.\nSome sample text *here*.";
        const card = this.renderAdaptiveCard(rawStepCard, this.stepObj);
        await context.updateActivity({
          type: "message",
          id: context.activity.replyToId,
          attachments: [card],
        });
        break;
      }
      case "action2": {
        this.stepObj.textVal = "Action: **TWO**.\nSome sample text *here*.";
        const card = this.renderAdaptiveCard(rawStepCard, this.stepObj);
        await context.updateActivity({
          type: "message",
          id: context.activity.replyToId,
          attachments: [card],
        });
        break;
      }
    }

    return { statusCode: 200, type: undefined, value: undefined };
  }

  // Bind AdaptiveCard with data
  renderAdaptiveCard(rawCardTemplate: any, dataObj?: any): Attachment {
    const cardTemplate = new ACData.Template(rawCardTemplate);
    const cardWithData = cardTemplate.expand({ $root: dataObj });
    const card = CardFactory.adaptiveCard(cardWithData);
    return card;
  }
}

interface Dictionary<T> {
  [Key: string]: T;
}
