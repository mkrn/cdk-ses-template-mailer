const AWS = require('aws-sdk');
const ses = new AWS.SES({apiVersion: '2010-12-01'});

const send = (event: any, context: any, responseStatus: any, responseData: any, physicalResourceId?: any) => {
    return new Promise((resolve, reject) => {
	
	var responseBody = JSON.stringify({
            Status: responseStatus,
            Reason: "See the details in CloudWatch Log Stream: " + context.logStreamName,
            PhysicalResourceId: physicalResourceId || context.logStreamName,
            StackId: event.StackId,
            RequestId: event.RequestId,
            LogicalResourceId: event.LogicalResourceId,
            Data: responseData
	});
	
	console.log("Response body:\n", responseBody);
	
	var https = require("https");
	var url = require("url");
	
	var parsedUrl = url.parse(event.ResponseURL);
	var options = {
            hostname: parsedUrl.hostname,
            port: 443,
            path: parsedUrl.path,
            method: "PUT",
            headers: {
                "content-type": "",
                "content-length": responseBody.length
            }
	};
	
	var request = https.request(options, function(response: any) {
            console.log("Status code: " + response.statusCode);
            console.log("Status message: " + response.statusMessage);
            resolve(context.done());
	});
	
	request.on("error", function(error: any) {
            console.log("send(..) failed executing https.request(..): " + error);
            reject(context.done(error));
	});
	
	request.write(responseBody);
	request.end();
    })
    
}

exports.handler = async (event: any, context: any) => {
    const { ResourceProperties, RequestType } = event;
    const { TemplateName, HtmlPart, TextPart, SubjectPart } = ResourceProperties;

    console.log(JSON.stringify(event));
    
    try {
        switch(RequestType) {
            case 'Delete': {
                await ses.deleteTemplate({ TemplateName }).promise();
                return await send(event, context, "SUCCESS", {});
            }
            case 'Create': {
                await ses.createTemplate({ Template: { TemplateName, HtmlPart, TextPart, SubjectPart } }).promise();
                return await send(event, context, "SUCCESS", {});
            }
            default: case 'Update': {
                await ses.updateTemplate({ Template: { TemplateName, HtmlPart, TextPart, SubjectPart } }).promise();
                return await send(event, context, "SUCCESS", {});
            }       
        }
    } catch (err) {
        console.error(err);
        return await send(event, context, "FAILED", {});
    }
  };
  export{};
