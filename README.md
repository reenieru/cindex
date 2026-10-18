# Cindex

Cindex is a movie catalogue built with React, Vite, and Firebase. Browse featured
movies, explore the catalogue, and view or manage movie information.

## Requirements

- Node.js 20.19+ or 22.12+
- npm
- A Firebase project with Authentication and Cloud Firestore enabled

## Getting started

```sh
npm install
npm run dev
```

Vite prints the local development URL after the server starts.

## Firebase setup

The app uses Firebase Authentication and the `movies` Firestore collection.
Configure your Firebase web app in `src/config/firebase.js` before running the
app with your own Firebase project.

Publish the rules in `firestore.rules` from the Firebase Console. The rules allow
authenticated users to read, create, update, and delete movie documents that
match the app's movie schema.

The Firebase web API key in the client configuration is not an authorization
secret. Restrict it to the required Google APIs and rely on Firebase
Authentication and Firestore Security Rules to protect data.

## Scripts

```sh
npm run dev
npm run lint
npm run build
npm run preview
```
