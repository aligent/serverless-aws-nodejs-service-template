# serverless-aws-nodejs-service-template
AWS Template for creating microservices

# Introduction

This template includes:

- The setup from the base aws typescript template
- AWS local lib for working online/offline
- BitBucket pipelines for deploying production and staging
- serverless offline packages for local development
- dockerised local development so you don't have to install the serverless client

# Usage

Add the following to your `.bashrc` file:

```
alias node-run='docker run --rm -it --volume ~/.aws:/home/node/.aws --volume ~/.npm:/home/node/.npm --volume $PWD:/app aligent/serverless'
alias serverless='node-run serverless'
alias sls-invoke='docker-compose exec offline /serverless/node_modules/serverless/bin/serverless.js --no-build invoke local --function'
```

You will then need to reload your bashrc file, either by running `. ~/.bashrc` or starting a new terminal session.

Start with the template: `serverless create --template-url https://github.com/aligent/serverless-aws-nodejs-service-template --path my-service`

Then install dependencies with `node-run npm install`.

## Offline Usage

Whenever using a AWS service, ensure you use the params defined in the lib/aws-local file, eg:

```typescript
import { S3Params } from './lib/aws-local';

const s3 = new S3(S3Params);
```

This will ensure that it uses a local S3 instance in this case when invoked with `invoke local`.

Run `docker-compose up` to run the serverless offline services. Then to invoke functions 
run `sls-invoke initialiseToken --stage dev`.

#### DynamoDB ####

If you want to use DynamoDB offline, you'll need to run `serverless dynamodb install` in your project once, to
download the local dynamodb code.