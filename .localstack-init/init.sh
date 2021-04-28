#!/bin/sh
awslocal ssm put-parameter --name "/example/ssm/param" --type String --value "some-value" --overwrite
awslocal ssm get-parameter --name "/example/ssm/param"