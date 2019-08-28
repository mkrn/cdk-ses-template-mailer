# SES Templated Emails Helper Constructs for AWS CDK

## Why 
- AWS SES Templates are amazing but pain to setup and manage

## Features 
- Custom resource to create SES Email Templates (functionality missing in AWS UX and CloudFormation)
- Custom resource to add SNS destination to message delivery events
- SNS topic and optional email subscription to notify you of template render fails!
- Lambda with an SQS queue to send emails without going over your SES limits
- Easy to drop-in to your project and use right away
- Perfect for transactional and drip emails 
- 0 idle costs. 100% serverless

## SES Features
- You can create up to 10,000 email templates per Amazon SES account.
- Each template can be up to 500KB in size, including both the text and HTML parts.

## Pre-requisites
- FromEmail needs to be verified in AWS SES `aws ses verify-email-identity --email-address support@mydomain.com`
- Apply for a sending limit increase (https://docs.aws.amazon.com/ses/latest/DeveloperGuide/request-production-access.html) to be able to send to non-verified email addresses
- If you include `RenderFailuresNotificationsEmail` you will receive an "AWS Notification - Subscription Confirmation" email. 
- `npm install cdk-ses-template-mailer`

## Use

```
import { SESEmailTemplate, SESTemplateMailer } from 'cdk-ses-template-mailer';

// Read from files
new SESEmailTemplate(this, 'Email1', {
    TemplateName: 'mytemplate',
    TextPart: fs.readFileSync(__dirname + '/../ses-templates/mytemplate/template.txt', 'utf8'),
    HtmlPart: fs.readFileSync(__dirname + '/../ses-templates/mytemplate/template.html', 'utf8'),
    SubjectPart: 'Email Subject Goes Here'
});

// Or embed
new SESEmailTemplate(this, 'EventLiveEmail', {
    TemplateName: 'eventLive',
    TextPart: 'Hi {{guest.name}}, {{data.event_title}} is Live!'
    HtmlPart: '<strong>Hi {{guest.name}}</strong><br />{{data.event_title}} is Live!',
    SubjectPart: '{{data.event_title}} is Live!'
});

// ... define more templates....

const mailer = new SESTemplateMailer(this, 'Mailer', {
    FromEmail: 'support@mydomain.com',
    FromName: 'My Service',
    RenderFailuresNotificationsEmail: 'myemail@gmail.com' // optional. add your email to receive render failure notifications
});

new cdk.CfnOutput(this, 'SQSQueueURL', {
    value: mailer.queue.queueUrl
})

new cdk.CfnOutput(this, 'SNSRenderFailureTopicArn', {
    value: mailer.snsRenderFailuresTopic.topicArn
})

```

## Adding SNS subscriptions to other email event types
```
import { SESSNSDestination } from 'cdk-ses-template-mailer';

const newTopic = new sns.Topic(this, 'CustomEmailEventsTopic', {
    topicName: 'sesSendConfigRenderFailures'
});

new sns.Subscription(this, 'CustomEmailEventsTopicSubscription', {
    topic: newTopic,
    protocol: sns.SubscriptionProtocol.EMAIL,
    endpoint: 'myemail@gmail.com'
})

new SESSNSDestination(this, 'CustomEmailEventsTopicSNSDestination', {
    ConfigurationSetName: 'SendConfig', // Keep it
    EventDestinationName: 'CustomEventsSNSDestination',
    MatchingEventTypes: [
        'send' | 'reject' | 'bounce' | 'complaint' | 'delivery' | 'open' | 'click' | 'renderingFailure'
    ],
    TopicARN: newTopic.topicArn
})
```

## SQS Message format
```
export interface SESTemplateMailerEventBody {
    to: {
        name?: string,
        email: string
    },
    data: any,
    template: string // name of template
}
```

## Test

```
aws sqs send-message --queue-url=QUEUE_URL_FROM_OUTPUTS --message-body='{ "data": {}, "template": "mytemplate", "to": { "email": "destination@gmail.com", "name": "Name" }}'
```

## TODO 
- Explore SendBulkTemplatedEmail (send email to up to 50 destinations in each call)
- Add automated email tracking and stats collection?
- Tests

## Useful commands

 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile

## License
MIT
