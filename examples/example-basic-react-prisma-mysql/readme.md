# Create React App + GraphQL + MySQL

This is a sample React app with a GraphQL backend. In this example, we'll be writing the devctl config from scratch, and we'll be explaining along the way why we are doing what we're doing.

## Problems and choices

In a microservice environment, each service that is made to be consumed by the browser usually has its own HTTP server. That means the frontend would be running on port 3000, and the API would be running on port 4466.

In production, how do we solve this? 2 choices:

- Use a different subdomain for the API and the frontend, like `api.example.com` for the API and `example.com`
- or transparently proxy it using an ingress, like nginx or caddy, so that the API is reachable by going to `exapmle.com/api` and the frontend takes the rest

That's production... how about dev?

Let's say we choose the first method and choose a different subdomain. This means that the frontend will always have to be given the full path to the API. Check [frontend/src/index.js](./frontend/src/index.js) on line 11.

This is problematic - `create-react-app` compiles to static files... this means that we'd have to [compile it differently for every environment](https://facebook.github.io/create-react-app/docs/adding-custom-environment-variables), or we would [need a server that rewrites the entry HTML with configuration](https://www.freecodecamp.org/news/how-to-implement-runtime-environment-variables-with-create-react-app-docker-and-nginx-7f9d42a91d70/).

Obviously the better choice is the proxy. We could use create-react-app's [built-in proxy](https://facebook.github.io/create-react-app/docs/proxying-api-requests-in-development#configuring-the-proxy-manually), which works fine since we're using create-react-app, but `devctl` was made to be agnostic.

In this example, we'll be doing the proxy option.. but if you prefer the subdomain option, devctl can help you too.

## Let's get this running first

- `yarn`
- `yarn frontend start`
- `cd graphql`
- `docker-compose up -d`
- `yarn exec prisma deploy`
- `yarn exec prisma seed`

Going to `(http://localhost:3000/)[http://localhost:3000/]` should work, and a few example posts should appear

Turn it down, and let's convert this to a devctl project.

- `docker-compose down`

and go back to the root the project

- `cd ..`

## 1. Databases

By analysing [graphql/docker-compose.yaml](./graphql/docker-compose.yaml), we can see that prisma is dependent on mysql 5.7.

```yaml
mysql:
  image: mysql:5.7
  restart: always
  environment:
    MYSQL_ROOT_PASSWORD: prisma
  volumes:
    - mysql:/var/lib/mysql
```

Let's run `devctl init`, choose `mysql`, version `5.7`, and just put `prisma` everywhere for credentials, username and database name.

You should now see

```
.devctl/mysql/.devconfig.yaml written.
.devctl.yaml written.

Your project has been successfully bootstrapped!
Please add these files in .gitignore
 - .devctl-current.yaml (This is your current state)
 - .devctl-docker-compose.yaml (This is your generated docker-compose file)
 - .devctl/data (This is where your databases will save state)

You can now run devctl switch in this folder.
```

Follow the instructions and add these to .gitignore

```
.devctl-current.yaml
.devctl-docker-compose.yaml
.devctl/data
```

If we run `devctl switch`, you should only see 1 choices, which is the mysql we just generated. Proceed to press enter, and it'll spin it up for you.

Let's take a look in these files we just generated. First, open `.devctl.yaml`

```yaml
services:
  - name: 'mysql'
    path: '.devctl/mysql'
    description: '5.7'
    notes: 'Check .devctl/mysql/.devconfig.yaml for credentials and configuration'

environment:
  - name: dev
    description: Run services locally
```

It created a `mysql` under services, and a `dev` environment for us. These fields are pretty self explanatory -- `.devctl.yaml` is the central configuration for your project, and the most important file. Without it, `devctl` will say `error devctl configuration not found` for all commands.

Now, open `.devctl/mysql/.devconfig.yaml`

You should see this

```yaml
compose:
  default:
    mysql:
      image: 'mysql:5.7'
      ports:
        - '3306:3306'
      volumes:
        - ./.devctl/data/mysql:/var/lib/mysql
      restart: always
      environment:
        MYSQL_ROOT_PASSWORD: 'prisma'
        MYSQL_DATABASE: 'prisma'
        MYSQL_USER: 'prisma'
        MYSQL_PASSWORD: 'prisma'
```

This is oddly familiar to the one in [graphql/docker-compose.yaml](./graphql/docker-compose.yaml). The difference is that the data is under `compose.default`.

- `compose` means it's for docker-compose
- `default` means its used for all environment

We can rewrite it this way, and it should still work

```yaml
compose:
  dev:
    mysql:
      image: 'mysql:5.7'
      ports:
        - '3306:3306'
      volumes:
        - ./.devctl/data/mysql:/var/lib/mysql
      restart: always
      environment:
        MYSQL_ROOT_PASSWORD: 'prisma'
        MYSQL_DATABASE: 'prisma'
        MYSQL_USER: 'prisma'
        MYSQL_PASSWORD: 'prisma'
```

Or this way

```yaml
compose:
  default:
    mysql:
      image: 'mysql:5.7'
      ports:
        - '3306:3306'
      volumes:
        - ./.devctl/data/mysql:/var/lib/mysql
      restart: always
  dev:
    mysql:
      environment:
        MYSQL_ROOT_PASSWORD: 'prisma'
        MYSQL_DATABASE: 'prisma'
        MYSQL_USER: 'prisma'
        MYSQL_PASSWORD: 'prisma'
```

As you can imagine, it gets merged like this

```js
const finalDockerCompose = deepmerge(compose.default, compose[environment]);
```

After doing `devctl switch` and bringing the services up, you should be able to look at `.devctl-docker-compose.yaml`. This is where the docker-compose file gets generated, and where you can debug the output.

Okay, let's add the `graphql` service.

## 2. GraphQL

Let's take a look again at [graphql/docker-compose.yaml](./graphql/docker-compose.yaml)

```yaml
prisma:
  image: prismagraphql/prisma:1.33
  restart: always
  ports:
    - '4466:4466'
  environment:
    PRISMA_CONFIG: |
      port: 4466
      # uncomment the next line and provide the env var PRISMA_MANAGEMENT_API_SECRET=my-secret to activate cluster security
      # managementApiSecret: my-secret
      databases:
        default:
          connector: mysql
          host: mysql
          user: root
          password: prisma
          rawAccess: true
          port: 3306
          migrations: true
```

Let's create a `.devconfig.yaml` inside of the `graphql` folder and write this

```yaml
compose:
  default:
    prisma:
      links:
        - mysql
      image: prismagraphql/prisma:1.33
      restart: always
      ports:
        - '4466:4466'
      environment:
        PRISMA_CONFIG: |
          port: 4466
          # uncomment the next line and provide the env var PRISMA_MANAGEMENT_API_SECRET=my-secret to activate cluster security
          # managementApiSecret: my-secret
          databases:
            default:
              connector: mysql
              host: mysql
              user: root
              password: prisma
              rawAccess: true
              port: 3306
              migrations: true
```

It's pretty much the same, except we added `link: ['mysql']` so that prisma can talk to MySQL.

Finally, let's add it to `.devctl.yaml` under `services`

```yaml
- name: 'graphql'
  description: 'Powered by Prisma'
  notes: |
    Run these commands the first time:
        yarn graphql exec prisma deploy
        yarn graphql exec prisma seed
    GraphQL should be running now!
```

Do another `devctl switch`, choose both `graphql` and `mysql`, and try opening your browser to (http://localhost:4466)[http://localhost:4466]. It should work!

## 3. Frontend

For the frontend, we're not going to be running it inside a docker container. We're going to be running it directly on our computer. So, create a `.devconfig.yaml` file and put `compose: {}`

Also add it to `.devctl.yaml`

```yaml
- name: 'frontend'
  description: 'Powered by create-react-app'
  notes: |
    To start the dev server:
        yarn frontend start
```

Frontend should now be a choice when doing `devctl switch`, but it does nothing new since we're not generating any docker-compose values from it.

## 4. Reverse Proxy

Okay so now everything is "running" but it doesn't get proxied correctly. Let's change that!

in `.devctl.yaml` file, add root level key called `proxy` like such:

```yaml
proxy:
  enabled: true
  port: 80
```

Now, for each service, add a proxy config array. For example, the `graphql` one looks like this:

```yaml
- name: 'graphql'
  description: 'Powered by Prisma'
  proxy:
    - port: 4466
      protocol: http
      paths:
        - localhost/graphql
  notes: |
    Run these commands the first time:
        yarn graphql exec prisma deploy
        yarn graphql exec prisma seed
    GraphQL should be running now!
```

- `port` is the port the service is running on
- `paths` are the paths that, when matched, should proxies to this service. I've put `localhost`, but if you prefer, you can also add `example.com/graphql`, and add `example.com` in your `/etc/hosts` to point to `127.0.0.1`, and it will match it!

The frontend one looks like this

```yaml
- name: 'frontend'
  description: 'Powered by create-react-app'
  proxy:
    - port: 3000
      protocol: http
      paths:
        - localhost
  notes: |
    To start the dev server:
        yarn frontend start
```

There's no path after localhost, so this will count as the default upstream match.

Modify [frontend/src/index.js](./frontend/src/index.js) on line 11 and

- replace `uri: 'http://localhost:4466/graphql/endpoint',`
- with `uri: '/graphql/endpoint',`

Do another `devctl switch`, tick `frontend` along with the rest, and go to `localhost`. It should work!

Congratulations, you've just bootstrapped your first `devctl project`. You can take a look at [example-basic-react-prisma-mysql-complete](../example-basic-react-prisma-mysql-complete) to see this example fully written out, with comments and all.
