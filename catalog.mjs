export const tracks = {
  normal: { label: 'Normal', duration: '45 Days' },
  advanced: { label: 'Advanced', duration: '3 Months' },
};

export const courses = [
  ['python', 'Python Programming',
    'Learn Python syntax, functions and data structures. Write scripts that read files and automate simple tasks.',
    'Work with APIs, databases and testing. Build a Python project that solves a practical problem.'],
  ['java', 'Java Programming',
    'Learn Java syntax, object-oriented programming and collections. Build and debug small console applications.',
    'Use streams, JDBC and testing tools. Build a Java application that reads and writes data.'],
  ['full-stack-python', 'Full Stack Development with Python',
    'Build web pages with HTML, CSS and JavaScript, then connect them to a Python server.',
    'Build a full-stack application with Django, a database, authentication and a deployment workflow.'],
  ['full-stack-java', 'Full Stack Development with Java',
    'Learn web fundamentals and connect a simple front end to a Java API.',
    'Build a Spring Boot application with REST endpoints, authentication, persistence and automated tests.'],
  ['agentic-ai', 'Agentic AI',
    'Learn how agents use prompts and tools. Build a workflow that completes a small multi-step task.',
    'Build a tool-using agent with state, evaluation and safeguards, then test how it handles failures.'],
  ['generative-ai', 'Generative AI',
    'Practice prompting, compare model outputs and build a small application using a model API.',
    'Build and evaluate a retrieval-augmented application that answers questions from a document collection.'],
  ['cloud', 'Cloud Computing',
    'Learn cloud compute, storage, networking and access control. Deploy a small service.',
    'Build a cloud deployment with infrastructure as code, monitoring, access policies and a recovery plan.'],
  ['salesforce', 'Salesforce',
    'Configure objects, fields, permissions and reports in a Salesforce practice environment.',
    'Build Salesforce automation with Flow, Apex and Lightning components. Test a business workflow end to end.'],
];

export const collegeName = 'GMR Institute of Technology';
export const partnerColleges = [
  ['bhisma', 'Bhishma Institute of Management and Science', 'bhisma-logo.jpeg', 'image/jpeg'],
  ['nsrit', 'Nadimpalli Satyanarayana Raju Institute of Technology', 'nsrit.png', 'image/png'],
  ['viet', 'Visakha Institute of Engineering and Technology', 'viet-logo-new.png', 'image/png'],
  ['sahe', 'Siddhartha Academy of Higher Education', 'https://siddhartha.edu.in/wp-content/uploads/2025/05/sahe-white-logo.png', ''],
  ['wistm', 'Wellfare Institute of Science Technology and Management (WISTM)', 'wistm.jpg', 'image/jpeg'],
];
export const additionalProfiles = [
  ['bhisma-cohort', 'Bhishma Institute internship cohort', 'Group internship session'],
  ['bhisma-instructor', 'Bhishma Institute instructor', 'Internship session instructor'],
];
export const cohort = [
  ['bhargav', 'S Bhargav', 'Information Technology'],
  ['charan-teja', 'K Ram Charan Teja', 'Computer Science and Engineering'],
  ['hari-manikanta-naidu', 'Hari Manikanta Naidu', 'Electronics and Communication Engineering'],
  ['harika', 'Harika', 'Information Technology'],
  ['kavya', 'Kavya', 'Computer Science and Engineering'],
  ['lakshmi-prasanna', 'Lakshmi Prasanna Sri', 'Electrical and Electronics Engineering'],
  ['pawan-kumar', 'Veera Pawan Kumar', 'Computer Science and Engineering'],
  ['shriya', 'G Shriya', 'Information Technology'],
  ['siva-sai', 'K G G Siva Sai', 'Information Technology'],
  ['sri-lakshmi', 'Sri Lakshmi', 'Computer Science and Engineering'],
];

export const contentTypes = {
  courses: { label: 'Courses', singular: 'course', fields: {
    name: ['Course name', 100], normal: ['Normal description', 600], advanced: ['Advanced description', 600],
  } },
  colleges: { label: 'Colleges', singular: 'college', image: 'College logo', fields: {
    name: ['College name', 120], detail: ['Location or collaboration details', 200, true],
  } },
  testimonials: { label: 'Testimonials', singular: 'testimonial', image: 'Student photograph', fields: {
    name: ['Student name', 120], college: ['College details', 160], department: ['Department', 120, true],
    experience: ['Internship experience', 600, true], skills: ['Skills and knowledge gained', 600, true],
    quote: ['Student testimonial', 900, true],
  } },
  certificates: { label: 'Certificates', singular: 'certificate', image: 'Certificate image', fields: {
    name: ['Certificate title', 120],
  } },
  hero: { label: 'Hero image', singular: 'hero image', image: 'Training photograph', fields: {
    name: ['Image description (alt text)', 160],
  } },
};

export const statuses = ['New', 'In review', 'Accepted', 'Declined'];
