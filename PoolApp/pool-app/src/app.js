console.log("Loading app.js...");

// Define FieldValue for easier use throughout the app
const FieldValue = firebase.firestore.FieldValue;

// Wait for DOM to be fully loaded before accessing elements
document.addEventListener('DOMContentLoaded', function() {
  console.log("DOM fully loaded - initializing app");
  
  // Add pool ball decorations
  document.body.innerHTML += `
    <div class="pocket-top-right"></div>
    <div class="pocket-bottom-left"></div>
    <div class="pool-ball ball-1">1</div>
    <div class="pool-ball ball-3">3</div>
    <div class="pool-ball ball-8">8</div>
  `;
  
  initApp();
});

function initApp() {
  // Get main app container
  const appContainer = document.getElementById('app');
  
  if (!appContainer) {
    console.error("Fatal error: Could not find app container element");
    // Display error in debug panel if it exists
    const debugPanel = document.getElementById('debug-info');
    if (debugPanel) {
      debugPanel.innerHTML += "<p class='error'>Fatal error: App container (#app) not found</p>";
    }
    return;
  }
  
  console.log("App container found, continuing initialization");
  
  // Application state
  let currentUser = null;
  let currentPage = 'login';
  let isOnline = navigator.onLine;
  let offlineActions = JSON.parse(localStorage.getItem('pool_offline_actions') || '[]');
  
  // Daily challenges configuration
  const DAILY_CHALLENGES_COUNT = 5; // Number of challenges per day
  const CHALLENGE_RESET_HOUR = 0;   // Midnight (0:00)
  
  // Listen for points changes to update UI when needed
  document.addEventListener('userPointsChanged', function(event) {
    console.log('Points changed event received:', event.detail);
    
    // If we're on the profile page, refresh it to show updated XP
    if (currentUser && currentUser.uid === event.detail.userId && currentPage === 'profile') {
      console.log('Refreshing profile page to show updated XP');
      renderProfilePage();
    } else {
      // Show floating notification of XP gain
      const xpChange = event.detail.newPoints - event.detail.oldPoints;
      if (xpChange > 0) {
        const notification = document.createElement('div');
        notification.className = 'xp-notification';
        notification.textContent = `+${xpChange} XP`;
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.left = '20px';
        notification.style.background = 'rgba(0, 0, 0, 0.8)';
        notification.style.color = 'var(--accent-color)';
        notification.style.padding = '8px 12px';
        notification.style.borderRadius = 'var(--border-radius)';
        notification.style.zIndex = '9999';
        notification.style.fontWeight = 'bold';
        notification.style.animation = 'fadeInOut 3s ease-in-out';
        
        // Add animation styles if not already present
        if (!document.getElementById('xp-animation-style')) {
          const style = document.createElement('style');
          style.id = 'xp-animation-style';
          style.textContent = `
            @keyframes fadeInOut {
              0% { opacity: 0; transform: translateY(20px); }
              20% { opacity: 1; transform: translateY(0); }
              80% { opacity: 1; transform: translateY(0); }
              100% { opacity: 0; transform: translateY(-20px); }
            }
          `;
          document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        // Remove after animation
        setTimeout(() => {
          notification.remove();
        }, 3000);
      }
    }
  });
  
  // Check and update online status
  function checkOnlineStatus() {
    const wasOnline = isOnline;
    isOnline = navigator.onLine;
    
    // If we just came back online, sync offline actions
    if (!wasOnline && isOnline) {
      syncOfflineActions();
    }
    
    // Update UI based on online status
    document.body.classList.toggle('offline', !isOnline);
    
    // If offline, try to get user from localStorage
    if (!isOnline && !currentUser) {
      const savedUser = localStorage.getItem('pool_current_user');
      if (savedUser) {
        currentUser = JSON.parse(savedUser);
        renderPage();
      }
    }
    
    console.log('Online status:', isOnline);
  }
  
  // Sync actions performed while offline
  function syncOfflineActions() {
    if (offlineActions.length === 0) return;
    
    console.log('Syncing offline actions:', offlineActions);
    
    // Process each action
    const processedActions = [];
    
    offlineActions.forEach(action => {
      // Process based on action type
      if (action.type === 'challenge_complete') {
        // Update challenge in Firestore
        db.collection('users').doc(currentUser.uid)
          .collection('challenges').doc(action.challengeId)
          .update({
            completed: true,
            completedAt: FieldValue.serverTimestamp()
          })
          .then(() => {
            processedActions.push(action);
          })
          .catch(error => {
            console.error('Error syncing challenge:', error);
          });
      }
    });
    
    // Remove processed actions
    offlineActions = offlineActions.filter(action => !processedActions.includes(action));
    localStorage.setItem('pool_offline_actions', JSON.stringify(offlineActions));
  }
  
  // Authentication state observer
  try {
    auth.onAuthStateChanged(function(user) {
      console.log('Auth state changed:', user ? user.email : 'No user');
      currentUser = user;
      
      // Navigate based on auth state
      if (user) {
        // User is signed in
        if (currentPage === 'login' || currentPage === 'register') {
          currentPage = 'dashboard';
        }
      } else {
        // User is signed out
        currentPage = 'login';
      }
      
      renderPage();
    });
  } catch (e) {
    console.error("Error setting up auth state observer:", e);
    const debugPanel = document.getElementById('debug-info');
    if (debugPanel) {
      debugPanel.innerHTML += `<p class='error'>Auth error: ${e.message}</p>`;
    }
  }
  
  // Render current page
  function renderPage() {
    console.log('Rendering page:', currentPage);
    
    // Hide loading screen
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.style.display = 'none';
    }
    
    // Clear previous content
    appContainer.innerHTML = '';
    
    // Add page-specific class to container
    appContainer.className = `page-${currentPage}`;
    
    // Render based on current page
    switch(currentPage) {
      case 'login':
        renderLoginPage();
        break;
      case 'register':
        renderRegisterPage();
        break;
      case 'dashboard':
        renderDashboardPage();
        break;
      case 'challenges':
        renderChallengesPage();
        break;
      case 'profile':
        renderProfilePage();
        break;
      default:
        renderLoginPage();
    }
    
    // Update navigation if user is logged in
    if (currentUser) {
      renderNavigation();
    }
  }
  
  // PAGES
  
  // Login page
  function renderLoginPage() {
    appContainer.innerHTML = `
      <div class="auth-container">
        <h1>ShotForge</h1>
        <form id="login-form" class="auth-form">
          <div class="form-group">
            <label for="login-email">Email</label>
            <input type="email" id="login-email" name="email" required>
          </div>
          <div class="form-group">
            <label for="login-password">Password</label>
            <input type="password" id="login-password" name="password" required>
          </div>
          <div class="error-message"></div>
          <button type="submit" class="btn btn-primary">Login</button>
          
          <div class="login-divider">
            <span>Or</span>
          </div>
          
          <div class="import-login-container">
            <label for="import-backup-file" class="btn btn-secondary">Login with Backup File</label>
            <input type="file" id="import-backup-file" accept=".json" style="display: none;">
            <p class="backup-note">Restore your profile by uploading a previously exported backup file.</p>
          </div>
          
          <p style="margin-top: 1rem; text-align: center;">
            Don't have an account? <a href="#" id="register-link">Create Account</a>
          </p>
        </form>
      </div>
    `;
    
    // Add event listeners
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-link').addEventListener('click', function(e) {
      e.preventDefault();
      currentPage = 'register';
      renderPage();
    });
    
    // Add import backup functionality
    document.getElementById('import-backup-file').addEventListener('change', function(e) {
      if (e.target.files.length === 0) return;
      
      const file = e.target.files[0];
      const errorElement = document.querySelector('.error-message');
      
      // Reset error message
      errorElement.textContent = '';
      
      if (window.StorageUtils) {
        try {
          const reader = new FileReader();
          
          reader.onload = function(event) {
            try {
              // Parse the backup file
              const importedData = JSON.parse(event.target.result);
              
              if (!importedData || !importedData.email || !importedData.uid) {
                errorElement.textContent = 'Invalid backup file format';
                return;
              }
              
              // Get all users or create new storage
              const users = JSON.parse(localStorage.getItem('pool_users') || '{}');
              
              // Check if the user already exists, or create a new entry
              if (!users[importedData.uid]) {
                // Create a basic user entry to enable login
                users[importedData.uid] = {
                  email: importedData.email,
                  password: 'imported-account',  // Use a placeholder password that can be reset later
                  username: importedData.profile?.username || importedData.email.split('@')[0]
                };
                
                // Save updated users
                localStorage.setItem('pool_users', JSON.stringify(users));
              }
              
              // Save the imported data
              window.StorageUtils.saveUserData(importedData.uid, importedData);
              
              // Create user object
              const user = {
                uid: importedData.uid,
                email: importedData.email,
                displayName: importedData.profile?.username || importedData.email.split('@')[0]
              };
              
              // Store current user
              localStorage.setItem('pool_current_user', JSON.stringify(user));
              currentUser = user;
              
              // Show success message
              const message = document.createElement('div');
              message.className = 'alert alert-success';
              message.textContent = 'Backup imported successfully! Logging in...';
              message.style.position = 'fixed';
              message.style.top = '20px';
              message.style.right = '20px';
              message.style.zIndex = '9999';
              document.body.appendChild(message);
              
              // Remove the message after 5 seconds
              setTimeout(() => {
                message.style.opacity = '0';
                setTimeout(() => message.remove(), 500);
              }, 5000);
              
              // Navigate to dashboard
              setTimeout(() => {
                currentPage = 'dashboard';
                renderPage();
              }, 1500);
              
            } catch (parseError) {
              console.error("Error parsing imported data:", parseError);
              errorElement.textContent = 'Error reading backup file: ' + parseError.message;
            }
          };
          
          reader.readAsText(file);
        } catch (e) {
          console.error("Error importing user data:", e);
          errorElement.textContent = 'Error processing backup file: ' + e.message;
        }
      } else {
        errorElement.textContent = 'Backup functionality not available';
      }
    });
  }
  
  // Register page
  function renderRegisterPage() {
    appContainer.innerHTML = `
      <div class="auth-container">
        <h1>Create Account</h1>
        <form id="register-form" class="auth-form">
          <div class="form-group">
            <label for="register-username">Username</label>
            <input type="text" id="register-username" name="username" required>
          </div>
          <div class="form-group">
            <label for="register-email">Email</label>
            <input type="email" id="register-email" name="email" required>
          </div>
          <div class="form-group">
            <label for="register-password">Password</label>
            <input type="password" id="register-password" name="password" required>
          </div>
          <div class="form-group">
            <label for="register-confirm-password">Confirm Password</label>
            <input type="password" id="register-confirm-password" name="confirm-password" required>
          </div>
          <div class="error-message"></div>
          <button type="submit" class="btn btn-primary">Create Account</button>
          <p style="margin-top: 1rem; text-align: center;">
            Already have an account? <a href="#" id="login-link">Login</a>
          </p>
        </form>
      </div>
    `;
    
    // Add event listeners
    document.getElementById('register-form').addEventListener('submit', handleRegister);
    document.getElementById('login-link').addEventListener('click', function(e) {
      e.preventDefault();
      currentPage = 'login';
      renderPage();
    });
  }
  
  // Handle login form submission
  function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorElement = document.querySelector('.error-message');
    
    // Reset error message
    errorElement.textContent = '';
    
    // Disable the submit button
    const submitButton = document.querySelector('.auth-form button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Logging in...';
    }
    
    // Sign in user
    auth.signInWithEmailAndPassword(email, password)
      .then(userCredential => {
        // User signed in successfully
        console.log('User signed in:', userCredential.user);
        
        // Set current user
        currentUser = userCredential.user;
        
        // Try to load backup data
        if (window.StorageUtils) {
          const backup = window.StorageUtils.loadUserData(currentUser.uid);
          if (backup) {
            console.log("Loaded backup data from localStorage");
          }
        }
        
        // Immediately render the main app
        renderPage();
      })
      .catch(error => {
        // Error signing in
        console.error('Error signing in:', error);
        errorElement.textContent = error.message;
        
        // Re-enable the submit button
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = 'Login';
        }
      });
  }
  
  // Handle register form submission
  function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    const errorElement = document.querySelector('.error-message');
    
    // Reset error message
    errorElement.textContent = '';
    
    // Validate username
    if (!username || username.trim().length < 3) {
      errorElement.textContent = 'Username must be at least 3 characters long';
      return;
    }
    
    // Check if passwords match
    if (password !== confirmPassword) {
      errorElement.textContent = 'Passwords do not match';
      return;
    }
    
    // Disable the submit button
    const submitButton = document.querySelector('.auth-form button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Creating Account...';
    }
    
    // Create user account
    auth.createUserWithEmailAndPassword(email, password)
      .then(userCredential => {
        // User created successfully
        console.log('User created:', userCredential.user);
        
        // Store user data with username
        db.collection('users').doc(userCredential.user.uid).set({
          email: email,
          username: username,
          createdAt: new Date().toISOString(),
          points: 0
        });
        
        // Set current user
        currentUser = userCredential.user;
        
        // Initialize auto-backup
        if (window.StorageUtils) {
          window.StorageUtils.saveUserData(currentUser.uid, {
            uid: currentUser.uid,
            email: currentUser.email,
            username: username,
            profile: {
              email: email,
              username: username,
              createdAt: new Date().toISOString(),
              points: 0
            },
            completedChallenges: [],
            achievements: []
          });
        }
        
        // Immediately render the main app instead of waiting for page reload
        renderPage();
      })
      .catch(error => {
        // Error creating user
        console.error('Error creating user:', error);
        errorElement.textContent = error.message;
        
        // Re-enable the submit button
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = 'Create Account';
        }
      });
  }
  
  // Dashboard page (About Us)
  function renderDashboardPage() {
    appContainer.innerHTML = `
      <div class="dashboard-container">
        <div class="dashboard-header">
          <h1>Welcome to ShotForge</h1>
          <p class="tagline">Master your pool skills with daily challenges</p>
        </div>
        
        <div class="about-section card">
          <div class="card-header">
            <h2>About ShotForge</h2>
          </div>
          <div class="card-body">
            <p>Welcome, ${currentUser.displayName || currentUser.email}!</p>
            <p>ShotForge is a training companion designed for billiards enthusiasts of all skill levels. Whether you're a beginner looking to improve or an experienced player seeking new ways to challenge yourself, our app provides the structure you need.</p>
            
            <div class="feature-grid">
              <div class="feature-item">
                <div class="feature-icon">🎯</div>
                <h3>Skill-Based Challenges</h3>
                <p>From basic shots to advanced techniques, our challenges are designed to improve your game step by step.</p>
              </div>
              <div class="feature-item">
                <div class="feature-icon">📈</div>
                <h3>Track Your Progress</h3>
                <p>Earn XP and level up as you complete challenges, with a visual record of your improvement over time.</p>
              </div>
              <div class="feature-item">
                <div class="feature-icon">🏆</div>
                <h3>Achievement System</h3>
                <p>Unlock achievements and badges as you master different aspects of the game.</p>
              </div>
            </div>
          </div>
        </div>
        
        <div class="how-to-use card">
          <div class="card-header">
            <h2>How to Use</h2>
          </div>
          <div class="card-body">
            <ol class="instruction-list">
              <li>Visit the <a href="#" class="nav-link" data-page="challenges">Challenges</a> page to view your current challenges</li>
              <li>Practice the skills described in each challenge</li>
              <li>Mark challenges as complete once you've mastered them</li>
              <li>Earn XP and level up your profile</li>
              <li>Request new challenges to keep improving</li>
            </ol>
            
            <div class="cta-container">
              <button class="btn btn-primary" id="go-to-challenges">View Your Challenges</button>
            </div>
          </div>
        </div>
        
        <div class="tips-section card">
          <div class="card-header">
            <h2>Pool Tips & Techniques</h2>
          </div>
          <div class="card-body">
            <div class="tip-item">
              <h3>Proper Stance</h3>
              <p>A solid stance is the foundation of a good shot. Keep your feet shoulder-width apart, with your dominant foot slightly back. Bend at the waist, not the knees, and keep your back straight.</p>
            </div>
            <div class="tip-item">
              <h3>Bridge Technique</h3>
              <p>Your bridge hand should be steady and stable. For beginners, the closed bridge (where your index finger wraps around the cue) provides stability. As you advance, you might prefer an open bridge for more precision.</p>
            </div>
            <div class="tip-item">
              <h3>Aiming Basics</h3>
              <p>Aim by aligning the cue with the center of the cue ball and the target point on the object ball. Focus on the contact point, not the pocket.</p>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Add navigation event listener
    document.getElementById('go-to-challenges').addEventListener('click', function() {
      currentPage = 'challenges';
      renderPage();
    });
    
    // Add navigation for other links
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        currentPage = this.dataset.page;
        renderPage();
      });
    });
  }
  
  // Challenges page
  function renderChallengesPage() {
    // Create a content container that won't overwrite the navigation
    appContainer.innerHTML = `
      <h1 style="text-align: center;">Daily Challenges</h1>
      <div id="challenges-content">
        <div class="loading-content">
          <div class="loading-spinner"></div>
          <p>Loading challenges...</p>
        </div>
      </div>
    `;
    
    loadChallenges();
  }
  
  // Check if daily challenges should reset
  function shouldResetDailyChallenge() {
    const lastResetTimestamp = localStorage.getItem('last_challenge_reset');
    if (!lastResetTimestamp) return true;
    
    const lastReset = new Date(parseInt(lastResetTimestamp));
    const now = new Date();
    
    // Check if it's a new day since the last reset and we're past the reset hour
    return (
      lastReset.getDate() !== now.getDate() || 
      lastReset.getMonth() !== now.getMonth() || 
      lastReset.getFullYear() !== now.getFullYear()
    ) && now.getHours() >= CHALLENGE_RESET_HOUR;
  }
  
  // Get time until next challenge reset
  function getTimeUntilNextReset() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(CHALLENGE_RESET_HOUR, 0, 0, 0);
    
    // If we haven't passed the reset hour today, set to today
    if (now.getHours() < CHALLENGE_RESET_HOUR) {
      tomorrow.setDate(now.getDate());
    }
    
    const timeRemaining = tomorrow - now;
    
    // Format as hours and minutes
    const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  }
  
  // Load challenges
  function loadChallenges() {
    console.log('Loading challenges for user:', currentUser.uid);
    
    // Reference to challenges container
    const challengesContainer = document.getElementById('challenges-content');
    
    try {
      // Check if we have the window.getRandomChallenge function from challenges.js
      if (typeof window.getRandomChallenge !== 'function') {
        throw new Error('Challenge functions not available');
      }
      
      // Check if we need to reset daily challenges
      const needsReset = shouldResetDailyChallenge();
      
      // Create challenges container for the UI
      let html = '<div class="challenges-container">';
      
      // Get user metadata to check challenge status
      db.collection('users').doc(currentUser.uid).get()
        .then(userDoc => {
          const userData = userDoc.exists ? userDoc.data() : {};
          
          // Try to get user's challenges from Firestore
          return db.collection('users').doc(currentUser.uid)
            .collection('challenges').get()
            .then(snapshot => {
              console.log('Challenges snapshot received:', snapshot);
              
              // If user has no challenges yet, create some initial ones
              if (!snapshot || !snapshot.docs || snapshot.empty) {
                console.log('No existing challenges found, creating daily challenges');
                return createDailyChallenges();
              }
              
              // If we need to reset challenges (it's a new day after reset time)
              if (needsReset) {
                console.log('Resetting daily challenges');
                
                // Archive completed challenges
                const archivePromises = [];
                snapshot.forEach(doc => {
                  const challenge = doc.data();
                  // Only archive if it's a daily challenge (has the daily flag)
                  if (challenge.daily && !challenge.archived) {
                    archivePromises.push(
                      db.collection('users').doc(currentUser.uid)
                        .collection('challenges').doc(doc.id)
                        .update({ archived: true })
                    );
                  }
                });
                
                // After archiving, create new daily challenges
                return Promise.all(archivePromises).then(() => {
                  // Update the last reset timestamp
                  localStorage.setItem('last_challenge_reset', Date.now());
                  // Reset extra challenges counter
                  localStorage.setItem('extra_challenges_today', '0');
                  return createDailyChallenges();
                });
              }
              
              // Filter out archived challenges and return active ones
              const activeDaily = [];
              const completedDaily = [];
              
              snapshot.forEach(doc => {
                const challenge = doc.data();
                challenge.id = doc.id;
                
                if (challenge.daily && !challenge.archived) {
                  if (challenge.completed) {
                    completedDaily.push(challenge);
                  } else {
                    activeDaily.push(challenge);
                  }
                }
              });
              
              // If we don't have enough active daily challenges, create more
              if (activeDaily.length + completedDaily.length < DAILY_CHALLENGES_COUNT) {
                const neededChallenges = DAILY_CHALLENGES_COUNT - (activeDaily.length + completedDaily.length);
                console.log(`Creating ${neededChallenges} more daily challenges`);
                
                const createPromises = [];
                for (let i = 0; i < neededChallenges; i++) {
                  createPromises.push(createDailyChallenge());
                }
                
                return Promise.all(createPromises).then(newChallenges => {
                  return [...activeDaily, ...completedDaily, ...newChallenges];
                });
              }
              
              return [...activeDaily, ...completedDaily];
            });
        })
        .then(challenges => {
          // Add timer for next reset
          html += `
            <div class="reset-timer card">
              <div class="card-header">
                <h3>Daily Challenge Reset</h3>
              </div>
              <div class="card-body">
                <p>New challenges in: <span id="next-reset-time">${getTimeUntilNextReset()}</span></p>
                <div class="progress-container">
                  <div class="progress-bar" id="reset-progress-bar" style="width: ${calculateResetProgress()}%"></div>
                </div>
                <div style="text-align: center; margin-top: 1rem;">
                  <button id="new-challenge-btn" class="btn btn-primary" style="width: auto;">Get New Challenge</button>
                  <p style="margin-top: 0.5rem; font-size: 0.8rem; color: #aaa;">
                    <span id="extra-challenges-count">0</span>/5 extra challenges used today
                  </p>
                </div>
              </div>
            </div>
          `;
          
          // Display challenges
          challenges.forEach(challenge => {
            html += createChallengeCard(challenge, challenge.completed);
          });
          
          html += '</div>';
          
          // Update the UI
          if (challengesContainer) {
            challengesContainer.innerHTML = html;
            
            // Add event listeners
            document.querySelectorAll('.complete-challenge-btn').forEach(button => {
              button.addEventListener('click', function() {
                const challengeId = this.dataset.id;
                completeChallenge(challengeId);
              });
            });
            
            // Add event listener for new challenge button
            const newChallengeBtn = document.getElementById('new-challenge-btn');
            if (newChallengeBtn) {
              newChallengeBtn.addEventListener('click', addNewChallenge);
              
              // Update extra challenges count
              updateExtraChallengesCount();
            }
            
            // Start timer update
            updateResetTimer();
            setInterval(updateResetTimer, 60000); // Update every minute
          }
        })
        .catch(error => {
          console.error('Error loading challenges:', error);
          
          if (challengesContainer) {
            challengesContainer.innerHTML = `
              <div class="alert alert-danger">
                ${error.message}. Please try refreshing the page or contact support.
              </div>
            `;
          }
        });
    } catch (error) {
      console.error('Challenge loading error:', error);
      if (challengesContainer) {
        challengesContainer.innerHTML = `
          <div class="alert alert-danger">
            ${error.message}. Please try refreshing the page or contact support.
          </div>
        `;
      }
    }
  }
  
  // Calculate progress percentage until next reset
  function calculateResetProgress() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(CHALLENGE_RESET_HOUR, 0, 0, 0);
    
    // If we haven't passed the reset hour today, set to today
    if (now.getHours() < CHALLENGE_RESET_HOUR) {
      tomorrow.setDate(now.getDate());
    }
    
    const midnight = new Date(now);
    midnight.setHours(0, 0, 0, 0);
    
    const totalSeconds = (tomorrow - midnight) / 1000;
    const elapsedSeconds = (now - midnight) / 1000;
    
    return Math.min(100, Math.max(0, (elapsedSeconds / totalSeconds) * 100));
  }
  
  // Update the reset timer display
  function updateResetTimer() {
    const timeElement = document.getElementById('next-reset-time');
    const progressBar = document.getElementById('reset-progress-bar');
    
    if (timeElement) {
      timeElement.textContent = getTimeUntilNextReset();
    }
    
    if (progressBar) {
      progressBar.style.width = `${calculateResetProgress()}%`;
    }
  }
  
  // Create daily challenges
  function createDailyChallenges() {
    const challenges = [];
    const createPromises = [];
    
    for (let i = 0; i < DAILY_CHALLENGES_COUNT; i++) {
      createPromises.push(createDailyChallenge());
    }
    
    // Update the last reset timestamp
    localStorage.setItem('last_challenge_reset', Date.now());
    
    return Promise.all(createPromises);
  }
  
  // Create a new daily challenge
  function createDailyChallenge() {
    // Get a random challenge from our templates
    const challenge = window.getRandomChallenge();
    
    // Add unique ID and daily challenge properties
    challenge.id = 'challenge_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    challenge.completed = false;
    challenge.daily = true;
    challenge.archived = false;
    challenge.createdAt = new Date().toISOString();
    
    // Save to Firestore
    return db.collection('users').doc(currentUser.uid)
      .collection('challenges').doc(challenge.id).set(challenge)
      .then(() => {
        console.log('New daily challenge created:', challenge.title);
        return challenge;
      })
      .catch(error => {
        console.error('Error creating daily challenge:', error);
        throw error;
      });
  }
  
  // Create a new challenge (non-daily)
  function createNewChallenge() {
    // Get a random challenge from our templates
    const challenge = window.getRandomChallenge();
    
    // Add unique ID and completion status
    challenge.id = 'challenge_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    challenge.completed = false;
    challenge.daily = false;
    challenge.createdAt = new Date().toISOString();
    
    // Save to Firestore
    db.collection('users').doc(currentUser.uid)
      .collection('challenges').doc(challenge.id).set(challenge)
      .catch(error => {
        console.error('Error creating challenge:', error);
      });
    
    return challenge;
  }
  
  // Add a new challenge
  function addNewChallenge() {
    // Get current extra challenges count
    const extraChallenges = parseInt(localStorage.getItem('extra_challenges_today') || '0');
    
    // Check if we've reached the daily limit
    if (extraChallenges >= 5) {
      // Show message about daily limit
      const message = document.createElement('div');
      message.className = 'alert alert-warning';
      message.textContent = `You've reached your daily limit of 5 extra challenges. Come back tomorrow for new challenges!`;
      message.style.position = 'fixed';
      message.style.top = '20px';
      message.style.right = '20px';
      message.style.zIndex = '9999';
      document.body.appendChild(message);
      
      // Remove the message after 5 seconds
      setTimeout(() => {
        message.style.opacity = '0';
        setTimeout(() => message.remove(), 500);
      }, 5000);
      
      return;
    }
    
    // Disable the button to prevent multiple clicks
    const newChallengeBtn = document.getElementById('new-challenge-btn');
    if (newChallengeBtn) {
      newChallengeBtn.disabled = true;
      newChallengeBtn.textContent = 'Creating...';
    }
    
    // Get existing challenge titles to avoid duplicates
    db.collection('users').doc(currentUser.uid)
      .collection('challenges')
      .where('daily', '==', true)
      .where('archived', '==', false)
      .get()
      .then(snapshot => {
        const existingTitles = new Set();
        snapshot.forEach(doc => {
          const challenge = doc.data();
          existingTitles.add(challenge.title);
        });
        
        // Create a new daily challenge (non-duplicate)
        createNonDuplicateChallenge(existingTitles)
          .then(challenge => {
            console.log('New challenge created:', challenge.title);
            
            // Increment extra challenges count
            const newCount = extraChallenges + 1;
            localStorage.setItem('extra_challenges_today', newCount.toString());
            updateExtraChallengesCount();
            
            // Create HTML for the new challenge
            const challengeHtml = createChallengeCard(challenge, false);
            
            // Add it to the beginning of the list
            const container = document.querySelector('.challenges-container');
            if (container) {
              const tempDiv = document.createElement('div');
              tempDiv.innerHTML = challengeHtml;
              
              // Insert after the reset timer
              const resetTimer = container.querySelector('.reset-timer');
              if (resetTimer && resetTimer.nextSibling) {
                container.insertBefore(tempDiv.firstChild, resetTimer.nextSibling);
              } else {
                container.insertBefore(tempDiv.firstChild, container.firstChild);
              }
              
              // Add event listener to the new challenge
              const newButton = document.querySelector(`.complete-challenge-btn[data-id="${challenge.id}"]`);
              if (newButton) {
                newButton.addEventListener('click', function() {
                  completeChallenge(challenge.id);
                });
              }
              
              // Show success message
              const message = document.createElement('div');
              message.className = 'alert alert-success challenge-added';
              message.textContent = `New challenge added: ${challenge.title}`;
              message.style.position = 'fixed';
              message.style.top = '20px';
              message.style.right = '20px';
              message.style.zIndex = '9999';
              document.body.appendChild(message);
              
              // Remove the message after 5 seconds
              setTimeout(() => {
                message.style.opacity = '0';
                setTimeout(() => message.remove(), 500);
              }, 5000);
            }
            
            // Re-enable the button
            if (newChallengeBtn) {
              newChallengeBtn.disabled = false;
              newChallengeBtn.textContent = 'Get New Challenge';
            }
          })
          .catch(error => {
            console.error('Error creating challenge:', error);
            
            // Show error message
            if (newChallengeBtn) {
              newChallengeBtn.disabled = false;
              newChallengeBtn.textContent = 'Get New Challenge';
            }
            
            // Display error notification
            const message = document.createElement('div');
            message.className = 'alert alert-danger';
            message.textContent = `Error creating challenge: ${error.message}`;
            message.style.position = 'fixed';
            message.style.top = '20px';
            message.style.right = '20px';
            message.style.zIndex = '9999';
            document.body.appendChild(message);
            
            // Remove the message after 5 seconds
            setTimeout(() => {
              message.style.opacity = '0';
              setTimeout(() => message.remove(), 500);
            }, 5000);
          });
      });
  }
  
  // Create a non-duplicate challenge
  function createNonDuplicateChallenge(existingTitles) {
    // Try to get a challenge that doesn't exist yet
    let challenge = window.getRandomChallenge();
    let attempts = 0;
    const maxAttempts = 10;
    
    while (existingTitles.has(challenge.title) && attempts < maxAttempts) {
      challenge = window.getRandomChallenge();
      attempts++;
    }
    
    // If we couldn't find a unique one after maxAttempts, make it unique by adding a number
    if (existingTitles.has(challenge.title)) {
      const baseTitle = challenge.title;
      let counter = 1;
      while (existingTitles.has(`${baseTitle} (${counter})`)) {
        counter++;
      }
      challenge.title = `${baseTitle} (${counter})`;
    }
    
    // Add unique ID and daily challenge properties
    challenge.id = 'challenge_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    challenge.completed = false;
    challenge.daily = true;
    challenge.archived = false;
    challenge.createdAt = new Date().toISOString();
    
    // Save to Firestore
    return db.collection('users').doc(currentUser.uid)
      .collection('challenges').doc(challenge.id).set(challenge)
      .then(() => {
        console.log('New daily challenge created:', challenge.title);
        return challenge;
      })
      .catch(error => {
        console.error('Error creating daily challenge:', error);
        throw error;
      });
  }
  
  // Update the extra challenges count display
  function updateExtraChallengesCount() {
    const countElement = document.getElementById('extra-challenges-count');
    if (countElement) {
      const extraChallenges = parseInt(localStorage.getItem('extra_challenges_today') || '0');
      countElement.textContent = extraChallenges;
      
      // Disable button if max extra challenges reached
      const newChallengeBtn = document.getElementById('new-challenge-btn');
      if (newChallengeBtn) {
        if (extraChallenges >= 5) {
          newChallengeBtn.disabled = true;
          newChallengeBtn.textContent = 'Daily Limit Reached';
        } else {
          newChallengeBtn.disabled = false;
          newChallengeBtn.textContent = 'Get New Challenge';
        }
      }
    }
  }
  
  // Create HTML for a challenge card
  function createChallengeCard(challenge, completed) {
    const isDailyLabel = challenge.daily ? 
      `<span class="challenge-type daily-challenge">Daily</span>` : '';
    
    return `
      <div class="card challenge-card" id="challenge-${challenge.id}">
        <div class="card-header">
          <h3>${challenge.title} ${completed ? '(Completed)' : ''}</h3>
          ${isDailyLabel}
        </div>
        <div class="card-body">
          <p class="challenge-description">${challenge.description}</p>
          <div class="challenge-meta">
            <span class="challenge-difficulty difficulty-${challenge.difficulty.toLowerCase()}">${challenge.difficulty}</span>
            <span class="challenge-xp">${challenge.xp} XP</span>
          </div>
          ${completed ? 
            '<button class="btn btn-secondary" disabled>Completed</button>' : 
            `<button class="btn btn-primary complete-challenge-btn" data-id="${challenge.id}">Mark as Completed</button>`
          }
        </div>
      </div>
    `;
  }
  
  // Profile page
  function renderProfilePage() {
    // Create a content container that won't overwrite the navigation
    appContainer.innerHTML = `
      <h1>Profile</h1>
      <div id="profile-content">
        <div class="loading-content">
          <div class="loading-spinner"></div>
          <p>Loading profile data...</p>
        </div>
      </div>
    `;
    
    // Get user data from Firestore
    db.collection('users').doc(currentUser.uid)
      .get()
      .then(doc => {
        const userData = doc.exists ? doc.data() : { points: 0, username: currentUser.email.split('@')[0] };
        const level = window.calculateLevel ? window.calculateLevel(userData.points || 0) : 1;
        const progress = window.calculateLevelProgress ? window.calculateLevelProgress(userData.points || 0, level) : 0;
        const nextLevelXP = window.calculateNextLevelXP ? window.calculateNextLevelXP(level) : level * 200;
        
        // Get daily challenge stats and achievements
        return Promise.all([
          // Get completed challenges today
          db.collection('users').doc(currentUser.uid)
            .collection('challenges')
            .where('daily', '==', true)
            .where('completed', '==', true)
            .where('archived', '==', false)
            .get(),
          
          // Get total completed challenges
          db.collection('users').doc(currentUser.uid)
            .collection('challenges')
            .where('completed', '==', true)
            .get(),
          
          // Get user achievements
          db.collection('users').doc(currentUser.uid)
            .collection('achievements')
            .get()
        ]).then(([todayChallenges, allCompleted, achievementsSnapshot]) => {
          // Format achievements data
          const achievements = [];
          achievementsSnapshot.forEach(doc => {
            achievements.push(doc.data());
          });
          
          // Get all user data for backup
          const allUserData = {
            uid: currentUser.uid,
            profile: userData,
            email: currentUser.email,
            completedChallenges: [],
            achievements: achievements,
            lastBackup: new Date().toISOString()
          };
          
          // Add challenge data
          if (allCompleted && allCompleted.forEach) {
            // If it's a Firestore collection (has forEach method)
            allCompleted.forEach(doc => {
              allUserData.completedChallenges.push(doc.data());
            });
          } else if (allCompleted && allCompleted.docs) {
            // If it's a Firestore QuerySnapshot (has docs array)
            allCompleted.docs.forEach(doc => {
              allUserData.completedChallenges.push(doc.data());
            });
          } else if (allCompleted && Array.isArray(allCompleted)) {
            // If it's a regular array
            allCompleted.forEach(challenge => {
              allUserData.completedChallenges.push(challenge);
            });
          } else if (allCompleted && typeof allCompleted === 'object') {
            // If it's a plain object (from localStorage)
            if (allCompleted.size !== undefined) {
              // It's likely a Firestore-like object with size property
              const completedChallengesSize = allCompleted.size || 0;
              // Use an empty array since we can't access the actual data
              allUserData.completedChallenges = [];
            } else {
              // Just use whatever we have
              allUserData.completedChallenges = Object.values(allCompleted);
            }
          }
          
          // Backup data automatically every 10 minutes
          if (window.StorageUtils) {
            window.StorageUtils.saveUserData(currentUser.uid, allUserData);
            
            // Setup auto-backup if not already done
            if (!window.autoBackupInterval) {
              window.autoBackupInterval = window.StorageUtils.setupAutoBackup(
                currentUser.uid, 
                () => allUserData, 
                600000 // 10 minutes
              );
            }
          }
          
          // Update only the content container, not the whole appContainer
          const profileContent = document.getElementById('profile-content');
          if (profileContent) {
            profileContent.innerHTML = `
              <div class="profile-container">
                <div class="profile-card card">
                  <div class="card-header">
                    <h2>${userData.username || userData.email.split('@')[0] || 'Pool Player'}</h2>
                  </div>
                  <div class="card-body">
                    <div class="profile-stats">
                      <div class="level-info">
                        <div class="level-badge">Level ${level}</div>
                        <div class="xp-info">
                          <span class="xp-text">${window.formatXP ? window.formatXP(userData.points || 0) : (userData.points || 0)} XP</span>
                          <span class="next-level">Next: ${window.formatXP ? window.formatXP(nextLevelXP) : nextLevelXP} XP</span>
                        </div>
                        <div class="progress-container">
                          <div class="progress-bar" style="width: ${progress}%"></div>
                        </div>
                      </div>
                      
                      <div class="stats-grid">
                        <div class="stat-item">
                          <div class="stat-value">${Math.min(getCollectionSize(todayChallenges), DAILY_CHALLENGES_COUNT)} / ${DAILY_CHALLENGES_COUNT}</div>
                          <div class="stat-label">Today's Challenges</div>
                        </div>
                        <div class="stat-item">
                          <div class="stat-value">${getCollectionSize(allCompleted)}</div>
                          <div class="stat-label">Total Completed</div>
                        </div>
                        <div class="stat-item">
                          <div class="stat-value">${Array.isArray(achievements) ? achievements.length : 0}</div>
                          <div class="stat-label">Achievements</div>
                        </div>
                      </div>
                    </div>
                    
                    <div class="logout-container">
                      <button id="logout-btn" class="btn btn-danger">Log Out</button>
                    </div>
                  </div>
                </div>
                
                <div class="achievements-section card">
                  <div class="card-header">
                    <h3>Achievements</h3>
                  </div>
                  <div class="card-body">
                    <div class="achievements-filter">
                      <button class="filter-button active" data-filter="all">All</button>
                      <button class="filter-button" data-filter="earned">Earned</button>
                      <button class="filter-button" data-filter="locked">Locked</button>
                      <button class="filter-button" data-filter="beginner">Beginner</button>
                      <button class="filter-button" data-filter="challenges">Challenges</button>
                      <button class="filter-button" data-filter="progress">Progress</button>
                      <button class="filter-button" data-filter="specialty">Specialty</button>
                    </div>
                    <div class="achievements-grid">
                      ${renderAchievements(achievements)}
                    </div>
                  </div>
                </div>
                
                <div class="backup-info card">
                  <div class="card-header">
                    <h3>Data Backup Options</h3>
                  </div>
                  <div class="card-body">
                    <p><strong>Your data is stored locally in this browser!</strong> If you clear your browser data or use a different device, you might lose your progress.</p>
                    
                    <div class="backup-actions">
                      <h4>Backup/Restore Options:</h4>
                      <div class="backup-buttons">
                        <button id="export-data-btn" class="btn btn-primary">Export Data Backup</button>
                        <div class="import-container">
                          <label for="import-file" class="btn btn-secondary">Import Data Backup</label>
                          <input type="file" id="import-file" accept=".json" style="display: none;">
                        </div>
                      </div>
                      <p class="backup-note">Export creates a file with all your achievements, challenges, and progress.</p>
                      <p class="backup-note">Keep this file safe! You can use it to restore your data if needed.</p>
                    </div>
                    
                    <div class="auto-backup-info">
                      <h4>Auto-Backup Status:</h4>
                      <p>Your data is automatically saved to this browser's local storage every 10 minutes.</p>
                      <p class="last-backup">Last auto-save: <span id="last-sync-time">${new Date().toLocaleString()}</span></p>
                    </div>
                  </div>
                </div>
                
                <div class="completed-challenges-section">
                  <h3>Completed Challenges</h3>
                  ${renderCompletedChallenges(allCompleted)}
                </div>
              </div>
            `;
            
            // Add logout functionality
            document.getElementById('logout-btn').addEventListener('click', function() {
              auth.signOut().then(() => {
                console.log('User signed out');
                currentUser = null;
                
                // Clear any auto-backup intervals
                if (window.autoBackupInterval) {
                  clearInterval(window.autoBackupInterval);
                  window.autoBackupInterval = null;
                }
                
                // Render login page immediately
                renderLoginPage();
              }).catch(error => {
                console.error('Sign out error:', error);
              });
            });
            
            // Add export functionality
            document.getElementById('export-data-btn').addEventListener('click', function() {
              if (window.StorageUtils) {
                window.StorageUtils.exportUserData(currentUser.uid, allUserData);
              } else {
                console.error("StorageUtils not available");
              }
            });
            
            // Add import functionality
            document.getElementById('import-file').addEventListener('change', function(e) {
              if (e.target.files.length === 0) return;
              
              const file = e.target.files[0];
              if (window.StorageUtils) {
                window.StorageUtils.importUserData(currentUser.uid, file, function(importedData) {
                  // Show success message
                  const message = document.createElement('div');
                  message.className = 'alert alert-success';
                  message.textContent = 'Data imported successfully! Refreshing...';
                  message.style.position = 'fixed';
                  message.style.top = '20px';
                  message.style.right = '20px';
                  message.style.zIndex = '9999';
                  document.body.appendChild(message);
                  
                  // Remove the message after 5 seconds
                  setTimeout(() => {
                    message.style.opacity = '0';
                    setTimeout(() => message.remove(), 500);
                  }, 5000);
                  
                  // Reload page after 2 seconds
                  setTimeout(() => {
                    renderProfilePage();
                  }, 2000);
                });
              } else {
                console.error("StorageUtils not available");
              }
            });
            
            // Add achievement filter functionality
            const filterButtons = document.querySelectorAll('.filter-button');
            filterButtons.forEach(button => {
              button.addEventListener('click', function() {
                // Remove active class from all buttons
                filterButtons.forEach(btn => btn.classList.remove('active'));
                // Add active class to clicked button
                this.classList.add('active');
                
                // Filter achievements
                const filter = this.dataset.filter;
                filterAchievements(filter, achievements);
              });
            });
            
            // Update the last sync time periodically to show data is backed up
            setInterval(() => {
              const syncElement = document.getElementById('last-sync-time');
              if (syncElement) {
                syncElement.textContent = new Date().toLocaleString();
              }
            }, 60000); // Update every minute
          }
        });
      })
      .catch(error => {
        console.error('Error loading profile:', error);
        const profileContent = document.getElementById('profile-content');
        if (profileContent) {
          profileContent.innerHTML = `
            <div class="alert alert-danger">
              Error loading profile: ${error.message}
            </div>
            <div class="logout-container">
              <button id="logout-btn" class="btn btn-danger">Log Out</button>
            </div>
          `;
          
          // Add logout functionality even in error state
          document.getElementById('logout-btn').addEventListener('click', function() {
            auth.signOut();
            currentUser = null;
            renderLoginPage();
          });
        }
      });
  }
  
  // Render user achievements
  function renderAchievements(userAchievements) {
    // Get user's earned achievement IDs
    const earnedIds = new Set(userAchievements.map(a => a.id));
    
    // Get all potential achievements from templates
    const allAchievements = window.achievementTemplates || [];
    
    // Combine earned and unearned
    return allAchievements.map(achievement => {
      const isEarned = earnedIds.has(achievement.id);
      const earnedData = isEarned ? userAchievements.find(a => a.id === achievement.id) : null;
      
      return `
        <div class="achievement-item ${isEarned ? 'earned' : 'locked-achievement'}" 
             data-id="${achievement.id}" 
             data-earned="${isEarned}" 
             data-category="${achievement.category.toLowerCase()}">
          <div class="achievement-icon">${achievement.icon}</div>
          <div class="achievement-name">${achievement.name}</div>
          <div class="achievement-desc">${achievement.description}</div>
          <div class="achievement-rarity rarity-${achievement.rarity.toLowerCase()}">${achievement.rarity}</div>
          ${isEarned ? `<div class="achievement-date">Earned: ${window.formatDate ? window.formatDate(earnedData.earnedAt) : new Date(earnedData.earnedAt).toLocaleDateString()}</div>` : ''}
        </div>
      `;
    }).join('');
  }
  
  // Filter achievements display
  function filterAchievements(filter, userAchievements) {
    const items = document.querySelectorAll('.achievement-item');
    
    items.forEach(item => {
      const isEarned = item.dataset.earned === 'true';
      const category = item.dataset.category;
      
      // Show/hide based on filter
      if (filter === 'all' || 
          (filter === 'earned' && isEarned) ||
          (filter === 'locked' && !isEarned) ||
          (filter === category)) {
        item.style.display = 'block';
      } else {
        item.style.display = 'none';
      }
    });
  }
  
  // Complete a challenge
  function completeChallenge(challengeId) {
    console.log('Completing challenge:', challengeId);
    
    // Show loading feedback
    const button = document.querySelector(`.complete-challenge-btn[data-id="${challengeId}"]`);
    if (button) {
      button.disabled = true;
      button.textContent = 'Completing...';
    }
    
    // Get the challenge data
    db.collection('users').doc(currentUser.uid)
      .collection('challenges').doc(challengeId).get()
      .then(doc => {
        if (!doc.exists) {
          throw new Error('Challenge not found');
        }
        
        const challenge = doc.data();
        
        // Mark as completed
        return db.collection('users').doc(currentUser.uid)
          .collection('challenges').doc(challengeId)
          .update({
            completed: true,
            completedAt: new Date().toISOString()
          })
          .then(() => {
            // Update user XP/points
            return db.collection('users').doc(currentUser.uid).get();
          })
          .then(userDoc => {
            if (userDoc.exists) {
              const userData = userDoc.data();
              const currentPoints = userData.points || 0;
              const newPoints = currentPoints + challenge.xp;
              
              console.log(`Updating user points: ${currentPoints} + ${challenge.xp} = ${newPoints}`);
              
              return db.collection('users').doc(currentUser.uid).update({
                points: newPoints
              });
            }
          })
          .then(() => {
            // Update challenge stats and check for achievements
            if (window.updateChallengeStats) {
              return window.updateChallengeStats(challenge, db, currentUser)
                .then(() => db.collection('users').doc(currentUser.uid).get())
                .then(userDoc => {
                  if (userDoc.exists && window.checkAchievements) {
                    return window.checkAchievements(userDoc.data(), db, currentUser);
                  }
                  return [];
                })
                .then(newAchievements => {
                  // Show achievement notifications if any
                  if (newAchievements.length > 0 && window.showAchievementNotification) {
                    // Show notifications with a slight delay between each
                    newAchievements.forEach((achievement, index) => {
                      setTimeout(() => {
                        window.showAchievementNotification(achievement);
                      }, index * 3000); // 3 second delay between notifications
                    });
                  }
                });
            }
          })
          .then(() => {
            // Update UI
            const challengeCard = document.getElementById(`challenge-${challengeId}`);
            if (challengeCard) {
              // Update header
              const header = challengeCard.querySelector('.card-header h3');
              if (header) {
                header.textContent = `${challenge.title} (Completed)`;
              }
              
              // Replace button
              const buttonContainer = challengeCard.querySelector('.card-body');
              const button = challengeCard.querySelector('.complete-challenge-btn');
              if (button && buttonContainer) {
                button.replaceWith(document.createElement('button'));
                const newButton = buttonContainer.querySelector('button');
                newButton.className = 'btn btn-secondary';
                newButton.disabled = true;
                newButton.textContent = 'Completed';
              }
            }
            
            // Show success message with XP and option to view profile
            const message = document.createElement('div');
            message.className = 'alert alert-success challenge-completed';
            message.innerHTML = `
              <div>Challenge completed! You earned ${challenge.xp} XP!</div>
              <button id="view-progress-btn" class="btn btn-primary btn-sm" style="margin-top: 8px;">View Progress</button>
            `;
            message.style.position = 'fixed';
            message.style.top = '20px';
            message.style.right = '20px';
            message.style.zIndex = '9999';
            document.body.appendChild(message);
            
            // Add event listener to view profile button
            const viewProgressBtn = message.querySelector('#view-progress-btn');
            if (viewProgressBtn) {
              viewProgressBtn.addEventListener('click', function() {
                currentPage = 'profile';
                renderPage();
                message.remove();
              });
            }
            
            // Remove the message after 5 seconds
            setTimeout(() => {
              message.style.opacity = '0';
              setTimeout(() => message.remove(), 500);
            }, 5000);
          });
      })
      .catch(error => {
        console.error('Error completing challenge:', error);
        
        // Reset button state
        if (button) {
          button.disabled = false;
          button.textContent = 'Mark as Completed';
        }
        
        // Show error message
        const message = document.createElement('div');
        message.className = 'alert alert-danger';
        message.textContent = `Error completing challenge: ${error.message}`;
        message.style.position = 'fixed';
        message.style.top = '20px';
        message.style.right = '20px';
        message.style.zIndex = '9999';
        document.body.appendChild(message);
        
        // Remove the message after 5 seconds
        setTimeout(() => {
          message.style.opacity = '0';
          setTimeout(() => message.remove(), 500);
        }, 5000);
      });
  }
  
  // Navigation component
  function renderNavigation() {
    const navHtml = `
      <nav class="app-nav">
        <ul>
          <li><a href="#" data-page="dashboard" class="${currentPage === 'dashboard' ? 'active' : ''}">Dashboard</a></li>
          <li><a href="#" data-page="challenges" class="${currentPage === 'challenges' ? 'active' : ''}">Challenges</a></li>
          <li><a href="#" data-page="profile" class="${currentPage === 'profile' ? 'active' : ''}">Profile</a></li>
        </ul>
      </nav>
    `;
    
    appContainer.insertAdjacentHTML('afterbegin', navHtml);
    
    // Add navigation event listeners
    const navLinks = appContainer.querySelectorAll('.app-nav a');
    navLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        currentPage = this.dataset.page;
        renderPage();
      });
    });
  }
  
  // Helper to render completed challenges with proper type checks
  function renderCompletedChallenges(allCompleted) {
    // If we have no completed challenges
    if (!allCompleted || 
        (allCompleted.size !== undefined && allCompleted.size === 0) || 
        (Array.isArray(allCompleted) && allCompleted.length === 0) ||
        (allCompleted.docs && allCompleted.docs.length === 0)) {
      return '<p class="no-challenges">No challenges completed yet. Visit the Challenges page to get started!</p>';
    }
    
    let challengeItems = '';
    
    // Handle different data structures
    if (allCompleted.docs) {
      // It's a Firestore QuerySnapshot
      challengeItems = Array.from(allCompleted.docs).slice(0, 6).map(doc => {
        const challenge = doc.data();
        return createCompletedChallengeItem(challenge);
      }).join('');
    } else if (Array.isArray(allCompleted)) {
      // It's a regular array
      challengeItems = allCompleted.slice(0, 6).map(challenge => {
        return createCompletedChallengeItem(challenge);
      }).join('');
    } else if (typeof allCompleted === 'object') {
      // It's an object
      const challenges = Object.values(allCompleted);
      challengeItems = challenges.slice(0, 6).map(challenge => {
        return createCompletedChallengeItem(challenge);
      }).join('');
    }
    
    return '<div class="completed-challenges-container">' + challengeItems + '</div>';
  }
  
  // Create HTML for a completed challenge item
  function createCompletedChallengeItem(challenge) {
    return `
      <div class="card challenge-card mini ${challenge.daily ? 'daily-card' : ''}">
        <div class="card-header">
          <h4>${challenge.title || 'Challenge'}</h4>
          ${challenge.daily ? '<span class="challenge-type daily-challenge">Daily</span>' : ''}
        </div>
        <div class="card-body">
          <div class="challenge-meta">
            <span class="challenge-difficulty difficulty-${(challenge.difficulty || 'medium').toLowerCase()}">${challenge.difficulty || 'Medium'}</span>
            <span class="challenge-xp">${challenge.xp || 100} XP</span>
          </div>
          <p class="completion-date">Completed: ${window.formatDate ? window.formatDate(challenge.completedAt) : new Date(challenge.completedAt || Date.now()).toLocaleDateString()}</p>
        </div>
      </div>
    `;
  }
  
  // Helper function to get the size of a collection, handling different data structures
  function getCollectionSize(collection) {
    if (!collection) return 0;
    
    if (collection.size !== undefined) {
      // It's likely a Firestore QuerySnapshot
      return collection.size;
    } else if (collection.docs) {
      // It has a docs property
      return collection.docs.length;
    } else if (Array.isArray(collection)) {
      // It's an array
      return collection.length;
    } else if (typeof collection === 'object') {
      // It's an object
      return Object.keys(collection).length;
    }
    
    return 0;
  }
  
  // Initial checks
  checkOnlineStatus();
  
  // Add event listeners for online/offline events
  window.addEventListener('online', checkOnlineStatus);
  window.addEventListener('offline', checkOnlineStatus);
}

console.log("app.js completed loading"); 