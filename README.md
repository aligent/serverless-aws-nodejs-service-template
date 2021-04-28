# serverless-aws-nodejs-service-template
AWS Template for creating microservices

# Introduction

This template includes:

- The setup from the base aws typescript template
- AWS local lib for working online/offline
- BitBucket pipelines for deploying production and staging
- Localstack packages for local development
- Dockerised local development so you don't have to install the serverless client or localstack

# Usage

## Setup
Add localstack credentials block to ~/.aws/credentials (creds don't matter)

```
[localstack]
aws_access_key_id = localstack
aws_secret_access_key = localstack
```

Add localstack profile block to ~/.aws/config
```
[profile localstack]
region = ap-southeast-2
output = json
```

### Aliased NPM
This ensures all serverless commands are run inside the serverless docker container so that you don't need to install node, npm and serverless globally.


Add the following to your `.bashrc` file:
```
alias node-run='docker run --rm -it --volume ~/.aws:/home/node/.aws --volume ~/.npm:/home/node/.npm --volume $PWD:/app aligent/serverless'
alias serverless='node-run serverless'
alias sls-deploy-local='docker-compose exec -u node -w /app offline /serverless/node_modules/serverless/bin/serverless.js deploy --log --profile localstack --stage dev'
alias sls-invoke='docker-compose exec -u node -w /app offline /serverless/node_modules/serverless/bin/serverless.js invoke --log --profile localstack --stage dev --function'
alias sls-invoke-stepf='docker-compose exec -u node -w /app offline /serverless/node_modules/serverless/bin/serverless.js invoke stepf --log --profile localstack --stage dev --name'
```

You will then need to reload your bashrc file, either by running `. ~/.bashrc` or starting a new terminal session.

Start with the template: `serverless create --template-url https://github.com/aligent/serverless-aws-nodejs-service-template --path my-service`

Then install dependencies with `node-run npm install`.

Start the development environment `docker-compose up`

### Local NPM
Install serverless globally see: https://www.serverless.com/framework/docs/getting-started/

Start with the template: `serverless create --template-url https://github.com/aligent/serverless-aws-nodejs-service-template --path my-service`

Install dependencies with `npm install`

Start the development environment `docker-compose up`

## Offline Usage

Whenever using a AWS service, ensure you use the params defined in the lib/aws-local file, eg:

###S3
```typescript
import { S3Params } from './lib/localstack';

const s3 = new S3(S3Params);
```

###DynamoDB
```typescript
import { DynamoDBParams } from './lib/localstack';

const db = new DynamoDB(DynamoDBParams);
```

This will ensure that it uses a localstack instance in this case when invoked with `invoke local`.

Run `docker-compose up` to run the localstack services. Then to invoke functions run `sls-invoke hello --stage dev`.


#### SSM Parameters ####
The .localstack-init folder contains a bash script that is run after localstack has successfully started up. In it you can add the creation of any AWS resource you want
using the awslocal cli tool. 

The script currently contains an example on how to create an SSM value:
```
awslocal ssm put-parameter --name "/example/ssm/param" --type String --value "some-value" --overwrite
```

Which can be used in your serverless.yml file like:

```yaml
example: ${ssm:/example/ssm/param}
```