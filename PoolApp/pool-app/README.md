# ShotForge App

A fully frontend web application for pool players to get daily challenges, earn XP, and track progress. All data is stored in your browser's local storage.

## Features

- **User Authentication**: Create an account and login (all local)
- **Daily Challenges**: Receive a new random challenge every day
- **XP & Leveling System**: Earn XP by completing challenges and level up
- **Challenge History**: View your completed challenges
- **User Profile**: Track your stats and progress
- **Responsive Design**: Works on mobile and desktop devices
- **Offline Support**: Works entirely offline using local storage

## No Server Required

This application is designed to work entirely in the browser without any backend server:
- All user data is stored in your browser's local storage
- No Firebase or other server requirements
- No costs or usage fees
- No internet connection required after initial load

## Getting Started

1. **Download/Clone the Repository**:
   ```
   git clone <repository-url>
   cd pool-app
   ```

2. **Open the Application**:
   - Simply open the `index.html` file in your browser
   - Or serve it using any simple HTTP server:
     ```
     npx serve ./
     ```

## Local Storage Notice

- All data is stored in your browser's local storage
- Clearing browser data or using private browsing will delete your progress
- Data is not synchronized between different browsers or devices
- For the best experience, use the same browser on the same device

## Project Structure

- `index.html` - Main HTML file
- `src/` - Source code directory
  - `app.js` - Main application code
  - `styles.css` - Global styles
  - `firebase-config.js` - Local storage implementation (no actual Firebase used)
  - `utils/` - Utility functions
    - `challenges.js` - Challenge templates and generation
    - `user.js` - User-related utility functions
    - `storage.js` - Local storage utilities for offline support

## Customization

- **Challenge Templates**: Modify `src/utils/challenges.js` to add or change challenges
- **XP System**: Adjust the XP formulas in `src/utils/user.js`
- **UI Styling**: Modify `src/styles.css` to change the look and feel

## License

MIT

## Support

For any questions or issues, please create an issue in the GitHub repository or contact the developer. 