#!/bin/bash

read -p "POSTGRES_USER: " POSTGRES_USER
read -p "POSTGRES_PASSWORD: " POSTGRES_PASSWORD
read -p "POSTGRES_DB: " POSTGRES_DB

export POSTGRES_USER POSTGRES_PASSWORD POSTGRES_DB

docker compose -f "$(dirname "$0")/docker-compose.yml" up -d
