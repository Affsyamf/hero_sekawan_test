# Hero Sekawan

## Setting Up

### Backend

1. Make sure **Python 3.13** is installed (older versions may not work).
2. Navigate to the backend folder:
   ```
   cd hero-sekawan/backend
   ```
3. Create a virtual environment:

   ```
   python -m venv .venv
   ```

4. Activate the virtual environment:

   ```
   .venv\Scripts\activate
   ```

5. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

---

### Frontend

1. Make sure **Node.js** is installed
   [Download Node.js](https://nodejs.org/en/download)
2. Navigate to the frontend folder:

   ```
   cd hero-sekawan/frontend
   ```

3. Install dependencies:

   ```
   npm install
   ```

---

### Database

1. Ensure backend dependencies are installed.
2. Download and install **PostgreSQL**
   [Download PostgreSQL](https://www.postgresql.org/download/)
   _(Include pgAdmin for easier management)_
3. Create a new **user** and **database**.
4. Create a new file named `.env` inside the backend folder:

   ```
   hero-sekawan/backend/.env
   ```

5. Add your PostgreSQL configuration inside your `.env`:

   ```
   POSTGRES_USER={your_username}
   POSTGRES_PASSWORD={your_password}
   POSTGRES_HOST=localhost
   POSTGRES_PORT={defaults to 5432}
   POSTGRES_DB={your_database_name}
   ```

6. Run database migrations:
   ```
   cd hero-sekawan/backend
   alembic upgrade head
   ```

---

## Running the Project

### Backend

1. Navigate to backend folder
2. Start virtual environment
   ```
   .venv\Scripts\activate
   ```
3. Run Uvicorn
   ```
   uvicorn main:app --host localhost --reload --port 8000
   ```

### Frontend

1. Navigate to frontend folder
2. Run `npm run dev`
