import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { ProductRepository } from "/opt/nodejs/productRepository"
import { DynamoDB } from "aws-sdk";
import * as AWSXRay from "aws-xray-sdk"

AWSXRay.captureAWS(require("aws-sdk"))
const productDdb = process.env.PRODUCTS_DDB!;
const ddbClient = new DynamoDB.DocumentClient();

const productsRepository = new ProductRepository(ddbClient, productDdb);
export async function handler(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  const lambdaRequestId = context.awsRequestId;
  const apiRequestId = event.requestContext.requestId;

  console.log(
    `API Gateway RequestId: ${apiRequestId} - Lambda RequestId: ${lambdaRequestId}`
  );

  const method = event.httpMethod;
  if (event.resource === "/products") {
    if (method === "GET") {
      console.log("GET");

      const products = await productsRepository.getAllProducts();

      return {
        statusCode: 200,
        body: JSON.stringify(products),
      };
    }
  }

  if (event.resource == "/products/{id}") {
    const productsId = event.pathParameters!.id as string;
    console.log(`GET /products/${productsId}`);

    try {
      const product = await productsRepository.getProductById(productsId);

      return {
        statusCode: 200,
        body: JSON.stringify(product),
      };
    } catch (error) {
      console.error((<Error>error).message);
      return {
        statusCode: 400,
        body: (<Error>error).message,
      };
    }
  }

  return {
    statusCode: 400,
    body: JSON.stringify({
      message: "Bad request",
    }),
  };
}
