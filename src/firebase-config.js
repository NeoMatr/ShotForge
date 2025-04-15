// Local Storage Implementation (No Firebase)
// This file creates mock Firebase services using localStorage

console.log("Loading firebase-config.js");

// Mock Firebase Auth Service
const mockAuth = {
  currentUser: null,
  onAuthStateChanged: function(callback) {
    console.log("Setting up auth state change listener");
    // Initial call with current state
    const savedUser = localStorage.getItem('pool_current_user');
    this.currentUser = savedUser ? JSON.parse(savedUser) : null;
    try {
      callback(this.currentUser);
    } catch (e) {
      console.error("Error in auth state change callback:", e);
    }
    
    // Set up listener for changes
    window.addEventListener('storage', (event) => {
      if (event.key === 'pool_current_user') {
        this.currentUser = event.newValue ? JSON.parse(event.newValue) : null;
        try {
          callback(this.currentUser);
        } catch (e) {
          console.error("Error in storage event callback:", e);
        }
      }
    });
    
    // Return unsubscribe function
    return () => {};
  },
  
  signInWithEmailAndPassword: function(email, password) {
    console.log("Attempting to sign in:", email);
    return new Promise((resolve, reject) => {
      // Get all users
      const users = JSON.parse(localStorage.getItem('pool_users') || '{}');
      
      // Find user with matching email
      const userIds = Object.keys(users);
      const matchedUserId = userIds.find(id => users[id].email === email);
      
      if (matchedUserId && users[matchedUserId].password === password) {
        // Create user object without password
        const user = {
          uid: matchedUserId,
          email: users[matchedUserId].email,
          displayName: users[matchedUserId].username
        };
        
        // Store current user
        localStorage.setItem('pool_current_user', JSON.stringify(user));
        this.currentUser = user;
        
        resolve({ user });
      } else {
        reject({ 
          code: 'auth/wrong-password',
          message: 'Invalid email or password'
        });
      }
    });
  },
  
  createUserWithEmailAndPassword: function(email, password) {
    console.log("Attempting to create user:", email);
    return new Promise((resolve, reject) => {
      // Get existing users
      const users = JSON.parse(localStorage.getItem('pool_users') || '{}');
      
      // Check if email is already in use
      const userExists = Object.values(users).some(user => user.email === email);
      
      if (userExists) {
        reject({ 
          code: 'auth/email-already-in-use',
          message: 'Email address is already in use'
        });
        return;
      }
      
      // Create new user
      const userId = 'user_' + Date.now();
      const user = {
        uid: userId,
        email: email,
        displayName: null
      };
      
      // Store user with password (real Firebase wouldn't store passwords client-side!)
      users[userId] = {
        email: email,
        password: password,
        username: null
      };
      
      localStorage.setItem('pool_users', JSON.stringify(users));
      localStorage.setItem('pool_current_user', JSON.stringify(user));
      this.currentUser = user;
      
      resolve({ user });
    });
  },
  
  signOut: function() {
    console.log("Signing out user");
    return new Promise((resolve) => {
      localStorage.removeItem('pool_current_user');
      this.currentUser = null;
      resolve();
    });
  }
};

// Mock Firestore Service
const mockFirestore = {
  // Collections
  collections: {},
  
  // Collection reference function
  collection: function(collectionName) {
    console.log("Accessing collection:", collectionName);
    
    return {
      // Define doc method to get a single document reference
      doc: function(docId) {
        return {
          // Define collection method to get a sub-collection reference
          collection: function(subCollectionName) {
            return firebase.firestore().collection(`${collectionName}/${docId}/${subCollectionName}`);
          },
          
          // Define get method to retrieve document data
          get: function() {
            return new Promise((resolve, reject) => {
              try {
                const key = `${collectionName}_${docId}`;
                const data = localStorage.getItem(key);
                
                if (data) {
                  try {
                    const docData = JSON.parse(data);
                    resolve({
                      exists: true,
                      id: docId,
                      data: function() {
                        return docData;
                      }
                    });
                  } catch (e) {
                    console.error("Error processing document:", key, e);
                    resolve({
                      exists: false,
                      id: docId,
                      data: function() { return null; }
                    });
                  }
                } else {
                  resolve({
                    exists: false,
                    id: docId,
                    data: function() { return null; }
                  });
                }
              } catch (e) {
                console.error("Error getting document:", e);
                reject(e);
              }
            });
          },
          
          // Define set method to save document data
          set: function(data) {
            return new Promise((resolve, reject) => {
              try {
                const key = `${collectionName}_${docId}`;
                localStorage.setItem(key, JSON.stringify(data));
                resolve();
              } catch (e) {
                console.error("Error setting document:", e);
                reject(e);
              }
            });
          },
          
          // Define update method to update document data
          update: function(data) {
            return new Promise((resolve, reject) => {
              try {
                const key = `${collectionName}_${docId}`;
                const existingData = localStorage.getItem(key);
                
                if (existingData) {
                  try {
                    const docData = JSON.parse(existingData);
                    
                    // Special handling for points updates in user documents
                    if (collectionName === 'users' && 'points' in data) {
                      console.log(`Firebase mock: Updating user points from ${docData.points || 0} to ${data.points}`);
                      
                      // Fire a custom event to notify the app about point changes
                      const event = new CustomEvent('userPointsChanged', {
                        detail: {
                          userId: docId,
                          oldPoints: docData.points || 0,
                          newPoints: data.points
                        }
                      });
                      document.dispatchEvent(event);
                    }
                    
                    const updatedData = { ...docData, ...data };
                    localStorage.setItem(key, JSON.stringify(updatedData));
                    resolve();
                  } catch (e) {
                    console.error("Error updating document:", key, e);
                    reject(e);
                  }
                } else {
                  // If document doesn't exist yet, create it
                  localStorage.setItem(key, JSON.stringify(data));
                  resolve();
                }
              } catch (e) {
                console.error("Error updating document:", e);
                reject(e);
              }
            });
          }
        };
      },
      
      // Define where method to query documents
      where: function(field, operator, value) {
        return {
          // Additional where clauses can be chained
          where: function(field2, operator2, value2) {
            return this; // Return self for chaining
          },
          
          // Get method for query
          get: function() {
            return new Promise((resolve, reject) => {
              try {
                const results = [];
                const prefix = `${collectionName}_`;
                let size = 0;
                
                // Scan localStorage for matching documents
                for (let i = 0; i < localStorage.length; i++) {
                  const key = localStorage.key(i);
                  
                  if (key.startsWith(prefix)) {
                    try {
                      const data = JSON.parse(localStorage.getItem(key));
                      const docId = key.substring(prefix.length);
                      
                      // Apply filters based on where conditions
                      let match = false;
                      
                      if (operator === '==') {
                        match = data[field] === value;
                      } else if (operator === '!=') {
                        match = data[field] !== value;
                      } else if (operator === '>') {
                        match = data[field] > value;
                      } else if (operator === '>=') {
                        match = data[field] >= value;
                      } else if (operator === '<') {
                        match = data[field] < value;
                      } else if (operator === '<=') {
                        match = data[field] <= value;
                      }
                      
                      if (match) {
                        results.push({
                          id: docId,
                          data: function() { return data; }
                        });
                        size++;
                      }
                    } catch (e) {
                      console.error("Error processing document in query:", key, e);
                    }
                  }
                }
                
                // Create a Firestore-like query snapshot result
                resolve({
                  size: size,
                  empty: size === 0,
                  docs: results,
                  forEach: function(callback) {
                    results.forEach(callback);
                  }
                });
              } catch (e) {
                console.error("Error executing query:", e);
                reject(e);
              }
            });
          }
        };
      },
      
      // Define get method to get all documents in collection
      get: function() {
        return new Promise((resolve, reject) => {
          try {
            const results = [];
            const prefix = `${collectionName}_`;
            let size = 0;
            
            // Scan localStorage for matching documents
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              
              if (key.startsWith(prefix)) {
                try {
                  const data = JSON.parse(localStorage.getItem(key));
                  const docId = key.substring(prefix.length);
                  
                  results.push({
                    id: docId,
                    data: function() { return data; }
                  });
                  size++;
                } catch (e) {
                  console.error("Error processing document in collection:", key, e);
                }
              }
            }
            
            // Create a Firestore-like collection snapshot result
            resolve({
              size: size,
              empty: size === 0,
              docs: results,
              forEach: function(callback) {
                results.forEach(callback);
              }
            });
          } catch (e) {
            console.error("Error getting collection:", e);
            reject(e);
          }
        });
      },
      
      // Add a document to the collection with auto-generated ID
      add: function(data) {
        return new Promise((resolve, reject) => {
          try {
            const docId = `doc_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            const key = `${collectionName}_${docId}`;
            
            localStorage.setItem(key, JSON.stringify(data));
            
            resolve({
              id: docId
            });
          } catch (e) {
            console.error("Error adding document:", e);
            reject(e);
          }
        });
      }
    };
  },
  
  // Enable persistence (mock function)
  enablePersistence: function() {
    console.log('Local persistence already enabled');
    return Promise.resolve();
  }
};

// Mock Collection class
class MockCollection {
  constructor(name) {
    this.name = name;
    this.storageKey = 'pool_collection_' + name;
  }
  
  // Get document reference
  doc(docId) {
    return new MockDocument(this.name, docId);
  }
  
  // Add a document with auto ID
  add(data) {
    const docId = 'doc_' + Date.now();
    const doc = new MockDocument(this.name, docId);
    return doc.set(data).then(() => doc);
  }
  
  // Get all documents in collection
  get() {
    console.log(`Getting all documents in collection: ${this.name}`);
    return new Promise((resolve) => {
      const results = [];
      const prefix = 'pool_doc_' + this.name + '_';
      
      // Search localStorage for all documents in this collection
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          try {
            const docId = key.substring(prefix.length);
            const data = JSON.parse(localStorage.getItem(key) || '{}');
            
            results.push({
              id: docId,
              data: () => data,
              exists: true
            });
          } catch (e) {
            console.error("Error processing document:", key, e);
          }
        }
      }
      
      resolve({
        docs: results,
        empty: results.length === 0,
        size: results.length,
        forEach: function(callback) {
          results.forEach(callback);
        }
      });
    });
  }
  
  // Get data with where clause
  where(field, operator, value) {
    return new MockQuery(this.name, [{ field, operator, value }]);
  }
  
  // Order results
  orderBy(field, direction) {
    return new MockQuery(this.name, [], field, direction);
  }
}

// Mock Document class
class MockDocument {
  constructor(collectionName, docId) {
    this.collectionName = collectionName;
    this.id = docId;
    this.storageKey = 'pool_doc_' + collectionName + '_' + docId;
    this.collections = {};
  }
  
  // Get a subcollection
  collection(collectionName) {
    const fullName = this.collectionName + '_' + this.id + '_' + collectionName;
    if (!this.collections[collectionName]) {
      this.collections[collectionName] = new MockCollection(fullName);
    }
    return this.collections[collectionName];
  }
  
  // Set document data
  set(data) {
    return new Promise((resolve) => {
      // Add timestamps if needed
      if (data.createdAt && data.createdAt.serverTimestamp) {
        data.createdAt = new Date().toISOString();
      }
      
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      resolve();
    });
  }
  
  // Update document data
  update(data) {
    return new Promise((resolve) => {
      const existingData = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
      
      // Handle special fields like increment
      for (const key in data) {
        if (data[key] && data[key].increment) {
          existingData[key] = (existingData[key] || 0) + data[key].increment;
        } else {
          existingData[key] = data[key];
        }
      }
      
      localStorage.setItem(this.storageKey, JSON.stringify(existingData));
      resolve();
    });
  }
  
  // Get document data
  get() {
    return new Promise((resolve) => {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        resolve({
          exists: true,
          data: () => JSON.parse(data),
          id: this.id
        });
      } else {
        resolve({
          exists: false,
          data: () => null,
          id: this.id
        });
      }
    });
  }
}

// Mock Query class
class MockQuery {
  constructor(collectionName, filters = [], orderByField = null, orderDirection = 'asc') {
    this.collectionName = collectionName;
    this.filters = filters;
    this.orderByField = orderByField;
    this.orderDirection = orderDirection;
    this.limitValue = null;
    this.collectionStoragePrefix = 'pool_doc_' + collectionName + '_';
  }
  
  // Add more filters
  where(field, operator, value) {
    this.filters.push({ field, operator, value });
    return this;
  }
  
  // Limit results
  limit(value) {
    this.limitValue = value;
    return this;
  }
  
  // Get results
  get() {
    return new Promise((resolve) => {
      // Find all matching documents in localStorage
      const results = [];
      
      // Get all keys for this collection
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.collectionStoragePrefix)) {
          try {
            const docId = key.substring(this.collectionStoragePrefix.length);
            const data = JSON.parse(localStorage.getItem(key) || '{}');
            
            // Apply filters
            let matches = true;
            for (const filter of this.filters) {
              const fieldValue = data[filter.field];
              
              if (filter.operator === '==') {
                if (fieldValue !== filter.value) matches = false;
              } else if (filter.operator === '>') {
                if (fieldValue <= filter.value) matches = false;
              } else if (filter.operator === '<') {
                if (fieldValue >= filter.value) matches = false;
              } else if (filter.operator === '>=') {
                if (fieldValue < filter.value) matches = false;
              } else if (filter.operator === '<=') {
                if (fieldValue > filter.value) matches = false;
              }
            }
            
            if (matches) {
              results.push({
                id: docId,
                data: () => data,
                exists: true
              });
            }
          } catch (e) {
            console.error("Error processing document:", key, e);
          }
        }
      }
      
      // Sort if needed
      if (this.orderByField) {
        results.sort((a, b) => {
          const valueA = a.data()[this.orderByField];
          const valueB = b.data()[this.orderByField];
          
          // Handle null/undefined values
          if (valueA == null && valueB == null) return 0;
          if (valueA == null) return -1;
          if (valueB == null) return 1;
          
          // Compare depending on direction
          if (this.orderDirection === 'desc') {
            if (valueA > valueB) return -1;
            if (valueA < valueB) return 1;
            return 0;
          } else {
            if (valueA < valueB) return -1;
            if (valueA > valueB) return 1;
            return 0;
          }
        });
      }
      
      // Apply limit if needed
      if (this.limitValue && results.length > this.limitValue) {
        results.length = this.limitValue;
      }
      
      resolve({
        docs: results,
        empty: results.length === 0
      });
    });
  }
}

// Create Firebase-like field values
const mockFieldValues = {
  serverTimestamp: () => ({ serverTimestamp: true }),
  increment: (value) => ({ increment: value })
};

console.log("Creating firebase mock objects");

// Create a global firebase object if it doesn't exist
if (typeof window.firebase === 'undefined') {
  window.firebase = {};
}

// Export Firebase-like objects
window.firebase.auth = () => mockAuth;
window.firebase.firestore = () => mockFirestore;
window.firebase.firestore.FieldValue = mockFieldValues;

// Export services to be used in other files (same API as Firebase)
window.auth = mockAuth;
window.db = mockFirestore;

console.log("firebase-config.js loaded successfully"); 