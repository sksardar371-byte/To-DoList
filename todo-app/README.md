# To-Do Task Manager

```
todo-app/
├── frontend/   HTML + CSS + JavaScript (no build step)
│   ├── index.html
│   ├── css/style.css      layout, 12 color themes (6 light + 6 dark, pick in Settings), dark mode, dark mode, responsive
│   └── js/
│       ├── config.js      default API_URL (also editable from the gear icon)
│       ├── api.js         all REST calls (fetch)
│       ├── utils.js       formatting, icons, toasts
│       └── app.js         state, rendering, events
├── backend/    Spring Boot + JPA + SQL database   (REST API)
└── api-tests.http
```

### Backend structure (layered, like a real project)
```
com.example.todo
├── TodoApplication
├── config/       WebConfig            -> CORS settings
├── controller/   TaskController       -> REST endpoints only (no logic)
├── service/      TaskService          -> interface (business operations)
│   └── impl/     TaskServiceImpl      -> business logic, transactions
├── repository/   TaskRepository       -> database access (Spring Data JPA)
│                 TaskSpecification    -> dynamic filter/search conditions
├── model/        Task, TaskStatus, Priority   -> entity + enums
├── dto/          TaskRequest, TaskResponse, StatusUpdateRequest, ErrorResponse
├── mapper/       TaskMapper           -> entity <-> DTO
└── exception/    ResourceNotFoundException, GlobalExceptionHandler
```
Request flow: `Controller -> Service -> Repository -> Database`, and results come back as DTOs.

## Run
**1. Backend** (needs JDK 17+ and Maven)
```
cd backend
mvn spring-boot:run
```
API runs at http://localhost:8080/api/tasks  
Database: H2 (SQL) saved in `backend/data/` so tasks stay after restart.
MySQL: `mvn spring-boot:run -Dspring-boot.run.profiles=mysql` (set `DB_URL`, `DB_USER`, `DB_PASSWORD`).
Tests: `mvn test`

**2. Frontend**
Open `frontend/index.html` in the browser (or right-click → *Open with Live Server* in VS Code).
If your backend is on a different URL, click the gear icon (Settings) in the app, or change `API_URL` in `frontend/js/config.js`.

## REST API
| Method | URL | What it does |
|---|---|---|
| GET | /api/tasks (?status=PENDING/COMPLETED &search=text) | view / filter / search |
| GET | /api/tasks/{id} | one task |
| POST | /api/tasks | add task (title required) |
| PUT | /api/tasks/{id} | update task |
| PATCH | /api/tasks/{id}/status | mark Pending / Completed |
| DELETE | /api/tasks/{id} | delete task |

## Deploy (bonus)
- Backend: `backend/Dockerfile` → deploy on Render / Railway (use a MySQL database there, because free disks are wiped).
- Frontend: upload `frontend/` to Netlify / GitHub Pages and set `API_URL` in `js/config.js` to your deployed backend URL (and set `CORS_ORIGINS` on the backend to your frontend URL).
