// Quiz Configuration - Centralized timing and question counts
const QUIZ_CONFIG = {
  // Time limits in seconds
  timeLimits: {
    'all-topics': 1200,      // 20 minutes for comprehensive quiz
    'timed-challenge': 300,   // 5 minutes for speed challenge
    'weak-areas-combined': 600,  // 10 minutes for focused practice
    'topic-specific': 480,    // 8 minutes for single topic
    'adaptive': 720,          // 12 minutes for adaptive quiz
    'default': 600            // 10 minutes fallback
  },
  
  // Question counts per quiz type
  questionCounts: {
    'all-topics': 20,
    'timed-challenge': 20,
    'weak-areas-combined': 15,
    'topic-specific': 12,
    'adaptive': 15,
    'default': 10
  },
  
  // Display labels for quiz selection
  displayInfo: {
    'all-topics': {
      questions: 20,
      timeDisplay: '15-20 min',
      description: 'Comprehensive quiz covering multiple topics'
    },
    'timed-challenge': {
      questions: 20,
      timeDisplay: '5 min',
      description: 'Fast-paced challenge to test your speed'
    },
    'weak-areas-combined': {
      questions: 15,
      timeDisplay: '8-12 min',
      description: 'Focus on your weakest areas'
    },
    'topic-specific': {
      questions: 8-10,
      timeDisplay: '5-8 min',
      description: 'Deep dive into a specific topic'
    },
    'adaptive': {
      questions: 15,
      timeDisplay: '8-12 min',
      description: 'Difficulty adjusts based on your performance'
    }
  },
  
  // Progress bar maximums for dashboard
  progressMaximums: {
    totalQuizzes: 50,      // Max quizzes for 100% progress
    studyTime: 100,        // Max hours for 100% progress  
    badges: 20             // Max badges for 100% progress
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = QUIZ_CONFIG;
}

// Make available globally for frontend
if (typeof window !== 'undefined') {
  window.QUIZ_CONFIG = QUIZ_CONFIG;
}
