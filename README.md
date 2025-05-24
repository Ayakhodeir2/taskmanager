Setup Guide:
Steps
Set Up AWS Services
Cognito: Create a user pool for authentication
AWS Console > Cognito > Create User Pool > Follow setup wizard.
VPC and EC2: Launch an Amazon Linux instance in eu-north-1.
Security Group: Open ports 22 (SSH), 80 (HTTP)..
RDS: Set up a MySQL instance (taskmanager database) with task_user table.
Schema: task_id, user_id, created_at, title, description, due_date, priority, status, updated_at, attachments.
DynamoDB: Create task-management-dynamo table with TaskID as the partition key.
S3: Create a bucket (e.g., giu-main-bucket) for attachments.
Lambda: Deploy functions (CreateTaskFunction, UpdateTaskFunction, etc.) with IAM roles for DynamoDB, RDS, and S3 access.
API Gateway: Set up REST APIs mapping to Lambda functions.
SQS: Create a queue for notifications.
CloudWatch: Enable logging and metrics for all services.
Deploy the React App on EC2 :SSH into the instance
Update and install dependencies
Clone or transfer the React app :Configure Nginx
Configure Lambda Functions
Package and deploy each function with dependencies :Upload to Lambda via AWS Console or CLI.
Test the System
Create a task via API Gateway
Verify data in DynamoDB, RDS, and S3.
Check CloudWatch logs for errors.
Set Up Notifications 
Integrate SQS with an email service for task update notifications.






User Manual: Instructions for Using the Task Management System
Task Management System, a web-based application hosted on AWS. This manual guides you through signing up, managing tasks, and receiving notifications.
Getting Started
Access the Application
Open your browser and navigate to http://<public-ip>
Sign Up
Click “Sign Up” and provide an email and password.
Verify your email via the link sent by Cognito.
Log In
Enter your credentials on the login page.
Use your Cognito sub (provided after login) for API requests if automating.
Managing Tasks
Create a Task
Click “Create Task.”
Enter title, description, due date, priority, and optionally attach files (via presigned URLs).
Submit to save to DynamoDB and RDS.
View Tasks
Click “View Tasks” to see your tasks (filtered by your Cognito sub).
Details include title, description, status, and attachments.
Update a Task
Select a task, edit title, description, status, due_date, priority, or attachments.
Save changes (updates both DynamoDB and RDS).
Delete a Task
Select a task and click “Delete” (removes from DynamoDB and RDS).
Attach Files
Upload files using the provided presigned URL link.
Files are stored in S3 and linked to the task.
Notifications
Receive email notifications for task updates (via SQS queue processing, if configured).
Check your inbox for alerts.



Task Management System on AWS Project Report
This report provides an in-depth overview of the Task Management System on AWS developed to meet the requirements outlined in the project documentation. The system leverages AWS services to enable user authentication, task management, file attachments, notifications, and monitoring. The project with the React frontend deployed on an Amazon Linux EC2 instance and backend logic integrated with serverless components.
1. Project Overview
The Task Management System aims to deliver a fully functional web application hosted on AWS, featuring secure user authentication, task CRUD (Create, Read, Update, Delete) operations, file attachment support, asynchronous notifications, and performance monitoring. Key AWS services utilized include Amazon Cognito for authentication, EC2 for hosting, DynamoDB and RDS for data storage, Lambda and API Gateway for backend logic, S3 for file storage, SQS for notifications, and CloudWatch for monitoring.
2. Design Decisions
The architecture of the Task Management System was designed with scalability, security, and efficiency in mind. Key decisions include:
Architecture: A hybrid approach was adopted, combining serverless backend components (Lambda, API Gateway) with a traditional EC2 instance hosting the React frontend via Nginx. This balances the cost-effectiveness of serverless computing with the flexibility of EC2 for frontend deployment.
Data Storage: DynamoDB was chosen for non-relational task metadata (e.g., task-management-dynamo table) due to its low-latency retrieval, while RDS (MySQL) manages relational data (e.g., task_user table) for user-task relationships. S3 stores attachments, ensuring scalability for file uploads.
Authentication: Amazon Cognito was implemented to provide secure sign-up, sign-in, and access control, utilizing the sub attribute for ownership validation across DynamoDB and RDS.
Deployment: The React app was deployed on an Amazon Linux EC2 instance, selected for its native AWS compatibility and lightweight resource usage, with Nginx serving the static build folder.
Asynchronous Processing: SQS was integrated to queue notification messages, though full implementation (email delivery) .
Monitoring: CloudWatch was configured to log errors and track performance metrics for Lambda, API Gateway, and EC2, providing actionable insights.
3. Implementation
The implementation reflects the design decisions with the following achievements:
The React frontend was successfully deployed on an EC2 instance running Amazon Linux 2023, using Nginx to serve the build folder generated by npm run build
Lambda functions (CreateTaskFunction, UpdateTaskFunction, DeleteTaskFunction, GetTaskFunction) were developed and deployed, integrating with DynamoDB for task metadata and RDS for relational data. Ownership validation ensures only the task creator (via Cognito sub) can modify tasks.
File attachments are handled via S3 presigned URLs, allowing secure uploads and storage.
API Gateway endpoints were configured to trigger Lambda functions, enabling RESTful task operations.
4. Challenges Encountered
Several challenges were encountered during development and deployment:
Ownership Mismatch: Tasks were initially created with created_by: test-user-id instead of the Cognito sub, causing 403 Unauthorized errors in functions like GetTaskFunction. 
EC2 Deployment Issues: Permission errors and Nginx misconfigurations (e.g., incorrect root path) prevented the React app from loading, requiring file ownership adjustments and try_files fixes.
Time Constraints: Real-time debugging across chat sessions delayed some integrations, particularly SQS notifications.
5. Solutions and Workarounds
The challenges were addressed with the following solutions:
Ownership Fix: The created_by field in DynamoDB and user_id in RDS were manually updated to match the Cognito sub. The CreateTaskFunction was enhanced with a debug log to enforce correct sub usage.
EC2 Troubleshooting: File permissions were fixed with sudo chown -R ec2-user:ec2-user /home/ec2-user/my-react-app, and the Nginx config was adjusted with try_files $uri $uri/ /index.html to handle React Router.
Debugging: CloudWatch logs were utilized to identify and resolve issues iteratively, improving efficiency despite time constraints.
6. Key Takeaways
The project provided valuable insights and lessons:
Cloud Flexibility: AWS services like Lambda and EC2 offer scalable solutions, but precise configuration is critical.
Data Consistency: Maintaining sync between DynamoDB and RDS requires careful schema alignment and ownership validation, enhancing security and reliability.
Future Improvements: Full SQS notification integration, HTTPS setup with Certbot, and Lambda performance optimization are recommended for production readiness.

