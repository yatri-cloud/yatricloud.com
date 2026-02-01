# Yatris Dual-Sheet Architecture & Setup

This document outlines the new architecture using **two separate Google Spreadsheets** and **two separate Apps Scripts** for Authentication and Event Registration.

---

## 1. Authentication System (Users)

*   **Purpose:** Handles user sign-up, login, and profile management.
*   **Spreadsheet Name:** `Yatris Users` (or similar)
*   **Spreadsheet ID:** `13OmomLAxfEoHBiqLLlPUw1TuM3CWUZQ4w6UJY6qSd-E`
*   **Tab Name:** `users`

### Sheet Headers (Row 1)
Copy and paste these exact headers into **Row 1** of the `users` tab:

| Column | Header Name | Description |
| :--- | :--- | :--- |
| **A** | `Email` | User's unique email address |
| **B** | `Password Hash` | MD5 hash of password + email salt |
| **C** | `Full Name` | User's display name |
| **D** | `LinkedIn URL` | Link to LinkedIn profile |
| **E** | `Photo URL` | Link to profile picture |
| **F** | `Country` | User's country |
| **G** | `Token` | Active session token |
| **H** | `Token Expiry` | Date/Time when the token expires |
| **I** | `Created At` | Account creation timestamp |
| **J** | `Last Login` | Last successful login timestamp |
| **K** | `Status` | Account status (e.g., 'active') |
| **L** | `Phone Number` | User's phone number |

### Apps Script File
*   **File:** `appscript/yatris-users.gs`
*   **Deployment:** Web App (Execute as Me, Access: Anyone)

---

## 2. Event Registration System (Attendees)

*   **Purpose:** Handles user registration for specific events.
*   **Spreadsheet Name:** `Yatris Events` (or similar)
*   **Spreadsheet ID:** `1UHHE0_Lew9dP-p_dlo6FWP-nlIMIF20KF9AxEihAaiw`
*   **Tab Name:** `attendees`

### Sheet Headers (Row 1)
Copy and paste these exact headers into **Row 1** of the `attendees` tab:

| Column | Header Name | Description |
| :--- | :--- | :--- |
| **A** | `Event ID` | Unique ID of the event |
| **B** | `Event Name` | Name of the event |
| **C** | `User Email` | Email of the registered user |
| **D** | `User Name` | Name of the user at time of registration |
| **F** | `Tickets` | Number of tickets reserved |
| **G** | `Total Amount` | Total cost (if applicable) |
| **H** | `Attendees Data` | JSON string containing details of other attendees |
| **I** | `Status` | Registration status (e.g., 'confirmed') |

### Apps Script File
*   **File:** `appscript/yatris-attendees.gs`
*   **Deployment:** Web App (Execute as Me, Access: Anyone)

---

## 3. Integration Setup

To connect these sheets to your frontend application:

1.  **Deploy both scripts** as Web Apps.
2.  Get the **Current web app URL** for each.
3.  Update your `src/lib/yatris-api.ts` or `.env` files with these URLs.

```typescript
// Example configuration in yatris-api.ts
const AUTH_API_URL = "https://script.google.com/macros/s/.../exec"; // From Users Script
const EVENTS_API_URL = "https://script.google.com/macros/s/.../exec"; // From Attendees Script
```
