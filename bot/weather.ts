import axios from "axios";
export const tzlookup = require("tz-lookup");

const openWeatherAPIKey = "TODO-REPLACE-ME";

export async function getHourlyForecast(
  cityName: string,
  countryCode: string = null,
  units: "standard" | "metric" | "imperial" = "imperial"
): Promise<any> {
  const query = [cityName, countryCode].filter(Boolean).join(",").toLowerCase();

  const resp = await axios(
    `https://api.openweathermap.org/data/2.5/forecast?q=${query}&appid=${openWeatherAPIKey}&units=${units}&cnt=5`
  );

  return resp.data;
}

export async function getAllInOneForecast(
  lat: number,
  lon: number,
  units: "standard" | "metric" | "imperial" = "imperial",
  exclude: Array<String> = ["minutely"]
): Promise<any> {
  const excludeVal = exclude.join(",").toLowerCase();

  const resp = await axios(
    `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=${excludeVal}&appid=${openWeatherAPIKey}&units=${units}`
  );

  return resp.data;
}

export function weatherIconUrl(iconCode: string): string {
  /** Ref: https://openweathermap.org/weather-conditions */
  return `http://openweathermap.org/img/wn/${iconCode}@2x.png`;
}

export function getCardinalDirection(angle) {
  const directions = [
    "↑ N",
    "↗ NE",
    "→ E",
    "↘ SE",
    "↓ S",
    "↙ SW",
    "← W",
    "↖ NW",
  ];
  return directions[Math.round(angle / 45) % 8];
}

export function toFahrenheit(kelvin: number): number {
  // Convert a value in Kelvin to a value in Fahrenheit.
  return 1.8 * (kelvin - 273) + 32;
}

async function main() {
  const res = await getHourlyForecast("Ashburn");
  console.log(tzlookup(res.coord.lat, res.coord.lon));
  console.log(weatherIconUrl(res.weather[0].icon));
  console.log(toFahrenheit(res.main.temp));
  console.log(toFahrenheit(res.main.feels_like));

  console.log(res);
  console.log("Weather");
  console.log(res.weather);
}

// main();
