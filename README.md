# Invoice Generator

A professional invoice generator application built with React, Express, and MongoDB.

## Features

- Create and manage professional invoices
- Generate PDF invoices for download
- Store invoice data in MongoDB
- Responsive design for all devices
- Modern UI with dark mode

## Tech Stack

- **Frontend**: React.js, Next.js, TailwindCSS
- **Backend**: Express.js
- **Database**: MongoDB
- **PDF Generation**: PDF-lib
- **Form Handling**: React Hook Form, Zod
- **CI/CD**: GitHub Actions, Vercel

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- MongoDB Atlas account (or local MongoDB instance)

### Environment Setup

1. Clone the repository
2. Create a `.env` file in the root directory with the following variables:
   ```
   MONGODB_URI=your_mongodb_connection_string
   PORT=5000
   NODE_ENV=development
   ```
3. Create a `.env.local` file in the root directory with:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

### Installation

```bash
# Install dependencies
npm install --legacy-peer-deps

# Run the development server (frontend + backend)
npm run dev:full

# Or run them separately
npm run dev        # Frontend only
npm run dev:server # Backend only
```

### Building for Production

```bash
# Build the Next.js frontend
npm run build

# Start the production server
npm start

# Start the Express backend
npm run server
```

## Deployment

The application is configured for deployment on Vercel with the following setup:

1. Frontend: Deployed automatically via GitHub Actions to Vercel
2. Backend: Express API deployed as serverless functions on Vercel

### Required Environment Variables for Deployment

- `MONGODB_URI`: Your MongoDB connection string
- `NEXT_PUBLIC_API_URL`: The URL of your deployed API

## Project Structure

```
/
├── app/                  # Next.js app directory
│   ├── actions/          # Client-side actions
│   ├── components/       # React components
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions
├── components/           # Shared UI components
├── public/               # Static assets
├── server/               # Express backend
│   ├── models/           # MongoDB models
│   └── routes/           # API routes
├── .env                  # Server environment variables
├── .env.local            # Frontend environment variables
└── vercel.json           # Vercel deployment configuration
```
