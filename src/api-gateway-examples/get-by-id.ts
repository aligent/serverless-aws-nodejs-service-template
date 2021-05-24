import { APIGatewayEventRequestContext, APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";


export const handler = async (event: APIGatewayProxyEvent, _context: APIGatewayEventRequestContext): Promise<APIGatewayProxyResult> => {
  const { id } = event.pathParameters;
  console.log('Get endpoint');
  const response: APIGatewayProxyResult = {
    statusCode: 200,
    body: `Retrieved record with id: ${id}!`
  };

  return response;
};