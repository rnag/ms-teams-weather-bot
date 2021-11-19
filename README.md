# CB Teams Chatbot

A foundational build of a Chat Bot for MS Teams with weather capabilities, built using **Typescript**.

This leverages the [Teams Toolkit](https://docs.microsoft.com/en-us/microsoftteams/platform/get-started/prerequisites?tabs=vscode) extension in VS Code for build and deployment.

Check out the [screenshots/](./screenshots) folder for sample interactions with the Weather Bot in MS Teams.

## Quickstart

There are tons of Weather APIs out there which are free to sign up and use, but for this PoC in particular we use the [OpenWeatherMap](https://openweathermap.org/) API. You can sign up on their site for free and get an API key which the bot can use to make requests to get the weather data.

Once you have a working API key, replace the value for `openWeatherAPIKey` at the top of the [weather.ts](./bot/weather.ts) file - also copied below.

```
const openWeatherAPIKey = "TODO-REPLACE-ME";
```

## Helpful Links

[Build your first Bot](https://docs.microsoft.com/en-us/microsoftteams/platform/get-started/first-app-bot?tabs=vscode)

[Bot Command Menus](https://docs.microsoft.com/en-us/microsoftteams/platform/bots/how-to/create-a-bot-commands-menu?tabs=desktop%2Cdotnet)

[Send media attachments with Bot Framework SDK](https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-howto-add-media-attachments?view=azure-bot-service-4.0&tabs=javascript)

[Create your own prompts to gather user input](https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-primitive-prompts?view=azure-bot-service-4.0&tabs=javascript)

[Create your first bot with Composer](https://docs.microsoft.com/en-us/composer/quickstart-create-bot)

[Tutorial: Create a weather bot with Composer](https://docs.microsoft.com/en-us/composer/tutorial-create-weather-bot)
