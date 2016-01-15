function cleanUpGamesAndPlayers(){
  var cutOff = moment().subtract(2, 'hours').toDate().getTime();

  var numGamesRemoved = Games.remove({
    createdAt: {$lt: cutOff}
  });

  var numPlayersRemoved = Players.remove({
    createdAt: {$lt: cutOff}
  });
}

function getRandomLocation(){
  var locationIndex = Math.floor(Math.random() * locations.length);
  return locations[locationIndex];
}

function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

function assignRoles(players){                                    
  var roles = characters.slice();
  var shuffled_roles = shuffleArray(roles);
  var role = null;

  players.forEach(function(player){
      role = shuffled_roles.pop();
      Players.update(player._id, {$set: {role: role}});
  });
}

Meteor.startup(function () {
  // Delete all games and players at startup
  Games.remove({});
  Players.remove({});
});

var MyCron = new Cron(60000);

MyCron.addJob(5, cleanUpGamesAndPlayers);

Meteor.publish('games', function(accessCode) {
  return Games.find({"accessCode": accessCode});
});

Meteor.publish('players', function(gameID) {
  return Players.find({"gameID": gameID});
});

Games.find({"state": 'waitingForPlayers'}).observeChanges({
  added: function (id, game) {
    Games.update(id, {$set: {location: null}});
  }
});



Games.find({"state": 'settingUp'}).observeChanges({
  added: function (id, game) {
    if (game.state === 'inProgress') return;
    Games.update(id, {$set: {state: 'inProgress'}});
    var players = Players.find({gameID: id});
    var gameEndTime = moment().add((players.count() + 5), 'minutes').valueOf();

    assignRoles(players);

    Games.update(id, {$set: {state: 'inProgress',cooldown : kickcooldown, endTime: gameEndTime, paused: false, pausedTime: null}});
  }
});