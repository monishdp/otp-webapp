A Contacts web app with SMS OTP delivery system
Steps to execute the project:

Step 1:
Create a new directory for your project.
Initialize a new Node.js project by running npm init -y in the project directory.
Install the required dependencies by running:
npm install express body-parser twilio sqlite3 express-rate-limit

Step-2:

Create a file named app.js in the root directory and paste the updated server-side code into it.
Create a public folder in the root directory.
Inside the public folder, create index.html and app.js files, and paste the respective updated front-end code into them.

Step-3:

Sign up for a Twilio account if you haven't already.
Get your Account SID and Auth Token from the Twilio console.
Replace 'YOUR_ACCOUNT_SID' and 'YOUR_AUTH_TOKEN' in the server-side app.js file with your actual Twilio credentials.
Replace 'YOUR_TWILIO_PHONE_NUMBER' with the phone number provided by Twilio.
Add the number +919810153260 to your Twilio account's list of verified numbers that can receive SMS.

Step-4:

Run the application:

Open a terminal in your project directory.
Run the command node app.js to start the server.
Open a web browser and navigate to http://localhost:3000 to use the application.
