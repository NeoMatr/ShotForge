console.log("Loading achievements.js...");

// Achievement templates
const achievementTemplates = [
  {
    id: "first_challenge",
    name: "First Steps",
    description: "Complete your first challenge",
    icon: "🏆",
    condition: (userData) => userData.stats && userData.stats.completedChallenges >= 1,
    category: "Beginner",
    rarity: "Common"
  },
  {
    id: "challenge_streak_3",
    name: "Three In A Row",
    description: "Complete 3 challenges in a single day",
    icon: "🔥",
    condition: (userData) => userData.stats && userData.stats.dailyStreak >= 3,
    category: "Challenges",
    rarity: "Common"
  },
  {
    id: "challenge_streak_5",
    name: "On Fire",
    description: "Complete 5 challenges in a single day",
    icon: "🔥",
    condition: (userData) => userData.stats && userData.stats.dailyStreak >= 5,
    category: "Challenges",
    rarity: "Uncommon"
  },
  {
    id: "level_5",
    name: "Rising Star",
    description: "Reach level 5",
    icon: "⭐",
    condition: (userData) => window.calculateLevel && window.calculateLevel(userData.points || 0) >= 5,
    category: "Progress",
    rarity: "Common"
  },
  {
    id: "level_10",
    name: "Pool Shark",
    description: "Reach level 10",
    icon: "🦈",
    condition: (userData) => window.calculateLevel && window.calculateLevel(userData.points || 0) >= 10,
    category: "Progress",
    rarity: "Uncommon"
  },
  {
    id: "level_20",
    name: "Cue Master",
    description: "Reach level 20",
    icon: "👑",
    condition: (userData) => window.calculateLevel && window.calculateLevel(userData.points || 0) >= 20,
    category: "Progress",
    rarity: "Rare"
  },
  {
    id: "complete_10",
    name: "Getting Started",
    description: "Complete 10 total challenges",
    icon: "🎯",
    condition: (userData) => userData.stats && userData.stats.completedChallenges >= 10, 
    category: "Challenges",
    rarity: "Common"
  },
  {
    id: "complete_50",
    name: "Challenge Hunter",
    description: "Complete 50 total challenges",
    icon: "🏹",
    condition: (userData) => userData.stats && userData.stats.completedChallenges >= 50,
    category: "Challenges",
    rarity: "Uncommon"
  },
  {
    id: "complete_100",
    name: "Century Club",
    description: "Complete 100 total challenges",
    icon: "💯",
    condition: (userData) => userData.stats && userData.stats.completedChallenges >= 100,
    category: "Challenges",
    rarity: "Rare"
  },
  {
    id: "technical_5",
    name: "Technician",
    description: "Complete 5 technique-based challenges",
    icon: "🧩",
    condition: (userData) => userData.stats && userData.stats.techniqueChallenges >= 5,
    category: "Specialty",
    rarity: "Uncommon"
  },
  {
    id: "accuracy_5",
    name: "Sharpshooter",
    description: "Complete 5 accuracy-based challenges",
    icon: "🎯",
    condition: (userData) => userData.stats && userData.stats.accuracyChallenges >= 5,
    category: "Specialty",
    rarity: "Uncommon"
  },
  {
    id: "expert_1",
    name: "Expert Challenger",
    description: "Complete your first expert challenge",
    icon: "🏅",
    condition: (userData) => userData.stats && userData.stats.expertChallenges >= 1,
    category: "Difficulty",
    rarity: "Rare"
  }
];

// Function to check for new achievements
function checkAchievements(userData, db, currentUser) {
  console.log("Checking achievements for user");
  
  if (!userData || !currentUser) {
    console.error("Missing user data for achievement check");
    return Promise.resolve([]);
  }

  // Get existing user achievements
  return db.collection('users').doc(currentUser.uid)
    .collection('achievements').get()
    .then(snapshot => {
      const existingAchievements = new Set();
      snapshot.forEach(doc => {
        existingAchievements.add(doc.id);
      });

      console.log(`User has ${existingAchievements.size} existing achievements`);
      
      // Check for new achievements
      const newAchievements = [];
      const awardPromises = [];
      
      achievementTemplates.forEach(achievement => {
        // Skip if already earned
        if (existingAchievements.has(achievement.id)) {
          return;
        }
        
        // Check if condition is met
        if (achievement.condition(userData)) {
          newAchievements.push(achievement);
          
          // Award achievement in database
          const achievementData = {
            id: achievement.id,
            name: achievement.name,
            description: achievement.description,
            icon: achievement.icon,
            category: achievement.category,
            rarity: achievement.rarity,
            earnedAt: new Date().toISOString()
          };
          
          awardPromises.push(
            db.collection('users').doc(currentUser.uid)
              .collection('achievements').doc(achievement.id)
              .set(achievementData)
          );
        }
      });
      
      // If we have new achievements, save them and return the list
      if (newAchievements.length > 0) {
        console.log(`User earned ${newAchievements.length} new achievements`);
        return Promise.all(awardPromises).then(() => newAchievements);
      }
      
      return [];
    });
}

// Show trophy notification
function showAchievementNotification(achievement) {
  // Create the notification element
  const notification = document.createElement('div');
  notification.className = 'achievement-notification';
  
  notification.innerHTML = `
    <div class="achievement-icon">${achievement.icon}</div>
    <div class="achievement-content">
      <div class="achievement-title">Achievement Unlocked!</div>
      <div class="achievement-name">${achievement.name}</div>
      <div class="achievement-desc">${achievement.description}</div>
    </div>
  `;
  
  // Add to document
  document.body.appendChild(notification);
  
  // Play sound if available
  const achievementSound = new Audio();
  achievementSound.src = 'assets/sounds/achievement.mp3';
  achievementSound.volume = 0.5;
  achievementSound.play().catch(e => console.log("Could not play achievement sound", e));
  
  // Trigger animation
  setTimeout(() => {
    notification.classList.add('show');
  }, 100);
  
  // Remove after display
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 500);
  }, 5000);
}

// Update user stats when challenge is completed
function updateChallengeStats(challenge, db, currentUser) {
  if (!challenge || !currentUser) return Promise.resolve();
  
  return db.collection('users').doc(currentUser.uid).get()
    .then(doc => {
      if (!doc.exists) return Promise.resolve();
      
      const userData = doc.data();
      const stats = userData.stats || {};
      
      // Initialize stats if needed
      if (!stats.completedChallenges) stats.completedChallenges = 0;
      if (!stats.dailyStreak) stats.dailyStreak = 0;
      
      // Update general stats
      stats.completedChallenges += 1;
      stats.lastChallengeDate = new Date().toISOString();
      
      // Get today's date
      const today = new Date().toDateString();
      const lastDate = stats.lastChallengeDate ? new Date(stats.lastChallengeDate).toDateString() : null;
      
      // If this is the first challenge today, reset streak
      if (lastDate !== today) {
        stats.dailyStreak = 1;
      } else {
        stats.dailyStreak += 1;
      }
      
      // Update challenge type stats
      if (challenge.type) {
        const typeKey = `${challenge.type.toLowerCase()}Challenges`;
        stats[typeKey] = (stats[typeKey] || 0) + 1;
      }
      
      // Update difficulty stats
      if (challenge.difficulty) {
        const diffKey = `${challenge.difficulty.toLowerCase()}Challenges`;
        stats[diffKey] = (stats[diffKey] || 0) + 1;
      }
      
      // Save updated stats
      return db.collection('users').doc(currentUser.uid).update({ stats });
    });
}

// Export functions for use in app.js
window.checkAchievements = checkAchievements;
window.showAchievementNotification = showAchievementNotification;
window.updateChallengeStats = updateChallengeStats;

console.log("Achievements.js loaded successfully"); 