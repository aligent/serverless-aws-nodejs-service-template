# Differences between serverless framework and cdk templates

## Deployment

CDK will produce a list of changes and ask permission to proceed

## Ids

The second argument for a construct is its ID. This is used by CDK to generate a logical id, and thus track the resource for replacement, deletion etc. It's important that this logical ID is not changed by accident.

## Aliases

The latest version of a deployed lambdas and step functions now has an alias of LATEST

## Step Functions

CDK Step Function setup produces a different base definition for lambda tasks

- Uses the `LambdaInvoke` resource, not the Lambda ARN directly
- Automatically adds a retry block for internal AWS service failures
- Outputs the task result nested inside the `Payload` property on a metadata object

To get task outputs similar to the direct lambda resource invocation, we can use the new Jsonata syntax and the `outputs` property.
Jsonata data transformation documentation: https://docs.aws.amazon.com/step-functions/latest/dg/transforming-data.html

# CDK Documentation

## AWS

https://docs.aws.amazon.com/cdk/v2/guide/home.html
https://docs.aws.amazon.com/cdk/v2/guide/best-practices.html

## Community documentation

https://github.com/kevinslin/open-cdk

# Questions

- CDK best practices are to NOT name resources directly. I'm not exactly sure what this means though - does it apply to Lambda.functionName, for instance?
- Should we continue to version lambda functions? I don't think I've ever invoked an older version.
- If we continue versioning, what's a useful alias strategy?
- How do we get step functions to call other step functions, especially in yaml definition?
- How do we get step functions to reference the stage name and other env variables?
- How do we work with env variables in general? What about the ones in SSM?
