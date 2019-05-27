########################
# Build container
########################
FROM node:10.15.1-alpine as builder

ADD . /workdir/

# set the workdir 
WORKDIR /workdir

# run JS stuff
RUN yarn install


########################
# Run container
########################
FROM node:10.15.1-alpine

COPY --from=builder /workdir /workdir

WORKDIR /workdir

ENV NODE_ENV=production
ENV TZ=utc

CMD [ "node", "index.js" ]