# EquipU Django backend

This backend reproduces the currently implemented Node.js API without changing
the existing MongoDB data or the React application.

## Setup

From this directory:

```powershell
python -m pip install -r requirements.txt
```

Set the MongoDB connection variables in `django_backend/.env`. A placeholder
file is included; replace `MONGO_URI` with the configuration you provide:

```powershell
$env:MONGO_URI = "mongodb+srv://..."
```

`MONGO_DATABASE` is optional when the MongoDB URI includes a default database.
If the URI has no database path, the backend uses MongoDB's `test` default,
matching the current Mongoose connection. The collection defaults to `products`;
override it with `MONGO_COLLECTION` only if the existing database uses a
different collection.

Start the server:

```powershell
python manage.py runserver 5000
```

The React app already points to `http://localhost:5000` through
`frontend/.env`. Start it separately with:

```powershell
cd ..\frontend
npm install
npm run dev
```

## Implemented API

- `GET /`
- `GET /api/health`
- `GET /api/products`
- `POST /api/products`

The response fields and status codes match the current Node.js implementation.
No authentication, orders, payments, or user-management endpoints have been
added.

The Django SQLite setting is only present because Django requires a database
configuration. Product data is read and written through PyMongo in the existing
MongoDB collection. Do not run destructive seed scripts or database resets.

If the configured collection is empty, the non-destructive bootstrap command can
insert the catalog once:

```powershell
python manage.py bootstrap_products
```
