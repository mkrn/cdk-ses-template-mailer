import { expect, haveResource } from '@aws-cdk/assert';
import { Stack, App } from "@aws-cdk/core";
import { Topic } from '@aws-cdk/aws-sns';
import { SESEmailTemplate, SESTemplateMailer, SESSNSDestination } from '../lib';
import { SnsEventSource } from '@aws-cdk/aws-lambda-event-sources';

test("testing resources", () => {
    const stack = new Stack();
    
    new SESEmailTemplate(stack, 'Email', {
        TemplateName: 'eventLive',
        TextPart: 'Hi {{guest.name}}, {{data.event_title}} is Live!',
        HtmlPart: '<strong>Hi {{guest.name}}</strong><br />{{data.event_title}} is Live!',
        SubjectPart: '{{data.event_title}} is Live!'
    });

    const mailer = new SESTemplateMailer(stack, 'Mailer', {
        FromEmail: 'support@mydomain.com',
        FromName: 'My Service',
        RenderFailuresNotificationsEmail: 'myemail@gmail.com'
    });

    const testTopic = new Topic(stack, 'TestTopic', {
        topicName: 'test'
    })

    new SESSNSDestination(stack, 'CustomEmailEventsTopicSNSDestination', {
        ConfigurationSetName: 'SendConfig',
        EventDestinationName: 'CustomEventsSNSDestination',
        MatchingEventTypes: [
            'send'
        ],
        TopicARN: testTopic.topicArn
    })

    expect(stack).to(haveResource('AWS::CloudFormation::CustomResource', {
        TemplateName: 'eventLive'
    }))

    expect(stack).to(haveResource('AWS::SES::ConfigurationSet', {
        Name: 'SendConfig'
    }))

    expect(stack).to(haveResource('AWS::SNS::Topic', {
        TopicName: 'sesSendConfigRenderFailures'
    }))

    expect(stack).to(haveResource('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'myemail@gmail.com'
    }))

    expect(stack).to(haveResource('AWS::CloudFormation::CustomResource', {
        ConfigurationSetName: 'SendConfig',
        EventDestinationName: 'CustomEventsSNSDestination',
        MatchingEventTypes: [
            'send'
        ],
    }))

});