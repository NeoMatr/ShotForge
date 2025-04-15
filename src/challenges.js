console.log("Loading challenges.js...");

// Challenge templates - these will be randomized for the user
const challengeTemplates = [
  {
    title: "The Perfect Break",
    description: "Set up a rack and perform a break shot. Pocket at least 3 balls on the break.",
    difficulty: "Medium",
    xp: 150,
    type: "Break"
  },
  {
    title: "Bank Shot Master",
    description: "Successfully complete 5 consecutive bank shots, where the object ball hits at least one rail before pocketing.",
    difficulty: "Hard",
    xp: 200,
    type: "Skill"
  },
  {
    title: "Corner Pocket Run",
    description: "Pocket 8 consecutive balls in any of the corner pockets without missing.",
    difficulty: "Medium",
    xp: 150,
    type: "Accuracy"
  },
  {
    title: "Side Pocket Precision",
    description: "Pocket 5 consecutive balls in either of the side pockets without missing.",
    difficulty: "Hard",
    xp: 200,
    type: "Accuracy"
  },
  {
    title: "Straight Shooter",
    description: "Set up the cue ball and an object ball in a straight line to a pocket. Make 10 shots in a row without missing.",
    difficulty: "Easy",
    xp: 100,
    type: "Accuracy"
  },
  {
    title: "Draw Shot Practice",
    description: "Perform 5 successful draw shots, bringing the cue ball back after hitting the object ball.",
    difficulty: "Medium",
    xp: 150,
    type: "Technique"
  },
  {
    title: "Follow Through",
    description: "Complete 5 follow shots where the cue ball continues forward after hitting the object ball.",
    difficulty: "Easy",
    xp: 100,
    type: "Technique"
  },
  {
    title: "The Combo Master",
    description: "Successfully make 3 combination shots where you hit one object ball into another to pocket the second ball.",
    difficulty: "Hard",
    xp: 200,
    type: "Skill"
  },
  {
    title: "Rail Runner",
    description: "Make a shot where the cue ball contacts at least 3 rails before hitting an object ball.",
    difficulty: "Expert",
    xp: 300,
    type: "Technique"
  },
  {
    title: "Straight Rail Cut",
    description: "Set up a shot where the object ball is near a rail. Cut the ball along the rail into a corner pocket. Complete 5 times.",
    difficulty: "Medium",
    xp: 150,
    type: "Skill"
  },
  {
    title: "Distance Challenge",
    description: "Place the cue ball and object ball at opposite ends of the table. Pocket the object ball in any pocket. Complete 3 times.",
    difficulty: "Medium",
    xp: 150,
    type: "Distance"
  },
  {
    title: "Cluster Buster",
    description: "Set up a cluster of 5 balls. Break them up and pocket at least 3 in a single shot.",
    difficulty: "Hard",
    xp: 200,
    type: "Strategy"
  },
  {
    title: "Call Your Shot",
    description: "Call your pocket before each shot. Successfully pocket 7 balls in the called pockets.",
    difficulty: "Medium",
    xp: 150,
    type: "Skill"
  },
  {
    title: "English Master",
    description: "Use side spin (English) to curve the cue ball around an obstacle ball to hit the target ball. Complete 3 times.",
    difficulty: "Expert",
    xp: 300,
    type: "Technique"
  },
  {
    title: "Safety Play",
    description: "Set up a defensive shot where you hit a legal ball but leave your opponent with no clear shot. Complete 5 times.",
    difficulty: "Hard",
    xp: 200,
    type: "Strategy"
  },
  {
    title: "Jump Shot",
    description: "Use a legal jump shot to jump over an obstacle ball and hit the target ball. Complete twice.",
    difficulty: "Expert",
    xp: 300,
    type: "Technique"
  },
  {
    title: "Massé Shot",
    description: "Perform a massé shot by elevating your cue and putting curve on the cue ball to hit a ball that seems blocked.",
    difficulty: "Expert",
    xp: 300,
    type: "Technique"
  },
  {
    title: "Three-Rail Kick",
    description: "When the object ball is blocked, kick the cue ball off three rails to hit the target ball. Complete once.",
    difficulty: "Expert",
    xp: 300,
    type: "Skill"
  },
  {
    title: "Table Length Draw",
    description: "Place the cue ball and object ball at opposite ends. After pocketing the object ball, draw the cue ball back to the original end.",
    difficulty: "Hard",
    xp: 250,
    type: "Technique"
  },
  {
    title: "Stop Shot Series",
    description: "Perform 5 stop shots where the cue ball remains in place after hitting the object ball.",
    difficulty: "Easy",
    xp: 100,
    type: "Technique"
  },
  {
    title: "8-Ball Runout",
    description: "Rack a full game of 8-ball and run out all your balls and the 8-ball without missing a shot.",
    difficulty: "Expert",
    xp: 400,
    type: "Game"
  },
  {
    title: "9-Ball Sprint",
    description: "Rack a 9-ball game and pocket all balls in numerical order without a miss.",
    difficulty: "Expert",
    xp: 400,
    type: "Game"
  },
  {
    title: "Rotation Challenge",
    description: "Set up 10 random balls and pocket them in numerical order without missing.",
    difficulty: "Hard",
    xp: 250,
    type: "Game"
  },
  {
    title: "Two Rail Position",
    description: "After pocketing an object ball, make the cue ball contact at least two rails and end up in position for the next shot.",
    difficulty: "Hard",
    xp: 200,
    type: "Position"
  },
  {
    title: "Pattern Play",
    description: "Set up 7 balls and plan a specific order to pocket them. Execute your plan without missing.",
    difficulty: "Hard",
    xp: 250,
    type: "Strategy"
  }
];

// Get a random challenge from the templates
function getRandomChallenge() {
  const randomIndex = Math.floor(Math.random() * challengeTemplates.length);
  return {...challengeTemplates[randomIndex]}; // Return a copy, not the original
}

// XP to level calculation (simple progression)
function calculateLevel(xp) {
  if (xp < 100) return 1;
  return Math.floor(Math.sqrt(xp / 50));
}

// Calculate XP needed for next level
function calculateNextLevelXP(level) {
  const nextLevel = level + 1;
  return nextLevel * nextLevel * 50;
}

// Calculate progress percentage to next level
function calculateLevelProgress(xp, currentLevel) {
  const currentLevelXP = currentLevel * currentLevel * 50;
  const nextLevelXP = calculateNextLevelXP(currentLevel);
  
  const levelXPRange = nextLevelXP - currentLevelXP;
  const userProgressInLevel = xp - currentLevelXP;
  
  return Math.min(100, Math.max(0, (userProgressInLevel / levelXPRange) * 100));
}

// Format XP with commas for thousands
function formatXP(xp) {
  return xp.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Format date for display
function formatDate(dateString) {
  if (!dateString) return 'Unknown';
  
  const date = new Date(dateString);
  
  // Check if the date is valid
  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }
  
  // If it's today, show the time
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return `Today at ${date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}`;
  }
  
  // If it's yesterday, show "Yesterday"
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  
  // Otherwise show the date
  return date.toLocaleDateString([], {month: 'short', day: 'numeric', year: 'numeric'});
}

// Export functions for use in app.js
window.getRandomChallenge = getRandomChallenge;
window.calculateLevel = calculateLevel;
window.calculateNextLevelXP = calculateNextLevelXP;
window.calculateLevelProgress = calculateLevelProgress;
window.formatXP = formatXP;
window.formatDate = formatDate;

console.log("challenges.js loaded successfully"); 