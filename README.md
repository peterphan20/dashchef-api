# Dashchef API

## Description

This is the API for the Dashchef website, which is an application that allows home cooks to advertise and sell home cooked meals to users

## Goals for the Future

- A raiding calendar to plan for future events
- A social event calendar for current or new members to interact with one another
- A general forum to promote discussion between current or new members
- A page dedicated to showcasing the guild's highlights

## Technologies

- Fastify
- PostgreSQL

## Installation

Clone the repository

`git clone https://github.com/peterphan20/guild-announcements.git`

Move into repository

`cd guild-announcement`

Install dependencies

Setup local Docker DB

`docker build -t my-postgres-db ./config`

`docker run -d --name my-postgres-container -p 5432:5432 my-postgres-db`


## Usage

This API supports basic CRUD operations for handling user and home chef interactions between one another as well as providing authentication for protecting various user and chef functionalities.

## Contributing

This project is not accepting contributions. You are welcome to use as a template.

## License

MIT License
