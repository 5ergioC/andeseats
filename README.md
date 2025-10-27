# AndesEats

AndesEats is a web app that helps the Universidad de los Andes community discover nearby food options, compare menus, and keep track of new places to try. The experience is optimized for students, staff, and administrators who need budget-friendly recommendations within walking distance of campus.

**Production URL:** [https://www.andeseats.co/](https://www.andeseats.co/)

![AndesEats Landing preview](https://github.com/user-attachments/assets/9ebc4103-c9ac-4ed2-bd70-255e7cea9d07)
![AndesEats Map preview](https://github.com/user-attachments/assets/d6d713bf-2575-43a6-b997-be0c9fe510b6)

## Features

- Email authentication with Firebase to unlock personalized content.
- Filter panel to refine results by price range, category, dietary tags, and distance.
- Interactive MapLibre map with live markers for every restaurant in Firestore.
- Community ratings aggregated from subcollections to display averages and counts.
- Admin panel (restricted by email) to manage restaurant records from the UI.
- Responsive interface tuned for desktop, tablet, and mobile breakpoints.

## Tech Stack

- [React 18](https://react.dev/) via Create React App
- [Firebase](https://firebase.google.com/) Authentication and Cloud Firestore
- [MapLibre GL JS](https://maplibre.org/) for map rendering
- [Tailwind CSS](https://tailwindcss.com/) and custom CSS modules
- [Framer Motion](https://www.framer.com/motion/) for UI animations



