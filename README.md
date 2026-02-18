# CogniFetch

CogniFetch is a modern, React-based web application designed to help users scrape, analyze, and organize study materials efficiently. Built with performance and aesthetics in mind, it features a premium dark-themed UI with glassmorphism effects.

## Features

- **Smart Scraping**: Fetch and process content from various sources.
- **User Profiles**: personalized dashboard and settings.
- **Responsive Design**: Fully responsive interface that works on all devices.
- **Premium UI**: Dark mode, glassmorphism, and smooth animations using Tailwind CSS.
- **Secure Authentication**: Login and registration functionality.

## Tech Stack

- **Frontend**: [React](https://reactjs.org/), [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/), [Bootstrap](https://getbootstrap.com/) (integrated)
- **Icons**: [React Icons](https://react-icons.github.io/react-icons/)
- **Routing**: [React Router](https://reactrouter.com/)

## Getting Started

Follow these steps to set up the project locally:

1.  **Clone the repository** (if you haven't already).
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Start the development server**:
    ```bash
    npm run dev
    ```
4.  **Build CSS (Development)**:
    To watch for CSS changes and rebuild styles on the fly:
    ```bash
    npm run style
    ```

## Project Structure

- `src/Components`: Reusable React components.
- `src/assets`: Images and static assets.
- `public/mainStyle.css`: Main source for Tailwind CSS directives and custom styles.
- `src/style.css`: Generated CSS output (do not edit directly).
- `tailwind.config.cjs`: Tailwind CSS configuration.

## Customization

The project uses a customized Tailwind configuration. You can modify colors and fonts in `tailwind.config.cjs`.
Global styles and utilities are defined in `public/mainStyle.css`.
