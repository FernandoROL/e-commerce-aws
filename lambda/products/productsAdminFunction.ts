import { Product, ProductRepository } from "/opt/nodejs/productsLayer";
import { DynamoDB } from "aws-sdk";
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";

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

  if (event.resource == "/products") {
    console.log("POST /products");
    const product = JSON.parse(event.body!) as Product;
    const productCreated = await productsRepository.create(product);

    return {
      statusCode: 201,
      body: JSON.stringify(productCreated),
    };
  }

  if (event.resource === "/products/{id}") {
    const productId = event.pathParameters!.id as string;
    if (event.httpMethod === "PUT") {
      console.log(`PUT /products/${productId}`);

      const product = JSON.parse(event.body!) as Product;
      const productUpdated = await productsRepository.updateProduct(
        productId,
        product
      );

      try {
        return {
          statusCode: 200,
          body: JSON.stringify(productUpdated),
        };
      } catch (ConditionExpression) {
        return {
          statusCode: 400,
          body: "Product not found with given ID",
        };
      }
    }

    if (event.httpMethod === "DELETE") {
      console.log(`DELETE /products/${productId}`);

      try {
        const product = await productsRepository.deleteProduct(productId);
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
  }
  return {
    statusCode: 400,
    body: "Bad request",
  };
}
