const AWS = require('aws-sdk');
const ses = new AWS.SES({apiVersion: '2010-12-01'});

export interface SESTemplateMailerEvent {
    Records: [{
        body: string
    }]
}

export interface SESTemplateMailerEventBody {
    guest: {
        name?: string,
        email: string
    },
    notification_type: string
}

const FROM = process.env.FROM;

exports.handler = async (event: SESTemplateMailerEvent, context: any) => {
  console.log(JSON.stringify(event));

  const { Records } = event;

  try {
    await Promise.all(
      Records.map(async ({ body }: any) => {
        console.log(body);
        const message = JSON.parse(body) as SESTemplateMailerEventBody;

        const { guest, notification_type } = message;

        console.log(`Emailing ${guest.name} ${guest.email} ${notification_type}`);

        const params = {
          "Source": FROM,
          "Template": notification_type,
          "Destination": {
            "ToAddresses": [ guest.email ]
          },
          "TemplateData": body,
          "ConfigurationSetName": "SendConfig",
        }

        const res = await ses.sendTemplatedEmail(params).promise();

        console.log(res);
      })
    );
  } catch(err) {
    console.error(err);
  }

  context.succeed({})
};
