# Offline Testing Guide

This document provides instructions on how to test the offline capabilities of the ShotForge App.

## Prerequisites

1. Set up the app with Firebase as described in the README.md
2. Create an account and log in at least once while online

## Testing Steps

### 1. Basic Offline Testing

1. **Log in** to the app while you have an internet connection
2. **Open your browser's developer tools**:
   - Chrome: Press F12 or right-click and select "Inspect"
   - Firefox: Press F12 or right-click and select "Inspect Element"
3. **Switch to offline mode**:
   - Chrome: Go to the "Network" tab and check "Offline"
   - Firefox: Go to the "Network" tab and check "Work Offline"
4. **Refresh the page**
   - The app should still load
   - You should see a notification indicating you're in offline mode
   - Your user data should still appear
   - The daily challenge should be available

### 2. Testing Offline Challenge Completion

1. While offline, **complete a daily challenge** by clicking "Mark as Completed"
2. Verify that:
   - The challenge is marked as completed
   - Your XP increases
   - If applicable, your level increases
3. **Refresh the page**
   - Your completed status and XP/level should persist

### 3. Testing Synchronization

1. After completing actions offline, **switch back to online mode** in your browser
2. **Refresh the page**
3. The app should:
   - Reconnect to Firebase
   - Display a notification that you're back online
   - Automatically synchronize any offline changes (note: full sync implementation would require further development)

### 4. Testing Offline Login

1. **Log out** while online
2. **Switch to offline mode** in your browser
3. Try to log in:
   - If you've logged in before, you should be able to access the app in a limited capacity
   - New users won't be able to create accounts or log in while offline

## Known Limitations

In the current implementation:

1. **New Users**: New users cannot create accounts while offline
2. **Synchronization**: The synchronization after coming back online is simulated (a full implementation would require more complex conflict resolution)
3. **Data Persistence**: Offline data is stored in the browser's localStorage, which has limited capacity
4. **Multiple Devices**: Changes made offline on one device won't sync to other devices until reconnected to Firebase

## Troubleshooting

If offline functionality isn't working:

1. **Clear Cache**: Try clearing your browser cache and cookies
2. **LocalStorage**: Check if localStorage is enabled in your browser
3. **Previous Login**: Ensure you've successfully logged in at least once while online
4. **Firebase Config**: Verify your Firebase configuration is correct 