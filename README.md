# serverless-aws-nodejs-service-template

AWS Template for creating microservices

# Introduction

This template includes:

- The setup from the base aws typescript template
- AWS local lib for working online/offline
- BitBucket pipelines for deploying production and staging
- Localstack packages for local development
- Dockerised local development so you don't have to install the serverless client or localstack
- Step though debugging support for VSCode

# Usage

## Setup

### Aliased NPM

#### Prerequisite
- Docker
- Docker-compose
- (Optional) Visual Studio Code with [Docker extension](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-docker) installed.

This ensures all serverless commands are run inside the serverless docker container so that you don't need to install node, npm and serverless globally.

Add the following to your `.bashrc` or `.zshrc` file:

```bash
# Normal aliases for normal usage & interacting with online AWS
alias node-run='docker run --rm -it --volume ~/.aws:/home/node/.aws --volume ~/.npm:/home/node/.npm --volume $PWD:/app aligent/serverless'
alias serverless='node-run serverless'
alias npm='node-run npm'
alias aws='node-run aws'

# Local aliases for interacting with localstack
alias local-run='docker run --rm -it --volume ~/.aws:/home/node/.aws --volume ~/.npm:/home/node/.npm --volume $PWD:/app --network localstack-net aligent/serverless:latest'
alias sls-local='local-run npm run serverless-local --'
alias sls-local-deploy='sls-local deploy --verbose --aws-profile localstack --stage dev'
alias sls-local-invoke='sls-local invoke --verbose --aws-profile localstack --stage dev'
alias sls-local-invoke-stepf='sls-local invoke stepf --verbose --aws-profile localstack --stage dev'
alias aws-local='local-run aws --endpoint-url=http://172.20.0.100:4566'
```

#### Notes
- You will then need to reload your bashrc file, either by running `. ~/.bashrc` (or `. ~/.zshrc`) or starting a new terminal session.
- These aliases only works when you are inside the project folder.
- For the local aliases to work, you need the localstack container running in background. Check Offline Usage for more details.

### Local NPM

Install serverless globally see: https://www.serverless.com/framework/docs/getting-started/

### Quick start
Start with the template: 
```bash
serverless create --template-url https://github.com/aligent/serverless-aws-nodejs-service-template --path my-project
```

Then install dependencies:
```bash
cd my-project
npm install
```

If you want to use the pre-configured VSCode debugging setup:
```bash
mkdir .vscode
cp .vscode-configs/. .vscode
```

## Development Environment

This template comes with jest, tslint and prettier configured. Each can be run for the entire repository with npm scripts in `package.json` e.g.

`node-run npm run jest` - run all tests and produce coverage statistics. Use the `--silent` flag to suppress console logs in output

`node-run npm run lint` - lint all typescript files and report warnings/errors

`node-run npm run format` - format and save all source files according to prettier configuration

### Step through debug with VSCode
This template comes with some pre-configured. This setup is a combination of:
1. [Docker extension](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-docker) - makes it easy to build, manage, and deploy containerized applications from VSCode
2. `.vscode-configs` folder:
    - `launch.json` - launch VSCode debugger and attached to our docker container for debugging by `invoke local` or by running a test.
    - `tasks.json` -  tasks used by `launch.json` or support deploy to localstack.
3. `debug` folder:
    - `.dev.env` - contain some environment variables that support debugging.
    - `dev.invoke.json` - contain dummy data that can be used for `invoke local` or `invoke stepf`.
4. `src/lib/localstack.ts` - support connection to localstack from our main docker container.
5. `docker-compose.yml` - contain definition for localstack.
6. `Dockerfile` - support building debug docker image from `aligent/serverless:latest` (expose Nodejs debug port 9229).
7. `package.json` file:
    - `jest-test-debug` - support debug against a Jest test case by running `Jest Test Debug` configuration.
    - `invoke-local-debug` - support debug through `invoke local` by running `Invoke Local Debug` configuration.
    - `serverless-local` - support running serverless command against localstack.
8. `serverless.yml` - enable/disable `minify` and `sourcemap` for `esbuild` based on environment variable.

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

## Offline Usage

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

Start up the localstack environment
```bash
docker-compose --env-file ./debug/.dev.env up [-d]
# or run the `sls-docker: start-localstack` task in VSCode
```

Deploy the serverless stack to localstack
```bash
sls-local-deploy
# or run the `sls-docker: deploy-localstack` task in VSCode
```

Invoke individual lambdas in localstack
```bash
sls-local-invoke -f hello
```

Invoke individual lambdas in localstack with data
```bash
sls-local-invoke -f hello -d '{}'
```

Invoke individual lambdas in localstack with json file
```bash
sls-local-invoke -f hello -p 'input.json'
```

Invoke the step function in localstack
```bash
sls-local-invoke-stepf -n helloWorld
```

Invoke the step function in localstack with data
```bash
sls-local-invoke-stepf -n helloWorld -d '{}'
# or run the `sls-docker: invoke-stef-local-data` task in VSCode
```

Invoke the step function in localstack with json file
```bash
sls-local-invoke-stepf -n helloWorld -p 'input.json'
# or run the `sls-docker: invoke-stef-local-file` task in VSCode
```

Whenever using an AWS service, ensure you use the params defined in the `.lib/localstack.ts` file, eg:

#### S3

```typescript
import { S3Params } from './lib/localstack';

const s3 = new S3(S3Params);
```

#### DynamoDB

```typescript
import { DynamoDBParams } from './lib/localstack';

const db = new DynamoDB(DynamoDBParams);
```

This will ensure that it uses a localstack instance in this case when invoked with `invoke local`.

#### SSM Parameters

The .localstack-init folder contains a bash script that is run after localstack has successfully started up. In it you can add the creation of any AWS resource you want
using the awslocal cli tool.

The script currently contains an example on how to create an SSM value:

```bash
awslocal ssm put-parameter --name "/example/ssm/param" --type String --value "some-value" --overwrite
```

Which can be used in your serverless.yml file like:

```yaml
example: ${ssm:/example/ssm/param}
```

### VSCode debugger
Debugging with VSCode debugger is supported by a mix of `invoke local` and localstack. Localstack is used to simulate AWS resources. If you don't use them, no need to spin up localstack docker container.

Start up the localstack environment
```bash
docker-compose --env-file ./debug/.dev.env up [-d]
# or run the `sls-docker: start-localstack` task in VSCode
```

Deploy the serverless stack to localstack (for usage of AWS resources like DynamoDB)
```bash
sls-local-deploy
# or run the `sls-docker: deploy-localstack` task in VSCode
```

Launch VSCode debugger using the `Invoke Local Debug` configuration to debug with `invoke local`.
Having a failed test and you don't know why? Try out the `Jest Test Debug` configuration.