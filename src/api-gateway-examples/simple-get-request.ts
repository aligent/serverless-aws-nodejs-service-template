import { APIGatewayEventRequestContext, APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";


export const handler = async (event: APIGatewayProxyEvent, _context: APIGatewayEventRequestContext): Promise<APIGatewayProxyResult> => {
  const response: APIGatewayProxyResult = {
    statusCode: 200,
    body: `Successfully returned response from GET method!`
  };

  return response;
};