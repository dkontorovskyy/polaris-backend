# Docker Parent Image with Node and Typescript
FROM node:alpine

# Create Directory for the Container
WORKDIR /app

# Copy the ready files we need to our new Directory
ADD . /app

# Expose the port outside of the container
EXPOSE 3000

# Grab dependencies
RUN  npm install && npm run build && npm run apidoc

# Start the server
ENTRYPOINT ["node", "build/"]
CMD [""]

