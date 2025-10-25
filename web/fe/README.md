# Smart Health Admin — Frontend

React (Vite) admin UI implementing the APIs for Login/Logout and Doctor management.

## What’s included

- Login/Logout (JWT) using `/api/v1/login/` and `/api/v1/logout/`
- Doctor CRUD under `/api/v1/admin/doctors/`:
  - List with pagination, search, filter by specialization
  - Create, Update, Delete
  - Detail/edit screen styled similar to the provided mock

## Configure backend URL

Create a `.env` file in `web/fe` (same folder as `package.json`):

```
VITE_API_BASE_URL=https://domain.com
```

If your frontend and backend share the same origin, you can omit this and calls will use relative paths.

## Install & run (Windows cmd)

```
cd web\fe
npm install
npm run dev
```

Open http://localhost:5173 and navigate to `/admin/login`.

## Build for production

```
npm run build
```

## Key files

- `src/utils/api.js` — Axios client, token storage, endpoints
- `src/utils/routers.js` — Route constants
- `src/layouts/admin/*` — Sidebar + header layout and SCSS (purple theme)
- `src/pages/admin/LoginPage.jsx` — Login form
- `src/pages/admin/doctors/DoctorList.jsx` — Table with pagination/search/filter
- `src/pages/admin/doctors/DoctorForm.jsx` — Create/Update form and detail-like panel
- `src/App.jsx` — Router + protected routes

## Notes

- Access token is stored in `localStorage` (`access_token`) and sent as `Authorization: Bearer <token>`.
- Backend error messages are shown when available (400/401/403/404/429/500).
