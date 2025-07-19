# Vue 3 + TypeScript +# Document Tracking System

A modern web-based document tracking system built with Vue.js and PocketBase. This application helps organizations manage and track documents throughout their lifecycle, from creation to completion.

## Features

- Document Management
  - Create, edit, and delete documents
  - Track document status (Pending, Verified, Completed)
  - Document verification workflow
  - Document history and timeline

- User Authentication
  - Secure login system
  - User registration
  - Password recovery
  - Role-based access control

- Search and Filtering
  - Advanced search functionality
  - Document filtering by status, date, and other criteria
  - Real-time document updates

- Notifications
  - Real-time notifications for document status changes
  - User activity notifications
  - System alerts and warnings

## Tech Stack

- **Frontend**
  - Vue.js 3
  - TypeScript
  - PrimeVue UI Components
  - Tailwind CSS
  - Vue Router
  - Pinia for state management

- **Backend**
  - PocketBase
  - SignalR for real-time updates
  - XLSX for document handling

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or pnpm package manager
- PocketBase server running locally

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd tracking-system
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Ensure PocketBase is running:
```bash
# Start PocketBase server
pocketbase serve
```

### Environment Configuration

The application expects PocketBase to be running on `http://127.0.0.1:8090`. If you need to change this, modify the PocketBase instance URL in the source code.

## Project Structure

```
src/
├── components/          # Reusable Vue components
│   └── TopNav.vue      # Navigation component
├── pages/              # Page components
│   ├── HomeView.vue    # Main dashboard
│   ├── LoginView.vue   # Login page
│   ├── SettingsView.vue # Settings page
│   └── SignupView.vue  # Registration page
├── stores/             # Pinia stores
│   └── searchStore.ts  # Search functionality
├── main.ts            # Application entry point
└── router.ts          # Vue Router configuration
```

## Usage

1. **Login/Registration**
   - Access the application through your web browser
   - Register a new account or login with existing credentials

2. **Document Management**
   - Create new documents with required fields
   - View document status and history
   - Verify documents through the verification workflow
   - Track document progress in real-time

3. **Search and Filter**
   - Use the search bar to find documents
   - Filter documents by status, date, and other criteria
   - View filtered results in real-time

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details

## Acknowledgments

- PrimeVue for the UI components
- PocketBase for the backend database
- Vue.js for the frontend framework
- All contributors who have helped improve this project
