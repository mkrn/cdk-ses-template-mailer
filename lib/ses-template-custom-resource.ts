import cfn = require('@aws-cdk/aws-cloudformation');
import lambda = require('@aws-cdk/aws-lambda');
import cdk = require('@aws-cdk/core');
import iam = require('@aws-cdk/aws-iam');
import fs = require('fs');

export interface SESEmailTemplateProps {
    TemplateName: string,
    SubjectPart: string,
    HtmlPart: string,
    TextPart: string,
}

export class SESEmailTemplate extends cdk.Construct {
  public readonly response: string;

  constructor(scope: cdk.Construct, id: string, props: SESEmailTemplateProps) {
    super(scope, id);

    const resolver = new lambda.SingletonFunction(this, 'Singleton', {
        uuid: '3c7314a4-04a1-455f-9093-a0ffe608fe79',
        code: new lambda.InlineCode(fs.readFileSync(__dirname + '/../lambda/ses-template-handler.js', { encoding: 'utf-8' })),
        handler: 'index.handler',
        timeout: cdk.Duration.seconds(20),
        runtime: lambda.Runtime.NODEJS_8_10,
    });

    resolver.addToRolePolicy(new iam.PolicyStatement({
        actions: ['ses:CreateTemplate', 'ses:UpdateTemplate', 'ses:DeleteTemplate'],
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