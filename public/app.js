// File: public/app.js
document.addEventListener('DOMContentLoaded', () => {
    const contactsList = document.getElementById('contactsList');
    const messagesList = document.getElementById('messagesList');
    const contactInfo = document.getElementById('contactInfo');
    const contactDetails = document.getElementById('contactDetails');
    const composeMessage = document.getElementById('composeMessage');
    const messageDetails = document.getElementById('messageDetails');
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    const sendOtpBtn = document.getElementById('sendOtpBtn');
    const otpMessage = document.getElementById('otpMessage');
    const errorModal = new bootstrap.Modal(document.getElementById('errorModal'));
    const errorModalBody = document.getElementById('errorModalBody');

    let selectedContact = null;

    function showError(message) {
        errorModalBody.textContent = message;
        errorModal.show();
    }

    function fetchContacts() {
        fetch('/api/contacts')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch contacts');
                }
                return response.json();
            })
            .then(contacts => {
                contactsList.innerHTML = contacts.map(contact => `
                    <div class="col-md-4 mb-3">
                        <div class="card contact-card" onclick="showContactInfo(${contact.id})">
                            <div class="card-body">
                                <h5 class="card-title">${contact.firstName} ${contact.lastName}</h5>
                                <p class="card-text"><i class="bi bi-telephone"></i> ${contact.phoneNumber}</p>
                            </div>
                        </div>
                    </div>
                `).join('');
            })
            .catch(error => {
                console.error('Error:', error);
                showError('Failed to load contacts. Please try again later.');
            });
    }

    function fetchMessages() {
        fetch('/api/messages')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch messages');
                }
                return response.json();
            })
            .then(messages => {
                messagesList.innerHTML = messages.map(message => `
                    <div class="card mb-2">
                        <div class="card-body">
                            <h5 class="card-title">${message.firstName} ${message.lastName}</h5>
                            <p class="card-text">OTP: ${message.otp}</p>
                            <p class="card-text"><small class="text-muted">${new Date(message.timestamp).toLocaleString()}</small></p>
                        </div>
                    </div>
                `).join('');
            })
            .catch(error => {
                console.error('Error:', error);
                showError('Failed to load messages. Please try again later.');
            });
    }

    function updateContact(contactId, updatedData) {
        fetch(`/api/contacts/${contactId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedData),
        })
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to update contact');
          }
          return response.json();
        })
        .then(data => {
          console.log('Contact updated:', data);
          fetchContacts(); // Refresh the contacts list
        })
        .catch(error => {
          console.error('Error updating contact:', error);
          showError('Failed to update contact. Please try again.');
        });
      }

      window.showContactInfo = (contactId) => {
        fetch(`/api/contacts/${contactId}`)
          .then(response => {
            if (!response.ok) {
              throw new Error('Failed to fetch contact information');
            }
            return response.json();
          })
          .then(contact => {
            selectedContact = contact;
            contactDetails.innerHTML = `
              <form id="editContactForm">
                <div class="mb-3">
                  <label for="firstName" class="form-label">First Name</label>
                  <input type="text" class="form-control" id="firstName" value="${contact.firstName}">
                </div>
                <div class="mb-3">
                  <label for="lastName" class="form-label">Last Name</label>
                  <input type="text" class="form-control" id="lastName" value="${contact.lastName}">
                </div>
                <div class="mb-3">
                  <label for="phoneNumber" class="form-label">Phone Number</label>
                  <input type="tel" class="form-control" id="phoneNumber" value="${contact.phoneNumber}">
                </div>
                <button type="submit" class="btn btn-primary">Update Contact</button>
              </form>
            `;
            contactInfo.classList.remove('hidden');
            composeMessage.classList.add('hidden');
      
            // Add event listener for form submission
            document.getElementById('editContactForm').addEventListener('submit', function(e) {
              e.preventDefault();
              const updatedData = {
                firstName: document.getElementById('firstName').value,
                lastName: document.getElementById('lastName').value,
                phoneNumber: document.getElementById('phoneNumber').value
              };
              updateContact(contact.id, updatedData);
            });
          })
          .catch(error => {
            console.error('Error:', error);
            showError('Failed to load contact information. Please try again.');
          });
      };

    sendMessageBtn.addEventListener('click', () => {
        if (selectedContact) {
            messageDetails.innerHTML = `
                <p><strong>To:</strong> ${selectedContact.firstName} ${selectedContact.lastName}</p>
                <p><strong>Phone:</strong> ${selectedContact.phoneNumber}</p>
            `;
            const otp = Math.floor(100000 + Math.random() * 900000);
            otpMessage.value = `Hi. Your OTP is: ${otp}`;
            contactInfo.classList.add('hidden');
            composeMessage.classList.remove('hidden');
        }
    });

    sendOtpBtn.addEventListener('click', () => {
        if (selectedContact) {
            fetch('/api/send-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ contactId: selectedContact.id }),
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to send OTP');
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    alert('OTP sent successfully!');
                    composeMessage.classList.add('hidden');
                    fetchMessages();
                } else {
                    throw new Error(data.message || 'Failed to send OTP');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showError('Failed to send OTP. Please try again later.');
            });
        }
    });

    // Initialize tabs
    const triggerTabList = [].slice.call(document.querySelectorAll('#myTab button'))
    triggerTabList.forEach(function (triggerEl) {
        const tabTrigger = new bootstrap.Tab(triggerEl)
        triggerEl.addEventListener('click', function (event) {
            event.preventDefault()
            tabTrigger.show()
        })
    })

    // Fetch initial data
    fetchContacts();
    fetchMessages();
});