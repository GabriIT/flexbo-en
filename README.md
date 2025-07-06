Running the code:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

## What technologies are used for this project?

This project is built with .

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
-------------------------
## Project Description
- A Flexbo website, dokku dployed flexbo-en with persistent storage
- Server backed in Go to manage Postgresql db
- server_resend is a Express server to forward email from the website

-Added Procfile to run in container server_resend/forward,js
-Both server_resend and media are served through buildpack node

# Pending 
-For Server, Go App for Postgresql I will need to add it as well 