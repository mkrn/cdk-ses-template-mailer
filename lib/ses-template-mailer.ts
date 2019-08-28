import lambda = require('@aws-cdk/aws-lambda');
import path = require('path');
import cdk = require('@aws-cdk/core');
import iam = require('@aws-cdk/aws-iam');
import sqs = require('@aws-cdk/aws-sqs');
import ses = require('@aws-cdk/aws-ses');
import sns = require('@aws-cdk/aws-sns');
import { SqsEventSource } from '@aws-cdk/aws-lambda-event-sources';
import { SESSNSDestination } from './ses-sns-event-destination-custom-resource'

export interface SESTemplateMailerProps {
    FromName: string,
    FromEmail: string,
    RenderFailuresNotificationsEmail?: string,
}

export class SESTemplateMailer extends cdk.Construct {
  public readonly queue: sqs.Queue;
  public readonly snsRenderFailuresTopic: sns.Topic;

  constructor(scope: cdk.Construct, id: string, props: SESTemplateMailerProps) {
    super(scope, id);

    const { FromName, FromEmail, RenderFailuresNotificationsEmail } = props;

    new ses.CfnConfigurationSet(this, 'ConfigurationSet', {
        name: 'SendConfig'
    });

    this.snsRenderFailuresTopic = new sns.Topic(this, 'RenderFailureTopic', {
        topicName: 'sesSendConfigRenderFailures'
    });

    if (RenderFailuresNotificationsEmail) {
        new sns.Subscription(this, 'EmailSubscription', {
            topic: this.snsRenderFailuresTopic,
            protocol: sns.SubscriptionProtocol.EMAIL,
            endpoint: RenderFailuresNotificationsEmail
        })
    }

    new SESSNSDestination(this, 'SNSDestination', {
        ConfigurationSetName: 'SendConfig',
        EventDestinationName: 'SNSRenderingFailures',
        MatchingEventTypes: ['renderingFailure'],
        TopicARN: this.snsRenderFailuresTopic.topicArn
    })

    const deadLetterQueue = new sqs.Queue(this, 'MailerDeadLetterQueue', {
        deliveryDelay: cdk.Duration.seconds(0),
        visibilityTimeout: cdk.Duration.seconds(120)
    });

    this.queue = new sqs.Queue(this, 'MailerQueue', {
        visibilityTimeout: cdk.Duration.seconds(300),
        deadLetterQueue: {
            maxReceiveCount: 5,
            queue: deadLetterQueue
        }
    });

    const mailerLambda = new lambda.Function(this, 'MailerLambda', {
        runtime: lambda.Runtime.NODEJS_8_10,
        code: lambda.Code.asset(path.join(__dirname, '../lambda')),
        handler: 'sesTemplateMailer.handler',
        environment: {
            FROM: `${FromName} <${FromEmail}>`
        }
    });

    mailerLambda.addToRolePolicy(new iam.PolicyStatement({
        actions: ['ses:SendTemplatedEmail'],
        resources: [
            `*`
        ],
        effect: iam.Effect.ALLOW
    }))

    mailerLambda.addEventSource(new SqsEventSource(this.queue, {
        batchSize: 10,
    }))   
  }
}