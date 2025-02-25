#!/bin/sh

echo "Waiting for LocalStack to be ready..."
while ! nc -z localstack 4566; do
  sleep 1
done

echo "Setup complete! Starting application..."
exec node app.js