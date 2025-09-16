# IT Asset Management System

A comprehensive web application for managing IT assets, transfers, and allocations in an organization.

## Features

- **Asset Management**: Track laptops, monitors, printers, and other IT equipment
- **Transfer Workflow**: Complete workflow for asset transfers between users and locations
- **User Management**: Role-based access control (Admin/User)
- **Location Management**: Organize assets by physical locations
- **Analytics & Reporting**: Dashboard with insights and reports
- **Secure Authentication**: JWT-based authentication system

## Technology Stack

### Backend
- **FastAPI**: Modern Python web framework
- **SQLAlchemy**: Database ORM
- **PostgreSQL**: Database (configurable to SQLite for development)
- **JWT**: Authentication tokens
- **Pydantic**: Data validation

### Frontend
- **React**: User interface library
- **TypeScript**: Type-safe JavaScript
- **Material-UI**: Component library
- **React Router**: Client-side routing
- **Axios**: HTTP client

## Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- PostgreSQL (optional, can use SQLite for development)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create environment file:
   ```bash
   cp .env.example .env
   ```

5. Update the `.env` file with your database configuration. For development, you can use SQLite:
   ```
   DATABASE_URL=sqlite:///./asset_management.db
   ```

   **Important Security Note**: Never commit sensitive credentials to version control. 
   For Firebase integration, use environment variables instead of service account files:
   
   ```bash
   # Set Firebase credentials as environment variables
   export FIREBASE_PROJECT_ID=your-project-id
   export FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   export FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
   # ... other Firebase variables (see .env.example)
   ```

6. Initialize the database:
   ```bash
   python init_db.py
   ```

7. Start the development server:
   ```bash
   uvicorn main:app --reload
   ```

The API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

The application will be available at `http://localhost:3000`

## Default Credentials

After running the database initialization, you can log in with:

- **Admin User**: 
  - Username: `admin`
  - Password: `admin`

- **Regular User**:
  - Username: `user`
  - Password: `user`

## API Documentation

Once the backend is running, you can access the interactive API documentation at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Project Structure

```
inventory/
├── backend/
│   ├── app/
│   │   ├── api/          # API endpoints
│   │   ├── core/         # Core configuration
│   │   ├── models/       # Database models
│   │   └── services/     # Business logic
│   ├── main.py           # FastAPI application
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── contexts/     # React contexts
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   └── types/        # TypeScript types
│   └── package.json
└── README.md
```

## Features Overview

### For Administrators
- View comprehensive dashboard with system statistics
- Manage all assets in the organization
- Process asset transfer requests
- Manage users and locations
- Access analytics and reporting

### For Regular Users
- View assigned assets
- Request asset transfers
- Track transfer request status
- View basic dashboard information

## Development

### Backend Development
- The FastAPI server supports hot reloading during development
- API endpoints are organized by functionality in the `app/api/` directory
- Database models are defined in `app/models/database.py`

### Frontend Development
- React application with TypeScript for type safety
- Material-UI components for consistent design
- React Router for navigation
- Context API for state management

## Deployment

For production deployment:

1. Update environment variables with production values
2. Use a production PostgreSQL database
3. Build the React application: `npm run build`
4. Configure a reverse proxy (nginx) to serve both frontend and backend
5. Use a production WSGI server like Gunicorn for the FastAPI backend

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
