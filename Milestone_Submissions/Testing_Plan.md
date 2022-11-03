# Powder Programmers' Testing Plan

---

## Register Page
* User should be able to insert valid credentials and be re-routed to login page upon successful registration.
* Upon inserting invalid data the user should be given a specific warning to help correct the error.
* If a user submits a username that is already in the database they should be given a warning that the username is invalid.

---

## Login Page
### Login Testing
* User will login with credentials from a pre-created user
* User will be on CU campus and on CU wifi
* Should return a user page showing user data
* Session created and saves user

### Login Testing 2
* User will login with incorrect credentials
* User will be on CU campus and on CU wifi
* Should return “Incorrect login data”
* Remain on login page

---

## Discover Page
* User will be able to navigate to discover page and stay logged in.
* Able to apply filters to display data on discovery page and correct expected data will be returned.
* User will be able to logout from the discovery page within 2 clicks.
* Working navbar can take user to all pages on the website with proper routing.
* Properly displayed data in cards that are informative, correct, and easy to read and navigate.

---

## Valid Test Results
Valid test results will be the working site and valid login and logout operations.

---

## Testing Environment
Testing will be live testing of the website and will be conducted on campus due to the website being locally hosted on the school wifi.

---