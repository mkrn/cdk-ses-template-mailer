# SES Templated Emails Helper Constructs for AWS CDK

## Features 
- Custom resource to create SES Email Templates (functionality missing in AWS UX and CloudFormation)
- Custom resource to add SNS destination to message delivery events
- SNS topic and optional subscription to notify you of template render fails!
- SQS queue that sends templated emails in batches without going over your SES limits
- Easy to drop-in to your project and use right away
- 0 idle costs. 100% serverless
- You can create up to 10,000 email templates per Amazon SES account.
- Each template can be up to 500KB in size, including both the text and HTML parts.


## Pre-requisites
- FromEmail needs to be verified in AWS SES `aws ses verify-email-identity --email-address support@mydomain.com`
- Apply for a sending limit increase (https://docs.aws.amazon.com/ses/latest/DeveloperGuide/request-production-access.html) to be able to send to non-verified emails
- If you indicate RenderFailuresNotificationsEmail you will receive an "AWS Notification - Subscription Confirmation" email. 

## Use
```
import { SESEmailTemplate, SESTemplateMailer } from 'cdk-ses-template-mailer';

new SESEmailTemplate(this, 'Email1', {
    TemplateName: 'mytemplate',
    TextPart: fs.readFileSync(__dirname + '/../ses-templates/mytemplate/template.txt', 'utf8'),
    HtmlPart: fs.readFileSync(__dirname + '/../ses-templates/mytemplate/template.html', 'utf8'),
    SubjectPart: 'Email Subject Goes Here'
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

```

## SQS Message format
```
export interface SESTemplateMailerEventBody {
    guest: {
        name?: string,
        email: string
    },
    notification_type: string
}
```

## Test

```
aws sqs send-message --queue-url=QUEUE_URL_FROM_OUTPUTS --message-body='{ "data": {}, "notification_type": "mytemplate", "guest": { "email": "destination@gmail.com", "name": "Name" }}'
```

## TODO 
- Explore SendBulkTemplatedEmail (send email to up to 50 destinations in each call)

## Useful commands

 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile

## License
MIT
