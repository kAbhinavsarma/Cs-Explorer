const db = require('./database');

// Sample users
const users = [
  {
    username: 'testuser1',
    email: 'test1@example.com',
    password_hash: 'hash123'
  },
  {
    username: 'testuser2',
    email: 'test2@example.com',
    password_hash: 'hash456'
  }
];

// Expanded questions database (50+ questions with explanations)
const questions = [
  // Algorithms (10 questions)
  {
    question_text: "What is the time complexity of binary search?",
    option_a: "O(n)",
    option_b: "O(log n)",
    option_c: "O(n log n)",
    option_d: "O(1)",
    correct_option: "B",
    topic: "Algorithms",
    explanation: "Binary search divides the search space in half each iteration."
  },
  {
    question_text: "Which sorting algorithm has the worst time complexity O(n²)?",
    option_a: "Merge Sort",
    option_b: "Quick Sort (worst case)",
    option_c: "Heap Sort",
    option_d: "Bubble Sort",
    correct_option: "D",
    topic: "Algorithms",
    explanation: "Bubble Sort repeatedly steps through the list, compares adjacent elements, and swaps them if in the wrong order."
  },
  {
    question_text: "What is the main advantage of using quicksort over mergesort?",
    option_a: "Always faster",
    option_b: "In-place sorting",
    option_c: "Stable sorting",
    option_d: "Better for small datasets",
    correct_option: "B",
    topic: "Algorithms",
    explanation: "Quicksort sorts in-place, requiring less memory than mergesort."
  },
  {
    question_text: "Which algorithm is used to find the shortest path in a graph?",
    option_a: "Depth First Search",
    option_b: "Breadth First Search",
    option_c: "Dijkstra's Algorithm",
    option_d: "Prim's Algorithm",
    correct_option: "C",
    topic: "Algorithms",
    explanation: "Dijkstra's Algorithm is used to find the shortest path from a source node to all other nodes."
  },
  {
    question_text: "What is the time complexity of insertion sort in the worst case?",
    option_a: "O(n)",
    option_b: "O(n log n)",
    option_c: "O(n²)",
    option_d: "O(1)",
    correct_option: "C",
    topic: "Algorithms",
    explanation: "Insertion sort has O(n²) time complexity in the worst case."
  },
  {
    question_text: "Which algorithm is used for topological sorting?",
    option_a: "Bubble Sort",
    option_b: "Topological Sort",
    option_c: "Merge Sort",
    option_d: "Heap Sort",
    correct_option: "B",
    topic: "Algorithms",
    explanation: "Topological sort is a linear ordering of vertices such that for every directed edge u to v, u comes before v."
  },
  {
    question_text: "What is the purpose of a hash function in hash tables?",
    option_a: "To encrypt data",
    option_b: "To map keys to indices",
    option_c: "To compress data",
    option_d: "To sort data",
    correct_option: "B",
    topic: "Algorithms",
    explanation: "A hash function maps keys to specific indices in a hash table."
  },
  {
    question_text: "Which data structure is best suited for implementing a priority queue?",
    option_a: "Array",
    option_b: "Stack",
    option_c: "Queue",
    option_d: "Heap",
    correct_option: "D",
    topic: "Algorithms",
    explanation: "A heap is commonly used to implement a priority queue."
  },
  {
    question_text: "What is the time complexity of a linear search?",
    option_a: "O(n)",
    option_b: "O(log n)",
    option_c: "O(n log n)",
    option_d: "O(1)",
    correct_option: "A",
    topic: "Algorithms",
    explanation: "Linear search checks each element in sequence, resulting in O(n) time complexity."
  },
  {
    question_text: "Which algorithm is NOT a comparison-based sorting algorithm?",
    option_a: "Quick Sort",
    option_b: "Merge Sort",
    option_c: "Counting Sort",
    option_d: "Heap Sort",
    correct_option: "C",
    topic: "Algorithms",
    explanation: "Counting sort is not comparison-based; it uses the range of numbers to sort."
  },

  // Data Structures (10 questions)
  {
    question_text: "Which data structure uses FIFO order?",
    option_a: "Stack",
    option_b: "Queue",
    option_c: "Tree",
    option_d: "Graph",
    correct_option: "B",
    topic: "Data Structures",
    explanation: "Queue uses First In First Out (FIFO) order."
  },
  {
    question_text: "What is the main advantage of a hash table?",
    option_a: "Constant time search",
    option_b: "Ordered elements",
    option_c: "Easy to implement",
    option_d: "Low memory usage",
    correct_option: "A",
    topic: "Data Structures",
    explanation: "Hash tables provide average constant time complexity for search operations."
  },
  {
    question_text: "Which data structure uses LIFO order?",
    option_a: "Stack",
    option_b: "Queue",
    option_c: "Linked List",
    option_d: "Tree",
    correct_option: "A",
    topic: "Data Structures",
    explanation: "Stack uses Last In First Out (LIFO) order."
  },
  {
    question_text: "What is a binary search tree?",
    option_a: "A tree with at most two children per node",
    option_b: "A tree where left child < parent < right child",
    option_c: "A tree with no children",
    option_d: "A tree with only leaves",
    correct_option: "B",
    topic: "Data Structures",
    explanation: "A binary search tree is a binary tree where the left child is less than the parent and the right child is greater."
  },
  {
    question_text: "What is the purpose of a linked list?",
    option_a: "To store data in a linear sequence",
    option_b: "To sort data automatically",
    option_c: "To encrypt data",
    option_d: "To compress data",
    correct_option: "A",
    topic: "Data Structures",
    explanation: "A linked list stores data in a linear sequence, with each element pointing to the next."
  },
  {
    question_text: "Which data structure is used for implementing recursion?",
    option_a: "Queue",
    option_b: "Stack",
    option_c: "Tree",
    option_d: "Graph",
    correct_option: "B",
    topic: "Data Structures",
    explanation: "The call stack is used for recursion."
  },
  {
    question_text: "What is the time complexity of inserting an element into a balanced binary search tree?",
    option_a: "O(n)",
    option_b: "O(log n)",
    option_c: "O(1)",
    option_d: "O(n²)",
    correct_option: "B",
    topic: "Data Structures",
    explanation: "Inserting into a balanced BST is O(log n)."
  },
  {
    question_text: "Which data structure is best for representing hierarchical data?",
    option_a: "Array",
    option_b: "Tree",
    option_c: "Stack",
    option_d: "Queue",
    correct_option: "B",
    topic: "Data Structures",
    explanation: "Tree structures are best for hierarchical data."
  },
  {
    question_text: "What is a node in a linked list?",
    option_a: "A data structure for sorting",
    option_b: "A data structure for encryption",
    option_c: "A data structure for compression",
    option_d: "A data structure for storing data and a reference to the next node",
    correct_option: "D",
    topic: "Data Structures",
    explanation: "A node stores data and a reference to the next node."
  },
  {
    question_text: "Which data structure is used for implementing breadth-first search?",
    option_a: "Stack",
    option_b: "Queue",
    option_c: "Tree",
    option_d: "Graph",
    correct_option: "B",
    topic: "Data Structures",
    explanation: "Breadth-first search uses a queue to manage nodes."
  },

  // Databases (10 questions)
  {
    question_text: "What does SQL stand for?",
    option_a: "Structured Query Language",
    option_b: "Simple Query Language",
    option_c: "System Query Logic",
    option_d: "Sequential Query Layer",
    correct_option: "A",
    topic: "Databases",
    explanation: "SQL stands for Structured Query Language."
  },
  {
    question_text: "Which normal form eliminates transitive dependencies?",
    option_a: "1NF",
    option_b: "2NF",
    option_c: "3NF",
    option_d: "BCNF",
    correct_option: "C",
    topic: "Databases",
    explanation: "Third Normal Form (3NF) eliminates transitive dependencies."
  },
  {
    question_text: "What is a primary key?",
    option_a: "A key used for encryption",
    option_b: "A key that uniquely identifies a record",
    option_c: "A key used for sorting",
    option_d: "A key used for compression",
    correct_option: "B",
    topic: "Databases",
    explanation: "A primary key uniquely identifies a record in a table."
  },
  {
    question_text: "What is the purpose of an index in a database?",
    option_a: "To encrypt data",
    option_b: "To speed up data retrieval",
    option_c: "To compress data",
    option_d: "To sort data",
    correct_option: "B",
    topic: "Databases",
    explanation: "Indexes speed up data retrieval operations."
  },
  {
    question_text: "What is a foreign key?",
    option_a: "A key used for encryption",
    option_b: "A key that references a primary key in another table",
    option_c: "A key used for sorting",
    option_d: "A key used for compression",
    correct_option: "B",
    topic: "Databases",
    explanation: "A foreign key references a primary key in another table."
  },
  {
    question_text: "Which SQL command is used to retrieve data from a database?",
    option_a: "INSERT",
    option_b: "SELECT",
    option_c: "UPDATE",
    option_d: "DELETE",
    correct_option: "B",
    topic: "Databases",
    explanation: "SELECT is used to retrieve data from a database."
  },
  {
    question_text: "What is the purpose of a transaction in a database?",
    option_a: "To encrypt data",
    option_b: "To ensure data consistency",
    option_c: "To compress data",
    option_d: "To sort data",
    correct_option: "B",
    topic: "Databases",
    explanation: "Transactions ensure data consistency."
  },
  {
    question_text: "Which database model organizes data into tables?",
    option_a: "Hierarchical",
    option_b: "Network",
    option_c: "Relational",
    option_d: "Object-oriented",
    correct_option: "C",
    topic: "Databases",
    explanation: "The relational model organizes data into tables."
  },
  {
    question_text: "What is the purpose of the GROUP BY clause in SQL?",
    option_a: "To sort data",
    option_b: "To group rows by a specified column",
    option_c: "To filter data",
    option_d: "To encrypt data",
    correct_option: "B",
    topic: "Databases",
    explanation: "GROUP BY groups rows by a specified column."
  },
  {
    question_text: "Which SQL command is used to remove rows from a table?",
    option_a: "INSERT",
    option_b: "SELECT",
    option_c: "UPDATE",
    option_d: "DELETE",
    correct_option: "D",
    topic: "Databases",
    explanation: "DELETE is used to remove rows from a table."
  },

  // Networking (10 questions)
  {
    question_text: "Which protocol is used for secure HTTP communication?",
    option_a: "FTP",
    option_b: "HTTP",
    option_c: "HTTPS",
    option_d: "TCP",
    correct_option: "C",
    topic: "Networking",
    explanation: "HTTPS is used for secure HTTP communication."
  },
  {
    question_text: "What is the purpose of DNS?",
    option_a: "To encrypt data",
    option_b: "To translate domain names to IP addresses",
    option_c: "To manage network bandwidth",
    option_d: "To authenticate users",
    correct_option: "B",
    topic: "Networking",
    explanation: "DNS translates domain names to IP addresses."
  },
  {
    question_text: "Which protocol is used for sending emails?",
    option_a: "SMTP",
    option_b: "POP3",
    option_c: "IMAP",
    option_d: "FTP",
    correct_option: "A",
    topic: "Networking",
    explanation: "SMTP is used for sending emails."
  },
  {
    question_text: "What is the purpose of a router in a network?",
    option_a: "To connect multiple networks together",
    option_b: "To encrypt data",
    option_c: "To compress data",
    option_d: "To sort data",
    correct_option: "A",
    topic: "Networking",
    explanation: "A router connects multiple networks together."
  },
  {
    question_text: "Which protocol is used for file transfer?",
    option_a: "HTTP",
    option_b: "FTP",
    option_c: "SMTP",
    option_d: "POP3",
    correct_option: "B",
    topic: "Networking",
    explanation: "FTP is used for file transfer."
  },
  {
    question_text: "What is a firewall?",
    option_a: "A device for encryption",
    option_b: "A device for network security",
    option_c: "A device for compression",
    option_d: "A device for sorting",
    correct_option: "B",
    topic: "Networking",
    explanation: "A firewall is used for network security."
  },
  {
    question_text: "Which protocol is used for web browsing?",
    option_a: "HTTP",
    option_b: "FTP",
    option_c: "SMTP",
    option_d: "POP3",
    correct_option: "A",
    topic: "Networking",
    explanation: "HTTP is used for web browsing."
  },
  {
    question_text: "What is the purpose of a switch in a network?",
    option_a: "To connect devices within a network",
    option_b: "To encrypt data",
    option_c: "To compress data",
    option_d: "To sort data",
    correct_option: "A",
    topic: "Networking",
    explanation: "A switch connects devices within a network."
  },
  {
    question_text: "Which protocol is used for receiving emails?",
    option_a: "SMTP",
    option_b: "POP3",
    option_c: "HTTP",
    option_d: "FTP",
    correct_option: "B",
    topic: "Networking",
    explanation: "POP3 is used for receiving emails."
  },
  {
    question_text: "What is an IP address?",
    option_a: "A unique identifier for a device on a network",
    option_b: "A device for encryption",
    option_c: "A device for compression",
    option_d: "A device for sorting",
    correct_option: "A",
    topic: "Networking",
    explanation: "An IP address uniquely identifies a device on a network."
  },

  // Operating Systems (10 questions)
  {
    question_text: "What is a process in an operating system?",
    option_a: "A single thread of execution",
    option_b: "A program in execution",
    option_c: "A type of memory",
    option_d: "A hardware component",
    correct_option: "B",
    topic: "Operating Systems",
    explanation: "A process is a program in execution."
  },
  {
    question_text: "Which scheduling algorithm provides starvation-free execution?",
    option_a: "First-Come, First-Served",
    option_b: "Shortest Job First",
    option_c: "Round Robin",
    option_d: "Priority Scheduling",
    correct_option: "C",
    topic: "Operating Systems",
    explanation: "Round Robin scheduling provides starvation-free execution."
  },
  {
    question_text: "What is the purpose of virtual memory?",
    option_a: "To increase the amount of physical memory",
    option_b: "To allow processes to use more memory than physically available",
    option_c: "To encrypt data",
    option_d: "To compress data",
    correct_option: "B",
    topic: "Operating Systems",
    explanation: "Virtual memory allows processes to use more memory than physically available."
  },
  {
    question_text: "What is a deadlock in an operating system?",
    option_a: "A hardware failure",
    option_b: "A situation where two or more processes are waiting indefinitely for each other",
    option_c: "A type of memory",
    option_d: "A device for compression",
    correct_option: "B",
    topic: "Operating Systems",
    explanation: "A deadlock is when two or more processes are waiting indefinitely for each other."
  },
  {
    question_text: "Which component manages the allocation of resources in an OS?",
    option_a: "Memory Manager",
    option_b: "File Manager",
    option_c: "Process Manager",
    option_d: "Resource Manager",
    correct_option: "C",
    topic: "Operating Systems",
    explanation: "The Process Manager manages the allocation of resources."
  },
  {
    question_text: "What is the purpose of a file system?",
    option_a: "To encrypt data",
    option_b: "To organize and store data on storage devices",
    option_c: "To compress data",
    option_d: "To sort data",
    correct_option: "B",
    topic: "Operating Systems",
    explanation: "A file system organizes and stores data on storage devices."
  },
  {
    question_text: "Which scheduling algorithm is non-preemptive?",
    option_a: "Round Robin",
    option_b: "Shortest Job First",
    option_c: "Priority Scheduling",
    option_d: "First-Come, First-Served",
    correct_option: "D",
    topic: "Operating Systems",
    explanation: "First-Come, First-Served is non-preemptive."
  },
  {
    question_text: "What is a thread?",
    option_a: "A process",
    option_b: "A lightweight process",
    option_c: "A type of memory",
    option_d: "A device for compression",
    correct_option: "B",
    topic: "Operating Systems",
    explanation: "A thread is a lightweight process."
  },
  {
    question_text: "What is the purpose of paging in an operating system?",
    option_a: "To encrypt data",
    option_b: "To compress data",
    option_c: "To manage memory by dividing it into fixed-size blocks",
    option_d: "To sort data",
    correct_option: "C",
    topic: "Operating Systems",
    explanation: "Paging manages memory by dividing it into fixed-size blocks."
  },
  {
    question_text: "Which OS component manages I/O operations?",
    option_a: "Memory Manager",
    option_b: "File Manager",
    option_c: "I/O Manager",
    option_d: "Process Manager",
    correct_option: "C",
    topic: "Operating Systems",
    explanation: "The I/O Manager manages I/O operations."
  },

  // Additional topics: Security (5 questions)
  {
    question_text: "What is encryption?",
    option_a: "A process for compressing data",
    option_b: "A process for converting data into a code",
    option_c: "A process for sorting data",
    option_d: "A process for organizing data",
    correct_option: "B",
    topic: "Security",
    explanation: "Encryption converts data into a code to prevent unauthorized access."
  },
  {
    question_text: "What is a firewall?",
    option_a: "A device for encryption",
    option_b: "A device for network security",
    option_c: "A device for compression",
    option_d: "A device for sorting",
    correct_option: "B",
    topic: "Security",
    explanation: "A firewall is used for network security."
  },
  {
    question_text: "What is the purpose of a VPN?",
    option_a: "To compress data",
    option_b: "To encrypt and secure internet connections",
    option_c: "To sort data",
    option_d: "To organize data",
    correct_option: "B",
    topic: "Security",
    explanation: "A VPN encrypts and secures internet connections."
  },
  {
    question_text: "What is two-factor authentication?",
    option_a: "A method for sorting data",
    option_b: "A method for compressing data",
    option_c: "A method for encrypting data",
    option_d: "A method for verifying user identity using two different factors",
    correct_option: "D",
    topic: "Security",
    explanation: "Two-factor authentication verifies user identity using two different factors."
  },
  {
    question_text: "What is a vulnerability in the context of security?",
    option_a: "A weakness in a system that can be exploited",
    option_b: "A device for encryption",
    option_c: "A device for compression",
    option_d: "A device for sorting",
    correct_option: "A",
    topic: "Security",
    explanation: "A vulnerability is a weakness in a system that can be exploited."
  }
];

// Initialize database
function seedDatabase() {
    // Insert users
    users.forEach(user => {
        db.run(
            `INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)`,
            [user.username, user.email, user.password_hash]
        );
    });

    // Insert questions
    questions.forEach(question => {
        db.run(
            `INSERT INTO questions (question_text, option_a, option_b, option_c, option_d, 
             correct_option, topic, explanation) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                question.question_text,
                question.option_a,
                question.option_b,
                question.option_c,
                question.option_d,
                question.correct_option,
                question.topic,
                question.explanation
            ]
        );
    });

    console.log('Database seeded successfully');
}

// Run seeding
seedDatabase();
