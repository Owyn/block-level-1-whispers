module.exports = function blockLevelOneWhispers(dispatch) {

  var name;
  var gameId;
  var serverId;
  var whisperQueues = {};
  var debug = false;
  var HiddenName;

  if(debug) {
    dispatch.hook('C_ASK_INTERACTIVE', 2, (event) => {
      console.log(event);
    });
  }

  dispatch.hook('S_LOGIN', dispatch.majorPatchVersion >= 86 ? 14 : 13, (event) => {
    ({name, gameId, serverId} = event);
  });

  dispatch.hook('S_WHISPER', 3, (event) => {
    if(event.name !== name) {
      if(!(whisperQueues[event.name]))
        whisperQueues[event.name] = [];
      whisperQueues[event.name].push(event.message);
      dispatch.toServer('C_ASK_INTERACTIVE', 2, {
        unk1: 1,
        serverId: serverId, // 4012 NA, 501 RU
        name: event.name
      });
	  if(debug && HiddenName) 
	  {
		  console.log(HiddenName + " is already waiting for response, ERROR, replaced with: " + event.name);
	  }
	  HiddenName = event.name;
      return false;
    }
  });

  dispatch.hook('S_ANSWER_INTERACTIVE', 2, (event) => {
    if(whisperQueues[event.name] && whisperQueues[event.name].length > 0){
      if(event.level > 1) {
        while(whisperQueues[event.name].length > 0) {
          dispatch.toClient('S_WHISPER', 3, {
            gameId: gameId,
            isWorldEventTarget: false,
            gm: false,
            founder: false,
            name: event.name,
            recipient: name,
            message: whisperQueues[event.name].shift()
          });
        }
      }
      else {
        while(whisperQueues[event.name].length > 0) {
          whisperQueues[event.name].shift();
          if(debug)
			{	
				console.log("message from level 1 character " + event.name + " blocked");
			}
        }
      }
    }
	if(event.name == HiddenName)
	{
		HiddenName = "";
		if(debug) 
		{
		  console.log("hide interaction from: " + event.name);
		}
		return false;
	}
    /*if(whisperQueues[event.name] && whisperQueues[event.name].length == 0)
      delete whisperQueues.name;
    */
  });
}
