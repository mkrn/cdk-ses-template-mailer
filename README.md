# SES Templated Emails Helper Constructs for AWS CDK

## Features 
- Custom resource to create SES Email Templates (functionality missing in AWS UX and CloudFormation)
- Custom resource to add SNS destination to message delivery events
- SNS topic and optional subscription to notify you of template render fails!
- SQS queue that sends templated emails in batches without going over your SES limits
- Easy to drop-in to your project and use right away
- 0 idle costs. 100% serverless

## Pre-requisites
- FromEmail needs to be verified in AWS SES
- Apply for a sending limit increase (https://docs.aws.amazon.com/ses/latest/DeveloperGuide/request-production-access.html) to be able to send to non-verified emails
- If you indicate RenderFailuresNotificationsEmail you will receive an "AWS Notification - Subscription Confirmation" email

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

new SESTemplateMailer(this, 'Mailer', {
    FromEmail: 'mysesverifiedemail@domain.com',
    FromName: 'My Service',
    RenderFailuresNotificationsEmail: 'myemail@gmail.com' // optionally know 
});

```

## Test

```
aws sqs send-message --queue-url=https://sqs.us-east-1.amazonaws.com/829654343590/CdkStackEast-MailerMailerQueueC30A6507-3HU1M24EX5R9 --message-body='{ "data": {}, "notification_type": "mytemplate", "guest": { "email": "destination@gmail.com", "name": "Name" }}'
```

## Useful commands

 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile

## License
MIT
