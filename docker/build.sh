#!/bin/bash

# This script's directory, relative to the running point
RELATIVE_SCRIPT_DIR=$( dirname -- ${BASH_SOURCE[0]} )

# This script's absolute directory
SCRIPT_DIR=$( cd -- ${RELATIVE_SCRIPT_DIR} &> /dev/null && pwd )

# Read the local configured variables
cd ${SCRIPT_DIR}
source ./env.txt

# Base directory of the package
GIT_ROOT_DIR=$( git rev-parse --show-toplevel )

# Copy the program temporally in side of the Dockerfile
cp -r "${GIT_ROOT_DIR}/public_html" ./public_html

# Change version to the current date in the index.html file
DATE=$(date +%Y.%m.%dT%H.%M)
sed -i "s/var version = .*;/var version = \"${DATE}\";/" ./public_html/index.html

# Build the container using the local Dockerfile
docker build -t ${TARGET_CONTAINER_NAME} .

# Delete the temporally copied files
rm -r ./public_html
