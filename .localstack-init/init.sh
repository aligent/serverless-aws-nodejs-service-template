#!/bin/sh

# Make sure user has ownership of ~/.localstack
LOCALSTACK_INIT="/docker-entrypoint-initaws.d/localstack-init.sh"
DEPLOY_USER="deployer"

DOCKER_UID=`stat -c "%u" $LOCALSTACK_INIT`
DOCKER_GID=`stat -c "%g" $LOCALSTACK_INIT`

if id -u $DEPLOY_USER >/dev/null 2>&1; then
  userdel $DEPLOY_USER
fi

groupadd -g ${DOCKER_GID} ${DEPLOY_USER}
useradd -g ${DOCKER_GID} --home-dir /home/${DEPLOY_USER} -s /bin/bash -u ${DOCKER_UID} ${DEPLOY_USER}

chown -R ${DEPLOY_USER}:${DEPLOY_USER} /var/lib/localstack

# Add the creation of any AWS resource you want using the awslocal cli tool
awslocal ssm put-parameter --name "/example/ssm/param" --type String --value "some-value" --overwrite
awslocal ssm get-parameter --name "/example/ssm/param"