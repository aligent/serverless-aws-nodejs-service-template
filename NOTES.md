### General gotchas

- Resource names have a limit of 64 characters - if prepending the service name/stage, those should be kept short.
- Variables of the form `#{AWS::AccountId}` require the `serverless-psuedo-parameters` plugin: https://www.serverless.com/plugins/serverless-pseudo-parameters

### Api Keys

Documentation: https://www.serverless.com/framework/docs/providers/aws/events/apigateway/#setting-api-keys-for-your-rest-api

#### Notes:

- Specifying just a key name tells CloudFormation to generate a 24 character alphanumeric key, accessible from the AWS Api Gateway console.
- YAML/CloudFormation variables can be used in key names and values. The final value of the key must be a string.
  - Some plugins (e.g. serverless-step-functions) do not support variables in key values and will throw an error on deploy.
- Api key names are tied to a value. The value is set at deploy time and can't be changed/regenerated without renaming the key.
- Api key names must be (globally?) unique.
- Deleting an Api key in the AWS Api Gateway console _does not_ release the Api key name. The value can not be changed in the console.
  - An API for updates exists which may allow for more control over existing API keys: https://docs.aws.amazon.com/apigateway/api-reference/link-relation/apikey-update/
- `serverless deploy` will by default print the value of any API keys to the console. This can be prevented with the `--conceal` flag.

#### Suggested practise:

Specify a key name incorporating the service and stage names e.g.

```yaml
provider:
  name: aws
  apiKeys:
    - ${self:service.name}-${self:provider.stage}-apiKey
```

Use the `--conceal` flag in bitbucket pipeline deployment scripts.

### Step Functions

Documentation: https://www.serverless.com/plugins/serverless-step-functions

#### Notes:

- If a step fails with the very unhelpful "lambda did not return an error" message, it may be caused by a process timing out.
- Input and output mapping can get quite complex and is not covered by the serverless documentation. Suggest reading the AWS docs: https://docs.aws.amazon.com/step-functions/latest/dg/concepts-input-output-filtering.html
