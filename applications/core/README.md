# Core CDK Application

Core CDK application for the Modelflight integration services. This application manages the deployment of microservices and their shared infrastructure.

## Architecture

This application deploys:

_add details here_

## Configuration

### Environment Parameters

Parameters are managed through the `config/.env.json` file

```bash
# Setup parameters for playground environment
yarn pg:parameters

# Force update existing parameters
yarn pg:parameters --force
```

### Parameter Configuration

The `config/.env.json` file defines all SSM parameters needed by the services:

```json
{
  "parameters": [
    {
      "name": "/application/dev/url",
      "value": "https://dev.magento.example.com",
      "description": "API URL for development",
      "type": "String",
      "tier": "Standard"
    }
  ]
}
```

## Deployment

### Using Nx (Recommended)

```bash
# From workspace root
yarn pg:deploy

# Synthesize templates
yarn pg:synth
```

### Direct CDK Commands

```bash
yarn nx run core:cdk <command> <args>
```

## Services

This application deploys the following services:

- _list services here_

## Testing

### Mock Services

The application includes mock services for testing integrations without external dependencies.

- _list mock services here_

Change the value of the `/modelflight/myob/dev/url` SSM Parameter to switch between real and mock endpoints

### Local Development

```bash
# Type checking
yarn typecheck

# Testing
yarn test

# Linting
yarn lint
```
