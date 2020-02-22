# MQTT to Telegram 
This links MQTT to Telegram. Built for Hackspace Manchester.

## Config
Copy `config.example.json` to `config.json` (which is in gitignore so your secrets won't get put into git) and then this is good to go.

## MQTT
These are the topics we listen for over MQTT:

#### door/outer/opened/username
Called whenever someone scans in, the message is their username:

* Usernames can be blank or non existent. 
* Usernames set to a dash (-) or the word anon will not get announced. This is because some people prefer not to have it announced when they enter and as such have set their username appropriately.

#### door/outer/state
Called whenever the door is opened or closed.

#### door/outer/doorbell
Called when the doorbell is rung - this is debounced at the doorbell.
