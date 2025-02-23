# FedDict - Federal Proposal Dictionary

FedDict is a web application that serves as a searchable dictionary of federal proposal terms and definitions. It helps users quickly find and understand terminology commonly used in federal proposals.

## Features

- **Search Functionality**: Search terms by keyword or phrase
- **Category Filtering**: Filter terms by categories
- **Pagination**: Browse through terms efficiently
- **Admin Panel**: Secure interface for managing terms
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

### Frontend
- React.js
- TailwindCSS
- React Router
- React Toastify
- Vercel (Hosting)

### Backend
- FastAPI (Python)
- SQLAlchemy
- SQLite Database
- Render (Hosting)

## Live Demo

- Frontend: [https://feddict.vercel.app](https://feddict.vercel.app)
- Backend API: [https://feddict-api.onrender.com](https://feddict-api.onrender.com)

## Local Development

### Prerequisites
- Node.js (v14 or higher)
- Python 3.8 or higher
- pip (Python package manager)

### Backend Setup

1. Clone the repository:
```

git clone https://github.com/yourusername/FedDict.git
cd FedDict/backend
```

2. Create and activate a virtual environment:
```

python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```

pip install -r requirements.txt
```

4. Run the development server:
```

uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```

cd frontend
```

2. Install dependencies:
```

npm install
```

3. Create a `.env` file:
```

REACT_APP_API_URL=http://localhost:8000
```

4. Start the development server:
```

npm start
```

The application will be available at `http://localhost:3000`

## API Documentation

### Endpoints

- `GET /terms/`: Get paginated list of terms
- `GET /terms/?search={query}`: Search terms
- `GET /terms/?category={category}`: Filter by category
- `GET /categories/`: Get list of categories
- `POST /terms/`: Add new term (Admin only)
- `PUT /terms/{id}`: Update term (Admin only)
- `DELETE /terms/{id}`: Delete term (Admin only)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- FastAPI documentation
- React documentation
- TailwindCSS documentation

## Database
- MongoDB Atlas (Cloud hosted)
- Persistent data storage
- Automatic backups
- Data validation
- Unique term constraints

## Environment Variables
Required environment variables:
- `MONGODB_URL`: MongoDB connection string

## Free Tier Limitations & Optimizations

### MongoDB Atlas (Free M0)
- Storage: 512MB limit
- Connections: 100 max
- Region: Single region

### Render (Free)
- Memory: 512MB RAM
- Inactive Spin-down: 15 minutes
- Build Minutes: 400/month

### Optimizations
- Database caching implemented
- Request monitoring for slow queries
- Storage usage tracking
- Automatic cleanup for old data

### Cold Start Handling
- Server spins down after 15 minutes of inactivity
- Initial request may take 10-30 seconds
- Subsequent requests are fast
- Implemented:
  - Graceful loading states
  - Background warm-up tasks
  - Data caching
  - Activity tracking

### Bulk Upload
- Support for CSV and JSON file uploads
- CSV format: term,definition,category
- JSON format: array of objects with term, definition, category
- Background processing for large files
- Duplicate checking and validation
- Error reporting for failed entries
