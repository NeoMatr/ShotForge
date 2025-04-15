// User Utility Functions

// Calculate XP needed for next level
function calculateNextLevelXP(level) {
  return level * 200;
}

// Calculate current level based on XP
function calculateLevel(xp) {
  return Math.floor(xp / 200) + 1;
}

// Calculate level progress as percentage
function calculateLevelProgress(xp, level) {
  const currentLevelXP = (level - 1) * 200;
  const nextLevelXP = level * 200;
  const levelXP = xp - currentLevelXP;
  const progress = (levelXP / (nextLevelXP - currentLevelXP)) * 100;
  return Math.min(Math.max(progress, 0), 100);
}

// Get user badges based on level and completed challenges
function getUserBadges(level, completedChallenges) {
  const badges = [];
  
  // Level badges
  if (level >= 5) badges.push({ name: "Pool Apprentice", icon: "🥉" });
  if (level >= 10) badges.push({ name: "Pool Expert", icon: "🥈" });
  if (level >= 20) badges.push({ name: "Pool Master", icon: "🥇" });
  
  // Challenge badges
  if (completedChallenges >= 10) badges.push({ name: "Challenge Beginner", icon: "🔰" });
  if (completedChallenges >= 50) badges.push({ name: "Challenge Enthusiast", icon: "🏆" });
  if (completedChallenges >= 100) badges.push({ name: "Challenge Master", icon: "👑" });
  
  return badges;
}

// Format user XP for display
function formatXP(xp) {
  return xp.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Format date to readable string
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Export user utility functions
window.calculateNextLevelXP = calculateNextLevelXP;
window.calculateLevel = calculateLevel;
window.calculateLevelProgress = calculateLevelProgress;
window.getUserBadges = getUserBadges;
window.formatXP = formatXP;
window.formatDate = formatDate;

console.log("user.js loaded successfully"); 