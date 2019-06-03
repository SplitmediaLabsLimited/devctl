#!/bin/bash

set -o errexit
set -o pipefail
set -o nounset

SERVICE_NAME=devctl-proxy
TAG_PREFIX=splitmedialabs

if [[ -z "${COMMIT_SHA:-}" ]] ; then
  COMMIT_SHA="latest"
fi

TAG=$TAG_PREFIX/$SERVICE_NAME:$COMMIT_SHA

# get the current directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $DIR

echo "+++ :docker: Building $SERVICE_NAME...."
docker build . --build-arg COMMIT_SHA=${COMMIT_SHA} -t $TAG

echo "+++ :docker: Container Size: $(docker images $TAG --format "{{.Size}}")"

if [[ $* == *--push* ]] ; then
  docker push $TAG
fi