// ShotForge Challenge Templates
const challengeTemplates = [
  {
    title: "Straight Shooter",
    description: "Pot 10 straight shots in a row without missing.",
    difficulty: "Easy",
    xp: 50
  },
  {
    title: "Corner Pocket Master",
    description: "Pot 5 balls consecutively into the corner pockets only.",
    difficulty: "Medium",
    xp: 100
  },
  {
    title: "Bank Shot Challenge",
    description: "Complete 3 bank shots in a row.",
    difficulty: "Hard",
    xp: 150
  },
  {
    title: "Behind-the-Back Shot",
    description: "Successfully make one behind-the-back shot.",
    difficulty: "Medium",
    xp: 100
  },
  {
    title: "Run the Table",
    description: "Clear the entire table in one turn without missing.",
    difficulty: "Hard",
    xp: 200
  },
  {
    title: "Long Distance",
    description: "Make 3 shots from the opposite end of the table.",
    difficulty: "Medium",
    xp: 100
  },
  {
    title: "Combo Master",
    description: "Successfully execute 2 combination shots.",
    difficulty: "Medium",
    xp: 120
  },
  {
    title: "Jump Shot",
    description: "Execute 1 legal jump shot that results in potting a ball.",
    difficulty: "Hard",
    xp: 150
  },
  {
    title: "Speed Round",
    description: "Clear 5 balls in under 2 minutes.",
    difficulty: "Easy",
    xp: 80
  },
  {
    title: "One-Handed Wonder",
    description: "Make 3 shots using only one hand.",
    difficulty: "Medium",
    xp: 100
  },
  {
    title: "Call Your Shots",
    description: "Call and successfully make 5 shots in a row.",
    difficulty: "Medium",
    xp: 120
  },
  {
    title: "Rail Master",
    description: "Make 3 shots where the cue ball contacts at least one rail before hitting the object ball.",
    difficulty: "Hard",
    xp: 150
  },
  {
    title: "The Impossible Shot",
    description: "Make a shot with at least 3 balls between the cue ball and the object ball.",
    difficulty: "Hard",
    xp: 180
  },
  {
    title: "Precision Practice",
    description: "Place an empty water bottle on the table and shoot around it without knocking it over 3 times.",
    difficulty: "Medium",
    xp: 120
  },
  {
    title: "Ball Control",
    description: "Pot a ball and have the cue ball stop within a chalk cube's distance of a specific point on the table.",
    difficulty: "Hard",
    xp: 150
  },
  {
    title: "Beginner's Drill",
    description: "Pot 5 balls in order from closest to farthest from the cue ball.",
    difficulty: "Easy",
    xp: 70
  },
  {
    title: "Safety Play",
    description: "Execute 3 safety shots where your opponent has no direct shot afterward.",
    difficulty: "Medium",
    xp: 110
  },
  {
    title: "Break and Run",
    description: "Break the rack and clear the table in a single turn.",
    difficulty: "Hard",
    xp: 200
  },
  {
    title: "Masse Shot",
    description: "Successfully execute one masse shot (curved cue ball path).",
    difficulty: "Hard",
    xp: 180
  },
  {
    title: "Consecutive Pockets",
    description: "Pot 6 balls, each in a different pocket, in consecutive shots.",
    difficulty: "Medium",
    xp: 130
  }
];

// Function to get a random challenge
function getRandomChallenge() {
  console.log("Getting random challenge");
  const randomIndex = Math.floor(Math.random() * challengeTemplates.length);
  return { ...challengeTemplates[randomIndex] };
}

// Function to get challenges by difficulty
function getChallengesByDifficulty(difficulty) {
  console.log(`Getting challenges with difficulty: ${difficulty}`);
  return challengeTemplates.filter(challenge => 
    challenge.difficulty.toLowerCase() === difficulty.toLowerCase()
  );
}

// Export the challenge functions
window.getRandomChallenge = getRandomChallenge;
window.getChallengesByDifficulty = getChallengesByDifficulty;

console.log("challenges.js loaded successfully"); 