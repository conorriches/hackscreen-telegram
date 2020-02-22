const https = require("https");
const mqtt = require("mqtt");
const querystring = require("querystring");

const config = require("./config.json");

class Telegram {
  constructor(config) {
    this.someoneWaiting = false;
    this.latestUser = "";
    this.lastMessageId = 0;
    this.storedMessage = "";
    this.config = config;

    this.postToTelegram("🤖 Hackscreen is starting, waiting for MQTT...");
    this.MQTTclient = mqtt.connect(config.mqtt.server);
    this.MQTTclient.on("connect", props => this.mqttHasConnected(props));
    this.MQTTclient.on("message", (topic, message) =>
      this.mqttReceivedMessage(topic, message)
    );
  }

  mqttHasConnected() {
    console.log(this.MQTTclient);
    this.MQTTclient.subscribe("door/#");
    this.postToTelegram("🔌 MQTT connected");
  }

  mqttReceivedMessage(topic, message) {
    switch (topic) {
      case "door/outer/opened/username":
        let justEntered = message.toString();

        if (!justEntered || justEntered == "") justEntered = "👻";
        if (justEntered == "-" || justEntered == "anon") break;

        const now = new Date();
        const niceDate = now.toLocaleTimeString();

        if (justEntered === this.latestUser) {
          this.storedMessage = `${this.storedMessage} (${niceDate})`;
          this.postToTelegram(this.storedMessage, this.lastMessageId, () => {});
        } else {
          this.latestUser = justEntered;
          this.storedMessage = `🔑  ${justEntered} (${niceDate})`;
          this.postToTelegram(this.storedMessage, false, id => {
            this.lastMessageId = id;
          });
        }
        break;

      case "door/outer/state":
        this.someoneWaiting && this.postToTelegram(` ${message.toString()}`);
        this.someoneWaiting = false;
        break;

      case "door/outer/doorbell":
        this.someoneWaiting = true;
        this.postToTelegram(`🔔 doorbell!`);
        break;

      default:
        break;
    }
  }

  postToTelegram(message, message_id, callback) {
    const postData = querystring.stringify({
      chat_id: this.config.telegram.chat_id,
      message_id,
      text: message
    });

    const options = {
      hostname: `api.telegram.org`,
      port: 443,
      path: `/bot${this.config.telegram.token}/${
        message_id ? "editMessageText" : "sendMessage"
      }`,
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": postData.length
      }
    };

    const req = https.request(options, res => {
      console.log("statusCode:", res.statusCode);
      console.log("headers:", res.headers);
      let body = "";

      res.on("data", d => {
        body += d;
      });

      res.on("end", function() {
        var parsed = JSON.parse(body);

        if (parsed && parsed.ok) {
          console.log(parsed);
          callback && callback(parsed.result.message_id);
        }
      });
    });

    req.on("error", e => {
      console.error(e);
    });

    req.write(postData);
    req.end();
  }
}

new Telegram(config);
