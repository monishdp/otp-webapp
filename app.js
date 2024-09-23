// File: app.js
const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const rateLimit = require("express-rate-limit");

const app = express();
const port = 3000;

// Twilio configuration
const accountSid = 'ACb267354738a59f6c30ca3f2462b22050';
const authToken = '91d74712718aacd7a7e7231c74ed7e24';
const client = require('twilio')(accountSid, authToken);
const twilioPhoneNumber = '+918884637627';

//const accountSid = 'ACb267354738a59f6c30ca3f2462b22050';
//const authToken = '[AuthToken]';
//const client = require('twilio')(accountSid, authToken);

//client.verify.v2.services("VA227014bd266029d9f60cbb8bc38bc2a4")
  //    .verifications
    //  .create({to: '+918884637627', channel: 'sms'})
      //.then(verification => console.log(verification.sid));

app.use(bodyParser.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, path, stat) => {
    if (path.endsWith('.js')) {
      res.set('Content-Type', 'application/javascript');
    }
  }
}));

// SQLite database setup
const db = new sqlite3.Database('./contacts.db', (err) => {
  if (err) {
    console.error('Error opening database', err);
  } else {
    console.log('Database connected');
    db.run(`CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firstName TEXT,
      lastName TEXT,
      phoneNumber TEXT
    )`, [], (err) => {
      if (err) {
        console.error('Error creating contacts table', err);
      } else {
        // Check if contacts table is empty
        db.get("SELECT COUNT(*) as count FROM contacts", [], (err, row) => {
          if (err) {
            console.error('Error checking contacts count', err);
          } else if (row.count === 0) {
            // Insert sample contacts
            const sampleContacts = [
              ['John', 'Doe', '+1234567890'],
              ['Jane', 'Smith', '+1987654321'],
              ['Alice', 'Johnson', '+1122334455'],
              ['Bob', 'Williams', '+1555666777'],
              ['Charlie', 'Brown', '+1999888777'],
              ['Monish', 'DP', '+917892860645']
            ];
            
            const insertStmt = db.prepare("INSERT INTO contacts (firstName, lastName, phoneNumber) VALUES (?, ?, ?)");
            sampleContacts.forEach(contact => {
              insertStmt.run(contact, (err) => {
                if (err) console.error('Error inserting sample contact', err);
              });
            });
            insertStmt.finalize();
            console.log('Sample contacts inserted');
          }
        });
      }
    });
    
    
    app.put('/api/contacts/:id', (req, res) => {
      const { firstName, lastName, phoneNumber } = req.body;
      const { id } = req.params;
      
      db.run(
        'UPDATE contacts SET firstName = ?, lastName = ?, phoneNumber = ? WHERE id = ?',
        [firstName, lastName, phoneNumber, id],
        function(err) {
          if (err) {
            console.error('Error updating contact:', err);
            res.status(500).json({ error: 'Failed to update contact' });
            return;
          }
          res.json({ message: 'Contact updated successfully', changes: this.changes });
        }
      );
    });
  }
});

// Rate limiting setup
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api', limiter);

// Routes
app.get('/api/contacts', (req, res) => {
  db.all('SELECT * FROM contacts', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: 'Failed to retrieve contacts' });
      return;
    }
    res.json(rows);
  });
});

// ... (rest of the routes remain the same)
app.get('/api/contacts/:id', (req, res) => {
    db.get('SELECT * FROM contacts WHERE id = ?', [req.params.id], (err, row) => {
      if (err) {
        res.status(500).json({ error: 'Failed to retrieve contact' });
        return;
      }
      if (!row) {
        res.status(404).json({ error: 'Contact not found' });
        return;
      }
      res.json(row);
    });
  });
  
  app.post('/api/send-otp', async (req, res) => {
    const { contactId } = req.body;
    
    db.get('SELECT * FROM contacts WHERE id = ?', [contactId], async (err, contact) => {
      if (err) {
        console.error('Database error:', err);
        res.status(500).json({ success: false, message: 'Database error' });
        return;
      }
      if (!contact) {
        res.status(404).json({ success: false, message: 'Contact not found' });
        return;
      }
  
      const otp = Math.floor(100000 + Math.random() * 900000);
      const message = `Hi. Your OTP is: ${otp}`;
  
      try {
        const twilioResponse = await client.messages.create({
          body: message,
          from: twilioPhoneNumber,
          to: contact.phoneNumber
        });
        console.log('Twilio response:', twilioResponse);
  
        db.run('INSERT INTO messages (contactId, otp) VALUES (?, ?)', [contactId, otp], function(err) {
          if (err) {
            console.error('Error saving message to database:', err);
            res.status(500).json({ success: false, message: 'Failed to save message' });
            return;
          }
          res.json({ success: true, message: 'OTP sent successfully' });
        });
      } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({ success: false, message: 'Failed to send OTP', error: error.message });
      }
    });
  });
  
  app.get('/api/messages', (req, res) => {
    db.all(`
      SELECT messages.*, contacts.firstName, contacts.lastName 
      FROM messages 
      JOIN contacts ON messages.contactId = contacts.id 
      ORDER BY messages.timestamp DESC
    `, [], (err, rows) => {
      if (err) {
        res.status(500).json({ error: 'Failed to retrieve messages' });
        return;
      }
      res.json(rows);
    });
  });

// Catch-all route to serve index.html for any unmatched routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});