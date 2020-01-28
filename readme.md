# DevCTL

[![asciicast](https://asciinema.org/a/AXypjq8FmtdsmCFLWwHPoOL0f.svg)](https://asciinema.org/a/AXypjq8FmtdsmCFLWwHPoOL0f)

DevCTL is a CLI app designed to:

- start docker-compose presets for easier onboarding and project switching
- customize what to run depending on what you're working on
- run everything through a local HTTPS proxy for easy HTTPS development
- heavily configurable and extensible using NodeJS

## Requirements

- Node 8+
- NPM or Yarn
- Docker
- Docker-Compose

## What DevCTL is useful for

- You have a frontend team that prefers to use the staging environment as their backend, so they don't need the API running
- You have a backend team that needs to run MySQL and Redis locally so they can test migrations and new endpoints
- You have a fullstack integration team that requires both frontend and backend to run on their machine, but they don't want to run MySQL, they prefer to use the shared Dev MySQL on the office servers
- You switch between projects back and forth, and they all have their own services to run, and they collide in ports.
- You have a new guy to onboard fast.

DevCTL decreases the onboarding time of new devs in any of our projects at Splitmedialabs. All the new users needs to have installed is docker, docker-compose and NodeJS 8+. Once a project is setup with devctl, its users does not require knowledge of docker.

## What DevCLT is **NOT**

- It is not a thick layer on docker-compose. It's a tool to switch "presets" of services. For advanced use cases, you still need to know how docker-compose and its networking components works. For simple use cases, the CLI generators should be enought to help you. **If you don't understand docker-compose, this project will most likely make it more confusing.**
- The docker-compose files that it generates are not meant to be used in production.

## Getting Started

- `yarn global add @splitmedialabs/devctl` (or `npm install -g @splitmedialabs/devctl`)
- Check examples

## Docs:

Traditional docs are non-existent 😔 instead, they're all in working examples in the [examples](./examples) folder. Don't worry though, they are quite comprehensive! We do, however, have a [reference](./docs/readme.md)

Clone this repository, and start with [examples/example-basic-react-prisma-mysql/readme.md](./examples/example-basic-react-prisma-mysql/readme.md)
