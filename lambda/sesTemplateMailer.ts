const AWS = require('aws-sdk');
const ses = new AWS.SES({apiVersion: '2010-12-01'});

export interface SESTemplateMailerEvent {
    Records: [{
        body: string
    }]
}

export interface SESTemplateMailerEventBody {
    to: {
        name?: string,
        email: string
    },
    data: any,
    template: string // name of template
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

        const { to, template } = message;

        console.log(`Emailing ${to.name} ${to.email} ${template}`);

        const params = {
          "Source": FROM,
          "Template": template,
          "Destination": {
            "ToAddresses": [ to.email ]
          },
          "TemplateData": body, // entire body will be available: data, template, to
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
