const express = require("express");
const path = require("path");
const app = express();
app.use(express.json());

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
    playerMatchId: dbObject.player_match_id,
    score: dbObject.score,
    fours: dbObject.fours,
    sixes: dbObject.sixes,
  };
};

//Get Players list API
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT * 
    FROM player_details;`;
  const playersArray = await db.all(getPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) =>
      convertDbObjectToResponseObject(eachPlayer)
    )
  );
});

//Get Player API
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT *
    FROM player_details
    WHERE player_id = ${playerId};`;
  const player = await db.get(getPlayerQuery);
  response.send(convertDbObjectToResponseObject(player));
});

//Update Player API
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updatePlayerQuery = `
    UPDATE player_details
    SET 
        player_name = '${playerName}
    WHERE player_id = ${playerId}';`;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//Get Match details API
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetailsQuery = `
    SELECT *
    FROM match_details
    WHERE match_id = ${matchId};`;
  const match = await db.get(getMatchDetailsQuery);
  response.send(convertDbObjectToResponseObject(match));
});

//Get All matches with player API
app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchesQuery = `
    SELECT 
        match_id,
        match,
        year
    FROM player_match_score
    NATURAL JOIN match_details
    WHERE player_id = ${playerId};`;
  const matchesOfPlayer = await db.all(getPlayerMatchesQuery);
  response.send(
    matchesOfPlayer.map((eachMatch) =>
      convertDbObjectToResponseObject(eachMatch)
    )
  );
});

//Get All players of specific Match API
app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const getPlayersOfMatchQuery = `
    SELECT 
        player_id,
        player_name
    FROM player_match_score NATURAL JOIN player_details
    WHERE match_id = ${matchId};`;
  const playersArray = await db.all(getPlayersOfMatchQuery);
  response.send(
    playersArray.map((eachPlayer) =>
      convertDbObjectToResponseObject(eachPlayer)
    )
  );
});

//Get stats of Player with playerId API
app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getStatsOfPlayerQuery = `
    SELECT 
        player_details.player_id AS playerId,
        player_details.player_name AS playerName,
        SUM(player_match_score.score) AS totalScore,
        SUM(fours) AS totalFours,
        SUM(sixes) AS totalSixes
    FROM player_details INNER JOIN player_match_score ON
        player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};`;
  const statsOfPlayer = await db.get(getStatsOfPlayerQuery);
  response.send(statsOfPlayer);
});

module.exports = app;
