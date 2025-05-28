const db = require('./database');

// Insert sample users
const users = [
  {
    username: 'testuser1',
    email: 'test1@example.com',
    password_hash: 'hash123' // In real apps, use bcrypt hashed passwords
  },
  {
    username: 'testuser2',
    email: 'test2@example.com',
    password_hash: 'hash123'
  },
  {
    username: 'testuser3',
    email: 'test3@example.com',
    password_hash: 'hash123'
  }
];

// Insert sample questions
const questions = [
  {
    question_text: "What is the time complexity of binary search?",
    option_a: "O(n)",
    option_b: "O(log n)",
    option_c: "O(n log n)",
    option_d: "O(1)",
    correct_option: "B",
    topic: "Algorithms"
  },
  {
    question_text: "Which data structure uses FIFO order?",
    option_a: "Stack",
    option_b: "Queue",
    option_c: "Tree",
    option_d: "Graph",
    correct_option: "B",
    topic: "Data Structures"
  },
  {
    question_text: "What does SQL stand for?",
    option_a: "Structured Query Language",
    option_b: "Simple Query Language",
    option_c: "System Query Logic",
    option_d: "Sequential Query Layer",
    correct_option: "A",
    topic: "Databases"
  },
  {
    question_text: "Which protocol is used for secure HTTP communication?",
    option_a: "FTP",
    option_b: "HTTP",
    option_c: "HTTPS",
    option_d: "TCP",
    correct_option: "C",
    topic: "Networking"
  },
  {
    question_text: "What is a process in an operating system?",
    option_a: "A single thread of execution",
    option_b: "A program in execution",
    option_c: "A type of memory",
    option_d: "A hardware component",
    correct_option: "B",
    topic: "Operating Systems"
  }
];

// Insert users
users.forEach(user => {
  db.run(
    `INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)`,
    [user.username, user.email, user.password_hash],
    (err) => {
      if (err) console.error('Error inserting user:', err.message);
    }
  );
});

// Insert questions
questions.forEach(question => {
  db.run(
    `INSERT INTO questions (question_text, option_a, option_b, option_c, option_d, correct_option, topic) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      question.question_text,
      question.option_a,
      question.option_b,
      question.option_c,
      question.option_d,
      question.correct_option,
      question.topic
    ],
    (err) => {
      if (err) console.error('Error inserting question:', err.message);
    }
  );
});
// Verify users
db.all("SELECT * FROM users", [], (err, rows) => {
  if (err) console.error(err);
  else console.log("Users:", rows);
});

// Verify questions
db.all("SELECT * FROM questions", [], (err, rows) => {
  if (err) console.error(err);
  else console.log("Questions:", rows);
});

console.log('Seed data inserted!');
