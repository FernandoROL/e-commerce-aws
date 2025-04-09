import { Product, ProductRepository } from "@productsRepository";
import { DynamoDB, Lambda } from "aws-sdk";
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import * as AWSXRay from "aws-xray-sdk";
import { ProductEvent, productEventType } from "@productEventsLayer";

AWSXRay.captureAWS(require("aws-sdk"));
const productDdb = process.env.PRODUCTS_DDB!;
const ddbClient = new DynamoDB.DocumentClient();
const productEventsFunctionName = process.env.PRODUCT_EVENTS_FUNCTION_NAME!;
const lambdaClient = new Lambda();
const productRepository = new ProductRepository(ddbClient, productDdb);

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
    const productCreated = await productRepository.create(product);

    const response = await sendProductEvent(
      productCreated,
      productEventType.CREATED,
      "fernando@teste.com",
      lambdaRequestId
    );

    console.log(response)

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
      const productUpdated = await productRepository.updateProduct(
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
        const product = await productRepository.deleteProduct(productId);
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

function sendProductEvent(
  product: Product,
  eventType: productEventType,
  email: string,
  lambdaRequestId: string
) {
  const event: ProductEvent = {
    email: email,
    eventType: eventType,
    productCode: product.code,
    productPrice: product.price,
    requestId: lambdaRequestId,
    productId: product.id,
  };

  return lambdaClient
    .invoke({
      FunctionName: productEventsFunctionName,
      Payload: JSON.stringify(event),
      InvocationType: "RequestResponse", // Syncronous response
    })
    .promise();
}
