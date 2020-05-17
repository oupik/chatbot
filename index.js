const BootBot = require('bootbot');
const config = require('config');
const fetch = require('node-fetch');
const API_URL = "https://tastedive.com/api/similar?";

var port = process.env.PORT || config.get('PORT');

const bot = new BootBot({
  accessToken: config.get('ACCESS_TOKEN'),
  verifyToken: config.get('VERIFY_TOKEN'),
  appSecret: config.get('APP_SECRET')
});

bot.start(port);

console.log('Bot started');

const helpText = 'To know, who is who, write "whois his/her name,"\n To get details about artist write "info her/his name,"\n To find similar artists write "similar his/her name,"\n  To find video link write "video name"';

bot.setGreetingText("Hello, I'm here to talk with you about artists. To talk, write artist name and type of art, eg. 'Queen music'. Allowed types are music, movie and author");

bot.on('message', (payload, chat) => {
	const text = payload.message.text;
	console.log(`The user said: ${text}`);
});

bot.hear(['whois'],(payload, chat) => {
    chat.say('Please use [whois name] or write "help" for help');
});

bot.hear(/whois (.*)/i,(payload, chat, data) => {
  const search = data.match[1];
  if (search === "")
    chat.say('Please enter name or write help');
  else {
    chat.conversation((conversation) => {
      fetch(API_URL + 'k=' + config.get('TASTE_DRIVE_TOKEN') + '&q=' + search + '&info=1')
        .then(res => res.json())
        .then(json => {
          console.log("Search result is "+JSON.stringify(json));
          const resType = json.Similar.Info[0].Type.toLowerCase();
          if (resType == "unknown") {
            conversation.say('I could not find any result for '+search, {typing: true});
            conversation.end();
            console.log("Response is empty");
          } else {
            console.log("All Ok");
            //conversation.say('I found a result ', { typing: true });
            setTimeout(() => {
              //conversation.say(JSON.stringify(json.Similar.Info[0].wTeaser), { typing: true });
              conversation.say(prepareResults(search, json.Similar.Info[0].Type), {typing:true});
            }, 1000)
            shouldShowDetail(conversation, json);
          }
        })
    });
  }
});

bot.hear(/detail (.*)/i,(payload, chat, data) => {
  const search = data.match[1];
  if (search === "")
    chat.say('Please enter name or write help');
  else {
    chat.conversation((conversation) => {
      fetch(API_URL + 'k=' + config.get('TASTE_DRIVE_TOKEN') + '&q=' + search + '&info=1')
        .then(res => res.json())
        .then(json => {
          console.log("Search result is "+JSON.stringify(json));
          const resType = json.Similar.Info[0].Type.toLowerCase();
          if (resType == "unknown") {
            conversation.say('I could not find any result for '+search, {typing: true});
            conversation.end();
            console.log("Response is empty");
          } else {
            console.log("All Ok");
            //conversation.say('I found a result ', { typing: true });
            setTimeout(() => {
              conversation.say(JSON.stringify(json.Similar.Info[0].wTeaser), { typing: true });
            }, 1000)
            shouldShowVideo(conversation, json);
          }
        })
    });
  }
});


bot.hear(['hello', 'hi'], (payload, chat) => {
	console.log('The user said "hello" or "hi"!');
	chat.say("Hi, can I help you to find informations About some artist/writer ?")
  chat.conversation((conversation) => {
    setTimeout(() => {
      conversation.ask({
        text: "Do you want to show how to speak with me? ",
        quickReplies: ["Yes", "No"],
        options: { typing: true }
      }, (payload, conversation) => {
        if (payload.message.text === "Yes") {
          conversation.say(helpText, { typing: true });
          conversation.end();
        } else {
          conversation.say("In case of problem, write help", { typing: true });
          conversation.end();
        }
      });
    }, 500);
  });
});

bot.hear(/similar (.*)/i,(payload, chat, data) => {
  const search = data.match[1];
  if (search === "")
    chat.say('Please enter name or write help');
  else {
    chat.conversation((conversation) => {
      fetch(API_URL + 'k=' + config.get('TASTE_DRIVE_TOKEN') + '&q=' + search + '&info=1')
        .then(res => res.json())
        .then(json => {
          console.log("Search result is "+JSON.stringify(json));
          const resType = json.Similar.Info[0].Type.toLowerCase();
          if (resType == "unknown") {
            conversation.say('I could not find any result for '+search, {typing: true});
            conversation.end();
            console.log("Response is empty");
          } else {
            console.log("All Ok");
            setTimeout(() => {
              conversation.say("Similar searches are " + prepareSimilar(json), { typing: true });
            }, 500);
          }
        })
    });
  }
});

bot.hear(/video (.*)/i,(payload, chat, data) => {
  const search = data.match[1];
  if (search === "")
    chat.say('Please enter name or write help');
  else {
    chat.conversation((conversation) => {
      fetch(API_URL + 'k=' + config.get('TASTE_DRIVE_TOKEN') + '&q=' + search + '&info=1')
        .then(res => res.json())
        .then(json => {
          console.log("Search result is "+JSON.stringify(json));
          const resType = json.Similar.Info[0].Type.toLowerCase();
          if (resType == "unknown") {
            conversation.say('I could not find any result for '+search, {typing: true});
            conversation.end();
            console.log("Response is empty");
          } else {
            console.log("All Ok");
            setTimeout(() => {
              conversation.say("Video for " + search + " is available on : " + json.Similar.Info[0].yUrl, { typing: true });
            }, 500);
          }
        })
    });
  }
});

bot.hear(['help'], (payload, chat)=>{
  console.log("Help requested");
  chat.say(helpText, {typing:true});
});

function prepareResults(name, itemType) {
  let res = name + " is a ";
  //console.log(JSON.stringify(item));
  console.log(itemType);
  switch (itemType.toLowerCase()) {
    case "music": res += 'musician or band';
      break;
    case "author ": res += 'writer';
      break;
    default: res += itemType.toLowerCase();
      break;
  }
  return res;
}

function shouldShowDetail(conversation, json) {
  //console.log(json.Similar.Info[0].wTeaser);
  console.log("Ask for details");
    if (json.Similar.Info[0].wTeaser != null){
      setTimeout(() => {
      conversation.ask({
        text: "Do you want to display details about " + json.Similar.Info[0].Name + "?",
        quickReplies: ["Yes", "No"],
        options: {typing: true}
      }, (payload, conversation) => {
        if (payload.message.text === "Yes") {
          conversation.say(json.Similar.Info[0].wTeaser, { typing: true });
          conversation.end();
        } else {
          setTimeout(()=>{

          },1500);
          //conversation.say("Ok, ask me about an another artist.", { typing: true });
          askForSimilar(conversation, json);
          conversation.end();
        }
      });
      }, 2000)
    }
    else{
      conversation.say("No details for " + json.Similar.Info[0].Name + "are available");
    }
}

function shouldShowVideo(conversation, json){
  setTimeout(() => {
    conversation.ask({
      text: "Do you want to play video from " + json.Similar.Info[0].Name + "?",
      quickReplies: ["Yes", "No"],
      options: {typing: true}
    }, (payload, conversation) => {
      if (payload.message.text === "Yes") {
        conversation.say("Video is available here " + json.Similar.Info[0].yUrl, { typing: true });
        conversation.end();
      }
    });
  }, 1500);
}

function askForSimilar(conversation, json){
  setTimeout(() => {
    conversation.ask({
      text: "Wanna see similar artists?",
      quickReplies: ["Yes", "No"],
      options: {typing: true}
    }, (payload, conversation) => {
      if (payload.message.text === "Yes") {
        console.log("Yes similar");
        conversation.say("Similar searches are " + prepareSimilar(json), { typing: true });
        conversation.end();
      }
    });
  }, 1500);
}

function prepareSimilar(json) {
  let res = "";
  let i = 0;
  while (json.Similar.Results[i] != undefined && i <= 5){
    res += prepareResults(json.Similar.Results[i].Name, json.Similar.Results[i].Type) + "\n";
    i++;
  }
  return res;
}