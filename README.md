# DeployLift

DeployLift is an open-source project for deploying, managing, and analyzing web projects with a simple and intuitive interface. Built with Node.js, Express, MongoDB, and Redis, it allows users to upload projects, manage deployments, and view analytics for their hosted sites.

## Features

- **User Authentication**: Secure login and registration system.
- **Project Management**: Create, view, and manage multiple web projects.
- **File Uploads**: Upload project files and assets for deployment.
- **Deployment Management**: Deploy new versions and set active deployments.
- **Analytics Dashboard**: View live visitor counts and project statistics.
- **Redis Integration**: Fast caching and analytics using Redis.
- **MongoDB Models**: Store user, project, and deployment data.
- **EJS Views**: Clean and responsive UI for all major actions.

## Getting Started

### Prerequisites
- Node.js (v16+ recommended)
- MongoDB instance
- Redis instance (Upstash or local)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/parasnikum/deploylift.git
   cd deploylift
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Configure environment variables:**
   - Create a `.env` file in the root directory.
   - Add your MongoDB URI, Redis URL, and JWT secret:
     ```env
     MONGODB_URI=your_mongodb_uri
     REDIS_URL=your_redis_url
     JWT_SECRETE=your_jwt_secret
     ```
4. **Start the server:**
   ```bash
   npm start
   ```
   The server will run at `http://127.0.0.1:3025`.


## API Endpoints

- `GET /` - Home (requires authentication)
- `GET /login` - Login page
- `POST /login` - Login action
- `GET /register` - Registration page
- `POST /register` - Register action
- `POST /upload` - Upload project files
- `POST /newproject` - Create new project
- `GET /projects` - List user projects
- `GET /newproject` - New project page
- `GET /:projectID/deployments` - List deployments for a project
- `POST /setDeploy/:projectID` - Set active deployment
- `GET /analytics/:projectId` - View analytics for a project

## Contributing

Contributions are welcome! Please open issues or submit pull requests for improvements, bug fixes, or new features.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a pull request

## License

This project is licensed under the MIT License.

## Maintainers

- [Paras Nikum](https://github.com/parasnikum/)

