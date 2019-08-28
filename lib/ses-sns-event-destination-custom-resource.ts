import cfn = require('@aws-cdk/aws-cloudformation');
import lambda = require('@aws-cdk/aws-lambda');
import cdk = require('@aws-cdk/core');
import iam = require('@aws-cdk/aws-iam');
import fs = require('fs');

export interface SESSNSDestinationProps {
    ConfigurationSetName: string, 
    TopicARN: string, 
    MatchingEventTypes: [string], 
    EventDestinationName: string
}

export class SESSNSDestination extends cdk.Construct {
  public readonly response: string;

  constructor(scope: cdk.Construct, id: string, props: SESSNSDestinationProps) {
    super(scope, id);

    const resolver = new lambda.SingletonFunction(this, 'Singleton', {
        uuid: '250cf9b6-6f47-4e17-9770-85f628f159df',
        code: new lambda.InlineCode(fs.readFileSync(__dirname + '/../lambda/ses-sns-config-destination.js', { encoding: 'utf-8' })),
        handler: 'index.handler',
        timeout: cdk.Duration.seconds(20),
        runtime: lambda.Runtime.NODEJS_8_10,
    });

    resolver.addToRolePolicy(new iam.PolicyStatement({
        actions: ['ses:CreateConfigurationSetEventDestination', 'ses:UpdateConfigurationSetEventDestination', 'ses:DeleteConfigurationSetEventDestination'],
        resources: [
          `*`
        ],
        effect: iam.Effect.ALLOW
      }))

    const resource = new cfn.CustomResource(this, 'Resource', {
      provider: cfn.CustomResourceProvider.lambda(resolver),
      properties: props,
    });

    this.response = resource.getAtt('Response').toString();
  }
}