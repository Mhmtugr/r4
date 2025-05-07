// Firebase Configuration
// This is a mockup configuration file for development
// Replace with your actual Firebase config in production

// Mock Firebase implementation for demo purposes
const createMockFirebase = () => {
  console.log("Initializing mock Firebase");
  
  // Create a simple auth mock
  const auth = {
    currentUser: null,
    onAuthStateChanged: (callback) => {
      // Simulate a logged-in demo user
      const demoUser = {
        uid: 'demo-user-1',
        email: 'demo@elektrotrack.com',
        displayName: 'Demo Kullanıcı',
        photoURL: null
      };
      
      // Call the callback with our demo user after a delay to simulate async behavior
      setTimeout(() => {
        callback(demoUser);
      }, 100);
      
      // Return an unsubscribe function
      return () => {};
    },
    signInWithEmailAndPassword: async (email, password) => {
      console.log(`Mock sign in with: ${email}`);
      
      // Simulate successful login
      return {
        user: {
          uid: 'demo-user-1',
          email: email,
          displayName: email.split('@')[0],
          photoURL: null
        }
      };
    },
    signOut: async () => {
      console.log("Mock sign out");
      return true;
    },
    GoogleAuthProvider: function() {
      return { addScope: () => {} };
    },
    signInWithPopup: async (provider) => {
      return {
        user: {
          uid: 'google-demo-user',
          email: 'google-demo@elektrotrack.com',
          displayName: 'Google Demo',
          photoURL: null
        }
      };
    }
  };
  
  // Create a simple firestore mock
  const firestore = {
    collection: (name) => ({
      doc: (id) => ({
        get: async () => ({
          exists: true,
          data: () => ({
            name: 'Demo Kullanıcı',
            email: 'demo@elektrotrack.com',
            role: 'admin',
            department: 'Yönetim',
            lastLogin: new Date()
          })
        }),
        set: async (data) => {
          console.log(`Mock set data for ${name}/${id}:`, data);
          return true;
        }
      }),
      where: () => ({
        get: async () => ({
          empty: true,
          docs: []
        })
      })
    })
  };
  
  return {
    auth: () => auth,
    firestore: () => firestore
  };
};

// Check if we're in development or production
const isProduction = process.env.NODE_ENV === 'production';

// Use mock firebase for development and when testing
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-app.firebaseapp.com",
  projectId: "your-app-id",
  storageBucket: "your-app.appspot.com",
  messagingSenderId: "your-messagingsender-id",
  appId: "your-app-id"
};

// Initialize and export Firebase
let firebase;

// If in development or there's no actual Firebase, use the mock
if (!isProduction || !window.firebase) {
  console.log("Using mock Firebase implementation");
  window.firebase = createMockFirebase();
  firebase = window.firebase;
} else {
  console.log("Using actual Firebase implementation");
  // Here you would initialize the actual Firebase
  // firebase.initializeApp(firebaseConfig);
  firebase = window.firebase;
}

export default firebase;