console.log("Loading storage.js...");

// Storage utility functions

// Save user data to local storage
function saveUserToLocalStorage(userData) {
  try {
    localStorage.setItem('pool_current_user', JSON.stringify(userData));
    console.log('User data saved to local storage');
    return true;
  } catch (error) {
    console.error('Error saving user data to local storage:', error);
    return false;
  }
}

// Get user data from local storage
function getUserFromLocalStorage() {
  try {
    const userData = localStorage.getItem('pool_current_user');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error getting user data from local storage:', error);
    return null;
  }
}

// Save challenge to local storage
function saveChallengeToLocalStorage(date, challenge) {
  try {
    localStorage.setItem(`pool_challenge_${date}`, JSON.stringify(challenge));
    console.log(`Challenge for ${date} saved to local storage`);
    return true;
  } catch (error) {
    console.error('Error saving challenge to local storage:', error);
    return false;
  }
}

// Get challenge from local storage
function getChallengeFromLocalStorage(date) {
  try {
    const challenge = localStorage.getItem(`pool_challenge_${date}`);
    return challenge ? JSON.parse(challenge) : null;
  } catch (error) {
    console.error('Error getting challenge from local storage:', error);
    return null;
  }
}

// Save completed challenge to local storage
function saveCompletedChallengeToLocalStorage(userId, challengeId, data) {
  try {
    // Get existing completed challenges
    const completedKey = `pool_completed_challenges_${userId}`;
    const completed = JSON.parse(localStorage.getItem(completedKey) || '{}');
    
    // Add this challenge
    completed[challengeId] = data;
    
    // Save back to local storage
    localStorage.setItem(completedKey, JSON.stringify(completed));
    console.log(`Completed challenge ${challengeId} saved for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Error saving completed challenge to local storage:', error);
    return false;
  }
}

// Check if challenge is completed in local storage
function isChallengeCompletedInLocalStorage(userId, challengeId) {
  try {
    const completedKey = `pool_completed_challenges_${userId}`;
    const completed = JSON.parse(localStorage.getItem(completedKey) || '{}');
    return !!completed[challengeId];
  } catch (error) {
    console.error('Error checking completed challenge in local storage:', error);
    return false;
  }
}

// Save offline action
function saveOfflineAction(action) {
  try {
    // Get existing actions
    const actions = JSON.parse(localStorage.getItem('pool_offline_actions') || '[]');
    
    // Add this action
    actions.push(action);
    
    // Save back to local storage
    localStorage.setItem('pool_offline_actions', JSON.stringify(actions));
    console.log('Offline action saved:', action);
    return true;
  } catch (error) {
    console.error('Error saving offline action:', error);
    return false;
  }
}

// Clear offline actions
function clearOfflineActions() {
  try {
    localStorage.removeItem('pool_offline_actions');
    console.log('Offline actions cleared');
    return true;
  } catch (error) {
    console.error('Error clearing offline actions:', error);
    return false;
  }
}

// Storage utilities for frontend-only data backup and restoration
const StorageUtils = {
  // Save all user data to localStorage
  saveUserData: function(userId, userData) {
    if (!userId || !userData) {
      console.error("Cannot save user data: missing userId or userData");
      return false;
    }
    
    try {
      localStorage.setItem(`pool_app_user_${userId}`, JSON.stringify(userData));
      console.log(`User data saved to localStorage for user ${userId}`);
      return true;
    } catch (e) {
      console.error("Error saving user data to localStorage:", e);
      return false;
    }
  },
  
  // Load user data from localStorage
  loadUserData: function(userId) {
    if (!userId) {
      console.error("Cannot load user data: missing userId");
      return null;
    }
    
    try {
      const data = localStorage.getItem(`pool_app_user_${userId}`);
      if (!data) return null;
      
      return JSON.parse(data);
    } catch (e) {
      console.error("Error loading user data from localStorage:", e);
      return null;
    }
  },
  
  // Export user data as downloadable JSON file
  exportUserData: function(userId, userData) {
    if (!userId || !userData) {
      console.error("Cannot export user data: missing userId or userData");
      return false;
    }
    
    try {
      // Create file data
      const dataStr = JSON.stringify(userData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const dataUrl = URL.createObjectURL(dataBlob);
      
      // Create download link
      const downloadLink = document.createElement('a');
      downloadLink.setAttribute('href', dataUrl);
      downloadLink.setAttribute('download', `pool_app_backup_${userId}_${new Date().toISOString().slice(0, 10)}.json`);
      downloadLink.style.display = 'none';
      
      // Trigger download
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      console.log("User data exported to file successfully");
      return true;
    } catch (e) {
      console.error("Error exporting user data:", e);
      return false;
    }
  },
  
  // Import user data from JSON file
  importUserData: function(userId, file, callback) {
    if (!userId || !file) {
      console.error("Cannot import user data: missing userId or file");
      return false;
    }
    
    try {
      const reader = new FileReader();
      
      reader.onload = function(e) {
        try {
          const importedData = JSON.parse(e.target.result);
          
          // Safety check for importing correct user data
          if (importedData && importedData.uid && importedData.uid !== userId) {
            console.warn("Imported data is for a different user. Current:", userId, "Imported:", importedData.uid);
          }
          
          // Save the imported data
          localStorage.setItem(`pool_app_user_${userId}`, JSON.stringify(importedData));
          console.log("User data imported successfully");
          
          // Execute callback if provided
          if (typeof callback === 'function') {
            callback(importedData);
          }
          
          return true;
        } catch (parseError) {
          console.error("Error parsing imported data:", parseError);
          return false;
        }
      };
      
      reader.readAsText(file);
    } catch (e) {
      console.error("Error importing user data:", e);
      return false;
    }
  },
  
  // Get all localStorage keys for Pool App
  getAllUserKeys: function() {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('pool_app_')) {
        keys.push(key);
      }
    }
    return keys;
  },
  
  // Auto-backup user data on a schedule (every 5 minutes by default)
  setupAutoBackup: function(userId, getUserDataFn, interval = 300000) {
    if (!userId || typeof getUserDataFn !== 'function') {
      console.error("Cannot setup auto-backup: missing userId or getUserDataFn");
      return null;
    }
    
    console.log(`Setting up auto-backup for user ${userId} every ${interval/1000} seconds`);
    
    const intervalId = setInterval(() => {
      const userData = getUserDataFn();
      if (userData) {
        this.saveUserData(userId, userData);
        console.log("Auto-backup completed:", new Date().toLocaleString());
      }
    }, interval);
    
    return intervalId;
  }
};

// Export functions to window object
window.saveUserToLocalStorage = saveUserToLocalStorage;
window.getUserFromLocalStorage = getUserFromLocalStorage;
window.saveChallengeToLocalStorage = saveChallengeToLocalStorage;
window.getChallengeFromLocalStorage = getChallengeFromLocalStorage;
window.saveCompletedChallengeToLocalStorage = saveCompletedChallengeToLocalStorage;
window.isChallengeCompletedInLocalStorage = isChallengeCompletedInLocalStorage;
window.saveOfflineAction = saveOfflineAction;
window.clearOfflineActions = clearOfflineActions;

// Export utilities for use in app.js
window.StorageUtils = StorageUtils;

console.log("Storage.js loaded successfully"); 