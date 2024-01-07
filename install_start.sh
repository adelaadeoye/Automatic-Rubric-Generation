#!/bin/bash

# Install dependencies
npm i

# Start the development server
npm start &

# Wait for a moment to ensure the server has started
sleep 5

# Run Node.js script
node server
