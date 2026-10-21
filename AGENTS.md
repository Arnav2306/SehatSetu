# SehatSetu — Agent Guidelines & Rules

## Core Rules
- Write the smallest amount of maintainable code needed for the active phase.
- Do not create placeholder components, unused utilities, unnecessary abstractions, excessive comments, or duplicate configuration.
- Do not install packages unless strictly required for requested functionality.
- Reuse existing files and dependencies where possible.
- Do not overwrite working code or delete existing files without permission.
- Keep frontend and backend code organized, without over-engineering folder structure.
- Never hardcode secrets or expose backend credentials to the frontend.
- Do not implement features belonging to later phases without explicit instructions.

## Scope Boundaries
- Do not add authentication, user roles, hospital listings, doctor profiles, dashboards, appointment booking, reviews, AI features, payments, maps, notifications, deployment, sample data, or full landing pages until explicitly requested.
- Maintain ES module syntax across frontend and backend.
- Ensure all environment variables are reflected in `.env.example` files without real secrets.
