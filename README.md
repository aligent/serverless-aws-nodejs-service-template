# serverless-aws-nodejs-service-template

AWS Template for creating microservices

# Introduction

This template includes:

- The setup from the base aws typescript template
- AWS local lib for working online/offline
- Bitbucket pipelines for deploying production and staging
- Dockerised local development so you don't have to install the serverless client

# Usage

## Setup

### Aliased NPM

This ensures all serverless commands are run inside the serverless docker container so that you don't need to install node, npm and serverless globally.

Add the following to your `.bashrc` file:

```
alias node-run='docker run --rm -it --volume ~/.aws:/home/node/.aws --volume ~/.npm:/home/node/.npm --volume $PWD:/app aligent/serverless'
alias serverless='node-run serverless'
```

You will then need to reload your bashrc file, either by running `. ~/.bashrc` or starting a new terminal session.

Start with the template: `serverless create --template-url https://github.com/aligent/serverless-aws-nodejs-service-template --path my-project`

Then install dependencies:

`cd my-project`

`node-run npm ci`.

### Local NPM

Install serverless globally see: https://www.serverless.com/framework/docs/getting-started/

Start with the template: `serverless create --template-url https://github.com/aligent/serverless-aws-nodejs-service-template --path my-project`

Then install dependencies:

`cd my-project`

`node-run npm ci`.

## Development Environment

This template comes with jest, tslint and prettier configured. Each can be run for the entire repository with npm scripts in `package.json` e.g.

`node-run npm run jest` - run all tests and produce coverage statistics. Use the `--silent` flag to suppress console logs in output

`node-run npm run lint` - lint all typescript files and report warnings/errors

`node-run npm run format` - format and save all source files according to prettier configuration

## Online usage

Add AWS profile credentials to ~/.aws/credentials
https://www.serverless.com/framework/docs/providers/aws/guide/credentials#use-an-existing-aws-profile

Deploy the serverless stack
`serverless deploy --aws-profile profileName --stage staging`

Invoke the step function
`serverless invoke stepf --name helloWorld --aws-profile profileName --stage staging`

Invoke the step function with data
`serverless invoke stepf --name helloWorld --data='{}' --aws-profile profileName --stage staging`

Invoke the step function with json file
`serverless invoke stepf --name helloWorld --path='input.json' --aws-profile profileName --stage staging`

Invoke individual lambdas
`serverless invoke --function hello --aws-profile profileName --stage staging`

Invoke individual lambdas with data
`serverless invoke --function hello --data='{}' --aws-profile profileName --stage staging`

Invoke individual lambdas json file
`serverless invoke --function hello --path='input.json' --aws-profile profileName --stage staging`

**Replace _profileName_ with your AWS profile and _staging_ with another stage, if desired**

Refer to the [https://www.serverless.com/framework/docs/providers/aws/cli-reference](Serverless CLI Reference for AWS) for further details.

## Bitbucket pipelines

This repository comes with a default pipeline for Bitbucket pipeline that will execute linting and testing on Pull Requests and automatically deploy when PRs are merged to the staging and production branches.

To set this pipeline up you need to add all of the variables below to either the repository variables section or the deployments section in your repository configuration.

`APP_USERNAME` and `APP_PASSWORD` can be created for a user by following the Bitbucket documentation here: https://support.atlassian.com/bitbucket-cloud/docs/app-passwords/ These are used by the pipeline to upload a deployment status badge to the repositories "Downloads" section. We recommend creating a dedicated Bot user account and using it's credentials for this.

```yaml
- step: &push-serverless
    name: 'Deploy service'
    script:
      - pipe: docker://aligent/serverless-deploy-pipe:latest
        variables:
          AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID}
          AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY}
          CFN_ROLE: ${CFN_ROLE}
          DEBUG: ${CI_DEBUG}
          UPLOAD_BADGE: true
          APP_USERNAME: ${APP_USERNAME}
          APP_PASSWORD: ${APP_PASSWORD}
```
