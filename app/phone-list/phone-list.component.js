'use strict';

// Register `phoneList` component, along with its associated controller and template
angular.
  module('phoneList').
  component('phoneList', {
    templateUrl: 'phone-list/phone-list.template.html',
    controller: ['Phone',
      function PhoneListController(Phone) {
        var self = this;
        
        self.phones = Phone.query();
        self.orderProp = 'age';
        
        /**
         * Send data to Angular MFE
         * This demonstrates how to pass data from AngularJS to Angular
         */
        self.sendDataToAngular = function() {
          // Create a sample data object
          var dataToSend = {
            message: 'Hello from AngularJS!',
            phoneCount: self.phones.length,
            orderBy: self.orderProp,
            timestamp: new Date().toISOString(),
            user: {
              name: 'John Doe',
              role: 'Admin',
              id: 12345
            },
            selectedPhones: self.phones.slice(0, 3).map(function(phone) {
              return {
                id: phone.id,
                name: phone.name,
                snippet: phone.snippet
              };
            })
          };
          
          var eventDetail = {
            source: 'AngularJS Phone List',
            data: dataToSend
          };
          
          // Dispatch custom event with data
          var event = new CustomEvent('angularjs-to-angular-data', {
            detail: eventDetail
          });
          
          // Store for Angular to pick up even if it loads later
          window._angularJsToAngularData = eventDetail;
          console.log('💾 [STORAGE] Stored data in window._angularJsToAngularData');
          
          window.dispatchEvent(event);
          console.log('📡 [EVENT] Dispatched "angularjs-to-angular-data" event');
          
          console.log('📤 AngularJS: Sent data to Angular MFE:', dataToSend);
          
          // Show confirmation message
          alert('✅ Data sent to Angular MFE!\n\nGo to "EUI Microfrontend > EUI Home" to see the received data.');
        };
        
        /**
         * Send specific phone data to Angular
         */
        self.sendPhoneToAngular = function(phone) {
          var eventDetail = {
            source: 'AngularJS Phone List',
            data: {
              type: 'phone-selection',
              phone: {
                id: phone.id,
                name: phone.name,
                snippet: phone.snippet,
                imageUrl: phone.imageUrl,
                age: phone.age
              },
              selectedAt: new Date().toISOString()
            }
          };
          
          var event = new CustomEvent('angularjs-to-angular-data', {
            detail: eventDetail
          });
          
          // Store for Angular to pick up even if it loads later
          window._angularJsToAngularData = eventDetail;
          console.log('💾 [STORAGE] Stored phone data in window._angularJsToAngularData');
          
          window.dispatchEvent(event);
          console.log('📡 [EVENT] Dispatched "angularjs-to-angular-data" event');
          
          console.log('📤 AngularJS: Sent phone data to Angular:', phone.name);
        };
      }
    ]
  });
