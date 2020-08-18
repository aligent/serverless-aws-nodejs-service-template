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
```

You will then need to reload your bashrc file, either by running `. ~/.bashrc` or starting a new terminal session.

Start with the template: `serverless create --template-url https://github.com/aligent/serverless-aws-nodejs-service-template --path my-service`

Then install dependencies with `node-run npm install`.